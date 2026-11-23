import {
  epochDayToGregorian,
  epochDayToJalali,
  gregorianMonthLength,
  gregorianToEpochDay,
  jalaliMonthLength,
  jalaliToEpochDay,
  maxJalaliYear,
} from "./jalali.mjs"

const persianDigits = "۰۱۲۳۴۵۶۷۸۹"
const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩"

export const jalaliMonthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
]

export const gregorianMonthNames = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
]

export const hijriMonthNames = [
  "محرم",
  "صفر",
  "ربیع‌الاول",
  "ربیع‌الثانی",
  "جمادی‌الاول",
  "جمادی‌الثانی",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذی‌القعده",
  "ذی‌الحجه",
]

export const calendarIds = ["jalali", "gregorian", "hijri"]

// The Hijri side of the range starts at 1 Muharram 1 AH. Starting a few
// months into Jalali year 1 keeps every displayed Hijri date in a real year.
const hijriEpochDay = -492148
export const minSupportedEpochDay = Math.max(jalaliToEpochDay(1, 1, 1), hijriEpochDay)
export const maxSupportedEpochDay = jalaliToEpochDay(3177, 12, jalaliMonthLength(3177, 12))

const averageLunarYear = 354.36708
const averageLunarMonth = 29.530588
const hijriSearchRadius = 60

const hijriFormatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
})

const gregorianPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
})

export function normalizeDigits(text) {
  return String(text)
    .replace(/[۰-۹]/g, (character) => String(persianDigits.indexOf(character)))
    .replace(/[٠-٩]/g, (character) => String(arabicIndicDigits.indexOf(character)))
    .replace(/٫/g, ".")
    .replace(/[−–—]/g, "-")
    .replace(/(\d)[٬,](?=\d)/g, "$1")
}

export function toPersianDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => persianDigits[Number(digit)])
}

function fail(code, message) {
  return { ok: false, error: { code, message } }
}

function pad(value, length = 2) {
  return String(value).padStart(length, "0")
}

function hijriParts(epochDay) {
  try {
    const date = new Date(epochDay * 86_400_000 + 43_200_000)
    if (Number.isNaN(date.getTime())) return null
    const parts = hijriFormatter.formatToParts(date)
    const read = (type) => Number(parts.find((part) => part.type === type)?.value)
    const hy = read("year")
    const hm = read("month")
    const hd = read("day")
    if (![hy, hm, hd].every(Number.isFinite)) return null
    return { hy, hm, hd }
  } catch {
    return null
  }
}

export function epochDayToHijri(epochDay) {
  const parts = hijriParts(epochDay)
  if (!parts) throw new RangeError(`Cannot convert epoch day ${epochDay} to Hijri`)
  return parts
}

export function hijriToEpochDay(hy, hm, hd) {
  if (![hy, hm, hd].every(Number.isInteger)) return null
  if (hy < 1 || hy > 9999 || hm < 1 || hm > 12 || hd < 1 || hd > 30) return null

  const estimate =
    Math.round((hy - 1) * averageLunarYear + (hm - 1) * averageLunarMonth + (hd - 1)) + hijriEpochDay

  for (let offset = 0; offset <= hijriSearchRadius; offset += 1) {
    const candidates = offset === 0 ? [estimate] : [estimate - offset, estimate + offset]
    for (const day of candidates) {
      const parts = hijriParts(day)
      if (parts && parts.hy === hy && parts.hm === hm && parts.hd === hd) return day
    }
  }
  return null
}

export function hijriMonthLength(hy, hm) {
  const start = hijriToEpochDay(hy, hm, 1)
  if (start === null) return null
  const next =
    hm === 12 ? hijriToEpochDay(hy + 1, 1, 1) : hijriToEpochDay(hy, hm + 1, 1)
  if (next === null) return null
  return next - start
}

export function isSupportedEpochDay(epochDay) {
  return (
    Number.isInteger(epochDay) &&
    epochDay >= minSupportedEpochDay &&
    epochDay <= maxSupportedEpochDay
  )
}

export function calendarToEpochDay(date) {
  if (date.calendar === "jalali") return jalaliToEpochDay(date.year, date.month, date.day)
  if (date.calendar === "gregorian") {
    return gregorianToEpochDay(date.year, date.month, date.day)
  }
  const epochDay = hijriToEpochDay(date.year, date.month, date.day)
  if (epochDay === null) throw new RangeError("Invalid Hijri date")
  return epochDay
}

