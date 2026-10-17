import { test } from "node:test"
import assert from "node:assert/strict"
import { compareTexts } from "../src/lib/compare.mjs"

function changedText(side) {
  return side.segments.filter((segment) => segment.changed).map((segment) => segment.text).join("")
}

test("empty and identical Persian texts", () => {
  assert.deepEqual(compareTexts("", ""), { rows: [], added: 0, removed: 0, modified: 0 })
  const result = compareTexts("سلام\nدنیا", "سلام\nدنیا")
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.equal(result.rows.length, 2)
})

test("single character edit highlights only that character", () => {
  const result = compareTexts("price = 120;", "price = 130;")
  assert.equal(result.modified, 1)
  assert.equal(result.added + result.removed, 0)
  assert.equal(changedText(result.rows[0].before), "2")
  assert.equal(changedText(result.rows[0].after), "3")
})

test("aligns similar edited lines around an insertion", () => {
  const result = compareTexts("start\nconst alpha = 1;\nconst beta = 2;\nend", "start\ninserted heading\nconst alpha = 3;\nconst beta = 4;\nend")
  assert.equal(result.added, 1)
  assert.equal(result.modified, 2)
  assert.deepEqual(result.rows.map((row) => [row.before?.number ?? null, row.after?.number ?? null]), [[1, 1], [null, 2], [2, 3], [3, 4], [4, 5]])
  assert.equal(changedText(result.rows[2].before), "1")
  assert.equal(changedText(result.rows[2].after), "3")
})

test("preserves spaces, tabs, blank lines and one empty side", () => {
  assert.equal(compareTexts("", "a\n\nb\n").added, 3)
  assert.equal(compareTexts("a\n\nb\n", "").removed, 3)
  const result = compareTexts("hello world\t", "hello  world ")
  assert.equal(changedText(result.rows[0].before), "\t")
  assert.equal(changedText(result.rows[0].after), "  ")
})

test("CRLF and final newline changes remain visible", () => {
  const result = compareTexts("a\r\nb", "a\nb\n")
  assert.equal(result.modified, 2)
  assert.equal(result.rows[0].before.ending, "\r\n")
  assert.equal(result.rows[0].after.ending, "\n")
  assert.equal(result.rows[1].before.ending, "")
  assert.equal(result.rows[1].after.ending, "\n")
  assert.equal(changedText(result.rows[0].before), "")
})

test("emoji and combining marks remain whole graphemes", () => {
  const result = compareTexts("Hi 👩‍💻 cafe\u0301", "Hi 👨‍💻 cafe\u0300")
  assert.equal(changedText(result.rows[0].before), "👩‍💻e\u0301")
  assert.equal(changedText(result.rows[0].after), "👨‍💻e\u0300")
  const persian = compareTexts("میروم", "می‌روم")
  assert.equal(persian.modified, 1)
  assert.ok(changedText(persian.rows[0].after).includes("\u200c"))
})

test("large mostly identical texts", () => {
  const before = Array.from({ length: 10000 }, (_, index) => `خط ${index}`).join("\n")
  const result = compareTexts(before, before + "\nخط تازه")
  assert.equal(result.rows.at(-1).after.text, "خط تازه")
  assert.equal(result.rows.at(-1).after.number, 10001)
})

test("both sides can be reconstructed exactly after alignment", () => {
  const pairs = [
    ["a\na\nb\n", "a\nb\na\n"],
    ["سلام\nخداحافظ", "سلام!\n\nخداحافظ\n"],
    ["a\r\n\r\nb", "a\nb\n"],
    ["<script>alert(1)</script>", "<script>alert(2)</script>"],
    ["", "\n"],
  ]
  for (const [before, after] of pairs) {
    const result = compareTexts(before, after)
    for (const [side, original] of [["before", before], ["after", after]]) {
      const lines = result.rows.map((row) => row[side]).filter(Boolean)
      assert.equal(lines.map((line) => line.segments.map((segment) => segment.text).join("") + line.ending).join(""), original)
      assert.deepEqual(lines.map((line) => line.number), lines.map((_, index) => index + 1))
    }
  }
})

test("large edited blocks no longer hit a line-pair matrix limit", () => {
  const before = Array.from({ length: 250 }, (_, index) => `entry ${index}: old`).join("\n")
  const after = Array.from({ length: 250 }, (_, index) => `entry ${index}: new`).join("\n")
  const result = compareTexts(before, after)
  assert.equal(result.modified, 250)
  assert.equal(result.added + result.removed, 0)
  assert.ok(result.rows.every((row) => changedText(row.before) === "old" && changedText(row.after) === "new"))
})

test("line splits and joins preserve every character and line number", () => {
  const pairs = [
    ["hello world\nend", "hello\nworld\nend"],
    ["hello\nworld\nend", "hello world\nend"],
    ["same\nrepeat\nrepeat\nend", "same\nrepeat\nchanged\nrepeat\nend"],
    ["\n\n\n", "\n"],
  ]
  for (const [before, after] of pairs) {
    const result = compareTexts(before, after)
    for (const [side, original] of [["before", before], ["after", after]]) {
      const lines = result.rows.map((row) => row[side]).filter(Boolean)
      assert.equal(lines.map((line) => line.segments.map((segment) => segment.text).join("") + line.ending).join(""), original)
      assert.deepEqual(lines.map((line) => line.number), lines.map((_, index) => index + 1))
    }
  }
})
