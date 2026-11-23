// Keyboard layout tables for the keyboard-layout fixer.
//
// `base` maps the character produced by an unshifted key on a US English
// keyboard to the character produced by the same key in the Persian layout.
// `shift` does the same for Shift+key. The tables are character based because
// the tool receives pasted text, not key events.
//
// Sources:
// - Standard: ISIRI 9147 (Iranian national standard), including Shift+Space
//   and Shift+B for ZWNJ. The number row is included for completeness, but
//   `convert` preserves digits instead of translating them.
// - Legacy: the Persian layout shipped with Windows before Windows 8
//   (Microsoft KLID 00000429 / kbdfa). It uses Latin digits, has پ on the
//   backslash key, and ئ on M.

export const ZWNJ = "\u200c"
export const ZWJ = "\u200d"

const standardBase = {
  "`": ZWJ,
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
  "0": "۰",
  "-": "-",
  "=": "=",
  "q": "ض",
  "w": "ص",
  "e": "ث",
  "r": "ق",
  "t": "ف",
  "y": "غ",
  "u": "ع",
  "i": "ه",
  "o": "خ",
  "p": "ح",
  "[": "ج",
  "]": "چ",
  "\\": "\\",
  "a": "ش",
  "s": "س",
  "d": "ی",
  "f": "ب",
  "g": "ل",
  "h": "ا",
  "j": "ت",
  "k": "ن",
  "l": "م",
  ";": "ک",
  "'": "گ",
  "z": "ظ",
  "x": "ط",
  "c": "ز",
  "v": "ر",
  "b": "ذ",
  "n": "د",
  "m": "پ",
  ",": "و",
  ".": ".",
  "/": "/",
  " ": " ",
}

const standardShift = {
  "~": "÷",
  "!": "!",
  "@": "٬",
  "#": "٫",
  "$": "﷼",
  "%": "٪",
  "^": "×",
  "&": "،",
  "*": "*",
  "(": ")",
  ")": "(",
  "_": "ـ",
  "+": "+",
  "Q": "ْ",
  "W": "ٌ",
  "E": "ٍ",
  "R": "ً",
  "T": "ُ",
  "Y": "ِ",
  "U": "َ",
  "I": "ّ",
  "O": "]",
  "P": "[",
  "{": "}",
  "}": "{",
  "|": "|",
  "A": "ؤ",
  "S": "ئ",
  "D": "ي",
  "F": "إ",
  "G": "أ",
  "H": "آ",
  "J": "ة",
  "K": "»",
  "L": "«",
  ":": ":",
  "\"": "؛",
  "Z": "ك",
  "X": "ٓ",
  "C": "ژ",
  "V": "ٰ",
  "B": ZWNJ,
  "N": "ٔ",
  "M": "ء",
  "<": ">",
  ">": "<",
  "?": "؟",
}

const legacyBase = {
  "`": "÷",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "0": "0",
  "-": "-",
  "=": "=",
  "q": "ض",
  "w": "ص",
  "e": "ث",
  "r": "ق",
  "t": "ف",
  "y": "غ",
  "u": "ع",
  "i": "ه",
  "o": "خ",
  "p": "ح",
  "[": "ج",
  "]": "چ",
  "\\": "پ",
  "a": "ش",
  "s": "س",
  "d": "ی",
  "f": "ب",
  "g": "ل",
  "h": "ا",
  "j": "ت",
  "k": "ن",
  "l": "م",
  ";": "ک",
  "'": "گ",
  "z": "ظ",
  "x": "ط",
  "c": "ز",
  "v": "ر",
  "b": "ذ",
  "n": "د",
  "m": "ئ",
  ",": "و",
  ".": ".",
  "/": "/",
  " ": " ",
}

const legacyShift = {
  "~": "×",
  "!": "!",
  "@": "@",
  "#": "#",
  "$": "$",
  "%": "%",
  "^": "^",
  "&": "&",
  "*": "*",
  "(": ")",
  ")": "(",
  "_": "_",
  "+": "+",
  "Q": "ً",
  "W": "ٌ",
  "E": "ٍ",
  "R": "ر",
  "T": "،",
  "Y": "؛",
  "U": ",",
  "I": "]",
  "O": "[",
  "P": "\\",
  "{": "}",
  "}": "{",
  "|": "|",
  "A": "َ",
  "S": "ُ",
  "D": "ِ",
  "F": "ّ",
  "G": "ۀ",
  "H": "آ",
  "J": "ـ",
  "K": "«",
  "L": "»",
  ":": ":",
  "\"": "\"",
  "Z": "ة",
  "X": "ي",
  "C": "ژ",
  "V": "ؤ",
  "B": "إ",
  "N": "أ",
  "M": "ء",
  "<": "<",
  ">": ">",
  "?": "؟",
}

export const layoutIds = ["standard", "legacy"]

export const layouts = {
  standard: {
    id: "standard",
    label: "استاندارد (ISIRI 9147)",
    description: "چیدمان ملی ایران؛ پیش‌فرض. نیم‌فاصله با Shift+Space یا Shift+B.",
    base: standardBase,
    shift: standardShift,
  },
  legacy: {
    id: "legacy",
    label: "ویندوز قدیمی",
    description: "چیدمان فارسی ویندوز ۷ و پیش‌تر؛ ارقام لاتین و پ روی کلید \\.",
    base: legacyBase,
    shift: legacyShift,
  },
}

export const settingsKey = "airgap:keyboard-fix:settings:v1"
export const defaultLayout = "standard"
export const defaultDirection = "auto"
export const defaultMode = "all"

export const defaultSettings = Object.freeze({
  layout: defaultLayout,
  direction: defaultDirection,
  mode: defaultMode,
})

export function normalizeLayout(value) {
  return value === "legacy" ? "legacy" : "standard"
}

export function normalizeDirection(value) {
  return value === "en-fa" || value === "fa-en" ? value : "auto"
}

export function normalizeMode(value) {
  return value === "wrong-only" ? "wrong-only" : "all"
}

export function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {}
  return {
    layout: normalizeLayout(source.layout),
    direction: normalizeDirection(source.direction),
    mode: normalizeMode(source.mode),
  }
}

const reverseCache = new Map()

function reverseFor(layoutId) {
  const id = normalizeLayout(layoutId)
  const cached = reverseCache.get(id)
  if (cached) return cached
  const layout = layouts[id]
  const reverse = new Map()
  // Base keys win when two keys produce the same Persian character (the
  // legacy layout has both V and Shift+R for ر). The character is never lost;
  // only which key produced it is ambiguous.
  for (const [key, value] of Object.entries(layout.base)) {
    if (value === " " || value === "\n") continue
    if (!reverse.has(value)) reverse.set(value, { key, shift: false })
  }
  for (const [key, value] of Object.entries(layout.shift)) {
    if (!reverse.has(value)) reverse.set(value, { key, shift: true })
  }
  reverseCache.set(id, reverse)
  return reverse
}

export function mapEnglishKey(char, layoutId) {
  const layout = layouts[normalizeLayout(layoutId)]
  if (Object.prototype.hasOwnProperty.call(layout.shift, char)) return layout.shift[char]
  if (Object.prototype.hasOwnProperty.call(layout.base, char)) return layout.base[char]
  return null
}

export function mapPersianChar(char, layoutId) {
  const entry = reverseFor(layoutId).get(char)
  return entry ? { ...entry } : null
}

export function readSettings(storage) {
  try {
    const raw = storage.getItem(settingsKey)
    if (!raw) return { ...defaultSettings }
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(storage, settings) {
  storage.setItem(settingsKey, JSON.stringify(normalizeSettings(settings)))
}
