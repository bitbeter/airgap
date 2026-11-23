import { test } from "node:test"
import assert from "node:assert/strict"
import {
  estimateRows, estimateRowsPerLine, lineAtOffset, lineFromBlocks, lineScrollTops, lineStartOffset, topForLine,
} from "../lib/scroll-map.mjs"

const measure = (value) => value.length * 10

test("lineStartOffset finds the first character of a 1-based line", () => {
  const text = "a\nbb\nccc"
  assert.equal(lineStartOffset(text, 1), 0)
  assert.equal(lineStartOffset(text, 2), 2)
  assert.equal(lineStartOffset(text, 3), 5)
  assert.equal(lineStartOffset(text, 99), text.length)
  assert.equal(lineStartOffset("", 3), 0)
})

test("estimateRows wraps at word boundaries and splits long words", () => {
  assert.equal(estimateRows("", measure, 100), 1)
  assert.equal(estimateRows("short", measure, 100), 1)
  assert.equal(estimateRows("aaaaaaaaaa", measure, 100), 1)
  assert.equal(estimateRows("aaaaaaaaaaa", measure, 100), 2)
  assert.equal(estimateRows("aaaa bbbb cccc", measure, 100), 2)
  assert.equal(estimateRows("aaaaaaaaaaaaaaaaaaaaaaaaa", measure, 100), 3)
  assert.equal(estimateRows("any text", measure, 0), 1)
})

test("estimateRowsPerLine keeps one entry per source line", () => {
  assert.deepEqual(estimateRowsPerLine("a\n\nbbbb bbbb bbbb", measure, 100), [1, 1, 2])
})

test("lineScrollTops accumulates wrapped rows", () => {
  assert.deepEqual(lineScrollTops([1, 2, 3], 20, 8), [8, 28, 68])
  assert.deepEqual(lineScrollTops([], 20), [])
})

test("topForLine clamps line numbers", () => {
  const tops = [8, 28, 68]
  assert.equal(topForLine(tops, 1), 8)
  assert.equal(topForLine(tops, 2), 28)
  assert.equal(topForLine(tops, 0), 8)
  assert.equal(topForLine(tops, 99), 68)
  assert.equal(topForLine([], 3), 0)
})

test("lineAtOffset finds the last line at or above an offset", () => {
  const tops = [8, 28, 68]
  assert.equal(lineAtOffset(tops, 0), 1)
  assert.equal(lineAtOffset(tops, 8), 1)
  assert.equal(lineAtOffset(tops, 27), 1)
  assert.equal(lineAtOffset(tops, 28), 2)
  assert.equal(lineAtOffset(tops, 1000), 3)
  assert.equal(lineAtOffset([], 5), 1)
})

test("lineFromBlocks maps a preview offset to the nearest preceding block", () => {
  const blocks = [
    { line: 1, top: 0 },
    { line: 5, top: 100 },
    { line: 9, top: 300 },
  ]
  assert.equal(lineFromBlocks(blocks, -10), 1)
  assert.equal(lineFromBlocks(blocks, 0), 1)
  assert.equal(lineFromBlocks(blocks, 99), 1)
  assert.equal(lineFromBlocks(blocks, 100), 5)
  assert.equal(lineFromBlocks(blocks, 250), 5)
  assert.equal(lineFromBlocks(blocks, 300), 9)
  assert.equal(lineFromBlocks([], 10), 1)
})
