// Pure text transformations for the editor toolbar and keys. Each returns the
// full next text and selection, or null when the browser default should run.

const listItem = /^([ \t]*)([-*+]|\d{1,9}[.)])([ \t]+)(\[[ xX]\][ \t]+)?/
const headingPrefix = /^ {0,3}#{1,6}(?:[ \t]+|$)/
const quotePrefix = /^ {0,3}> ?/
const fenceLine = /^ {0,3}(?:```|~~~)/

const inlineMarkers = { bold: "**", italic: "_", strikethrough: "~~", code: "`" }
const linePrefixes = ["heading1", "heading2", "heading3", "bullet", "ordered", "task", "quote"]

// `select` is a caret offset or the part of the template selected after insertion.
function template(text, select, blankLines) {
  const start = typeof select === "number" ? select : text.indexOf(select)
  return { text, select: [start, typeof select === "number" ? start : start + select.length], blankLines }
}

const blocks = {
  codeBlock: template("```\n\n```", 4, false),
  table: template("| ستون ۱ | ستون ۲ | ستون ۳ |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |", "ستون ۱", true),
  rule: template("---", 3, true),
  mermaid: template("```mermaid\nflowchart LR\n  A[شروع] --> B[پایان]\n```", "شروع", true),
}

function lineStart(text, index) {
  return text.lastIndexOf("\n", index - 1) + 1
}

function lineEnd(text, index) {
  const end = text.indexOf("\n", index)
  return end === -1 ? text.length : end
}

// A selection ending at the start of a line does not include that line.
function selectedLines(text, start, end) {
  const last = end > start && text[end - 1] === "\n" ? end - 1 : end
  return { from: lineStart(text, start), to: lineEnd(text, last) }
}

function insideFence(text, index) {
  let inside = false
  for (const line of text.slice(0, index).split("\n").slice(0, -1)) {
    if (fenceLine.test(line)) inside = !inside
  }
  return inside
}

function result(text, selectionStart, selectionEnd = selectionStart) {
  return { text, selectionStart, selectionEnd }
}

// Replace whole lines; a caret keeps its distance from the line end, and a selection covers the changed lines.
function replaceLines(text, start, end, from, to, nextLines) {
  const previous = text.slice(from, to)
  const next = nextLines.join("\n")
  if (next === previous) return null
  const updated = text.slice(0, from) + next + text.slice(to)
  const nextEnd = from + next.length
  if (nextLines.length > 1 || start !== end) return result(updated, from, nextEnd)
  return result(updated, Math.max(from, nextEnd - (to - start)))
}

function toggleInline(text, start, end, marker) {
  const size = marker.length
  const outside = start >= size && text.slice(start - size, start) === marker && text.slice(end, end + size) === marker
  if (start === end) {
    if (outside) return result(text.slice(0, start - size) + text.slice(end + size), start - size)
    return result(text.slice(0, start) + marker + marker + text.slice(end), start + size)
  }
  const selected = text.slice(start, end)
  if (outside && !selected.includes("\n")) {
    return result(text.slice(0, start - size) + selected + text.slice(end + size), start - size, end - size)
  }
  // Wrap each line separately; inline markers cannot span lines.
  const parts = selected.split("\n").map((line) => /^(\s*)(.*?)(\s*)$/s.exec(line).slice(1))
  const filled = parts.filter(([, core]) => core)
  if (!filled.length) return toggleInline(text, end, end, marker)
  const wrapped = (core) => core.length >= size * 2 && core.startsWith(marker) && core.endsWith(marker)
  const unwrap = filled.every(([, core]) => wrapped(core))
  const next = parts.map(([lead, core, trail]) => !core ? lead + trail
    : unwrap ? lead + core.slice(size, -size) + trail
    : wrapped(core) ? lead + core + trail
    : lead + marker + core + marker + trail).join("\n")
  return result(text.slice(0, start) + next + text.slice(end), start, start + next.length)
}

function insertLink(text, start, end) {
  const selected = text.slice(start, end)
  const before = text.slice(0, start)
  const after = text.slice(end)
  if (/^(?:https?:\/\/|mailto:)\S+$/.test(selected)) {
    return result(`${before}[](${selected})${after}`, start + 1)
  }
  const label = selected || "متن پیوند"
  const url = "https://"
  const updated = `${before}[${label}](${url})${after}`
  if (!selected) return result(updated, start + 1, start + 1 + label.length)
  const urlStart = start + label.length + 3
  return result(updated, urlStart, urlStart + url.length)
}

function hasPrefix(kind, line) {
  if (kind.startsWith("heading")) return new RegExp(`^ {0,3}#{${kind.at(-1)}}(?:[ \\t]+|$)`).test(line)
  if (kind === "quote") return quotePrefix.test(line)
  const match = listItem.exec(line)
  if (!match) return false
  const ordered = /\d/.test(match[2])
  if (kind === "ordered") return ordered
  return !ordered && !!match[4] === (kind === "task")
}

function stripPrefix(kind, line) {
  if (kind.startsWith("heading")) return line.replace(headingPrefix, "")
  if (kind === "quote") return line.replace(quotePrefix, "")
  const match = listItem.exec(line)
  return match ? match[1] + line.slice(match[0].length) : line
}

function toggleLinePrefix(text, start, end, kind) {
  const { from, to } = selectedLines(text, start, end)
  const lines = text.slice(from, to).split("\n")
  const target = (line) => lines.length === 1 || line.trim() !== ""
  const remove = lines.every((line) => !target(line) || hasPrefix(kind, line))
  const numbers = new Map()
  const next = lines.map((line) => {
    if (!target(line)) return line
    const content = stripPrefix(kind, line)
    if (remove) return content
    if (kind.startsWith("heading")) return `${"#".repeat(Number(kind.at(-1)))} ${content.trimStart()}`
    if (kind === "quote") return `> ${content}`
    const [indent] = /^[ \t]*/.exec(content)
    const body = content.slice(indent.length)
    if (kind === "bullet") return `${indent}- ${body}`
    if (kind === "task") return `${indent}- [ ] ${body}`
    // Number each nesting level independently.
    const number = (numbers.get(indent) ?? 0) + 1
    numbers.set(indent, number)
    return `${indent}${number}. ${body}`
  })
  return replaceLines(text, start, end, from, to, next)
}

function insertBlock(text, start, end, block) {
  const selected = text.slice(start, end)
  if (block === blocks.codeBlock && selected) {
    const { from, to } = selectedLines(text, start, end)
    const fenced = "```\n" + text.slice(from, to) + "\n```"
    return result(text.slice(0, from) + fenced + text.slice(to), from + 3)
  }
  const lineFrom = lineStart(text, selected ? end : start)
  const lineTo = lineEnd(text, selected ? selectedLines(text, start, end).to : start)
  const emptyLine = !selected && text.slice(lineFrom, lineTo).trim() === ""
  const from = emptyLine ? lineFrom : lineTo
  // Blank lines keep a rule from turning the previous line into a heading.
  const previousFilled = from > 0 && text.slice(lineStart(text, from - 1), from - 1).trim() !== ""
  const prefix = emptyLine ? (block.blankLines && from > 0 && previousFilled ? "\n" : "") : block.blankLines ? "\n\n" : "\n"
  const nextFilled = lineTo < text.length && text.slice(lineTo + 1, lineEnd(text, lineTo + 1)).trim() !== ""
  const suffix = block.blankLines && nextFilled ? "\n" : ""
  const offset = from + prefix.length
  const updated = text.slice(0, from) + prefix + block.text + suffix + text.slice(emptyLine ? lineTo : from)
  return result(updated, offset + block.select[0], offset + block.select[1])
}

export const formatActions = [...Object.keys(inlineMarkers), "link", ...linePrefixes, ...Object.keys(blocks)]

export function formatText(text, start, end, action) {
  if (action in inlineMarkers) return toggleInline(text, start, end, inlineMarkers[action])
  if (action === "link") return insertLink(text, start, end)
  if (linePrefixes.includes(action)) return toggleLinePrefix(text, start, end, action)
  if (action in blocks) return insertBlock(text, start, end, blocks[action])
  throw new Error(`Unknown format action: ${action}`)
}

export function continueList(text, start, end) {
  if (start !== end) return null
  const from = lineStart(text, start)
  const to = lineEnd(text, start)
  const match = listItem.exec(text.slice(from, to))
  if (!match || start - from < match[0].length || insideFence(text, from)) return null
  // Enter on an empty item ends the list; a blank line keeps following text out of it.
  if (text.slice(from + match[0].length, to).trim() === "") {
    const blank = from > 0 && text.slice(lineStart(text, from - 1), from - 1).trim() !== "" ? "\n" : ""
    return result(text.slice(0, from) + blank + text.slice(to), from + blank.length)
  }
  const [, indent, marker, space, task] = match
  const next = /\d/.test(marker) ? `${Number(marker.slice(0, -1)) + 1}${marker.at(-1)}` : marker
  const insert = `\n${indent}${next}${space}${task ? "[ ] " : ""}`
  return result(text.slice(0, start) + insert + text.slice(end), start + insert.length)
}

// Nest under the previous sibling, or move to the parent's level.
function listIndent(lines, index, outdent) {
  const match = listItem.exec(lines[index])
  const indent = match[1].length
  for (let line = index - 1; line >= 0; line--) {
    const candidate = listItem.exec(lines[line])
    if (!candidate) {
      if (lines[line].trim() !== "" && !/^[ \t]/.test(lines[line])) break
      continue
    }
    const level = candidate[1].length
    if (outdent && level < indent) return level
    if (!outdent && level === indent) return candidate[0].length - (candidate[4]?.length ?? 0)
    if (!outdent && level < indent) break
  }
  return outdent ? 0 : indent
}

export function indentList(text, start, end, outdent) {
  const { from, to } = selectedLines(text, start, end)
  const lines = text.split("\n")
  const first = text.slice(0, from).split("\n").length - 1
  const count = text.slice(from, to).split("\n").length
  const selected = lines.slice(first, first + count)
  if (!selected.some((line) => listItem.test(line)) || !selected.every((line) => line.trim() === "" || listItem.test(line))) return null
  if (insideFence(text, from)) return null
  const next = selected.map((line, offset) => {
    if (!listItem.test(line)) return line
    const indent = listIndent(lines, first + offset, outdent)
    return " ".repeat(indent) + line.replace(/^[ \t]*/, "")
  })
  return replaceLines(text, start, end, from, to, next)
}

// The smallest replacement that turns one text into the other, for native undo.
export function changedRange(previous, next) {
  let start = 0
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++
  let previousEnd = previous.length
  let nextEnd = next.length
  while (previousEnd > start && nextEnd > start && previous[previousEnd - 1] === next[nextEnd - 1]) {
    previousEnd--
    nextEnd--
  }
  return { start, end: previousEnd, insert: next.slice(start, nextEnd) }
}
