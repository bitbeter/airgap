import { test } from "node:test"
import assert from "node:assert/strict"
import { textStats } from "../stats.mjs"

test("counts Persian words joined by ZWNJ as one word", () => {
  const stats = textStats("من می‌خواهم کتاب‌ها را بخوانم.")
  assert.equal(stats.words, 5)
})

test("ignores Markdown punctuation and counts mixed text", () => {
  assert.equal(textStats("# عنوان\n\n- **bold** item, ۱۴۰۳ and `code`").words, 6)
})

test("counts characters as graphemes and lines by newline", () => {
  assert.deepEqual(textStats(""), { words: 0, characters: 0, lines: 0, readingMinutes: 0 })
  const stats = textStats("👩‍💻 é\nسلام\n")
  assert.equal(stats.characters, 9)
  assert.equal(stats.lines, 3)
})

test("reading time rounds to whole minutes with a minimum of one", () => {
  assert.equal(textStats("یک").readingMinutes, 1)
  assert.equal(textStats(Array(500).fill("واژه").join(" ")).readingMinutes, 3)
})
