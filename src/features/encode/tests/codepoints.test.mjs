import { test } from "node:test"
import assert from "node:assert/strict"
import {
  codepointReport,
  codepointSummary,
  describeCodepoints,
} from "../lib/codepoints.mjs"

test("describes Persian letters with code point and UTF-8 bytes", () => {
  const [entry] = describeCodepoints("م")
  assert.equal(entry.codePoint, 0x645)
  assert.equal(entry.hex, "U+0645")
  assert.equal(entry.decimal, 1605)
  assert.equal(entry.utf8, "d9 85")
  assert.equal(entry.category, "حرف")
  assert.equal(entry.isInvisible, false)
})

test("counts emoji as one code point spanning two UTF-16 units", () => {
  const entries = describeCodepoints("😀a")
  assert.equal(entries.length, 2)
  assert.equal(entries[0].codePoint, 0x1f600)
  assert.equal(entries[0].hex, "U+1F600")
  assert.equal(entries[0].index, 0)
  assert.equal(entries[1].index, 2)
  assert.equal(entries[1].char, "a")
})

test("flags ZWNJ, NBSP, BOM, bidi controls, and variation selectors as invisible", () => {
  const entries = describeCodepoints("\u200c\u00a0\ufeff\u200f\ufe0f")
  assert.equal(entries.length, 5)
  for (const entry of entries) assert.equal(entry.isInvisible, true, entry.hex)
  assert.match(entries[0].name, /ZWNJ/)
  assert.match(entries[1].name, /NBSP/)
  assert.match(entries[2].name, /BOM/)
  assert.match(entries[3].name, /RLM/)
  assert.match(entries[4].name, /ایموجی/)
})

test("flags combining marks and control characters", () => {
  const entries = describeCodepoints("a\u0301\n")
  assert.equal(entries[1].isMark, true)
  assert.equal(entries[1].category, "علامت ترکیبی")
  assert.equal(entries[2].isControl, true)
  assert.equal(entries[2].isInvisible, true)
  assert.equal(entries[2].display, "\\u{A}")
})

test("regular spaces stay visible while other whitespace is invisible", () => {
  const [space, tab] = describeCodepoints(" \t")
  assert.equal(space.isInvisible, false)
  assert.equal(tab.isInvisible, true)
})

test("summary counts total, unique, and invisible code points", () => {
  const entries = describeCodepoints("سلام سلام\u200c")
  const summary = codepointSummary(entries)
  assert.equal(summary.total, entries.length)
  assert.equal(summary.invisible, 1)
  assert.equal(summary.unique, new Set(entries.map((entry) => entry.codePoint)).size)
})

test("report lists every code point with its UTF-8 bytes", () => {
  const entries = describeCodepoints("م\u200c")
  const report = codepointReport(entries)
  assert.match(report, /1\. U\+0645 \(1605\)/)
  assert.match(report, /UTF-8: d9 85/)
  assert.match(report, /2\. U\+200C \(8204\)/)
  assert.match(report, /ZWNJ/)
})

test("empty text has no entries", () => {
  assert.deepEqual(describeCodepoints(""), [])
  assert.deepEqual(codepointSummary([]), { total: 0, unique: 0, invisible: 0 })
})
