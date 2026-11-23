import { useMemo, useState } from "react"
import {
  epochDayToCalendar,
  formatCanonicalDate,
  parseInput,
  todayEpochDay,
  type CalendarMode,
  type ParseResult,
} from "../lib/parse.mjs"

export function useDateConvert() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<CalendarMode>("auto")

  const result = useMemo<ParseResult | null>(
    () => (input.trim() ? parseInput(input, { calendar: mode }) : null),
    [input, mode],
  )
  const error = result && !result.ok ? result.error.message : ""

  function updateInput(value: string) {
    setInput(value)
  }

  function updateMode(value: CalendarMode) {
    setMode(value)
  }

  function setToday() {
    const calendar = mode === "auto" ? "jalali" : mode
    setInput(formatCanonicalDate(epochDayToCalendar(todayEpochDay(), calendar)))
  }

  function clear() {
    setInput("")
  }

  return { input, mode, result, error, updateInput, updateMode, setToday, clear }
}
