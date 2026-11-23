import {
  ZWNJ,
  mapEnglishKey,
  mapPersianChar,
  normalizeLayout,
} from "./layouts.mjs"
import { findProtectedRanges } from "./protect.mjs"

const persianLetter = /[\u0621-\u063A\u0641-\u064A\u066E-\u06D3\u06FA-\u06FF]/
const latinLetter = /[A-Za-z]/
const persianDigit = /[\u06F0-\u06F9\u0660-\u0669]/
const latinDigit = /[0-9]/
const whitespace = /\s/

// Characters that belong to Persian/Arabic script and may have a reverse
// layout mapping. ASCII punctuation is intentionally excluded: a literal ")"
// in already-English text must not be turned into "(" just because Shift+9
// produces ")" in the Persian layout.
const persianScript = /[\u00AB\u00BB\u060C\u061B\u061F\u0621-\u063A\u0640-\u065F\u066A-\u066C\u066E-\u06D4\u0670\u06F0-\u06F9\u06FA-\u06FF\u200C\u200D]/

const rareLatinBigrams = [
  "sg", "sd", "df", "fg", "hj", "jk", "kl", "zx", "xc", "cv",
  "vb", "bn", "nm", "qw", "wq", "qz", "xq", "vq", "jq", "kq",
  "fq", "hq", "mq", "nq", "pq", "sq", "tq", "yq", "zq", "dh",
  "hl", "kd",
]

// Common Persian words without long vowels (ا/آ/و/ی). They are only used by
// the experimental "wrong parts" mode to avoid converting ordinary words that
// happen to have no long vowels. This is a heuristic, not a dictionary.
const commonPersianWords = new Set([
  "مدرسه", "کتب", "شهر", "درس", "کمک", "بچه", "مردم", "بزرگ", "سبز",
  "سرد", "گرم", "چشم", "چند", "دست", "دل", "گل", "سر", "تن", "من", "تو",
  "ما", "چه", "که", "نه", "هم", "با", "بر", "در", "از", "به", "تا", "یا",
  "را", "همه", "هیچ", "کی", "شب", "پدر", "دختر", "مرد", "درد", "درک",
  "شعر", "شکل", "کشف", "عشق", "عقل", "علم", "عمل", "فکر", "قدر", "قلب",
  "خوش", "خشم", "خون", "خاک", "خواب", "خنده", "گوش", "گرد", "گرگ",
  "پنج", "پنجره", "پسر", "مادر", "برادر", "خواهر", "کشور", "خوب",
  "کتاب", "سلام", "دنیا", "چرا", "کجا", "اینجا", "آنجا", "ولی", "چون",
  "خیلی", "بسیار", "اگر", "شما", "او", "آن", "این", "نام", "کار",
  "خانه", "آب", "نان", "روز",
])

function detectDirectionIn(text, ranges) {
  let persian = 0
  let latin = 0
  let index = 0
  let rangeIndex = 0
  while (index < text.length) {
    while (rangeIndex < ranges.length && ranges[rangeIndex].end <= index) rangeIndex += 1
    const range = ranges[rangeIndex]
    if (range && index >= range.start) {
      index = range.end
      continue
    }
    const char = text[index]
    if (persianLetter.test(char)) persian += 1
    else if (latinLetter.test(char)) latin += 1
    index += 1
  }
  if (persian === latin) return null
  return persian > latin ? "fa-en" : "en-fa"
}

/**
 * Detects the conversion direction from the dominant script. URLs and emails
 * are ignored so a long link does not outvote the surrounding text. A tie
 * (including text with no letters) returns null and leaves the text alone.
 */
export function detectDirection(text) {
  if (!text) return null
  return detectDirectionIn(text, findProtectedRanges(text))
}

function convertChar(char, direction, layoutId) {
  if (direction === "en-fa") {
    if (latinDigit.test(char) || whitespace.test(char)) return null
    return mapEnglishKey(char, layoutId)
  }
  if (char === ZWNJ) return " "
  if (persianDigit.test(char)) return null
  if (!persianScript.test(char)) return null
  const entry = mapPersianChar(char, layoutId)
  return entry ? entry.key : null
}

