import { test } from "node:test"
import assert from "node:assert/strict"
import { decodeEntities, encodeEntities } from "../lib/entities.mjs"

test("encoding escapes the five HTML-significant characters", () => {
  const result = encodeEntities(`<a href="x">Tom & Jerry's</a>`)
  assert.equal(result.ok, true)
  assert.equal(
    result.output,
    "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
  )
})

test("encode/decode round-trips Persian text and special characters", () => {
  const samples = [
    "سلام دنیا",
    "<b>تهران</b> & «ایران»",
    `"نقل قول" و 'تک‌نقل قول'`,
    "😀 <ok> & done",
    "",
  ]
  for (const sample of samples) {
    const encoded = encodeEntities(sample)
    assert.equal(encoded.ok, true)
    const decoded = decodeEntities(encoded.output)
    assert.equal(decoded.ok, true)
    assert.equal(decoded.output, sample)
  }
})

test("decoding supports common named entities", () => {
  assert.equal(decodeEntities("&amp; &lt; &gt; &quot; &apos;").output, `& < > " '`)
  assert.equal(decodeEntities("&nbsp;").output, "\u00a0")
  assert.equal(decodeEntities("&copy; &reg; &hellip; &mdash;").output, "© ® … —")
  assert.equal(decodeEntities("&zwnj;").output, "\u200c")
})

test("decoding supports decimal and hexadecimal numeric references", () => {
  assert.equal(decodeEntities("&#65;&#x42;&#x1F600;").output, "AB😀")
  assert.equal(decodeEntities("&#1605;&#1581;&#1605;&#1583;").output, "محمد")
})

test("unknown named entities are left untouched", () => {
  assert.equal(decodeEntities("&unknown; &Amp; &amp").output, "&unknown; &Amp; &amp")
})

test("decoding is a single pass and never double-decodes", () => {
  assert.equal(decodeEntities("&amp;lt;").output, "&lt;")
  assert.equal(decodeEntities("&amp;amp;").output, "&amp;")
})

test("invalid numeric references report a position", () => {
  const tooLarge = decodeEntities("a &#x110000; b")
  assert.equal(tooLarge.ok, false)
  assert.equal(tooLarge.code, "numeric")
  assert.equal(tooLarge.position, 3)

  const surrogate = decodeEntities("&#xD800;")
  assert.equal(surrogate.ok, false)
  assert.equal(surrogate.code, "numeric")

  const zero = decodeEntities("&#0;")
  assert.equal(zero.ok, false)
  assert.equal(zero.code, "numeric")
})

test("lone surrogates are rejected when encoding", () => {
  const result = encodeEntities("a\uD800b")
  assert.equal(result.ok, false)
  assert.equal(result.code, "surrogate")
  assert.equal(result.position, 2)
})
