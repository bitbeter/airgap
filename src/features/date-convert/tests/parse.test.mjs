process.env.TZ = "Asia/Tehran"

const {
  addDaysToEpochDay,
  diffEpochDays,
  epochDayInTimeZone,
  epochDayToCalendar,
  formatCanonicalDate,
  formatCanonicalPersian,
  isSupportedEpochDay,
  maxSupportedEpochDay,
  minSupportedEpochDay,
  normalizeDigits,
  parseInput,
  todayEpochDay,
} = await import("../lib/parse.mjs")
const { gregorianToEpochDay, jalaliToEpochDay } = await import("../lib/jalali.mjs")
const { test } = await import("node:test")
const assert = (await import("node:assert/strict")).default

const tehran = "Asia/Tehran"
const utc = "UTC"
const epochDayOf = (jy, jm, jd) => jalaliToEpochDay(jy, jm, jd)

test("normalizes Persian and Arabic-Indic digits", () => {
  assert.equal(normalizeDigits("۱۴۰۳/۰۷/۱۵"), "1403/07/15")
  assert.equal(normalizeDigits("١٤٤٦-٤-٣"), "1446-4-3")
  assert.equal(normalizeDigits("۲۰۲۴٫۱۰٫۰۶"), "2024.10.06")
  assert.equal(normalizeDigits("۱٬۴۰۳/۰۷/۱۵"), "1403/07/15")
  assert.equal(normalizeDigits("1,403/07/15"), "1403/07/15")
  assert.equal(normalizeDigits("−۳۰"), "-30")
})

test("parses Jalali dates in several spellings", () => {
  for (const text of ["1403/07/15", "۱۴۰۳-۷-۱۵", "1403 07 15", "شمسی: 1403/07/15"]) {
    const result = parseInput(text)
    assert.equal(result.ok, true, text)
    assert.deepEqual(result.date, { calendar: "jalali", year: 1403, month: 7, day: 15 }, text)
    assert.equal(result.epochDay, 20002, text)
    assert.equal(result.kind, "date", text)
  }
})

test("auto detection treats years below 1700 as Jalali and the rest as Gregorian", () => {
  assert.equal(parseInput("1403/07/15").date.calendar, "jalali")
  assert.equal(parseInput("2024-10-06").date.calendar, "gregorian")
  assert.equal(parseInput("2024/10/06").date.calendar, "gregorian")
  assert.equal(parseInput("2024-10-06").epochDay, 20002)
  assert.equal(parseInput("1403/07/15", { calendar: "gregorian" }).date.calendar, "gregorian")
  assert.equal(parseInput("1446/04/03", { calendar: "hijri" }).date.calendar, "hijri")
})

test("calendar prefixes override auto detection", () => {
  const hijri = parseInput("قمری: 1446/04/03")
  assert.equal(hijri.ok, true)
  assert.deepEqual(hijri.date, { calendar: "hijri", year: 1446, month: 4, day: 3 })
  assert.equal(hijri.epochDay, 20002)

  const gregorian = parseInput("میلادی، 2024/10/06")
  assert.equal(gregorian.ok, true)
  assert.equal(gregorian.date.calendar, "gregorian")

  assert.equal(parseInput("hijri: 1446/04/03").date.calendar, "hijri")
  assert.equal(parseInput("قمری 1446/04/03").date.calendar, "hijri")
})

test("rejects impossible Jalali dates with Persian messages", () => {
  const mehr = parseInput("1403/07/31")
  assert.equal(mehr.ok, false)
  assert.equal(mehr.error.code, "invalid-jalali-day")
  assert.match(mehr.error.message, /۳۱ مهر/)
  assert.match(mehr.error.message, /۳۰ روز/)

  const esfand = parseInput("1402/12/30")
  assert.equal(esfand.ok, false)
  assert.equal(esfand.error.code, "invalid-jalali-day")
  assert.match(esfand.error.message, /کبیسه/)

  assert.equal(parseInput("1403/12/30").ok, true)
  assert.equal(parseInput("1403/12/30").epochDay, 20167)

  assert.equal(parseInput("1403/13/01").error.code, "jalali-month")
  assert.equal(parseInput("1403/00/01").error.code, "jalali-month")
  assert.equal(parseInput("1403/07/00").error.code, "invalid-jalali-day")
})

