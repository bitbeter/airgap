import { findProtectedRanges, replaceOutside } from "./protect.mjs"

export const settingsKey = "airgap:persian-text:settings:v1"
const zwnj = "\u200c"

// Persian/Arabic letters, excluding digits, punctuation, diacritics and kashida.
const letterBody = "\\u0621-\\u063A\\u0641-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06FA-\\u06FF"
const letterClass = `[${letterBody}]`
const letterRegex = new RegExp(letterClass)
const wordCharClass = `[${letterBody}\\u200c]`
const beforeWord = `(?<!${wordCharClass})`
const afterWord = `(?!${wordCharClass})`

// Letters that do not connect to the following letter. A plural or comparative
// suffix after these letters is written without a half-space.
const nonJoiningLetters = new Set(["ا", "آ", "أ", "إ", "د", "ذ", "ر", "ز", "ژ", "و", "ة", "ء", "ى"])

// Words that start with می but are not the می prefix. Longer entries are
// checked as prefixes so their inflections stay intact.
const prefixExceptions = [
  "میزان", "میزبان", "میزگرد", "میهن", "میراث", "میدان", "میوه", "میان", "مینا",
  "میگرن", "میکا", "میرزا", "میمند", "میکروب", "میلیون", "میلیارد", "میکروسکوپ",
  "میکروفون", "میکرو", "میکده", "میرداماد", "میرزاده", "میرعماد", "میرعلی",
  "میرحسین", "میرمحمد", "میررضا", "میرحسن", "میراب", "میرآب", "میرنده", "میلاد",
  "میلگرد", "میخانه", "میثم", "میترا", "میمیک",
]

// Short words that would otherwise be broken by the می prefix. These are
// matched exactly, so verbs such as می‌روم and می‌زنم still normalize.
const exactExceptions = new Set([
  "میز", "میزها", "میزهای", "میخ", "میخک", "میخچه", "میگو", "میگوها", "میگوهای",
  "مید", "میدل", "میل", "میلر", "میلتون", "میلی", "میو", "میمی", "میشا", "میلا",
  "مینو", "میکل", "میکائیل", "میثم", "میترا", "میسون", "میر", "میرا", "میرک",
  "نمیر", "نمیرا", "نمین",
])

// Lexicalized words ending in تر that are not comparatives.
const comparativeExceptions = new Set([
  "بهتر", "کمتر", "بیشتر", "کهتر", "مهتر", "دختر", "دفتر", "بستر", "استر",
  "مستر", "دکتر", "فیلتر", "پرینتر", "پلاستر", "وینتر", "هیتر", "لیتر", "پیتر",
  "رایتر", "کلاستر", "سنتر", "هالتر", "کانتر", "راپتر", "کاپتر", "هلیکوپتر",
])

const superlativeExceptions = new Set([
  "بهترین", "کمترین", "بیشترین", "کهترین", "مهترین", "فیلترین", "دکترین",
])

// These stems take a direct comparative/superlative suffix without a half-space.
const directComparativeStems = new Set(["به", "کم", "بیش", "که", "مه"])

export const defaultSettings = Object.freeze({
  letters: true,
  taMarbuta: false,
  digits: "persian",
  zwnj: true,
  spacing: true,
  punctuation: true,
  quotes: false,
  kashida: false,
  diacritics: false,
  invisible: true,
  protectCode: true,
})

