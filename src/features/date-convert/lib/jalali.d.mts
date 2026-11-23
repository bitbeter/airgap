export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

export interface GregorianDate {
  gy: number
  gm: number
  gd: number
}

export const minJalaliYear: number
export const maxJalaliYear: number
export const minGregorianYear: number
export const maxGregorianYear: number

export function isJalaliLeapYear(jy: number): boolean
export function jalaliMonthLength(jy: number, jm: number): number
export function gregorianMonthLength(gy: number, gm: number): number
export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean
export function isValidGregorianDate(gy: number, gm: number, gd: number): boolean
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate
export function jalaliToEpochDay(jy: number, jm: number, jd: number): number
export function epochDayToJalali(epochDay: number): JalaliDate
export function gregorianToEpochDay(gy: number, gm: number, gd: number): number
export function epochDayToGregorian(epochDay: number): GregorianDate
