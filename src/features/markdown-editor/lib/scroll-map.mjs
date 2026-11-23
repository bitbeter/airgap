// Approximate mapping between Markdown source lines and textarea scroll
// offsets. A textarea wraps at word boundaries, so the row count per line is
// estimated from measured text widths; it is intentionally approximate.

export function lineStartOffset(text, line) {
  const source = String(text ?? "")
  if (line <= 1) return 0
  let offset = 0
  let current = 1
  while (current < line) {
    const next = source.indexOf("\n", offset)
    if (next === -1) return source.length
    offset = next + 1
    current++
  }
  return offset
}

export function estimateRows(line, measure, width) {
  if (line === "" || !(width > 0)) return 1
  const leading = /^[ \t]*/.exec(line)[0]
  const words = line.slice(leading.length).match(/\S+/g) ?? []
  const space = measure(" ")
  let current = measure(leading)
  let rows = 1
  for (const word of words) {
    const wordWidth = measure(word)
    if (current > 0 && current + space + wordWidth > width) {
      rows++
      current = wordWidth
    } else {
      current += (current > 0 ? space : 0) + wordWidth
    }
    // A single word wider than the line wraps across several rows.
    while (current > width) {
      rows++
      current -= width
    }
  }
  return rows
}

export function estimateRowsPerLine(text, measure, width) {
  return String(text ?? "").split("\n").map((line) => estimateRows(line, measure, width))
}

export function lineScrollTops(rows, lineHeight, paddingTop = 0) {
  const tops = []
  let top = paddingTop
  for (const count of rows) {
    tops.push(top)
    top += Math.max(1, count) * lineHeight
  }
  return tops
}

export function topForLine(tops, line) {
  if (tops.length === 0) return 0
  const index = Math.min(Math.max(Math.trunc(line) - 1, 0), tops.length - 1)
  return tops[index]
}

export function lineAtOffset(tops, offset) {
  if (tops.length === 0) return 1
  let low = 0
  let high = tops.length - 1
  let found = 0
  while (low <= high) {
    const middle = (low + high) >> 1
    if (tops[middle] <= offset) {
      found = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return found + 1
}

// `blocks` must be sorted by `top`. Returns the source line of the last
// rendered block that starts at or above the given preview scroll offset.
export function lineFromBlocks(blocks, offset) {
  if (blocks.length === 0) return 1
  let low = 0
  let high = blocks.length - 1
  let found = 0
  while (low <= high) {
    const middle = (low + high) >> 1
    if (blocks[middle].top <= offset) {
      found = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return blocks[found].line
}