export const ruleDefinitions = [
  {
    id: "letters",
    label: "یکدست‌سازی ی و ک",
    description: "ي، ى و ك عربی را به ی و ک فارسی تبدیل می‌کند و ۀ و هٔ را یکدست می‌کند.",
    example: "عربي → عربی، كتاب → کتاب",
    shortLabel: "ی/ک",
  },
  {
    id: "taMarbuta",
    label: "تبدیل ة به ه",
    description: "ة عربی را به ه فارسی تبدیل می‌کند.",
    example: "مدرسة → مدرسه",
    shortLabel: "ة/ه",
    optional: true,
  },
  {
    id: "digits",
    label: "یکدست‌سازی ارقام",
    description: "ارقام فارسی، عربی و لاتین را به شکل انتخاب‌شده یکدست می‌کند؛ URL، ایمیل و کد محافظت می‌شوند.",
    example: "۱۲۳ / ١٢٣ / 123",
    shortLabel: "ارقام",
    kind: "digits",
  },
  {
    id: "zwnj",
    label: "نیم‌فاصله",
    description: "می/نمی، ها/های، تر/ترین و ضمایر را با نیم‌فاصله به هم می‌چسباند.",
    example: "می روم → می‌روم، کتاب ها → کتاب‌ها",
    shortLabel: "نیم‌فاصله",
  },
  {
    id: "spacing",
    label: "اصلاح فاصله‌ها",
    description: "فاصله‌های تکراری و فاصلهٔ قبل از علائم را حذف و بعد از علائم فاصله می‌گذارد.",
    example: "سلام ،دنیا → سلام، دنیا",
    shortLabel: "فاصله",
  },
  {
    id: "punctuation",
    label: "علائم نگارشی فارسی",
    description: "کاما، نقطه‌ویرگول و علامت سؤال لاتین را در بافت فارسی به علائم فارسی تبدیل می‌کند.",
    example: "سلام, دنیا? → سلام، دنیا؟",
    shortLabel: "نگارشی",
  },
  {
    id: "quotes",
    label: "گیومهٔ فارسی",
    description: "گیومهٔ لاتین را در بافت فارسی به «» تبدیل می‌کند.",
    example: "\"سلام\" → «سلام»",
    shortLabel: "گیومه",
    optional: true,
  },
  {
    id: "kashida",
    label: "حذف کشیده",
    description: "کشیده (ـ) را حذف می‌کند.",
    example: "کتـــاب → کتاب",
    shortLabel: "کشیده",
    optional: true,
  },
  {
    id: "diacritics",
    label: "حذف اعراب",
    description: "اعراب و حرکت‌های عربی را حذف می‌کند.",
    example: "كَتَبَ → کتب",
    shortLabel: "اعراب",
    optional: true,
  },
  {
    id: "invisible",
    label: "حذف نویسه‌های نامرئی",
    description: "ZWJ، LRM/RLM، NBSP و کنترل‌های دوجهته را حذف یا به فاصله تبدیل می‌کند.",
    example: "متن\u200dنامرئی → متننامرئی",
    shortLabel: "نامرئی",
  },
]

export const pipelineOrder = [
  "invisible", "kashida", "diacritics", "letters", "taMarbuta",
  "punctuation", "quotes", "spacing", "digits", "zwnj",
]

export function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {}
  const settings = {}
  for (const definition of ruleDefinitions) {
    if (definition.kind === "digits") {
      settings.digits = ["persian", "latin", "none"].includes(source.digits) ? source.digits : defaultSettings.digits
    } else {
      settings[definition.id] = source[definition.id] === undefined
        ? defaultSettings[definition.id]
        : source[definition.id] === true
    }
  }
  settings.protectCode = source.protectCode === undefined ? true : source.protectCode !== false
  return settings
}

