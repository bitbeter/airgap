import { test } from "node:test"
import assert from "node:assert/strict"
import {
  epochDayToGregorian,
  epochDayToJalali,
  gregorianMonthLength,
  gregorianToEpochDay,
  gregorianToJalali,
  isJalaliLeapYear,
  isValidGregorianDate,
  isValidJalaliDate,
  jalaliMonthLength,
  jalaliToEpochDay,
  jalaliToGregorian,
} from "../lib/jalali.mjs"

const intlFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
})

function intlJalali(epochDay) {
  const parts = intlFormatter.formatToParts(new Date(epochDay * 86_400_000 + 43_200_000))
  const read = (type) => Number(parts.find((part) => part.type === type)?.value)
  return { jy: read("year"), jm: read("month"), jd: read("day") }
}

test("every day from 1300 through 1500 Jalali matches Intl", () => {
  const start = jalaliToEpochDay(1300, 1, 1)
  const end = jalaliToEpochDay(1501, 1, 1)
  const mismatches = []

  for (let epochDay = start; epochDay < end; epochDay += 1) {
    const expected = intlJalali(epochDay)
    const actual = epochDayToJalali(epochDay)
    if (actual.jy !== expected.jy || actual.jm !== expected.jm || actual.jd !== expected.jd) {
      mismatches.push({ epochDay, expected, actual })
      if (mismatches.length >= 5) break
      continue
    }
    if (jalaliToEpochDay(actual.jy, actual.jm, actual.jd) !== epochDay) {
      mismatches.push({ epochDay, expected, actual, roundTrip: false })
      if (mismatches.length >= 5) break
    }
  }

  assert.deepEqual(mismatches, [])
})

test("Jalali leap years match the Intl length of Esfand", () => {
  for (let jy = 1300; jy <= 1500; jy += 1) {
    const lastDayOfYear = jalaliToEpochDay(jy + 1, 1, 1) - 1
    const intlLength = intlJalali(lastDayOfYear).jd
    assert.equal(jalaliMonthLength(jy, 12), intlLength, `Esfand ${jy}`)
    assert.equal(isJalaliLeapYear(jy), intlLength === 30, `leap ${jy}`)
  }
})

test("known Jalali and Gregorian dates agree", () => {
  assert.deepEqual(jalaliToGregorian(1403, 7, 15), { gy: 2024, gm: 10, gd: 6 })
  assert.deepEqual(gregorianToJalali(2024, 10, 6), { jy: 1403, jm: 7, jd: 15 })
  assert.deepEqual(jalaliToGregorian(1300, 1, 1), { gy: 1921, gm: 3, gd: 21 })
  assert.deepEqual(jalaliToGregorian(1500, 1, 1), { gy: 2121, gm: 3, gd: 21 })
  assert.deepEqual(jalaliToGregorian(1500, 12, 29), { gy: 2122, gm: 3, gd: 20 })
  assert.deepEqual(gregorianToJalali(1970, 1, 1), { jy: 1348, jm: 10, jd: 11 })
  assert.deepEqual(jalaliToGregorian(1, 1, 1), { gy: 622, gm: 3, gd: 22 })
})

test("epoch days handle the Unix epoch and negative values", () => {
  assert.equal(gregorianToEpochDay(1970, 1, 1), 0)
  assert.equal(jalaliToEpochDay(1348, 10, 11), 0)
  assert.deepEqual(epochDayToGregorian(-1), { gy: 1969, gm: 12, gd: 31 })
  assert.deepEqual(epochDayToJalali(-1), { jy: 1348, jm: 10, jd: 10 })

  for (const epochDay of [-100_000, -1, 0, 1, 25_000, 100_000]) {
    const gregorian = epochDayToGregorian(epochDay)
    assert.equal(gregorianToEpochDay(gregorian.gy, gregorian.gm, gregorian.gd), epochDay)
    const jalali = epochDayToJalali(epochDay)
    assert.equal(jalaliToEpochDay(jalali.jy, jalali.jm, jalali.jd), epochDay)
  }
})

test("Esfand 30 is accepted only in leap years", () => {
  assert.equal(isJalaliLeapYear(1403), true)
  assert.equal(isValidJalaliDate(1403, 12, 30), true)
  assert.equal(jalaliToGregorian(1403, 12, 30).gy, 2025)

  assert.equal(isJalaliLeapYear(1402), false)
  assert.equal(isValidJalaliDate(1402, 12, 30), false)
  assert.equal(jalaliMonthLength(1402, 12), 29)
})

test("month lengths and Gregorian validation follow the calendar rules", () => {
  for (const jm of [1, 2, 3, 4, 5, 6]) assert.equal(jalaliMonthLength(1403, jm), 31)
  for (const jm of [7, 8, 9, 10, 11]) assert.equal(jalaliMonthLength(1403, jm), 30)

  assert.equal(gregorianMonthLength(2024, 2), 29)
  assert.equal(gregorianMonthLength(2023, 2), 28)
  assert.equal(gregorianMonthLength(1900, 2), 28)
  assert.equal(gregorianMonthLength(2000, 2), 29)
  assert.equal(gregorianMonthLength(2024, 4), 30)

  assert.equal(isValidGregorianDate(2024, 2, 29), true)
  assert.equal(isValidGregorianDate(2023, 2, 29), false)
  assert.equal(isValidGregorianDate(2024, 13, 1), false)
  assert.equal(isValidJalaliDate(1403, 7, 31), false)
  assert.equal(isValidJalaliDate(1403, 0, 1), false)
  assert.equal(isValidJalaliDate(3178, 1, 1), false)
})
