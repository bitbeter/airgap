// Local URL and email protection for the keyboard-layout fixer. The feature
// owns this copy so it does not import another feature's helpers.

const urlPattern = /\b(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"'`]+/gi
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const trailingUrlPunctuation = /[.,;:!?،؛؟»)\]}'"]/

function trimUrlEnd(text, start, end) {
  let trimmed = end
  while (trimmed > start && trailingUrlPunctuation.test(text[trimmed - 1])) trimmed -= 1
  return trimmed
}

export function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end)
  const merged = []
  for (const range of sorted) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}

export function findProtectedRanges(text) {
  const ranges = []
  for (const match of text.matchAll(urlPattern)) {
    const end = trimUrlEnd(text, match.index, match.index + match[0].length)
    if (end > match.index) ranges.push({ start: match.index, end, kind: "url" })
  }
  for (const match of text.matchAll(emailPattern)) {
    ranges.push({ start: match.index, end: match.index + match[0].length, kind: "email" })
  }
  return mergeRanges(ranges)
}