export function readSettings(storage) {
  const raw = storage.getItem(settingsKey)
  if (!raw) return { ...defaultSettings }
  try {
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(storage, settings) {
  storage.setItem(settingsKey, JSON.stringify(normalizeSettings(settings)))
}

export function isRuleEnabled(settings, id) {
  if (id === "digits") return settings.digits !== "none"
  return settings[id] === true
}

function isPersianLetter(character) {
  return character !== "" && letterRegex.test(character)
}

function previousNonSpace(text, index) {
  let cursor = index - 1
  while (cursor >= 0 && (text[cursor] === " " || text[cursor] === "\t")) cursor -= 1
  return cursor >= 0 ? text[cursor] : ""
}

function nextNonSpace(text, index) {
  let cursor = index
  while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor += 1
  return cursor < text.length ? text[cursor] : ""
}

function nonJoining(stem) {
  return nonJoiningLetters.has(stem[stem.length - 1])
}

function applyLetters(text, ranges) {
  return replaceOutside(text, ranges, /[يىكۀ]/g, (match) => {
    if (match === "ي" || match === "ى") return "ی"
    if (match === "ك") return "ک"
    return "هٔ"
  })
}

function applyTaMarbuta(text, ranges) {
  return replaceOutside(text, ranges, /ة/g, () => "ه")
}

function applyDigits(text, ranges, settings) {
  if (settings.digits === "none") return { text, count: 0 }
  return replaceOutside(text, ranges, /[0-9\u0660-\u0669\u06F0-\u06F9]/g, (match) => {
    const code = match.charCodeAt(0)
    if (settings.digits === "persian") {
      if (code >= 0x06f0 && code <= 0x06f9) return match
      if (code >= 0x0660 && code <= 0x0669) return String.fromCharCode(0x06f0 + code - 0x0660)
      if (code >= 0x30 && code <= 0x39) return String.fromCharCode(0x06f0 + code - 0x30)
    } else if (settings.digits === "latin") {
      if (code >= 0x30 && code <= 0x39) return match
      if (code >= 0x06f0 && code <= 0x06f9) return String.fromCharCode(0x30 + code - 0x06f0)
      if (code >= 0x0660 && code <= 0x0669) return String.fromCharCode(0x30 + code - 0x0660)
    }
    return match
  })
}

function applyKashida(text, ranges) {
  return replaceOutside(text, ranges, /\u0640/g, () => "")
}

function applyDiacritics(text, ranges) {
  // Hamza above/below (U+0654/U+0655) is kept so هٔ stays meaningful.
  return replaceOutside(text, ranges, /[\u064B-\u0653\u0656-\u065F\u0670]/g, () => "")
}

function applyInvisible(text, ranges) {
  return replaceOutside(
    text,
    ranges,
    /[\u00A0\u00AD\u200B\u200D\u200E\u200F\u2060\uFEFF\u180E\u202A-\u202E\u2066-\u2069]/g,
    (match) => (match === "\u00A0" ? " " : ""),
  )
}

function applyPunctuation(text, ranges) {
  return replaceOutside(text, ranges, /[;,?]/g, (match, offset, string) => {
    const before = previousNonSpace(string, offset)
    const after = nextNonSpace(string, offset + 1)
    if (!isPersianLetter(before) && !isPersianLetter(after)) return match
    if (match === ",") return "،"
    if (match === ";") return "؛"
    return "؟"
  })
}

function applyQuotes(text, ranges) {
  return replaceOutside(text, ranges, /"([^"\n]*)"/g, (match, content) => {
    if (!letterRegex.test(content)) return match
    return `«${content}»`
  })
}

function applySpacing(text, settings, _ranges) {
  let current = text
  let count = 0
  const steps = [
    // Collapse runs of spaces/tabs that follow a visible character.
    [/(?<=[^ \t\n])[ \t]{2,}/g, () => " "],
    // Remove trailing spaces/tabs at the end of each line.
    [/[ \t]+(?=\r?$)/gm, () => ""],
    // Remove spaces/tabs before punctuation.
    [/[ \t]+([،؛؟!.,:;»)\]}])/g, (match, punctuation) => punctuation],
    // Add a space after Persian punctuation when a letter or opening quote follows.
    [new RegExp(`([،؛؟])(?=[${letterBody}A-Za-z«(\\[])`, "g"), (match, punctuation) => `${punctuation} `],
    // Add a space after Latin punctuation before Persian text.
    [new RegExp(`([!.,:;])(?=[${letterBody}«(\\[])`, "g"), (match, punctuation) => `${punctuation} `],
    // Mixed text: Persian sentence followed by a Latin word.
    [/([.!:])(?=[A-Za-z])/g, (match, punctuation, offset, string) => (
      isPersianLetter(previousNonSpace(string, offset)) ? `${punctuation} ` : match
    )],
  ]
  for (const [regex, replacer] of steps) {
    const ranges = findProtectedRanges(current, { code: settings.protectCode })
    const result = replaceOutside(current, ranges, regex, replacer)
    current = result.text
    count += result.count
  }
  return { text: current, count }
}

