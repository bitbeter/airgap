import { test } from "node:test"
import assert from "node:assert/strict"
import { bytesToBase64, decodeBase64, encodeBase64 } from "../lib/base64.mjs"

const samples = [
  "",
  "a",
  "ab",
  "abc",
  "hello world",
  "سلام دنیا",
  "تهران — Airgap",
  "😀🎉🚀",
  "نیم‌فاصله‌ها و ایموجی 😀",
  "line one\nline two\r\n",
]

test("standard Base64 matches RFC 4648 vectors", () => {
  assert.equal(encodeBase64("").output, "")
  assert.equal(encodeBase64("f").output, "Zg==")
  assert.equal(encodeBase64("fo").output, "Zm8=")
  assert.equal(encodeBase64("foo").output, "Zm9v")
  assert.equal(encodeBase64("foob").output, "Zm9vYg==")
  assert.equal(encodeBase64("fooba").output, "Zm9vYmE=")
  assert.equal(encodeBase64("foobar").output, "Zm9vYmFy")
})

test("Base64 round-trips Persian, emoji, and mixed text", () => {
  for (const sample of samples) {
    const encoded = encodeBase64(sample)
    assert.equal(encoded.ok, true)
    const decoded = decodeBase64(encoded.output)
    assert.equal(decoded.ok, true)
    assert.equal(decoded.text, sample)
  }
})

test("Base64URL uses - and _ and omits padding", () => {
  const encoded = encodeBase64("??>>", { urlSafe: true })
  assert.equal(encoded.ok, true)
  assert.match(encoded.output, /^[A-Za-z0-9_-]+$/)
  assert.equal(encoded.output.includes("="), false)
  const decoded = decodeBase64(encoded.output, { urlSafe: true })
  assert.equal(decoded.ok, true)
  assert.equal(decoded.text, "??>>")
})

test("Base64URL round-trips Persian and emoji", () => {
  for (const sample of samples) {
    const encoded = encodeBase64(sample, { urlSafe: true })
    assert.equal(encoded.ok, true)
    const decoded = decodeBase64(encoded.output, { urlSafe: true })
    assert.equal(decoded.ok, true)
    assert.equal(decoded.text, sample)
  }
})

test("decoding accepts whitespace and optional padding", () => {
  assert.equal(decodeBase64(" Zm9v\nYmFy ").text, "foobar")
  assert.equal(decodeBase64("Zm9vYg").text, "foob")
  assert.equal(decodeBase64("Zm9vYg==").text, "foob")
  assert.equal(decodeBase64("Pz8-", { urlSafe: true }).text, "??>")
})

test("decoding accepts both standard and URL-safe alphabets", () => {
  assert.equal(decodeBase64("Pz8+").text, "??>")
  assert.equal(decodeBase64("Pz8-").text, "??>")
  assert.equal(decodeBase64("Pz8+", { urlSafe: true }).text, "??>")
  assert.equal(decodeBase64("Pz8-", { urlSafe: false }).text, "??>")
})

test("invalid characters report a one-based position", () => {
  const result = decodeBase64("Zm9v!")
  assert.equal(result.ok, false)
  assert.equal(result.code, "alphabet")
  assert.equal(result.position, 5)
  assert.match(result.message, /Base64/)
})

test("invalid padding and length are rejected", () => {
  const middle = decodeBase64("ab=c")
  assert.equal(middle.ok, false)
  assert.equal(middle.code, "padding")
  assert.equal(middle.position, 4)

  const tooMuch = decodeBase64("A===")
  assert.equal(tooMuch.ok, false)
  assert.equal(tooMuch.code, "padding")

  const badLength = decodeBase64("Z")
  assert.equal(badLength.ok, false)
  assert.equal(badLength.code, "length")

  const badPaddedLength = decodeBase64("Zg=")
  assert.equal(badPaddedLength.ok, false)
  assert.equal(badPaddedLength.code, "length")
})

test("invalid UTF-8 bytes are reported instead of throwing", () => {
  const result = decodeBase64("/w==")
  assert.equal(result.ok, false)
  assert.equal(result.code, "utf8")
  assert.equal(result.position, 2)
})

test("lone surrogates cannot be encoded as UTF-8", () => {
  const result = encodeBase64("a\uD800b")
  assert.equal(result.ok, false)
  assert.equal(result.code, "surrogate")
  assert.equal(result.position, 2)
})

test("bytesToBase64 handles empty and arbitrary bytes", () => {
  assert.equal(bytesToBase64(new Uint8Array()), "")
  assert.equal(bytesToBase64(Uint8Array.from([0x66])), "Zg==")
  assert.equal(bytesToBase64(Uint8Array.from([0xfb, 0xff]), true), "-_8")
})