function convertChunk(text, direction, layoutId) {
  const chunks = []
  let changed = 0
  for (const char of text) {
    const converted = convertChar(char, direction, layoutId)
    if (converted !== null && converted !== char) {
      chunks.push(converted)
      changed += 1
    } else {
      chunks.push(char)
    }
  }
  return { text: chunks.join(""), changed }
}

function shouldConvertLatinWord(word) {
  const letters = word.match(/[A-Za-z]/g)
  if (!letters) return false
  // Brackets and semicolons are strong signals of a mistyped Persian word.
  if (/[\[\]\\;]/.test(word)) return true
  const lower = letters.join("").toLowerCase()
  if (lower.length <= 1) return false
  if (!/[aeiouy]/.test(lower)) return true
  return rareLatinBigrams.some((bigram) => lower.includes(bigram))
}

function shouldConvertPersianWord(word) {
  const letters = word.match(/[\u0621-\u063A\u0641-\u064A\u066E-\u06D3\u06FA-\u06FF]/g)
  if (!letters) return false
  const joined = letters.join("")
  if (joined.length < 3) return false
  if (/[اآوی]/.test(joined)) return false
  return !commonPersianWords.has(joined)
}

function shouldConvertWord(word, direction) {
  return direction === "en-fa" ? shouldConvertLatinWord(word) : shouldConvertPersianWord(word)
}

/**
 * Converts text typed with the wrong keyboard layout.
 *
 * Options:
 * - direction: "auto" (default), "en-fa", or "fa-en".
 * - layout: "standard" (ISIRI 9147, default) or "legacy" (old Windows).
 * - mode: "all" (default) or "wrong-only" (experimental).
 *
 * Digits, whitespace, line breaks, URLs, and emails are preserved. In the
 * fa-en direction ZWNJ becomes a normal space, matching what Shift+Space
 * produces when the English layout is active.
 */
export function convert(text, options = {}) {
  const layoutId = normalizeLayout(options.layout)
  const requestedDirection = options.direction === "en-fa" || options.direction === "fa-en"
    ? options.direction
    : "auto"
  const mode = options.mode === "wrong-only" ? "wrong-only" : "all"
  const ranges = findProtectedRanges(text)
  const direction = requestedDirection === "auto" ? detectDirectionIn(text, ranges) : requestedDirection

  if (!text || !direction) {
    return {
      text,
      direction: direction ?? null,
      changed: 0,
      protectedCount: ranges.length,
    }
  }

  const chunks = []
  let changed = 0
  let index = 0
  let rangeIndex = 0

  while (index < text.length) {
    while (rangeIndex < ranges.length && ranges[rangeIndex].end <= index) rangeIndex += 1
    const range = ranges[rangeIndex]

    if (range && index >= range.start) {
      chunks.push(text.slice(range.start, range.end))
      index = range.end
      continue
    }

    if (mode === "wrong-only" && !whitespace.test(text[index])) {
      const limit = range ? range.start : text.length
      let end = index
      while (end < limit && !whitespace.test(text[end])) end += 1
      if (end === index) {
        chunks.push(text[index])
        index += 1
        continue
      }
      const word = text.slice(index, end)
      if (shouldConvertWord(word, direction)) {
        const result = convertChunk(word, direction, layoutId)
        chunks.push(result.text)
        changed += result.changed
      } else {
        chunks.push(word)
      }
      index = end
      continue
    }

    const char = text[index]
    const converted = convertChar(char, direction, layoutId)
    if (converted !== null && converted !== char) {
      chunks.push(converted)
      changed += 1
    } else {
      chunks.push(char)
    }
    index += 1
  }

  return {
    text: chunks.join(""),
    direction,
    changed,
    protectedCount: ranges.length,
  }
}
