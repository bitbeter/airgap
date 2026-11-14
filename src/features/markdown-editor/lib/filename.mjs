export const fallbackFileName = "document"
const maxNameLength = 80

// Text of the first ATX or setext heading outside fenced code, without inline Markdown.
export function documentTitle(markdown) {
  const lines = markdown.split(/\r\n?|\n/)
  let fence = null
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length && !line.trim().slice(marker.length).trim()) fence = null
      continue
    }
    if (marker) {
      fence = marker
      continue
    }
    const atx = /^ {0,3}#{1,6}(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/.exec(line)
    if (atx) {
      const title = plainHeading(atx[1] ?? "")
      if (title) return title
      continue
    }
    const next = lines[index + 1]
    if (line.trim() && next !== undefined && /^ {0,3}(?:=+|-+)[ \t]*$/.test(next) && !/^ {0,3}(?:[-*+>]|\d+[.)])\s/.test(line)) {
      const title = plainHeading(line)
      if (title) return title
    }
  }
  return ""
}

function plainHeading(text) {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!~|<>])/g, "$1")
    .replace(/[`*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// A portable file name: no path separators, reserved characters, control or bidi
// override characters, or trailing dots. Persian letters and ZWNJ are kept.
export function sanitizeFileName(name) {
  const cleaned = name
    .replace(/[\p{Cc}‎‏‪-‮⁦-⁩<>:"/\\|?*]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
  const limited = Array.from(cleaned).slice(0, maxNameLength).join("").replace(/^[\s.]+|[\s.]+$/g, "")
  if (!limited || /^(?:con|prn|aux|nul|com\d|lpt\d)$/i.test(limited)) return fallbackFileName
  return limited
}

export function documentFileName(markdown, extension) {
  return `${sanitizeFileName(documentTitle(markdown))}.${extension}`
}
