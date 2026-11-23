const atxHeading = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/
const setextUnderline = /^ {0,3}(=+|-+)[ \t]*$/
const fenceOpening = /^ {0,3}(`{3,}|~{3,})(.*)$/
const fenceClosing = /^ {0,3}(`{3,}|~{3,})[ \t]*$/
const blockStart = /^ {0,3}(?:#{1,6}(?:[ \t]|$)|>|[-+*][ \t]|\d{1,9}[.)][ \t]|\||<)/
const thematicBreak = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/

// Outline labels are plain text: inline Markdown markers are removed, but the
// heading itself is never rendered or parsed as HTML.
function plainHeadingText(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

// Extracts ATX and Setext headings up to `maxLevel` (1–3 for the outline
// panel). Lines inside fenced code blocks are ignored, and empty headings are
// skipped because they give the reader nothing to jump to. `line` is 1-based
// and points at the first heading text line, matching mdast
// `position.start.line` (a Setext heading may span several lines).
export function extractOutline(text, maxLevel = 3) {
  const lines = String(text ?? "").split(/\r?\n/)
  const headings = []
  let fence = null
  let paragraph = []
  let paragraphStart = 0

  const resetParagraph = () => {
    paragraph = []
    paragraphStart = 0
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const number = index + 1

    if (fence) {
      const closing = fenceClosing.exec(line)
      if (closing && closing[1][0] === fence.char && closing[1].length >= fence.length) fence = null
      resetParagraph()
      continue
    }

    const opening = fenceOpening.exec(line)
    if (opening && !(opening[1][0] === "`" && opening[2].includes("`"))) {
      fence = { char: opening[1][0], length: opening[1].length }
      resetParagraph()
      continue
    }

    const atx = atxHeading.exec(line)
    if (atx) {
      const level = atx[1].length
      // A closing sequence of # is optional and needs whitespace before it.
      const title = plainHeadingText((atx[2] ?? "").replace(/[ \t]+#+[ \t]*$/, ""))
      if (level <= maxLevel && title) headings.push({ level, text: title, line: number })
      resetParagraph()
      continue
    }

    const setext = setextUnderline.exec(line)
    if (setext) {
      if (paragraph.length > 0) {
        const level = setext[1][0] === "=" ? 1 : 2
        const title = plainHeadingText(paragraph.join(" "))
        if (level <= maxLevel && title) headings.push({ level, text: title, line: paragraphStart })
      }
      resetParagraph()
      continue
    }

    if (line.trim() === "" || blockStart.test(line) || thematicBreak.test(line)) {
      resetParagraph()
      continue
    }

    if (paragraph.length === 0) paragraphStart = number
    paragraph.push(line.trim())
  }

  return headings
}
