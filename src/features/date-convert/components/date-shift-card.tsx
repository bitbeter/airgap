import { useMemo, useState } from "react"
import { CalendarPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  addDaysToEpochDay,
  epochDayToCalendar,
  formatCanonicalDate,
  isSupportedEpochDay,
  normalizeDigits,
  parseInput,
  todayEpochDay,
} from "../lib/parse.mjs"
import { CalendarSummary } from "./calendar-summary"

function initialBase() {
  return formatCanonicalDate(epochDayToCalendar(todayEpochDay(), "jalali"))
}

export function DateShiftCard() {
  const [base, setBase] = useState(initialBase)
  const [days, setDays] = useState("0")

  const baseParsed = useMemo(() => (base.trim() ? parseInput(base) : null), [base])
  const normalizedDays = normalizeDigits(days).trim()
  const dayCount = Number(normalizedDays)
  const validCount = normalizedDays !== "" && Number.isSafeInteger(dayCount)
  const shifted = useMemo(() => {
    if (!baseParsed?.ok || !validCount) return null
    return addDaysToEpochDay(baseParsed.epochDay, dayCount)
  }, [baseParsed, dayCount, validCount])
  const outOfRange = shifted !== null && !isSupportedEpochDay(shifted)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>افزودن یا کم‌کردن روز</CardTitle>
        <CardDescription>
          تاریخ پایه را وارد کنید و تعداد روز را اضافه یا کم کنید؛ نتیجه در هر سه تقویم نمایش داده
          می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <div className="space-y-2">
            <label htmlFor="date-shift-base" className="text-sm font-medium">
              تاریخ پایه
            </label>
            <Input
              id="date-shift-base"
              value={base}
              onChange={(event) => setBase(event.target.value)}
              placeholder="۱۴۰۳/۰۷/۱۵"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(baseParsed && !baseParsed.ok)}
              className={baseParsed && !baseParsed.ok ? "border-red-500/50 font-mono" : "font-mono"}
            />
            {baseParsed && !baseParsed.ok && (
              <p role="alert" className="text-xs leading-6 text-red-300">
                {baseParsed.error.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="date-shift-days" className="text-sm font-medium">
              تعداد روز
            </label>
            <Input
              id="date-shift-days"
              value={days}
              onChange={(event) => setDays(event.target.value)}
              placeholder="۰"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!validCount}
              className={validCount ? "font-mono" : "border-red-500/50 font-mono"}
            />
          </div>
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          تشخیص خودکار: سال کمتر از ۱۷۰۰ شمسی و بقیه میلادی. برای تاریخ قمری از پیشوند «قمری:»
          استفاده کنید.
        </p>

        {!validCount ? (
          <p role="alert" className="text-sm leading-7 text-red-300">
            تعداد روز را به‌صورت عدد صحیح وارد کنید؛ برای کم‌کردن از عدد منفی استفاده کنید.
          </p>
        ) : outOfRange ? (
          <p role="alert" className="text-sm leading-7 text-red-300">
            نتیجه خارج از بازهٔ پشتیبانی‌شدهٔ تقویم است. تعداد روز کمتری وارد کنید.
          </p>
        ) : shifted !== null ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="size-4 text-muted-foreground" aria-hidden="true" />
              تاریخ جدید
            </p>
            <CalendarSummary epochDay={shifted} hijriNote />
          </div>
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">
            تاریخ پایه را وارد کنید تا نتیجه محاسبه شود.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