export function epochDayToCalendar(epochDay, calendar) {
  if (calendar === "jalali") {
    const { jy, jm, jd } = epochDayToJalali(epochDay)
    return { calendar, year: jy, month: jm, day: jd }
  }
  if (calendar === "gregorian") {
    const { gy, gm, gd } = epochDayToGregorian(epochDay)
    return { calendar, year: gy, month: gm, day: gd }
  }
  const { hy, hm, hd } = epochDayToHijri(epochDay)
  return { calendar, year: hy, month: hm, day: hd }
}

export function formatCanonicalDate(date) {
  return `${pad(date.year, 4)}/${pad(date.month)}/${pad(date.day)}`
}

export function formatCanonicalPersian(date) {
  return toPersianDigits(formatCanonicalDate(date))
}

export function epochDayInTimeZone(epochMs, timeZone) {
  const formatter = timeZone
    ? new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone,
      })
    : gregorianPartsFormatter
  const parts = formatter.formatToParts(new Date(epochMs))
  const read = (type) => Number(parts.find((part) => part.type === type)?.value)
  return gregorianToEpochDay(read("year"), read("month"), read("day"))
}

export function todayEpochDay(timeZone) {
  return epochDayInTimeZone(Date.now(), timeZone)
}

export function addDaysToEpochDay(epochDay, days) {
  return epochDay + days
}

export function addJalaliMonths(epochDay, months) {
  const { jy, jm, jd } = epochDayToJalali(epochDay)
  const totalMonths = jy * 12 + (jm - 1) + months
  const year = Math.floor(totalMonths / 12)
  const month = (totalMonths % 12) + 1
  const day = Math.min(jd, jalaliMonthLength(year, month))
  return jalaliToEpochDay(year, month, day)
}

function tryAddJalaliMonths(epochDay, months) {
  try {
    return addJalaliMonths(epochDay, months)
  } catch {
    return null
  }
}

export function diffEpochDays(startDay, endDay) {
  const sign = endDay >= startDay ? 1 : -1
  const from = Math.min(startDay, endDay)
  const to = Math.max(startDay, endDay)
  let cursor = from
  let years = 0
  let months = 0

  for (;;) {
    const next = tryAddJalaliMonths(cursor, 12)
    if (next === null || next > to) break
    cursor = next
    years += 1
  }
  for (;;) {
    const next = tryAddJalaliMonths(cursor, 1)
    if (next === null || next > to) break
    cursor = next
    months += 1
  }

  return { totalDays: to - from, sign, years, months, days: to - cursor }
}

function parseTimestampText(text) {
  const match = /^(ms:|s:|@)?([+-]?\d+)$/.exec(text)
  if (!match) return null
  const prefix = match[1] ?? ""
  const raw = match[2]
  const value = Number(raw)
  if (!Number.isSafeInteger(value)) {
    return fail("timestamp-range", "timestamp وارد‌شده در بازهٔ پشتیبانی‌شده نیست.")
  }
  const digitCount = raw.replace(/^[+-]/, "").length
  let milliseconds
  if (prefix === "ms:") milliseconds = value
  else if (prefix === "s:" || prefix === "@") milliseconds = value * 1000
  else milliseconds = digitCount >= 13 ? value : value * 1000
  if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > 8_640_000_000_000_000) {
    return fail("timestamp-range", "timestamp وارد‌شده در بازهٔ پشتیبانی‌شده نیست.")
  }
  return { ok: true, kind: "instant", epochMs: milliseconds, source: "timestamp" }
}

