import { diffArrays, diffLines } from "diff"

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
const complexityMessage = "مقایسهٔ دقیق این متن‌ها زمان زیادی می‌برد. متن را به بخش‌های کوچک‌تر تقسیم کنید."

function linesOf(text) {
  return (text.match(/[^\n]*\n|[^\n]+$/g) ?? []).map((raw, index) => {
    const ending = raw.endsWith("\r\n") ? "\r\n" : raw.endsWith("\n") ? "\n" : ""
    return { number: index + 1, text: ending ? raw.slice(0, -ending.length) : raw, ending }
  })
}

export function compareTexts(before, after) {
  const deadline = Date.now() + 4000
  function remainingTime() {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new Error(complexityMessage)
    return remaining
  }
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

  function side(line, changed) {
    return line ? { ...line, segments: [{ text: line.text, changed }] } : null
  }

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
