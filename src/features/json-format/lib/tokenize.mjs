const whitespace = new Set([" ", "\t", "\n", "\r", "\uFEFF"])
const punctuation = new Set(["{", "}", "[", "]", ":", ","])
const simpleEscapes = new Set(['"', "\\", "/", "b", "f", "n", "r", "t"])
const numberPattern = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const identifierStart = /[A-Za-z_$]/
const identifierPart = /[A-Za-z0-9_$]/

export class JsonSyntaxError extends Error {
  constructor(code, position, detail = {}) {
    super(code)
    this.name = "JsonSyntaxError"
    this.code = code
    this.position = position
    this.detail = detail
  }
}

function decodeString(raw) {
  let result = ""
  for (let index = 1; index < raw.length - 1; index++) {
    const char = raw[index]
    if (char !== "\\") {
      result += char
      continue
    }
    const escaped = raw[++index]
    switch (escaped) {
      case '"': result += '"'; break
      case "\\": result += "\\"; break
      case "/": result += "/"; break
      case "b": result += "\b"; break
      case "f": result += "\f"; break
      case "n": result += "\n"; break
      case "r": result += "\r"; break
      case "t": result += "\t"; break
      case "u":
        result += String.fromCharCode(Number.parseInt(raw.slice(index + 1, index + 5), 16))
        index += 4
        break
      default:
        // tokenize() rejects unknown escapes before this point.
        break
    }
  }
  return result
}

function readString(source, start) {
  let cursor = start + 1
  while (cursor < source.length) {
    const char = source[cursor]
    if (char === '"') {
      const raw = source.slice(start, cursor + 1)
      return { token: { type: "string", raw, value: decodeString(raw), start, end: cursor + 1 }, next: cursor + 1 }
    }
    if (char === "\\") {
      const escaped = source[cursor + 1]
      if (simpleEscapes.has(escaped)) {
        cursor += 2
        continue
      }
      if (escaped === "u") {
        const hex = source.slice(cursor + 2, cursor + 6)
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          throw new JsonSyntaxError("invalid-escape", cursor, { raw: source.slice(cursor, cursor + 6) })
        }
        cursor += 6
        continue
      }
      throw new JsonSyntaxError("invalid-escape", cursor, { raw: source.slice(cursor, cursor + 2) })
    }
    if (char.charCodeAt(0) < 0x20) {
      throw new JsonSyntaxError("control-character", cursor, { char })
    }
    cursor++
  }
  throw new JsonSyntaxError("unterminated-string", start)
}

function readNumber(source, start) {
  numberPattern.lastIndex = start
  const match = numberPattern.exec(source)
  if (!match) {
    throw new JsonSyntaxError("invalid-number", start, { raw: source.slice(start, start + 20) })
  }
  const raw = match[0]
  const end = start + raw.length
  const next = source[end]
  if (next && /[0-9A-Za-z_.]/.test(next)) {
    throw new JsonSyntaxError("invalid-number", start, { raw: source.slice(start, end + 1) })
  }
  return { token: { type: "number", raw, value: Number(raw), start, end }, next: end }
}

function readIdentifier(source, start) {
  let cursor = start
  while (cursor < source.length && identifierPart.test(source[cursor])) cursor++
  const raw = source.slice(start, cursor)
  if (raw !== "true" && raw !== "false" && raw !== "null") {
    throw new JsonSyntaxError("invalid-literal", start, { raw })
  }
  return { token: { type: "literal", raw, value: raw, start, end: cursor }, next: cursor }
}

/**
 * Split JSON or JSONC text into tokens without losing the original spelling of
 * strings and numbers. Whitespace and JSONC comments are skipped.
 */
export function tokenize(text, options = {}) {
  const source = typeof text === "string" ? text : ""
  const jsonc = options?.jsonc === true
  const tokens = []
  let index = 0

  while (index < source.length) {
    const char = source[index]
    if (whitespace.has(char)) {
      index++
      continue
    }
    if (jsonc && char === "/" && source[index + 1] === "/") {
      index += 2
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") index++
      continue
    }
    if (jsonc && char === "/" && source[index + 1] === "*") {
      const start = index
      const end = source.indexOf("*/", index + 2)
      if (end === -1) throw new JsonSyntaxError("unterminated-comment", start)
      index = end + 2
      continue
    }
    if (punctuation.has(char)) {
      tokens.push({ type: char, raw: char, start: index, end: index + 1 })
      index++
      continue
    }
    if (char === '"') {
      const result = readString(source, index)
      tokens.push(result.token)
      index = result.next
      continue
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      const result = readNumber(source, index)
      tokens.push(result.token)
      index = result.next
      continue
    }
    if (char === "+" || char === ".") {
      throw new JsonSyntaxError("invalid-number", index, { raw: char })
    }
    if (identifierStart.test(char)) {
      const result = readIdentifier(source, index)
      tokens.push(result.token)
      index = result.next
      continue
    }
    throw new JsonSyntaxError("unexpected-character", index, { char })
  }

  return tokens
}
