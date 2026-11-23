import { test } from "node:test"
import assert from "node:assert/strict"
import { buildInlineChanges, inlineHighlightLimit } from "../lib/changes.mjs"

test("buildInlineChanges marks unchanged, removed and added text", () => {
  const segments = buildInlineChanges("سلام دنیا", "سلام دنیا!")
  assert.ok(segments)
  assert.equal(segments.map((segment) => segment.value).join(""), "سلام دنیا!")
  assert.equal(segments.some((segment) => segment.kind === "added"), true)
  assert.equal(segments.some((segment) => segment.kind === "removed"), false)
})

test("buildInlineChanges returns null above the highlight limit", () => {
  const size = Math.ceil(inlineHighlightLimit / 2) + 1
  assert.equal(buildInlineChanges("a".repeat(size), "b".repeat(size)), null)
})

test("buildInlineChanges handles identical text as one unchanged segment", () => {
  const segments = buildInlineChanges("متن یکسان", "متن یکسان")
  assert.deepEqual(segments, [{ value: "متن یکسان", kind: "same" }])
})