function parseIsoText(text) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|z|[+-]\d{2}(?::?\d{2})?)?$/.exec(
      text,
    )
  if (!match) return null

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = "0", fraction = "", zone] =
    match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)

  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > gregorianMonthLength(year, month)
  ) {
    return fail("iso-date", `تاریخ ISO نامعتبر است؛ ${toPersianDigits(`${year}/${month}/${day}`)} وجود ندارد.`)
  }
  if (hour > 23 || minute > 59 || second > 59) {
    return fail("iso-time", "زمان ISO نامعتبر است؛ ساعت باید بین ۰ تا ۲۳ و دقیقه و ثانیه بین ۰ تا ۵۹ باشد.")
  }

  let normalized = `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`
  if (fraction) normalized += `.${fraction}`
  if (zone) {
    normalized +=
      zone.toUpperCase() === "Z"
        ? "Z"
        : zone.replace(/^([+-]\d{2})(\d{2})$/, "$1:$2").replace(/^([+-]\d{2})$/, "$1:00")
  }

  const epochMs = Date.parse(normalized)
  if (Number.isNaN(epochMs)) {
    return fail("iso-invalid", "ISO 8601 نامعتبر است. نمونه: 2024-10-06T12:30:00Z")
  }
  return { ok: true, kind: "instant", epochMs, source: "iso" }
}

function rangeFailure() {
  return fail(
    "range",
    "این تاریخ خارج از بازهٔ پشتیبانی‌شده است؛ بازه از آغاز سال ۱ قمری تا پایان سال ۳۱۷۷ شمسی است.",
  )
}

export function parseInstant(text, options = {}) {
  const normalized = normalizeDigits(String(text)).trim()
  if (!normalized) return null
  const parsed = parseTimestampText(normalized) ?? parseIsoText(normalized)
  if (!parsed) return null
  if (!parsed.ok) return parsed
  let epochDay
  try {
    epochDay = epochDayInTimeZone(parsed.epochMs, options.timeZone)
  } catch {
    return rangeFailure()
  }
  if (!isSupportedEpochDay(epochDay)) return rangeFailure()
  return { ...parsed, epochDay }
}

const calendarPrefixes = [
  [/^(?:شمسی|جلالی|jalali)\s*(?:[:،]\s*|\s+)/i, "jalali"],
  [/^(?:میلادی|گرگوری|gregorian)\s*(?:[:،]\s*|\s+)/i, "gregorian"],
  [/^(?:قمری|هجری\s*قمری|هجری|hijri)\s*(?:[:،]\s*|\s+)/i, "hijri"],
]

function detectCalendar(year, calendar) {
  if (calendar !== "auto") return calendar
  return year <= 1699 ? "jalali" : "gregorian"
}

function invalidJalaliDay(year, month, day) {
  const monthName = jalaliMonthNames[month - 1]
  const length = jalaliMonthLength(year, month)
  if (month === 12 && day === 30) {
    return fail(
      "invalid-jalali-day",
      `۳۰ اسفند در سال ${toPersianDigits(year)} وجود ندارد؛ این سال کبیسه نیست.`,
    )
  }
  if (day > length && day === 31 && month >= 7 && month <= 11) {
    return fail(
      "invalid-jalali-day",
      `۳۱ ${monthName} وجود ندارد؛ ${monthName} ${toPersianDigits(length)} روز دارد.`,
    )
  }
  return fail(
    "invalid-jalali-day",
    `روز باید بین ۱ و ${toPersianDigits(length)} باشد؛ ${monthName} ${toPersianDigits(year)} ${toPersianDigits(length)} روز دارد.`,
  )
}

function invalidGregorianDay(year, month, day) {
  const monthName = gregorianMonthNames[month - 1]
  const length = gregorianMonthLength(year, month)
  if (month === 2 && day === 29) {
    return fail(
      "invalid-gregorian-day",
      `۲۹ ${monthName} در سال ${toPersianDigits(year)} وجود ندارد؛ این سال کبیسه نیست.`,
    )
  }
  if (day === 31 && length === 30) {
    return fail(
      "invalid-gregorian-day",
      `۳۱ ${monthName} وجود ندارد؛ ${monthName} ${toPersianDigits(length)} روز دارد.`,
    )
  }
  return fail(
    "invalid-gregorian-day",
    `روز باید بین ۱ و ${toPersianDigits(length)} باشد؛ ${monthName} ${toPersianDigits(year)} ${toPersianDigits(length)} روز دارد.`,
  )
}

