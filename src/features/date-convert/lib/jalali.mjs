/**
 * Arithmetic Jalali (Solar Hijri) ⇄ Gregorian conversion.
 *
 * The algorithm is the well-known 33-year-cycle implementation with the
 * documented break years. It is pure and has no dependency on `Intl`; the
 * feature tests compare it against `Intl` for every day from 1300 through
 * 1500 Jalali.
 */

const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
]

export const minJalaliYear = 1
export const maxJalaliYear = 3177
export const minGregorianYear = 1
export const maxGregorianYear = 9999

const epochJdn = 2440588 // Julian day number of 1970-01-01 (Unix epoch)

function div(a, b) {
  return Math.trunc(a / b)
}

function mod(a, b) {
  return a - Math.trunc(a / b) * b
}

function jalaliCalendar(jy, withoutLeap = false) {
  const bl = breaks.length
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  let jm = 0
  let jump = 0
  let leap = 0
  let n = 0

  if (jy < jp || jy >= breaks[bl - 1]) throw new RangeError(`Invalid Jalali year ${jy}`)

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  n = jy - jp

  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG

  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
    leap = mod(mod(n + 1, 33) - 1, 4)
    if (leap === -1) leap = 4
  }

  return { leap, gy, march }
}

function gregorianToJdn(gy, gm, gd) {
  let day =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  day = day - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return day
}

function jdnToGregorian(jdn) {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function jalaliToJdn(jy, jm, jd) {
  const r = jalaliCalendar(jy, true)
  return gregorianToJdn(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

const minJdn = jalaliToJdn(minJalaliYear, 1, 1)
const maxJdn = jalaliToJdn(maxJalaliYear, 12, jalaliMonthLength(maxJalaliYear, 12))

function jdnToJalali(jdn) {
  if (!Number.isInteger(jdn) || jdn < minJdn || jdn > maxJdn) {
    throw new RangeError(`Jalali conversion supports Julian days ${minJdn} through ${maxJdn}`)
  }
  const gy = jdnToGregorian(jdn).gy
  let jy = gy - 621
  // The last days of the final supported Jalali year fall in the next
  // Gregorian year, so `gy - 621` can point one year past the table.
  if (jy > maxJalaliYear) jy = maxJalaliYear
  const r = jalaliCalendar(jy, false)
  const jdn1f = gregorianToJdn(r.gy, 3, r.march)
  let k = jdn - jdn1f
  let jd = 0
  let jm = 0

  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31)
      jd = mod(k, 31) + 1
      return { jy, jm, jd }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }

  jm = 7 + div(k, 30)
  jd = mod(k, 30) + 1
  return { jy, jm, jd }
}

export function isJalaliLeapYear(jy) {
  if (!Number.isInteger(jy) || jy < minJalaliYear || jy > maxJalaliYear) return false
  return jalaliCalendar(jy, false).leap === 0
}

export function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isJalaliLeapYear(jy) ? 30 : 29
}

export function gregorianMonthLength(gy, gm) {
  if (gm === 2) {
    const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0
    return leap ? 29 : 28
  }
  return [4, 6, 9, 11].includes(gm) ? 30 : 31
}

export function isValidJalaliDate(jy, jm, jd) {
  if (![jy, jm, jd].every(Number.isInteger)) return false
  if (jy < minJalaliYear || jy > maxJalaliYear) return false
  if (jm < 1 || jm > 12) return false
  return jd >= 1 && jd <= jalaliMonthLength(jy, jm)
}

export function isValidGregorianDate(gy, gm, gd) {
  if (![gy, gm, gd].every(Number.isInteger)) return false
  if (gy < minGregorianYear || gy > maxGregorianYear) return false
  if (gm < 1 || gm > 12) return false
  return gd >= 1 && gd <= gregorianMonthLength(gy, gm)
}

export function jalaliToGregorian(jy, jm, jd) {
  if (!isValidJalaliDate(jy, jm, jd)) throw new RangeError(`Invalid Jalali date ${jy}/${jm}/${jd}`)
  return jdnToGregorian(jalaliToJdn(jy, jm, jd))
}

export function gregorianToJalali(gy, gm, gd) {
  if (!isValidGregorianDate(gy, gm, gd)) throw new RangeError(`Invalid Gregorian date ${gy}/${gm}/${gd}`)
  return jdnToJalali(gregorianToJdn(gy, gm, gd))
}

export function jalaliToEpochDay(jy, jm, jd) {
  if (!isValidJalaliDate(jy, jm, jd)) throw new RangeError(`Invalid Jalali date ${jy}/${jm}/${jd}`)
  return jalaliToJdn(jy, jm, jd) - epochJdn
}

export function epochDayToJalali(epochDay) {
  if (!Number.isInteger(epochDay)) throw new RangeError(`Invalid epoch day ${epochDay}`)
  return jdnToJalali(epochDay + epochJdn)
}

export function gregorianToEpochDay(gy, gm, gd) {
  if (!isValidGregorianDate(gy, gm, gd)) throw new RangeError(`Invalid Gregorian date ${gy}/${gm}/${gd}`)
  return gregorianToJdn(gy, gm, gd) - epochJdn
}

export function epochDayToGregorian(epochDay) {
  if (!Number.isInteger(epochDay)) throw new RangeError(`Invalid epoch day ${epochDay}`)
  return jdnToGregorian(epochDay + epochJdn)
}
