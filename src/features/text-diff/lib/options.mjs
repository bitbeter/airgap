export const optionsKey = "airgap:diff-options:v1"

export const defaultOptions = Object.freeze({
  trimLines: false,
  ignoreWhitespace: false,
  ignoreCrLf: false,
  ignoreCase: false,
  normalizePersian: false,
  ignoreBlankLines: false,
})

// The order here is the order shown in the options panel and in summaries.
export const diffOptionDefinitions = [
  {
    id: "trimLines",
    label: "نادیده‌گرفتن فاصله‌های ابتدا و انتهای خط",
    shortLabel: "فاصله‌های ابتدا/انتها",
  },
  {
    id: "ignoreWhitespace",
    label: "نادیده‌گرفتن همهٔ تغییرات فاصله (مثل git diff -w)",
    shortLabel: "همهٔ فاصله‌ها",
  },
  {
    id: "ignoreCrLf",
    label: "نادیده‌گرفتن تفاوت LF و CRLF",
    shortLabel: "LF/CRLF",
  },
  {
    id: "ignoreCase",
    label: "نادیده‌گرفتن بزرگی و کوچکی حروف لاتین",
    shortLabel: "حروف لاتین",
  },
  {
    id: "normalizePersian",
    label: "یکسان‌دانستن ي/ی، ك/ک و ارقام فارسی، عربی و لاتین",
    shortLabel: "ي/ی، ك/ک و ارقام",
  },
  {
    id: "ignoreBlankLines",
    label: "نادیده‌گرفتن خطوط خالی",
    shortLabel: "خطوط خالی",
  },
]

export function normalizeOptions(value) {
  const source = value && typeof value === "object" ? value : {}
  const options = {}
  for (const definition of diffOptionDefinitions) options[definition.id] = source[definition.id] === true
  return options
}

export function hasActiveOptions(options) {
  return diffOptionDefinitions.some((definition) => options?.[definition.id] === true)
}

export function describeOptions(options) {
  const active = diffOptionDefinitions.filter((definition) => options?.[definition.id] === true)
  // Removing all whitespace already covers trimming both ends.
  const labels = active
    .filter((definition) => !(definition.id === "trimLines" && options.ignoreWhitespace))
    .map((definition) => definition.shortLabel)
  return labels.join("، ")
}

export function readOptions(storage) {
  const raw = storage.getItem(optionsKey)
  if (!raw) return { ...defaultOptions }
  try {
    return normalizeOptions(JSON.parse(raw))
  } catch {
    return { ...defaultOptions }
  }
}

export function saveOptions(storage, options) {
  storage.setItem(optionsKey, JSON.stringify(normalizeOptions(options)))
}
