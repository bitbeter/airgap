import { test } from "node:test"
import assert from "node:assert/strict"
import {
  clearTerms,
  defaultSettings,
  readSettings,
  readTerms,
  redact,
  restore,
  saveSettings,
  saveTerms,
  settingsKey,
  termsKey,
} from "../lib/redact.mjs"

const mixedFixture = [
  "سلام،",
  "ایمیل ali@example.com و نشانی https://example.com/profile/ali و IPv4 192.168.1.10 و IPv6 2001:db8::1.",
  "تلفن ۰۹۱۲ ۱۲۳ ۴۵۶۷ و 021-12345678.",
  "کد ملی 1234567891 و کارت 4111 1111 1111 1111.",
  "شبا IR820540102680020817909002.",
  "کلید sk-abcdefghijklmnopqrstuvwxyz123456 و ghp_abcdefghijklmnopqrstuvwxyz123456.",
  "AWS AKIAABCDEFGHIJKLMNOP و JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123.",
  "-----BEGIN PRIVATE KEY-----",
  "MIIBVwIBADANBgkqhkiG9w0BAQEFAASC",
  "-----END PRIVATE KEY-----",
  "شرکت آلفا و علی رضایی.",
].join("\n")

function createStorage() {
  const values = new Map()
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
    dump() { return Object.fromEntries(values) },
  }
}

test("redact and restore round-trip every supported detector", () => {
  const result = redact(mixedFixture, { terms: ["شرکت آلفا", "علی رضایی"] })
  const types = new Set(result.findings.map((finding) => finding.type))

  for (const type of ["email", "url", "ip", "phone", "nationalId", "card", "iban", "apiKey", "terms"]) {
    assert.equal(types.has(type), true, `expected a ${type} finding`)
  }
  assert.equal(restore(result.text, result.mapping), mixedFixture)
  assert.ok(result.text.includes("[EMAIL_1]"))
  assert.ok(result.text.includes("[PHONE_1]"))
  assert.ok(result.text.includes("[NAME_1]"))
})

test("invalid card and national ID are not detected", () => {
  const input = "کارت 4111111111111112 و کد ملی 1234567890"
  const result = redact(input)
  assert.equal(result.findings.length, 0)
  assert.equal(result.text, input)
})

test("Persian digits are detected in phone, national ID, and card numbers", () => {
  const phone = redact("تماس: ۰۹۱۲ ۱۲۳ ۴۵۶۷")
  assert.equal(phone.text, "تماس: [PHONE_1]")
  assert.equal(phone.findings[0].value, "۰۹۱۲ ۱۲۳ ۴۵۶۷")

  const identifiers = redact("کد ملی ۱۲۳۴۵۶۷۸۹۱ و کارت ۴۱۱۱ ۱۱۱۱ ۱۱۱۱ ۱۱۱۱")
  assert.equal(identifiers.text, "کد ملی [NATIONAL_ID_1] و کارت [CARD_1]")
})

test("a longer URL wins over the email inside it", () => {
  const input = "https://example.com/?to=ali@example.com"
  const result = redact(input)
  assert.equal(result.findings.length, 1)
  assert.equal(result.findings[0].type, "url")
  assert.equal(result.text, "[URL_1]")
  assert.equal(restore(result.text, result.mapping), input)
})

test("duplicate values share one placeholder", () => {
  const input = "ali@example.com و ali@example.com"
  const result = redact(input)
  assert.equal(result.text, "[EMAIL_1] و [EMAIL_1]")
  assert.equal(result.findings.length, 1)
  assert.equal(result.findings[0].count, 2)
  assert.deepEqual(result.mapping, { "[EMAIL_1]": "ali@example.com" })
  assert.equal(restore(result.text, result.mapping), input)
})

test("settings can disable individual detector types", () => {
  const result = redact("ali@example.com 09121234567", { settings: { email: false } })
  assert.equal(result.text, "ali@example.com [PHONE_1]")
  assert.equal(result.findings.some((finding) => finding.type === "email"), false)
})

test("custom terms are matched case-insensitively with word boundaries", () => {
  const input = "شرکت آلفا با علی رضایی و Ali و ali و Alice"
  const result = redact(input, { terms: ["شرکت آلفا", "علی رضایی", "ali"] })
  assert.equal(result.text, "[NAME_1] با [NAME_2] و [NAME_3] و [NAME_4] و Alice")
  assert.equal(restore(result.text, result.mapping), input)
})

test("excluding a finding keeps its value visible and removes it from the mapping", () => {
  const input = "ali@example.com و 09121234567"
  const initial = redact(input)
  const email = initial.findings.find((finding) => finding.type === "email")
  const result = redact(input, { excluded: [email.id] })

  assert.equal(result.text, "ali@example.com و [PHONE_1]")
  assert.equal(result.findings.find((finding) => finding.id === email.id).excluded, true)
  assert.equal(result.mapping[email.id], undefined)
  assert.equal(restore(result.text, result.mapping), input)
})

test("IPv4 and IPv6 are both detected", () => {
  const result = redact("آدرس 192.168.1.10 و 2001:db8::1")
  assert.equal(result.text, "آدرس [IP_1] و [IP_2]")
  assert.equal(restore(result.text, result.mapping), "آدرس 192.168.1.10 و 2001:db8::1")
})

test("restore leaves unknown placeholders and replacement syntax untouched", () => {
  assert.equal(restore("x [EMAIL_9]", { "[EMAIL_1]": "a@b.com" }), "x [EMAIL_9]")
  assert.equal(restore("x [EMAIL_1] y", { "[EMAIL_1]": "$& $1" }), "x $& $1 y")
  assert.equal(restore("بدون نگاشت", null), "بدون نگاشت")
})

test("settings storage keeps only booleans and no detected values", () => {
  const storage = createStorage()
  assert.deepEqual(readSettings(storage), defaultSettings)

  storage.setItem(settingsKey, "{bad json")
  assert.deepEqual(readSettings(storage), defaultSettings)

  saveSettings(storage, { email: false, phone: true })
  const raw = storage.getItem(settingsKey)
  const parsed = JSON.parse(raw)
  assert.equal(parsed.email, false)
  assert.equal(parsed.phone, true)
  assert.ok(Object.values(parsed).every((value) => typeof value === "boolean"))
  assert.ok(!raw.includes("ali@example.com"))
  assert.ok(!raw.includes("09121234567"))
})

test("custom terms are stored only when the user asks to remember them", () => {
  const storage = createStorage()
  assert.deepEqual(readTerms(storage), { terms: [], remembered: false })

  saveTerms(storage, ["شرکت آلفا", " شرکت آلفا ", "علی"])
  assert.deepEqual(readTerms(storage), { terms: ["شرکت آلفا", "علی"], remembered: true })
  assert.ok(storage.getItem(termsKey).includes("شرکت آلفا"))

  clearTerms(storage)
  assert.deepEqual(readTerms(storage), { terms: [], remembered: false })
})

test("the redaction mapping is never written to storage", () => {
  const storage = createStorage()
  const input = "ali@example.com 09121234567"
  const result = redact(input)
  saveSettings(storage, defaultSettings)

  for (const value of Object.values(storage.dump())) {
    assert.ok(!value.includes("ali@example.com"))
    assert.ok(!value.includes("09121234567"))
    assert.ok(!value.includes("[EMAIL_1]"))
  }
  assert.ok(Object.keys(result.mapping).length > 0)
})
