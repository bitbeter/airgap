import { decodeUtf8, encodeUtf8, findLoneSurrogate } from "./utf8.mjs"

const standardAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const urlAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

const standardValues = new Map([...standardAlphabet].map((char, index) => [char, index]))
const urlValues = new Map([...urlAlphabet].map((char, index) => [char, index]))
const allValues = new Map([...standardValues, ...urlValues])

function surrogateError(position) {
  return {
    ok: false,
    code: "surrogate",
    message: "متن شامل یک نویسهٔ یونیکد ناقص (سوروگیت تنها) است و به UTF-8 تبدیل نمی‌شود.",
    position,
  }
}

function describeChar(char) {
  const code = char.codePointAt(0)
  if (code < 0x20 || code === 0x7f) {
    return `\\u{${code.toString(16).toUpperCase()}}`
  }
  return char
}

/** Encode bytes as RFC 4648 Base64 (or Base64URL without padding). */
export function bytesToBase64(bytes, urlSafe = false) {
  const alphabet = urlSafe ? urlAlphabet : standardAlphabet
  let output = ""
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    output += alphabet[first >> 2]
    output += alphabet[((first & 0x03) << 4) | ((second ?? 0) >> 4)]
    if (second === undefined) {
      output += urlSafe ? "" : "="
    } else {
      output += alphabet[((second & 0x0f) << 2) | ((third ?? 0) >> 6)]
    }
    if (third === undefined) {
      if (!urlSafe) output += "="
    } else {
      output += alphabet[third & 0x3f]
    }
  }
  return output
}

/** Encode UTF-8 text as Base64. Persian and emoji survive the round trip. */
export function encodeBase64(text, options = {}) {
  const source = String(text ?? "")
  const lone = findLoneSurrogate(source)
  if (lone !== -1) return surrogateError(lone + 1)
  return { ok: true, output: bytesToBase64(encodeUtf8(source), options?.urlSafe === true) }
}

/**
 * Decode Base64 or Base64URL into UTF-8 text. Whitespace is ignored. Both
 * alphabets are accepted; padding is optional and validated when present.
 */
export function decodeBase64(text, options = {}) {
  const source = String(text ?? "")
  const characters = []
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (/\s/.test(char)) continue
    characters.push({ char, index })
  }

  if (characters.length === 0) return { ok: true, text: "", bytes: new Uint8Array() }

  const values = allValues
  let dataLength = characters.length
  let padding = 0
  let sawPadding = false
  for (let index = 0; index < characters.length; index++) {
    const { char, index: sourceIndex } = characters[index]
    if (char === "=") {
      sawPadding = true
      padding++
      continue
    }
    if (sawPadding) {
      return {
        ok: false,
        code: "padding",
        message: "پدینگ Base64 نامعتبر است؛ «=» فقط می‌تواند در پایان متن بیاید.",
        position: sourceIndex + 1,
      }
    }
    if (!values.has(char)) {
      return {
        ok: false,
        code: "alphabet",
        message: `نویسهٔ «${describeChar(char)}» نویسهٔ معتبر Base64 نیست.`,
        position: sourceIndex + 1,
      }
    }
  }

  dataLength -= padding
  if (padding > 2) {
    return {
      ok: false,
      code: "padding",
      message: "پدینگ Base64 نامعتبر است؛ حداکثر دو نویسهٔ «=» مجاز است.",
      position: characters[characters.length - 1].index + 1,
    }
  }
  if (padding > 0 && (dataLength + padding) % 4 !== 0) {
    return {
      ok: false,
      code: "length",
      message: "طول متن Base64 با پدینگ هم‌خوان نیست.",
      position: characters[characters.length - 1].index + 1,
    }
  }
  if (padding === 0 && dataLength % 4 === 1) {
    return {
      ok: false,
      code: "length",
      message: "طول متن Base64 نامعتبر است؛ تعداد نویسه‌ها نمی‌تواند ۴n+۱ باشد.",
      position: characters[characters.length - 1].index + 1,
    }
  }

  const bytes = []
  const bytePositions = []
  let buffer = 0
  let bits = 0
  for (let index = 0; index < dataLength; index++) {
    const { char, index: sourceIndex } = characters[index]
    buffer = (buffer << 6) | values.get(char)
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
      bytePositions.push(sourceIndex)
    }
  }

  const decoded = decodeUtf8(Uint8Array.from(bytes))
  if (!decoded.ok) {
    return {
      ok: false,
      code: "utf8",
      message: "بایت‌های رمزگشایی‌شده UTF-8 معتبر نیستند؛ ممکن است داده به‌صورت UTF-8 ذخیره نشده باشد.",
      position: (bytePositions[decoded.position] ?? characters[0].index) + 1,
    }
  }

  return { ok: true, text: decoded.text, bytes: Uint8Array.from(bytes) }
}
