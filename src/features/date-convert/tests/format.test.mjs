process.env.TZ = "Asia/Tehran"

const {
  calendarLabel,
  formatLocalDateTime,
  formatLongDate,
  formatUnixMilliseconds,
  formatUnixSeconds,
  formatUtcDateTime,
  formatWeekday,
  localStartOfDayEpochMs,
  toLocalIso,
  toUtcIso,
} = await import("../lib/format.mjs")
const { epochDayToHijri, hijriMonthLength, hijriToEpochDay, maxSupportedEpochDay, minSupportedEpochDay } =
  await import("../lib/parse.mjs")
const { test } = await import("node:test")
const assert = (await import("node:assert/strict")).default

test("formats a date in all three calendars with the Persian weekday", () => {
  assert.equal(formatLongDate(20002, "jalali"), "یکشنبه ۱۵ مهر ۱۴۰۳")
  assert.equal(formatLongDate(20002, "gregorian"), "یکشنبه ۶ اکتبر ۲۰۲۴")
  assert.equal(formatLongDate(20002, "hijri"), "یکشنبه ۳ ربیع‌الثانی ۱۴۴۶")
  assert.equal(formatWeekday(20002), "یکشنبه")
  assert.equal(calendarLabel("jalali"), "شمسی")
  assert.equal(calendarLabel("gregorian"), "میلادی")
  assert.equal(calendarLabel("hijri"), "قمری")
})

test("formats UTC and local ISO 8601 values", () => {
  assert.equal(toUtcIso(1_728_230_400_000), "2024-10-06T16:00:00.000Z")
  assert.equal(toLocalIso(1_728_230_400_000), "2024-10-06T19:30:00.000+03:30")
  assert.equal(formatUnixSeconds(1_728_230_400_000), "1728230400")
  assert.equal(formatUnixMilliseconds(1_728_230_400_000), "1728230400000")
})

test("formats local and UTC date-times in Persian", () => {
  assert.match(formatLocalDateTime(1_728_230_400_000), /۱۹:۳۰:۰۰/)
  assert.match(formatUtcDateTime(1_728_230_400_000), /۱۶:۰۰:۰۰/)
})

test("local start of day follows the browser time zone", () => {
  assert.equal(localStartOfDayEpochMs(20002), Date.UTC(2024, 9, 5, 20, 30))
  assert.equal(localStartOfDayEpochMs(0), Date.UTC(1969, 11, 31, 20, 30))
})

test("Hijri dates round-trip through the Intl search", () => {
  for (let epochDay = 19990; epochDay <= 20100; epochDay += 1) {
    const hijri = epochDayToHijri(epochDay)
    assert.equal(hijriToEpochDay(hijri.hy, hijri.hm, hijri.hd), epochDay, `epoch day ${epochDay}`)
  }
})

test("the first day of every Hijri month from 1300 through 1500 round-trips", () => {
  for (let hy = 1300; hy <= 1500; hy += 1) {
    for (let hm = 1; hm <= 12; hm += 1) {
      const epochDay = hijriToEpochDay(hy, hm, 1)
      assert.notEqual(epochDay, null, `${hy}/${hm}/1`)
      assert.deepEqual(epochDayToHijri(epochDay), { hy, hm, hd: 1 })
    }
  }
})

test("Hijri month lengths are 29 or 30 days", () => {
  for (let hm = 1; hm <= 12; hm += 1) {
    const length = hijriMonthLength(1446, hm)
    assert.ok(length === 29 || length === 30, `month ${hm}: ${length}`)
  }
})

test("Hijri search stays inside the supported calendar range", () => {
  const minHijri = epochDayToHijri(minSupportedEpochDay)
  const maxHijri = epochDayToHijri(maxSupportedEpochDay)
  assert.ok(hijriToEpochDay(minHijri.hy, minHijri.hm, minHijri.hd) >= minSupportedEpochDay)
  assert.ok(hijriToEpochDay(maxHijri.hy, maxHijri.hm, maxHijri.hd) <= maxSupportedEpochDay)
})
