import { useMemo } from "react"
import { Clock3, Info } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatLocalDateTime,
  formatUnixMilliseconds,
  formatUnixSeconds,
  formatUtcDateTime,
  localStartOfDayEpochMs,
  toLocalIso,
  toUtcIso,
} from "../lib/format.mjs"
import type { ParseResult } from "../lib/parse.mjs"
import { CalendarSummary } from "./calendar-summary"

interface DateResultCardProps {
  result: ParseResult | null
}

export function DateResultCard({ result }: DateResultCardProps) {
  const resolved = useMemo(() => {
    if (!result || !result.ok) return null
    const epochDay = result.epochDay
    const epochMs = result.kind === "instant" ? result.epochMs : localStartOfDayEpochMs(epochDay)
    return { epochDay, epochMs, instant: result.kind === "instant" }
  }, [result])

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>نتیجهٔ تبدیل</CardTitle>
        <CardDescription>
          {resolved
            ? resolved.instant
              ? "تاریخ‌های تقویمی بر اساس روز محلی همین لحظه هستند."
              : "تاریخ واردشده در سه تقویم و معادل timestamp آن."
            : "برای دیدن نتیجه، یک تاریخ، timestamp یا ISO وارد کنید."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!resolved ? (
          <p className="rounded-lg border border-dashed p-4 text-sm leading-7 text-muted-foreground">
            تاریخ را در کارت ورودی بنویسید. نتیجه هم‌زمان در تقویم شمسی، میلادی و قمری نمایش داده
            می‌شود.
          </p>
        ) : (
          <div className="space-y-5">
            <CalendarSummary epochDay={resolved.epochDay} hijriNote />
            <section className="space-y-3 rounded-lg border p-4" aria-labelledby="date-convert-instant-title">
              <h3 id="date-convert-instant-title" className="flex items-center gap-2 text-sm font-medium">
                <Clock3 className="size-4" aria-hidden="true" />
                timestamp و ISO 8601
              </h3>
              <dl className="space-y-2">
                <ValueRow label="ثانیهٔ یونیکس" value={formatUnixSeconds(resolved.epochMs)} />
                <ValueRow label="میلی‌ثانیهٔ یونیکس" value={formatUnixMilliseconds(resolved.epochMs)} />
                <ValueRow label="ISO 8601 (UTC)" value={toUtcIso(resolved.epochMs)} />
                <ValueRow label="ISO 8601 (محلی)" value={toLocalIso(resolved.epochMs)} />
                <ValueRow
                  label="تاریخ و زمان محلی (شمسی)"
                  value={formatLocalDateTime(resolved.epochMs)}
                  ltr={false}
                />
                <ValueRow label="تاریخ و زمان UTC (شمسی)" value={formatUtcDateTime(resolved.epochMs)} ltr={false} />
              </dl>
              <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                <Info className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                {resolved.instant
                  ? "برای ورودی ISO یا timestamp، لحظهٔ دقیق مبنا است و روز محلی ممکن است با UTC متفاوت باشد."
                  : "برای تاریخ‌های تقویمی، مبنای timestamp ابتدای همان روز به وقت محلی است."}
              </p>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ValueRow({ label, value, ltr = true }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span dir={ltr ? "ltr" : undefined} className={ltr ? "truncate font-mono text-xs" : "truncate text-xs"}>
          {value}
        </span>
        <CopyButton text={value} label={label} />
      </dd>
    </div>
  )
}