function applyZwnj(text, settings, _ranges) {
  let current = text
  let count = 0

  const steps = [
    // می/نمی separated from the following verb.
    [
      new RegExp(`${beforeWord}(می|نمی)[ \\t]+(?=${letterClass})`, "gu"),
      (match, prefix) => `${prefix}${zwnj}`,
    ],
    // می/نمی attached to the following verb.
    [
      new RegExp(`${beforeWord}(می|نمی)(?=${letterClass})`, "gu"),
      (match, prefix, offset, string) => {
        let end = offset + match.length
        while (end < string.length && letterRegex.test(string[end])) end += 1
        const word = string.slice(offset, end)
        if (prefixExceptions.some((exception) => word.startsWith(exception))) return match
        if (exactExceptions.has(word)) return match
        return `${prefix}${zwnj}`
      },
    ],
    // Plural های separated from the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})[ \\t]+های${afterWord}`, "gu"),
      (match, stem) => (nonJoining(stem) ? `${stem}های` : `${stem}${zwnj}های`),
    ],
    // Plural های attached. Only the unambiguous ههای form is split; a single
    // های after a consonant can also be an indefinite ای and is left alone.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})های${afterWord}`, "gu"),
      (match, stem) => (stem.endsWith("ه") ? `${stem}${zwnj}های` : match),
    ],
    // Plural ها separated from the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})[ \\t]+ها${afterWord}`, "gu"),
      (match, stem) => (nonJoining(stem) ? `${stem}ها` : `${stem}${zwnj}ها`),
    ],
    // Plural ها attached to the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})ها${afterWord}`, "gu"),
      (match, stem) => {
        if (stem === "تن") return match
        return nonJoining(stem) ? match : `${stem}${zwnj}ها`
      },
    ],
    // Superlative ترین separated from the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})[ \\t]+ترین${afterWord}`, "gu"),
      (match, stem) => {
        if (directComparativeStems.has(stem) || nonJoining(stem)) return `${stem}ترین`
        return `${stem}${zwnj}ترین`
      },
    ],
    // Superlative ترین attached to the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})ترین${afterWord}`, "gu"),
      (match, stem) => {
        if (superlativeExceptions.has(match) || nonJoining(stem)) return match
        return `${stem}${zwnj}ترین`
      },
    ],
    // Comparative تر separated from the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})[ \\t]+تر${afterWord}`, "gu"),
      (match, stem) => {
        if (directComparativeStems.has(stem) || nonJoining(stem)) return `${stem}تر`
        return `${stem}${zwnj}تر`
      },
    ],
    // Comparative تر attached to the stem.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,})تر${afterWord}`, "gu"),
      (match, stem) => {
        if (comparativeExceptions.has(match)) return match
        if (match.endsWith("متر") || match.endsWith("لیتر")) return match
        return nonJoining(stem) ? match : `${stem}${zwnj}تر`
      },
    ],
    // Possessive and indefinite suffixes after a final ه, where the half-space
    // is unambiguous: خانه ام → خانه‌ام، خانه ای → خانه‌ای.
    [
      new RegExp(`${beforeWord}(${letterClass}{2,}ه)[ \\t]+(ایت|اید|ایم|اند|شان|تان|مان|ام|ات|اش|ای)${afterWord}`, "gu"),
      (match, stem, suffix) => `${stem}${zwnj}${suffix}`,
    ],
  ]

  for (const [regex, replacer] of steps) {
    const ranges = findProtectedRanges(current, { code: settings.protectCode })
    const result = replaceOutside(current, ranges, regex, replacer)
    current = result.text
    count += result.count
  }
  return { text: current, count }
}

const ruleFunctions = {
  letters: (text, settings, ranges) => applyLetters(text, ranges),
  taMarbuta: (text, settings, ranges) => applyTaMarbuta(text, ranges),
  digits: (text, settings, ranges) => applyDigits(text, ranges, settings),
  zwnj: (text, settings, ranges) => applyZwnj(text, settings, ranges),
  spacing: (text, settings, ranges) => applySpacing(text, settings, ranges),
  punctuation: (text, settings, ranges) => applyPunctuation(text, ranges),
  quotes: (text, settings, ranges) => applyQuotes(text, ranges),
  kashida: (text, settings, ranges) => applyKashida(text, ranges),
  diacritics: (text, settings, ranges) => applyDiacritics(text, ranges),
  invisible: (text, settings, ranges) => applyInvisible(text, ranges),
}

export function normalize(text, settings = defaultSettings) {
  const normalized = normalizeSettings(settings)
  let current = text
  const counts = {}
  for (const definition of ruleDefinitions) counts[definition.id] = 0
  for (const id of pipelineOrder) {
    if (!isRuleEnabled(normalized, id)) continue
    const ranges = findProtectedRanges(current, { code: normalized.protectCode })
    const result = ruleFunctions[id](current, normalized, ranges)
    current = result.text
    counts[id] = result.count
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  return { text: current, counts, total }
}

export function describeCounts(counts) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  if (total === 0) return "تغییری لازم نیست."
  const parts = ruleDefinitions
    .filter((definition) => (counts[definition.id] ?? 0) > 0)
    .map((definition) => `${counts[definition.id].toLocaleString("fa-IR")} ${definition.shortLabel}`)
  return `${total.toLocaleString("fa-IR")} تغییر: ${parts.join("، ")}`
}
