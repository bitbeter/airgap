import { test } from "node:test"
import assert from "node:assert/strict"
import {
  isValidCardNumber,
  isValidIban,
  isValidIpv4,
  isValidIpv6,
  isValidIranLandline,
  isValidIranMobile,
  isValidLuhn,
  isValidNationalId,
  normalizeIranPhone,
  toLatinDigits,
} from "../lib/validators.mjs"

test("Persian and Arabic-Indic digits convert to Latin digits", () => {
  assert.equal(toLatinDigits("۰۱۲۳۴۵۶۷۸۹"), "0123456789")
  assert.equal(toLatinDigits("٠١٢٣٤٥٦٧٨٩"), "0123456789")
  assert.equal(toLatinDigits("کد ۱۲۳"), "کد 123")
})

test("national ID validates the check digit and rejects repeated digits", () => {
  assert.equal(isValidNationalId("1234567891"), true)
  assert.equal(isValidNationalId("۱۲۳۴۵۶۷۸۹۱"), true)
  assert.equal(isValidNationalId("1234567890"), false)
  assert.equal(isValidNationalId("0000000000"), false)
  assert.equal(isValidNationalId("12345"), false)
})

test("card numbers require sixteen digits and a valid Luhn checksum", () => {
  assert.equal(isValidLuhn("4111111111111111"), true)
  assert.equal(isValidLuhn("4111111111111112"), false)
  assert.equal(isValidCardNumber("4111111111111111"), true)
  assert.equal(isValidCardNumber("4111 1111 1111 1111"), true)
  assert.equal(isValidCardNumber("۴۱۱۱ ۱۱۱۱ ۱۱۱۱ ۱۱۱۱"), true)
  assert.equal(isValidCardNumber("4111111111111112"), false)
  assert.equal(isValidCardNumber("411111111111111"), false)
})

test("IBAN validates the mod-97 checksum", () => {
  assert.equal(isValidIban("IR820540102680020817909002"), true)
  assert.equal(isValidIban("IR82 0540 1026 8002 0817 9090 02"), true)
  assert.equal(isValidIban("IR820540102680020817909003"), false)
  assert.equal(isValidIban("IR123"), false)
})

test("IPv4 and IPv6 validation", () => {
  assert.equal(isValidIpv4("192.168.1.1"), true)
  assert.equal(isValidIpv4("999.168.1.1"), false)
  assert.equal(isValidIpv4("1.2.3"), false)
  assert.equal(isValidIpv6("2001:db8::1"), true)
  assert.equal(isValidIpv6("::1"), true)
  assert.equal(isValidIpv6("::ffff:192.168.1.1"), true)
  assert.equal(isValidIpv6("2001:db8:::1"), false)
  assert.equal(isValidIpv6("192.168.1.1"), false)
})

test("Iranian mobile and fixed-line validation", () => {
  assert.equal(normalizeIranPhone("+98 912 123 4567"), "09121234567")
  assert.equal(normalizeIranPhone("0098-912-123-4567"), "09121234567")
  assert.equal(normalizeIranPhone("۰۹۱۲۱۲۳۴۵۶۷"), "09121234567")
  assert.equal(isValidIranMobile("۰۹۱۲ ۱۲۳ ۴۵۶۷"), true)
  assert.equal(isValidIranMobile("+989121234567"), true)
  assert.equal(isValidIranMobile("00989121234567"), true)
  assert.equal(isValidIranMobile("0912123456"), false)
  assert.equal(isValidIranLandline("02112345678"), true)
  assert.equal(isValidIranLandline("021 1234 5678"), true)
  assert.equal(isValidIranLandline("09121234567"), false)
  assert.equal(isValidIranLandline("09912345678"), false)
})
