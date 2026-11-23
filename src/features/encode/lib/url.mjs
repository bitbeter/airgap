import { decodeUtf8, encodeUtf8, findLoneSurrogate } from "./utf8.mjs"

const componentUnescaped = /^[A-Za-z0-9\-_.!~*'()]$/
const fullUnescaped = /^[A-Za-z0-9\-_.!~*'();/?:@&=+$,#]$/
const reserved = new Set(";/?:@&=+$,#".split(""))
const hexDigit = /^[0-9a-fA-F]$/

function surrogateError(position) {
  return {
    ok: false,
    code: "surrogate",
    message: "متن شامل یک نویسهٔ یونیکد ناقص (سوروگیت تنها) است و به UTF-8 تبدیل نمی‌شود.",
    position,
  }
}

function percentEncode(char) {
  let output = ""
  for (const byte of encodeUtf8(char)) {
    output += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`
  }
  return output
}

/**
 * Percent-encode text. `full` follows encodeURI (reserved URL characters stay
 * readable); otherwise it follows encodeURIComponent.
 */
export function encodeUrl(value, options = {}) {
  const source = String(value ?? "")
  const lone = findLoneSurrogate(source)
  if (lone !== -1) return surrogateError(lone + 1)

  const full = options?.full === true
  const unescaped = full ? fullUnescaped : componentUnescaped
  let output = ""
  for (let index = 0; index < source.length; ) {
    const codePoint = source.codePointAt(index)
    const char = String.fromCodePoint(codePoint)
    output += unescaped.test(char) ? char : percentEncode(char)
    index += char.length
  }
  return { ok: true, output }
}

function percentError(position) {
  return {
    ok: false,
    code: "percent",
    message: "دنبالهٔ درصد کامل نیست؛ پس از % باید دو رقم هگزادسیمال بیاید.",
    position,
  }
}

/**
 * Decode percent escapes. `full` follows decodeURI and keeps escaped reserved
 * characters such as %2F as-is; otherwise it follows decodeURIComponent.
 * A literal plus sign is never turned into a space (this is not form encoding).
 */
export function decodeUrl(value, options = {}) {
  const source = String(value ?? "")
  const lone = findLoneSurrogate(source)
  if (lone !== -1) return surrogateError(lone + 1)

  const full = options?.full === true
  let output = ""
  let index = 0
  while (index < source.length) {
    if (source[index] !== "%") {
      output += source[index]
      index++
      continue
    }

    const run = []
    while (index < source.length && source[index] === "%") {
      const start = index
      if (index + 2 >= source.length) return percentError(index + 1)
      const high = source[index + 1]
      const low = source[index + 2]
      if (!hexDigit.test(high) || !hexDigit.test(low)) return percentError(index + 1)
      run.push({ byte: Number.parseInt(high + low, 16), start, end: index + 3 })
      index += 3
    }

    const bytes = Uint8Array.from(run.map((item) => item.byte))
    const decoded = decodeUtf8(bytes)
    if (!decoded.ok) {
      return {
        ok: false,
        code: "utf8",
        message: "بایت‌های درصدی UTF-8 معتبر نیستند.",
        position: run[decoded.position].start + 1,
      }
    }

    if (!full) {
      output += decoded.text
      continue
    }

    let byteIndex = 0
    for (const char of decoded.text) {
      const size = encodeUtf8(char).length
      if (size === 1 && reserved.has(char)) {
        const item = run[byteIndex]
        output += source.slice(item.start, item.end)
      } else {
        output += char
      }
      byteIndex += size
    }
  }
  return { ok: true, output }
}