test("rejects impossible Gregorian dates", () => {
  const february = parseInput("2024/02/30")
  assert.equal(february.ok, false)
  assert.equal(february.error.code, "invalid-gregorian-day")
  assert.match(february.error.message, /فوریه/)

  assert.equal(parseInput("2023/02/29").error.code, "invalid-gregorian-day")
  assert.equal(parseInput("2024/13/01").error.code, "gregorian-month")
  assert.equal(parseInput("2024/00/01").error.code, "gregorian-month")
})

test("rejects impossible Hijri dates", () => {
  const missing = parseInput("قمری: 1446/01/30")
  assert.equal(missing.ok, false)
  assert.equal(missing.error.code, "invalid-hijri-date")
  assert.match(missing.error.message, /امالقری/)

  assert.equal(parseInput("قمری: 1446/13/01").error.code, "hijri-month")
  assert.equal(parseInput("قمری: 1446/04/31").error.code, "invalid-hijri-day")
})

test("rejects empty and malformed input", () => {
  assert.equal(parseInput("").error.code, "empty")
  assert.equal(parseInput("   ").error.code, "empty")
  assert.equal(parseInput("abc").error.code, "format")
  assert.equal(parseInput("1403/7").error.code, "format")
  assert.equal(parseInput("1403/07/15/1").error.code, "format")
})

test("parses Unix timestamps in seconds and milliseconds", () => {
  const seconds = parseInput("@1728230400")
  assert.equal(seconds.ok, true)
  assert.equal(seconds.kind, "instant")
  assert.equal(seconds.source, "timestamp")
  assert.equal(seconds.epochMs, 1_728_230_400_000)
  assert.equal(seconds.epochDay, 20002)

  const milliseconds = parseInput("1728230400000")
  assert.equal(milliseconds.epochMs, 1_728_230_400_000)
  assert.equal(milliseconds.epochDay, 20002)

  assert.equal(parseInput("s:1728230400").epochMs, 1_728_230_400_000)
  assert.equal(parseInput("ms:1728230400000").epochMs, 1_728_230_400_000)
})

test("handles negative and boundary timestamps", () => {
  const epoch = parseInput("0")
  assert.equal(epoch.epochMs, 0)
  assert.equal(epoch.epochDay, 0)

  const beforeEpoch = parseInput("-1")
  assert.equal(beforeEpoch.epochMs, -1000)
  assert.equal(beforeEpoch.epochDay, 0)

  const negative = parseInput("-31536000")
  assert.equal(negative.epochMs, -31_536_000_000)
  assert.equal(negative.epochDay, gregorianToEpochDay(1969, 1, 1))

  const negativeMilliseconds = parseInput("ms:-31536000000")
  assert.equal(negativeMilliseconds.epochMs, -31_536_000_000)
  assert.equal(negativeMilliseconds.epochDay, gregorianToEpochDay(1969, 1, 1))

  const year2038 = parseInput("2147483647")
  assert.equal(year2038.epochMs, 2_147_483_647_000)
  assert.equal(year2038.epochDay, gregorianToEpochDay(2038, 1, 19))
})

test("parses ISO 8601 with UTC, offsets, fractions, and local time", () => {
  const utcDate = parseInput("2024-10-06T12:30:00Z")
  assert.equal(utcDate.ok, true)
  assert.equal(utcDate.source, "iso")
  assert.equal(utcDate.epochMs, Date.UTC(2024, 9, 6, 12, 30))
  assert.equal(utcDate.epochDay, 20002)

  const offset = parseInput("2024-10-06T12:30:00+03:30")
  assert.equal(offset.epochMs, Date.UTC(2024, 9, 6, 9, 0))

  const compactOffset = parseInput("2024-10-06T12:30:00+0330")
  assert.equal(compactOffset.epochMs, Date.UTC(2024, 9, 6, 9, 0))

  const hourOffset = parseInput("2024-10-06T12:30:00+03")
  assert.equal(hourOffset.epochMs, Date.UTC(2024, 9, 6, 9, 30))

  const fraction = parseInput("2024-10-06T12:30:00.123Z")
  assert.equal(fraction.epochMs, Date.UTC(2024, 9, 6, 12, 30, 0, 123))

  const local = parseInput("2024-10-06T12:30:00")
  assert.equal(local.epochMs, Date.UTC(2024, 9, 6, 9, 0))

  const nextLocalDay = parseInput("2024-10-06T23:30:00Z")
  assert.equal(nextLocalDay.epochDay, 20003)
})

test("rejects invalid ISO dates and times", () => {
  assert.equal(parseInput("2024-02-30T12:00:00Z").error.code, "iso-date")
  assert.equal(parseInput("2024-10-06T24:00:00Z").error.code, "iso-time")
  assert.equal(parseInput("2024-10-06T12:60:00Z").error.code, "iso-time")
})

