import { epochDayToGregorian } from "./jalali.mjs"

const calendarLocales = {
  jalali: "fa-IR-u-ca-persian",
  gregorian: "fa-IR-u-ca-gregory",
  hijri: "fa-IR-u-ca-islamic-umalqura",
}

const calendarLabels = {
  jalali: "شمسی",
  gregorian: "میلادی",
  hijri: "قمری",
}

const longFormatters = new Map()
const weekdayFormatter = new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: "UTC" })
const localDateTimeFormatter = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "full",
  timeStyle: "medium",
})
const utcDateTimeFormatter = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "full",
  timeStyle: "medium",
  timeZone: "UTC",
})

function longFormatter(calendar) {
  let formatter = longFormatters.get(calendar)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(calendarLocales[calendar], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    longFormatters.set(calendar, formatter)
  }
  return formatter
}

function utcNoon(epochDay) {
  return new Date(epochDay * 86_400_000 + 43_200_000)
}

export function calendarLabel(calendar) {
  return calendarLabels[calendar] ?? calendar
}

export function formatLongDate(epochDay, calendar) {
  const parts = longFormatter(calendar).formatToParts(utcNoon(epochDay))
  const read = (type) => parts.find((part) => part.type === type)?.value ?? ""
  return `${read("weekday")} ${read("day")} ${read("month")} ${read("year")}`.trim()
}

export function formatWeekday(epochDay) {
  return weekdayFormatter.format(utcNoon(epochDay))
}

export function toUtcIso(epochMs) {
  const date = new Date(epochMs)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

export function toLocalIso(epochMs) {
  const date = new Date(epochMs)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value, length = 2) => String(value).padStart(length, "0")
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absolute = Math.abs(offsetMinutes)
  return (
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${pad(date.getMilliseconds(), 3)}` +
    `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
  )
}

export function formatLocalDateTime(epochMs) {
  const date = new Date(epochMs)
  return Number.isNaN(date.getTime()) ? "" : localDateTimeFormatter.format(date)
}

export function formatUtcDateTime(epochMs) {
  const date = new Date(epochMs)
  return Number.isNaN(date.getTime()) ? "" : utcDateTimeFormatter.format(date)
}

export function localStartOfDayEpochMs(epochDay) {
  const { gy, gm, gd } = epochDayToGregorian(epochDay)
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(gy, gm - 1, gd)
  return date.getTime()
}

export function formatUnixSeconds(epochMs) {
  return String(Math.floor(epochMs / 1000))
}

export function formatUnixMilliseconds(epochMs) {
  return String(epochMs)
}
