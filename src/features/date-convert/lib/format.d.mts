import type { CalendarId } from "./parse.mjs"

export function calendarLabel(calendar: CalendarId): string
export function formatLongDate(epochDay: number, calendar: CalendarId): string
export function formatWeekday(epochDay: number): string
export function toUtcIso(epochMs: number): string
export function toLocalIso(epochMs: number): string
export function formatLocalDateTime(epochMs: number): string
export function formatUtcDateTime(epochMs: number): string
export function localStartOfDayEpochMs(epochDay: number): number
export function formatUnixSeconds(epochMs: number): string
export function formatUnixMilliseconds(epochMs: number): string