test("computes the local calendar day from an instant", () => {
  const instant = Date.UTC(2024, 9, 5, 21, 0)
  assert.equal(epochDayInTimeZone(instant, tehran), 20002)
  assert.equal(epochDayInTimeZone(instant, utc), 20001)
  assert.equal(parseInput("2024-10-05T21:00:00Z").epochDay, 20002)
})

test("converts an epoch day to all three calendars", () => {
  assert.deepEqual(epochDayToCalendar(20002, "jalali"), {
    calendar: "jalali",
    year: 1403,
    month: 7,
    day: 15,
  })
  assert.deepEqual(epochDayToCalendar(20002, "gregorian"), {
    calendar: "gregorian",
    year: 2024,
    month: 10,
    day: 6,
  })
  assert.deepEqual(epochDayToCalendar(20002, "hijri"), {
    calendar: "hijri",
    year: 1446,
    month: 4,
    day: 3,
  })
})

test("formats canonical ASCII and Persian dates", () => {
  const date = { calendar: "jalali", year: 1403, month: 7, day: 15 }
  assert.equal(formatCanonicalDate(date), "1403/07/15")
  assert.equal(formatCanonicalPersian(date), "۱۴۰۳/۰۷/۱۵")
})

test("computes date differences in days and Jalali years/months/days", () => {
  const start = epochDayOf(1403, 7, 15)
  assert.deepEqual(diffEpochDays(start, epochDayOf(1404, 7, 15)), {
    totalDays: 366,
    sign: 1,
    years: 1,
    months: 0,
    days: 0,
  })
  assert.deepEqual(diffEpochDays(start, epochDayOf(1403, 8, 20)), {
    totalDays: 35,
    sign: 1,
    years: 0,
    months: 1,
    days: 5,
  })
  assert.deepEqual(diffEpochDays(start, start - 1), {
    totalDays: 1,
    sign: -1,
    years: 0,
    months: 0,
    days: 1,
  })
  assert.deepEqual(diffEpochDays(epochDayOf(1403, 12, 30), epochDayOf(1404, 12, 29)), {
    totalDays: 365,
    sign: 1,
    years: 1,
    months: 0,
    days: 0,
  })
})

test("adds and subtracts days", () => {
  assert.equal(addDaysToEpochDay(20002, 30), 20032)
  assert.deepEqual(epochDayToCalendar(20032, "jalali"), {
    calendar: "jalali",
    year: 1403,
    month: 8,
    day: 15,
  })
  assert.deepEqual(epochDayToCalendar(addDaysToEpochDay(20002, -15), "jalali"), {
    calendar: "jalali",
    year: 1403,
    month: 6,
    day: 31,
  })
})

test("supported epoch-day range covers the Jalali algorithm", () => {
  assert.equal(isSupportedEpochDay(minSupportedEpochDay), true)
  assert.equal(isSupportedEpochDay(maxSupportedEpochDay), true)
  assert.equal(isSupportedEpochDay(minSupportedEpochDay - 1), false)
  assert.equal(isSupportedEpochDay(maxSupportedEpochDay + 1), false)
  assert.deepEqual(epochDayToCalendar(minSupportedEpochDay, "hijri"), {
    calendar: "hijri",
    year: 1,
    month: 1,
    day: 1,
  })
  assert.deepEqual(epochDayToCalendar(minSupportedEpochDay, "jalali"), {
    calendar: "jalali",
    year: 1,
    month: 4,
    day: 27,
  })
  assert.deepEqual(epochDayToCalendar(maxSupportedEpochDay, "jalali"), {
    calendar: "jalali",
    year: 3177,
    month: 12,
    day: 29,
  })
})

test("rejects dates and instants outside the supported calendar range", () => {
  assert.equal(parseInput("شمسی: 3178/01/01").error.code, "jalali-year")
  assert.equal(parseInput("9999/12/31").error.code, "range")
  assert.equal(parseInput("قمری: 9999/01/01").error.code, "range")
  assert.equal(parseInput("9999-12-31T12:00:00Z").error.code, "range")
  assert.equal(parseInput("3799/03/19").ok, true)
  assert.equal(parseInput("3799/03/20").error.code, "range")
})

test("today uses the requested time zone", () => {
  const before = epochDayInTimeZone(Date.now(), utc)
  const today = todayEpochDay(utc)
  const after = epochDayInTimeZone(Date.now(), utc)
  assert.ok(today === before || today === after)
})
