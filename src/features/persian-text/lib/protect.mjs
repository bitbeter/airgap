const urlPattern = /\b(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"'`]+/gi
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const trailingUrlPunctuation = /[.,;:!?،؛؟»)\]}'"]/

function trimUrlEnd(text, start, end) {
  let trimmed = end
  while (trimmed > start && trailingUrlPunctuation.test(text[trimmed - 1])) trimmed -= 1
  return trimmed
}

function insideAny(index, ranges) {
  return ranges.some((range) => index >= range.start && index < range.end)
}

function overlapsAny(start, end, ranges) {
  return ranges.some((range) => start < range.end && end > range.start)
}

/**
 * Fenced code blocks are found line by line so an opening fence only closes
 * with a fence of the same character and at least the same length.
 */
function findFencedCode(text) {
  const ranges = []
  const lines = text.split("\n")
  let offset = 0
  let fence = null
  for (const line of lines) {
    const lineStart = offset
    const lineEnd = offset + line.length
    if (fence) {
      const close = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*\r?$/.exec(line)
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) {
        ranges.push({ start: fence.start, end: lineEnd, kind: "code" })
        fence = null
      }
    } else {
      const open = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line)
      if (open) fence = { char: open[1][0], length: open[1].length, start: lineStart }
    }
    offset = lineEnd + 1
  }
  if (fence) ranges.push({ start: fence.start, end: text.length, kind: "code" })
  return ranges
}

/**
 * Inline code spans use matching backtick runs. Runs inside fenced blocks are
 * ignored, and a span may not cross a fenced block.
 */
function findInlineCode(text, fenced) {
  const runs = []
  for (const match of text.matchAll(/`+/g)) {
    const start = match.index
    if (insideAny(start, fenced)) continue
    runs.push({ start, end: start + match[0].length, length: match[0].length })
  }
  const ranges = []
  for (let index = 0; index < runs.length; index += 1) {
    const open = runs[index]
    for (let next = index + 1; next < runs.length; next += 1) {
      if (runs[next].length !== open.length) continue
      const start = open.start
      const end = runs[next].end
      if (overlapsAny(start, end, fenced)) break
      ranges.push({ start, end, kind: "code" })
      index = next
      break
    }
  }
  return ranges
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

export function findProtectedRanges(text, { code = true } = {}) {
  const ranges = []
  for (const match of text.matchAll(urlPattern)) {
    const end = trimUrlEnd(text, match.index, match.index + match[0].length)
    if (end > match.index) ranges.push({ start: match.index, end, kind: "url" })
  }
  for (const match of text.matchAll(emailPattern)) {
    ranges.push({ start: match.index, end: match.index + match[0].length, kind: "email" })
  }
  if (code) {
    const fenced = findFencedCode(text)
    ranges.push(...fenced, ...findInlineCode(text, fenced))
  }
  return mergeRanges(ranges)
}

export function isProtected(index, ranges) {
  let low = 0
  let high = ranges.length - 1
  while (low <= high) {
    const middle = (low + high) >> 1
    const range = ranges[middle]
    if (index < range.start) high = middle - 1
    else if (index >= range.end) low = middle + 1
    else return true
  }
  return false
}

export function overlapsProtected(start, end, ranges) {
  let low = 0
  let high = ranges.length - 1
  while (low <= high) {
    const middle = (low + high) >> 1
    const range = ranges[middle]
    if (range.end <= start) low = middle + 1
    else if (range.start >= end) high = middle - 1
    else return true
  }
  return false
}

/**
 * Runs a global replacement but leaves every match that touches a protected
 * range untouched. The replacer receives the same arguments as String#replace.
 */
export function replaceOutside(text, ranges, regex, replacer) {
  let count = 0
  const output = text.replace(regex, (...args) => {
    const match = args[0]
    const offset = args[args.length - 2]
    if (overlapsProtected(offset, offset + match.length, ranges)) return match
    const replacement = replacer(...args)
    if (replacement !== match) count += 1
    return replacement
  })
  return { text: output, count }
}
