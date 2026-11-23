export type CalendarId = "jalali" | "gregorian" | "hijri"
export type CalendarMode = "auto" | CalendarId

export interface CalendarDate {
  calendar: CalendarId
  year: number
  month: number
  day: number
}

export interface ParseError {
  code: string
  message: string
}

export interface ParsedDate {
  ok: true
  kind: "date"
  date: CalendarDate
  epochDay: number
  source: "text"
}

export interface ParsedInstant {
  ok: true
  kind: "instant"
  epochMs: number
  epochDay: number
  source: "timestamp" | "iso"
}

export interface ParseFailure {
  ok: false
  error: ParseError
}

export type ParseResult = ParsedDate | ParsedInstant | ParseFailure

export interface ParseOptions {
  calendar?: CalendarMode
  timeZone?: string
}

export interface DateDifference {
  totalDays: number
  sign: 1 | -1
  years: number
  months: number
  days: number
}

export interface HijriDate {
  hy: number
  hm: number
  hd: number
}

export const jalaliMonthNames: string[]
export const gregorianMonthNames: string[]
export const hijriMonthNames: string[]
export const calendarIds: CalendarId[]
export const minSupportedEpochDay: number
export const maxSupportedEpochDay: number

export function normalizeDigits(text: string): string
export function toPersianDigits(value: string | number): string
export function epochDayToHijri(epochDay: number): HijriDate
export function hijriToEpochDay(hy: number, hm: number, hd: number): number | null
export function hijriMonthLength(hy: number, hm: number): number | null
export function isSupportedEpochDay(epochDay: number): boolean
export function calendarToEpochDay(date: CalendarDate): number
export function epochDayToCalendar(epochDay: number, calendar: CalendarId): CalendarDate
export function formatCanonicalDate(date: CalendarDate): string
export function formatCanonicalPersian(date: CalendarDate): string
export function epochDayInTimeZone(epochMs: number, timeZone?: string): number
export function todayEpochDay(timeZone?: string): number
export function addDaysToEpochDay(epochDay: number, days: number): number
export function addJalaliMonths(epochDay: number, months: number): number
export function diffEpochDays(startDay: number, endDay: number): DateDifference
export function parseInstant(
  text: string,
  options?: ParseOptions,
): ParsedInstant | ParseFailure | null
export function parseDateInput(text: string, options?: ParseOptions): ParseResult
export function parseInput(text: string, options?: ParseOptions): ParseResult
export function isValidDate(date: CalendarDate): boolean
export function isJalaliLeapYear(jy: number): boolean
