import { diffArrays, diffLines } from "diff"
import { hasActiveOptions, normalizeOptions } from "./options.mjs"

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
const complexityMessage = "مقایسهٔ دقیق این متن‌ها زمان زیادی می‌برد. متن را به بخش‌های کوچک‌تر تقسیم کنید."

function linesOf(text) {
  return (text.match(/[^\n]*\n|[^\n]+$/g) ?? []).map((raw, index) => {
    const ending = raw.endsWith("\r\n") ? "\r\n" : raw.endsWith("\n") ? "\n" : ""
    return { number: index + 1, text: ending ? raw.slice(0, -ending.length) : raw, ending }
  })
}

function createDeadline() {
  const deadline = Date.now() + 4000
  return function remainingTime() {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new Error(complexityMessage)
    return remaining
  }
}

function side(line, changed) {
  return line ? { ...line, segments: [{ text: line.text, changed }] } : null
}

// Only ASCII case is folded, so Persian and other scripts stay untouched.
function normalizePersianCharacter(character) {
  if (character === "\u064a") return "\u06cc"
  if (character === "\u0643") return "\u06a9"
  const code = character.codePointAt(0)
  if (code >= 0x06f0 && code <= 0x06f9) return String.fromCharCode(0x30 + code - 0x06f0)
  if (code >= 0x0660 && code <= 0x0669) return String.fromCharCode(0x30 + code - 0x0660)
  return character
}

function normalizeMatchText(text, options) {
  let result = text
  if (options.ignoreWhitespace) result = result.replace(/\s+/g, "")
  else if (options.trimLines) result = result.trim()
  if (options.ignoreCase) result = result.replace(/[A-Z]/g, (character) => character.toLowerCase())
  if (options.normalizePersian) result = Array.from(result, normalizePersianCharacter).join("")
  return result
}

function lineKey(line, options) {
  // `git diff -w` treats the CR of a CRLF ending as whitespace too.
  const ignoreEnding = options.ignoreCrLf || options.ignoreWhitespace
  const ending = ignoreEnding && line.ending === "\r\n" ? "\n" : line.ending
  return `${normalizeMatchText(line.text, options)}\u0000${ending}`
}

// A normalized string plus a map from each normalized code unit back to its
// original position. The map lets inline highlights show the user's own text.
function normalizeWithMap(text, options) {
  let start = 0
  let end = text.length
  if (options.trimLines && !options.ignoreWhitespace) {
    while (start < end && /\s/.test(text[start])) start++
    while (end > start && /\s/.test(text[end - 1])) end--
  }
  const output = []
  const map = []
  for (let index = start; index < end; index++) {
    const character = text[index]
    if (options.ignoreWhitespace && /\s/.test(character)) continue
    let normalized = character
    if (options.ignoreCase && character >= "A" && character <= "Z") normalized = character.toLowerCase()
    if (options.normalizePersian) normalized = normalizePersianCharacter(normalized)
    for (let offset = 0; offset < normalized.length; offset++) {
      output.push(normalized[offset])
      map.push(index)
    }
  }
  return { text: output.join(""), map, originalLength: text.length }
}

function graphemesOf(text) {
  return Array.from(segmenter.segment(text), (part) => part.segment)
}

function graphemePositions(graphemes) {
  const positions = new Array(graphemes.length + 1)
  let position = 0
  for (let index = 0; index < graphemes.length; index++) {
    positions[index] = position
    position += graphemes[index].length
  }
  positions[graphemes.length] = position
  return positions
}

// Consecutive grapheme ranges partition the original text, including any
// characters that normalization removed (trimmed or ignored whitespace).
function originalRange(normalized, positions, from, to) {
  const normalizedStart = positions[from]
  const normalizedEnd = positions[to]
  return {
    start: normalizedStart === 0 ? 0 : normalized.map[normalizedStart],
    end: normalizedEnd === normalized.text.length ? normalized.originalLength : normalized.map[normalizedEnd],
  }
}

