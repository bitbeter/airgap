import { bytesToHex, encodeUtf8 } from "./utf8.mjs"

const invisibleNames = new Map([
  [0x0000, "نویسهٔ تهی (NUL)"],
  [0x0009, "تب"],
  [0x000a, "خط جدید"],
  [0x000d, "بازگشت به ابتدای خط"],
  [0x00a0, "فاصلهٔ بدون شکست (NBSP)"],
  [0x00ad, "خط تیرهٔ نرم (SHY)"],
  [0x034f, "علامت ترکیبی گرافم (CGJ)"],
  [0x061c, "علامت ترتیب عربی (ALM)"],
  [0x115f, "پُرکنندهٔ چوکی هانگول"],
  [0x1160, "پُرکنندهٔ جونگ‌سونگ هانگول"],
  [0x17b4, "علامت نامرئی خمر"],
  [0x17b5, "علامت نامرئی خمر"],
  [0x180e, "جداکنندهٔ مغولی"],
  [0x2000, "فاصلهٔ en"],
  [0x2001, "فاصلهٔ em"],
  [0x2002, "فاصلهٔ en (نوع دوم)"],
  [0x2003, "فاصلهٔ em (نوع دوم)"],
  [0x2004, "فاصلهٔ سه‌به‌چهارم em"],
  [0x2005, "فاصلهٔ چهار‌به‌پنجم em"],
  [0x2006, "فاصلهٔ شش‌به‌یک‌دهم em"],
  [0x2007, "فاصلهٔ رقمی"],
  [0x2008, "فاصلهٔ سجاوندی"],
  [0x2009, "فاصلهٔ نازک"],
  [0x200a, "فاصلهٔ مویی"],
  [0x200b, "فاصلهٔ صفرعرض (ZWSP)"],
  [0x200c, "نیم‌فاصله (ZWNJ)"],
  [0x200d, "اتصال‌دهندهٔ عرض‌صفر (ZWJ)"],
  [0x200e, "علامت چپ‌به‌راست (LRM)"],
  [0x200f, "علامت راست‌به‌چپ (RLM)"],
  [0x2028, "جداکنندهٔ خط"],
  [0x2029, "جداکنندهٔ پاراگراف"],
  [0x202a, "کنترل جهت چپ‌به‌راست (LRE)"],
  [0x202b, "کنترل جهت راست‌به‌چپ (RLE)"],
  [0x202c, "پایان کنترل جهت (PDF)"],
  [0x202d, "کنترل جهت چپ‌به‌راست اجباری (LRO)"],
  [0x202e, "کنترل جهت راست‌به‌چپ اجباری (RLO)"],
  [0x202f, "فاصلهٔ نازک بدون شکست"],
  [0x205f, "فاصلهٔ ریاضی"],
  [0x2060, "فاصلهٔ نامرئی (WJ)"],
  [0x2066, "شروع جداسازی چپ‌به‌راست (LRI)"],
  [0x2067, "شروع جداسازی راست‌به‌چپ (RLI)"],
  [0x2068, "شروع جداسازی اول‌قوی (FSI)"],
  [0x2069, "پایان جداسازی (PDI)"],
  [0x206a, "کنترل قالب قدیمی"],
  [0x206b, "کنترل قالب قدیمی"],
  [0x206c, "کنترل قالب قدیمی"],
  [0x206d, "کنترل قالب قدیمی"],
  [0x206e, "کنترل قالب قدیمی"],
  [0x206f, "کنترل قالب قدیمی"],
  [0x3000, "فاصلهٔ ایدئوگرافیک"],
  [0xfe00, "انتخابگر شکل"],
  [0xfe0f, "انتخابگر شکل ایموجی"],
  [0xfeff, "علامت ترتیب بایت (BOM/ZWNBSP)"],
  [0xfff9, "نشانگر حاشیه‌نویسی"],
  [0xfffa, "نشانگر حاشیه‌نویسی"],
  [0xfffb, "نشانگر حاشیه‌نویسی"],
  [0xe0001, "برچسب زبان"],
])

function isVariationSelector(codePoint) {
  return (
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  )
}

function categoryOf(char) {
  if (/\p{Cc}/u.test(char)) return "کنترل"
  if (/\p{Cf}/u.test(char)) return "قالب/نامرئی"
  if (/\p{M}/u.test(char)) return "علامت ترکیبی"
  if (/\p{L}/u.test(char)) return "حرف"
  if (/\p{N}/u.test(char)) return "رقم"
  if (/\p{P}/u.test(char)) return "سجاوندی"
  if (/\p{S}/u.test(char)) return "نماد"
  if (/\p{Z}/u.test(char)) return "فاصله"
  return "ناشناخته"
}

function displayOf(char, codePoint, invisible) {
  if (!invisible) return char
  if (codePoint === 0x20) return "␠"
  return `\\u{${codePoint.toString(16).toUpperCase()}}`
}

/** Describe every Unicode code point, flagging invisible and control characters. */
export function describeCodepoints(value) {
  const source = String(value ?? "")
  const entries = []
  let index = 0
  let ordinal = 0
  for (const char of source) {
    ordinal++
    const codePoint = char.codePointAt(0)
    const isControl = /\p{Cc}/u.test(char)
    const isFormat = /\p{Cf}/u.test(char)
    const isWhitespace = /\s/u.test(char)
    const isMark = /\p{M}/u.test(char)
    const variation = isVariationSelector(codePoint)
    const isInvisible =
      isFormat || isControl || (isWhitespace && codePoint !== 0x20) || variation
    entries.push({
      index,
      ordinal,
      char,
      codePoint,
      hex: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
      decimal: codePoint,
      utf8: bytesToHex(encodeUtf8(char), " "),
      display: displayOf(char, codePoint, isInvisible),
      name: invisibleNames.get(codePoint) ?? "",
      category: categoryOf(char),
      isControl,
      isFormat,
      isWhitespace,
      isMark,
      isInvisible,
    })
    index += char.length
  }
  return entries
}

export function codepointSummary(entries) {
  return {
    total: entries.length,
    unique: new Set(entries.map((entry) => entry.codePoint)).size,
    invisible: entries.filter((entry) => entry.isInvisible).length,
  }
}

export function codepointReport(entries) {
  return entries
    .map((entry) => {
      const name = entry.name ? ` — ${entry.name}` : ""
      return `${entry.ordinal}. ${entry.hex} (${entry.decimal}) «${entry.display}»${name} — ${entry.category} — UTF-8: ${entry.utf8}`
    })
    .join("\n")
}
