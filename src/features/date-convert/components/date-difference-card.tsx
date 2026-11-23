import { useMemo, useState } from "react"
import { ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { diffEpochDays, parseInput } from "../lib/parse.mjs"

export function DateDifferenceCard() {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  const startParsed = useMemo(() => (start.trim() ? parseInput(start) : null), [start])
  const endParsed = useMemo(() => (end.trim() ? parseInput(end) : null), [end])
  const difference = useMemo(() => {
    if (!startParsed?.ok || !endParsed?.ok) return null
    return diffEpochDays(startParsed.epochDay, endParsed.epochDay)
  }, [startParsed, endParsed])

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>فاصلهٔ دو تاریخ</CardTitle>
        <CardDescription>
          تعداد روز و تفکیک سال/ماه/روز شمسی. هر دو تاریخ می‌توانند شمسی، میلادی یا قمری باشند.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="date-diff-start" className="text-sm font-medium">
              تاریخ شروع
            </label>
            <Input
              id="date-diff-start"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              placeholder="۱۴۰۳/۰۷/۱۵"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(startParsed && !startParsed.ok)}
              className={startParsed && !startParsed.ok ? "border-red-500/50 font-mono" : "font-mono"}
            />
            {startParsed && !startParsed.ok && (
              <p role="alert" className="text-xs leading-6 text-red-300">
                {startParsed.error.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="date-diff-end" className="text-sm font-medium">
              تاریخ پایان
            </label>
            <Input
              id="date-diff-end"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              placeholder="2024-10-06"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(endParsed && !endParsed.ok)}
              className={endParsed && !endParsed.ok ? "border-red-500/50 font-mono" : "font-mono"}
            />
            {endParsed && !endParsed.ok && (
              <p role="alert" className="text-xs leading-6 text-red-300">
                {endParsed.error.message}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          تشخیص خودکار: سال کمتر از ۱۷۰۰ شمسی و بقیه میلادی. برای تاریخ قمری از پیشوند «قمری:»
          استفاده کنید.
        </p>

        {difference ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4" role="status">
            <p className="flex items-center gap-2 text-sm leading-7">
              <ArrowLeftRight className="size-4 text-muted-foreground" aria-hidden="true" />
              فاصله: <strong>{difference.totalDays.toLocaleString("fa-IR")}</strong> روز
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              {difference.years.toLocaleString("fa-IR")} سال، {difference.months.toLocaleString("fa-IR")} ماه و{" "}
              {difference.days.toLocaleString("fa-IR")} روز (شمسی)
            </p>
            {difference.sign < 0 && (
              <p className="text-xs leading-6 text-amber-300">
                تاریخ پایان پیش از شروع است؛ فاصله به‌صورت قدر مطلق نمایش داده می‌شود.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">
            هر دو تاریخ را وارد کنید تا فاصله محاسبه شود.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
