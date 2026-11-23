const encoder = new TextEncoder()
const decoder = new TextDecoder("utf-8")

/** Return the UTF-16 index of the first unpaired surrogate, or -1. */
export function findLoneSurrogate(text) {
  const source = String(text ?? "")
  for (let index = 0; index < source.length; index++) {
    const code = source.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = source.charCodeAt(index + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        index++
        continue
      }
      return index
    }
    if (code >= 0xdc00 && code <= 0xdfff) return index
  }
  return -1
}

/**
 * Return the byte offset of the first invalid UTF-8 sequence, or -1.
 * Rejects overlong forms, surrogates, and code points above U+10FFFF.
 */
export function findInvalidUtf8(bytes) {
  const length = bytes?.length ?? 0
  let index = 0
  while (index < length) {
    const first = bytes[index]
    if (first <= 0x7f) {
      index++
      continue
    }

    let continuation = 0
    let min = 0x80
    let max = 0xbf
    if (first >= 0xc2 && first <= 0xdf) {
      continuation = 1
    } else if (first === 0xe0) {
      continuation = 2
      min = 0xa0
    } else if (first >= 0xe1 && first <= 0xec) {
      continuation = 2
    } else if (first === 0xed) {
      continuation = 2
      max = 0x9f
    } else if (first >= 0xee && first <= 0xef) {
      continuation = 2
    } else if (first === 0xf0) {
      continuation = 3
      min = 0x90
    } else if (first >= 0xf1 && first <= 0xf3) {
      continuation = 3
    } else if (first === 0xf4) {
      continuation = 3
      max = 0x8f
    } else {
      return index
    }

    if (index + continuation >= length) return index
    const second = bytes[index + 1]
    if (second < min || second > max) return index
    for (let offset = 2; offset <= continuation; offset++) {
      const byte = bytes[index + offset]
      if (byte < 0x80 || byte > 0xbf) return index
    }
    index += continuation + 1
  }
  return -1
}

export function encodeUtf8(text) {
  return encoder.encode(String(text ?? ""))
}

/** Decode strict UTF-8, reporting the byte offset of the first invalid sequence. */
export function decodeUtf8(bytes) {
  const invalid = findInvalidUtf8(bytes)
  if (invalid !== -1) return { ok: false, position: invalid }
  return { ok: true, text: decoder.decode(bytes) }
}

export function bytesToHex(bytes, separator = "") {
  const parts = []
  for (const byte of bytes) parts.push(byte.toString(16).padStart(2, "0"))
  return parts.join(separator)
}
