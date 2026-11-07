import { test } from "node:test"
import assert from "node:assert/strict"
import { collapseRows, groupChanges } from "../lib/hunks.mjs"
import { compareTexts } from "../lib/compare.mjs"

const rowsOf = (pattern) => Array.from(pattern, (kind) => ({ kind: { s: "same", m: "modified", a: "added", r: "removed" }[kind] }))

function render(items) {
  return items.map((item) => item.kind === "row" ? item.index : `[${item.from}-${item.to}]`)
}

test("groups adjacent changes into one block", () => {
  assert.deepEqual(groupChanges(rowsOf("ssmarsssa")), [{ start: 2, end: 5 }, { start: 8, end: 9 }])
  assert.deepEqual(groupChanges(rowsOf("mss")), [{ start: 0, end: 1 }])
  assert.deepEqual(groupChanges(rowsOf("ssr")), [{ start: 2, end: 3 }])
  assert.deepEqual(groupChanges(rowsOf("sss")), [])
  assert.deepEqual(groupChanges([]), [])
})

test("keeps context around changes and collapses the rest", () => {
  const rows = rowsOf("ssssssmsssssssssa")
  assert.deepEqual(render(collapseRows(rows, 2)), ["[0-4]", 4, 5, 6, 7, 8, "[9-14]", 14, 15, 16])
  const collapsed = collapseRows(rows, 2).find((item) => item.kind === "collapsed")
  assert.deepEqual(collapsed, { kind: "collapsed", from: 0, to: 4, count: 4 })
})

test("collapses trailing unchanged lines after the last change", () => {
  assert.deepEqual(render(collapseRows(rowsOf("asssssss"), 3)), [0, 1, 2, 3, "[4-8]"])
})

test("merges changes whose gap is covered by context", () => {
  assert.deepEqual(render(collapseRows(rowsOf("msssssm"), 3)), [0, 1, 2, 3, 4, 5, 6])
  // A single hidden line is not worth a placeholder.
  assert.deepEqual(render(collapseRows(rowsOf("msssssssssm"), 4)), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(render(collapseRows(rowsOf("mssssssssssm"), 4)), [0, 1, 2, 3, 4, "[5-7]", 7, 8, 9, 10, 11])
})

test("identical, change-only, and empty inputs", () => {
  assert.deepEqual(render(collapseRows(rowsOf("sssss"), 3)), ["[0-5]"])
  assert.deepEqual(render(collapseRows(rowsOf("aaa"), 3)), [0, 1, 2])
  assert.deepEqual(render(collapseRows(rowsOf("rr"), 3)), [0, 1])
  assert.deepEqual(collapseRows([], 3), [])
})

test("expanding a collapsed range shows only that range", () => {
  const rows = rowsOf("ssssssmssssssssssm")
  assert.deepEqual(render(collapseRows(rows, 2)), ["[0-4]", 4, 5, 6, 7, 8, "[9-15]", 15, 16, 17])
  assert.deepEqual(render(collapseRows(rows, 2, [9])), ["[0-4]", 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
})

test("every row appears exactly once in order", () => {
  const rows = rowsOf("sssmsssssssarsssssssssssssmss")
  for (const context of [0, 1, 3, 10]) {
    const indexes = collapseRows(rows, context).flatMap((item) => item.kind === "row" ? [item.index] : Array.from({ length: item.count }, (_, offset) => item.from + offset))
    assert.deepEqual(indexes, rows.map((_, index) => index))
  }
})

test("finds each scattered change in a long comparison", () => {
  const lines = Array.from({ length: 5000 }, (_, index) => `line ${index}`)
  const edited = lines.slice()
  for (const position of [10, 1200, 2500, 3999, 4990]) edited[position] += " changed"
  const { rows } = compareTexts(lines.join("\n"), edited.join("\n"))
  const changes = groupChanges(rows)
  assert.deepEqual(changes.map(({ start }) => start), [10, 1200, 2500, 3999, 4990])
  const items = collapseRows(rows, 3)
  assert.equal(items.filter((item) => item.kind === "row").length, 5 * 7)
  assert.equal(items.filter((item) => item.kind === "collapsed").length, 6)
})
