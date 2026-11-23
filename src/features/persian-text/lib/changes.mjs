import { diffChars, diffWordsWithSpace } from "diff"

// Rendering tens of thousands of highlighted spans freezes the page, so very
// large inputs fall back to a plain output with a note.
export const inlineHighlightLimit = 150000
const wordDiffThreshold = 40000

export function buildInlineChanges(before, after, { timeout = 4000 } = {}) {
  if (before.length + after.length > inlineHighlightLimit) return null
  const parts = before.length + after.length > wordDiffThreshold
    ? diffWordsWithSpace(before, after, { timeout })
    : diffChars(before, after, { timeout })
  if (!parts) return null
  return parts.map((part) => ({
    value: part.value,
    kind: part.added ? "added" : part.removed ? "removed" : "same",
  }))
}