function inlineSegments(left, right, options, remainingTime) {
  const leftNormalized = normalizeWithMap(left.text, options)
  const rightNormalized = normalizeWithMap(right.text, options)
  const before = []
  const after = []
  if (!leftNormalized.text) before.push({ text: left.text, changed: false })
  if (!rightNormalized.text) after.push({ text: right.text, changed: false })
  if (!leftNormalized.text && !rightNormalized.text) return { before, after }

  const leftGraphemes = graphemesOf(leftNormalized.text)
  const rightGraphemes = graphemesOf(rightNormalized.text)
  const leftPositions = graphemePositions(leftGraphemes)
  const rightPositions = graphemePositions(rightGraphemes)
  const parts = diffArrays(leftGraphemes, rightGraphemes, { timeout: remainingTime() })
  if (!parts) throw new Error(complexityMessage)

  let leftIndex = 0
  let rightIndex = 0
  for (const part of parts) {
    const count = part.value.length
    if (part.removed) {
      const range = originalRange(leftNormalized, leftPositions, leftIndex, leftIndex + count)
      if (range.end > range.start) before.push({ text: left.text.slice(range.start, range.end), changed: true })
      leftIndex += count
    } else if (part.added) {
      const range = originalRange(rightNormalized, rightPositions, rightIndex, rightIndex + count)
      if (range.end > range.start) after.push({ text: right.text.slice(range.start, range.end), changed: true })
      rightIndex += count
    } else {
      const leftRange = originalRange(leftNormalized, leftPositions, leftIndex, leftIndex + count)
      const rightRange = originalRange(rightNormalized, rightPositions, rightIndex, rightIndex + count)
      if (leftRange.end > leftRange.start) before.push({ text: left.text.slice(leftRange.start, leftRange.end), changed: false })
      if (rightRange.end > rightRange.start) after.push({ text: right.text.slice(rightRange.start, rightRange.end), changed: false })
      leftIndex += count
      rightIndex += count
    }
  }
  return { before, after }
}

function compareExact(before, after) {
  const remainingTime = createDeadline()
  const beforeLines = linesOf(before)
  const afterLines = linesOf(after)
  const changes = diffLines(before, after, {
    ignoreWhitespace: false,
    ignoreNewlineAtEof: false,
    stripTrailingCr: false,
    timeout: remainingTime(),
  })
  if (!changes) throw new Error(complexityMessage)
  const rows = []
  let added = 0
  let removed = 0
  let modified = 0
  let oldPosition = 0
  let newPosition = 0

  function appendPair(left, right, parts) {
    if (!left || !right) {
      rows.push({ kind: left ? "removed" : "added", before: side(left, true), after: side(right, true) })
      if (left) removed++
      else added++
      return
    }
    const changed = left.text !== right.text || left.ending !== right.ending
    if (changed) modified++
    rows.push({
      kind: changed ? "modified" : "same",
      before: { ...left, segments: parts.filter((part) => !part.added).map((part) => ({ text: part.value.join(""), changed: !!part.removed })) },
      after: { ...right, segments: parts.filter((part) => !part.removed).map((part) => ({ text: part.value.join(""), changed: !!part.added })) },
    })
  }

  function align(leftLines, rightLines) {
    if (!leftLines.length || !rightLines.length) {
      for (const line of leftLines) appendPair(line, null, [])
      for (const line of rightLines) appendPair(null, line, [])
      return
    }
    const leftTokens = leftLines.map((line) => Array.from(segmenter.segment(line.text), (part) => part.segment))
    const rightTokens = rightLines.map((line) => Array.from(segmenter.segment(line.text), (part) => part.segment))
    function characterDiff(leftIndex, rightIndex) {
      const parts = diffArrays(leftTokens[leftIndex], rightTokens[rightIndex], { timeout: remainingTime() })
      if (!parts) throw new Error(complexityMessage)
      return parts
    }
    const blockChanges = diffArrays(
      leftTokens.flatMap((tokens) => tokens.concat("\n")),
      rightTokens.flatMap((tokens) => tokens.concat("\n")),
      { timeout: remainingTime() },
    )
    if (!blockChanges) throw new Error(complexityMessage)
    let leftIndex = 0
    let rightIndex = 0
    for (const part of blockChanges) {
      for (const token of part.value) {
        if (token !== "\n") continue
        if (part.removed) appendPair(leftLines[leftIndex++], null, [])
        else if (part.added) appendPair(null, rightLines[rightIndex++], [])
        else {
          appendPair(leftLines[leftIndex], rightLines[rightIndex], characterDiff(leftIndex, rightIndex))
          leftIndex++
          rightIndex++
        }
      }
    }
  }

  for (let index = 0; index < changes.length; index++) {
    const change = changes[index]
    if (!change.added && !change.removed) {
      for (let offset = 0; offset < change.count; offset++) {
        rows.push({ kind: "same", before: side(beforeLines[oldPosition++], false), after: side(afterLines[newPosition++], false) })
      }
      continue
    }
    const leftLines = []
    const rightLines = []
    while (index < changes.length && (changes[index].added || changes[index].removed)) {
      const block = changes[index]
      for (let offset = 0; offset < block.count; offset++) {
        if (block.removed) leftLines.push(beforeLines[oldPosition++])
        else rightLines.push(afterLines[newPosition++])
      }
      index++
    }
    index--
    align(leftLines, rightLines)
  }
  return { rows, added, removed, modified }
}

