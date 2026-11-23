import { test } from "node:test"
import assert from "node:assert/strict"
import { decodeUrl, encodeUrl } from "../lib/url.mjs"

const samples = [
  "",
  "hello world",
  "سلام دنیا",
  "تهران/ایران",
  "a+b=c&d?e#f",
  "100%",
  "😀 & 🎉",
  "نیم‌فاصله",
]

test("component encoding matches encodeURIComponent", () => {
  for (const sample of samples) {
    const result = encodeUrl(sample)
    assert.equal(result.ok, true)
    assert.equal(result.output, encodeURIComponent(sample))
  }
})

test("full encoding matches encodeURI", () => {
  for (const sample of samples) {
    const result = encodeUrl(sample, { full: true })
    assert.equal(result.ok, true)
    assert.equal(result.output, encodeURI(sample))
  }
})

test("component decoding matches decodeURIComponent", () => {
  for (const sample of samples) {
    const encoded = encodeURIComponent(sample)
    const result = decodeUrl(encoded)
    assert.equal(result.ok, true)
    assert.equal(result.output, decodeURIComponent(encoded))
  }
})

test("full decoding matches decodeURI and keeps escaped reserved characters", () => {
  const encoded = "a%20b%2Fc%3Fd%3De%26f%23g"
  const result = decodeUrl(encoded, { full: true })
  assert.equal(result.ok, true)
  assert.equal(result.output, decodeURI(encoded))
  assert.equal(result.output, "a b%2Fc%3Fd%3De%26f%23g")

  const component = decodeUrl(encoded)
  assert.equal(component.ok, true)
  assert.equal(component.output, "a b/c?d=e&f#g")
})

test("plus is not treated as a space", () => {
  assert.equal(decodeUrl("a+b").output, "a+b")
  assert.equal(decodeUrl("a+b", { full: true }).output, "a+b")
})

test("Persian and emoji round-trip in both modes", () => {
  for (const sample of samples) {
    for (const full of [false, true]) {
      const encoded = encodeUrl(sample, { full })
      assert.equal(encoded.ok, true)
      const decoded = decodeUrl(encoded.output, { full })
      assert.equal(decoded.ok, true)
      assert.equal(decoded.output, sample)
    }
  }
})

test("incomplete percent escapes report a position", () => {
  const trailing = decodeUrl("abc%")
  assert.equal(trailing.ok, false)
  assert.equal(trailing.code, "percent")
  assert.equal(trailing.position, 4)

  const short = decodeUrl("abc%2")
  assert.equal(short.ok, false)
  assert.equal(short.code, "percent")
  assert.equal(short.position, 4)

  const nonHex = decodeUrl("ab%ZZ")
  assert.equal(nonHex.ok, false)
  assert.equal(nonHex.code, "percent")
  assert.equal(nonHex.position, 3)
})

test("invalid percent-encoded UTF-8 reports the source position", () => {
  const result = decodeUrl("x%FF")
  assert.equal(result.ok, false)
  assert.equal(result.code, "utf8")
  assert.equal(result.position, 2)
})

test("lone surrogates are rejected in both directions", () => {
  const encoded = encodeUrl("\uDC00")
  assert.equal(encoded.ok, false)
  assert.equal(encoded.code, "surrogate")
  assert.equal(encoded.position, 1)

  const decoded = decodeUrl("a\uD800")
  assert.equal(decoded.ok, false)
  assert.equal(decoded.code, "surrogate")
  assert.equal(decoded.position, 2)
})