export function parseDateInput(text, options = {}) {
  let value = normalizeDigits(String(text)).trim()
  if (!value) return fail("empty", "تاریخ یا زمان را وارد کنید.")

  let prefixedCalendar = null
  for (const [pattern, calendar] of calendarPrefixes) {
    if (pattern.test(value)) {
      prefixedCalendar = calendar
      value = value.replace(pattern, "").trim()
      break
    }
  }
  if (!value) return fail("empty", "پس از نام تقویم، تاریخ را وارد کنید.")

  const match = /^(\d{1,4})(?:\s*[/\-.]\s*|\s+)(\d{1,2})(?:\s*[/\-.]\s*|\s+)(\d{1,2})$/.exec(value)
  if (!match) {
    return fail(
      "format",
      "قالب تاریخ شناسایی نشد. نمونه: ۱۴۰۳/۰۷/۱۵، 2024-10-06 یا «قمری: 1446/04/03».",
    )
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const calendar = prefixedCalendar ?? detectCalendar(year, options.calendar ?? "auto")

  if (calendar === "jalali") {
    if (year < 1 || year > maxJalaliYear) {
      return fail(
        "jalali-year",
        `سال شمسی باید بین ۱ و ${toPersianDigits(maxJalaliYear)} باشد.`,
      )
    }
    if (month < 1 || month > 12) return fail("jalali-month", "ماه شمسی باید بین ۱ و ۱۲ باشد.")
    if (day < 1) return fail("invalid-jalali-day", "روز باید حداقل ۱ باشد.")
    if (day > jalaliMonthLength(year, month)) return invalidJalaliDay(year, month, day)
    const epochDay = jalaliToEpochDay(year, month, day)
    if (!isSupportedEpochDay(epochDay)) return rangeFailure()
    return {
      ok: true,
      kind: "date",
      date: { calendar, year, month, day },
      epochDay,
      source: "text",
    }
  }

  if (calendar === "gregorian") {
    if (year < 1 || year > 9999) return fail("gregorian-year", "سال میلادی باید بین ۱ و ۹۹۹۹ باشد.")
    if (month < 1 || month > 12) return fail("gregorian-month", "ماه میلادی باید بین ۱ و ۱۲ باشد.")
    if (day < 1) return fail("invalid-gregorian-day", "روز باید حداقل ۱ باشد.")
    if (day > gregorianMonthLength(year, month)) return invalidGregorianDay(year, month, day)
    const epochDay = gregorianToEpochDay(year, month, day)
    if (!isSupportedEpochDay(epochDay)) return rangeFailure()
    return {
      ok: true,
      kind: "date",
      date: { calendar, year, month, day },
      epochDay,
      source: "text",
    }
  }

  if (year < 1 || year > 9999) return fail("hijri-year", "سال قمری باید بین ۱ و ۹۹۹۹ باشد.")
  if (month < 1 || month > 12) return fail("hijri-month", "ماه قمری باید بین ۱ و ۱۲ باشد.")
  if (day < 1 || day > 30) return fail("invalid-hijri-day", "روز قمری باید بین ۱ و ۳۰ باشد.")
  const epochDay = hijriToEpochDay(year, month, day)
  if (epochDay === null) {
    return fail(
      "invalid-hijri-date",
      `تاریخ ${toPersianDigits(year)}/${toPersianDigits(month)}/${toPersianDigits(day)} در تقویم قمری امالقری یافت نشد؛ ممکن است این ماه ${toPersianDigits(29)} روزه باشد.`,
    )
  }
  if (!isSupportedEpochDay(epochDay)) return rangeFailure()
  return {
    ok: true,
    kind: "date",
    date: { calendar, year, month, day },
    epochDay,
    source: "text",
  }
}

export function parseInput(text, options = {}) {
  const normalized = normalizeDigits(String(text)).trim()
  if (!normalized) return fail("empty", "تاریخ یا زمان را وارد کنید.")
  const instant = parseInstant(normalized, options)
  if (instant) return instant
  return parseDateInput(normalized, options)
}

export function isValidDate(date) {
  if (date.calendar === "jalali") {
    return (
      date.year >= 1 &&
      date.year <= maxJalaliYear &&
      date.month >= 1 &&
      date.month <= 12 &&
      date.day >= 1 &&
      date.day <= jalaliMonthLength(date.year, date.month)
    )
  }
  if (date.calendar === "gregorian") {
    return (
      date.year >= 1 &&
      date.year <= 9999 &&
      date.month >= 1 &&
      date.month <= 12 &&
      date.day >= 1 &&
      date.day <= gregorianMonthLength(date.year, date.month)
    )
  }
  return hijriToEpochDay(date.year, date.month, date.day) !== null
}

export { isJalaliLeapYear } from "./jalali.mjs"