function compareIgnoring(before, after, options) {
  const remainingTime = createDeadline()
  const beforeLines = linesOf(before)
  const afterLines = linesOf(after)
  const beforeKeys = beforeLines.map((line) => lineKey(line, options))
  const afterKeys = afterLines.map((line) => lineKey(line, options))
  const changes = diffArrays(beforeKeys, afterKeys, { timeout: remainingTime() })
  if (!changes) throw new Error(complexityMessage)
  const rows = []
  let added = 0
  let removed = 0
  let modified = 0
  let oldPosition = 0
  let newPosition = 0

  function appendPair(left, right) {
    if (!left || !right) {
      rows.push({ kind: left ? "removed" : "added", before: side(left, true), after: side(right, true) })
      if (left) removed++
      else added++
      return
    }
    const rawSame = left.text === right.text && left.ending === right.ending
    if (lineKey(left, options) === lineKey(right, options)) {
      rows.push({ kind: "same", before: side(left, false), after: side(right, false), ...(rawSame ? {} : { ignored: true }) })
      return
    }
    modified++
    const segments = inlineSegments(left, right, options, remainingTime)
    rows.push({
      kind: "modified",
      before: { ...left, segments: segments.before },
      after: { ...right, segments: segments.after },
    })
  }

  function align(leftLines, rightLines) {
    if (!leftLines.length || !rightLines.length) {
      for (const line of leftLines) appendPair(line, null)
      for (const line of rightLines) appendPair(null, line)
      return
    }
    const leftTokens = leftLines.map((line) => graphemesOf(normalizeMatchText(line.text, options)))
    const rightTokens = rightLines.map((line) => graphemesOf(normalizeMatchText(line.text, options)))
    const blockChanges = diffArrays(
      leftTokens.flatMap((tokens) => tokens.concat("\n")),
      rightTokens.flatMap((tokens) => tokens.concat("\n")),
      { timeout: remainingTime() },
    )
    if (!blockChanges) throw new Error(complexityMessage)
    let leftIndex = 0
    let rightIndex = 0
    for (const part of blockChanges) {
      for (const token of part.value) {
        if (token !== "\n") continue
        if (part.removed) appendPair(leftLines[leftIndex++], null)
        else if (part.added) appendPair(null, rightLines[rightIndex++])
        else {
          appendPair(leftLines[leftIndex], rightLines[rightIndex])
          leftIndex++
          rightIndex++
        }
      }
    }
  }

  for (let index = 0; index < changes.length; index++) {
    const change = changes[index]
    if (!change.added && !change.removed) {
      for (let offset = 0; offset < change.value.length; offset++) {
        appendPair(beforeLines[oldPosition++], afterLines[newPosition++])
      }
      continue
    }
    const leftLines = []
    const rightLines = []
    while (index < changes.length && (changes[index].added || changes[index].removed)) {
      const block = changes[index]
      for (let offset = 0; offset < block.value.length; offset++) {
        if (block.removed) leftLines.push(beforeLines[oldPosition++])
        else rightLines.push(afterLines[newPosition++])
      }
      index++
    }
    index--
    align(leftLines, rightLines)
  }

  if (options.ignoreBlankLines) {
    for (const row of rows) {
      if (row.kind === "same") continue
      const lines = [row.before, row.after].filter(Boolean)
      if (!lines.length || !lines.every((line) => line.text.trim() === "")) continue
      if (row.kind === "added") added--
      else if (row.kind === "removed") removed--
      else modified--
      row.kind = "same"
      row.ignored = true
      for (const line of lines) line.segments = [{ text: line.text, changed: false }]
    }
  }

  return { rows, added, removed, modified }
}

export function compareTexts(before, after, options = {}) {
  const normalized = normalizeOptions(options)
  return hasActiveOptions(normalized) ? compareIgnoring(before, after, normalized) : compareExact(before, after)
}
