import { CalendarDays, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { CalendarMode } from "../lib/parse.mjs"

const modes: { value: CalendarMode; label: string }[] = [
  { value: "auto", label: "خودکار" },
  { value: "jalali", label: "شمسی" },
  { value: "gregorian", label: "میلادی" },
  { value: "hijri", label: "قمری" },
]

interface DateInputCardProps {
  value: string
  mode: CalendarMode
  error: string
  onChange: (value: string) => void
  onModeChange: (mode: CalendarMode) => void
  onToday: () => void
  onClear: () => void
}

export function DateInputCard({
  value,
  mode,
  error,
  onChange,
  onModeChange,
  onToday,
  onClear,
}: DateInputCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>
              <label htmlFor="date-convert-input">تاریخ ورودی</label>
            </CardTitle>
            <CardDescription>تاریخ، timestamp یونیکس یا ISO 8601</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onToday}>
              <CalendarDays />
              امروز
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!value} onClick={onClear}>
              <Trash2 />
              پاک کردن
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          id="date-convert-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="۱۴۰۳/۰۷/۱۵ یا 2024-10-06 یا 1728230400"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "date-convert-error" : "date-convert-hint"}
          className={error ? "border-red-500/50 font-mono" : "font-mono"}
        />

        <div className="space-y-2">
          <span id="date-convert-mode-label" className="text-sm font-medium">
            تقویم ورودی
          </span>
          <div role="group" aria-labelledby="date-convert-mode-label" className="flex flex-wrap gap-2">
            {modes.map(({ value: modeValue, label }) => (
              <Button
                key={modeValue}
                type="button"
                size="sm"
                variant={mode === modeValue ? "default" : "outline"}
                aria-pressed={mode === modeValue}
                onClick={() => onModeChange(modeValue)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <p id="date-convert-hint" className="text-xs leading-6 text-muted-foreground">
          نمونه‌ها: <span dir="ltr">۱۴۰۳/۰۷/۱۵</span>، <span dir="ltr">2024-10-06</span>،{" "}
          <span dir="ltr">@1728230400</span>، <span dir="ltr">2024-10-06T12:30:00Z</span>. عدد صحیح
          بدون جداکننده به‌عنوان timestamp خوانده می‌شود. در حالت خودکار، سال کمتر از ۱۷۰۰ شمسی و
          بقیه میلادی خوانده می‌شود؛ برای قمری از پیشوند «قمری:» یا گزینهٔ قمری استفاده کنید.
        </p>

        {error && (
          <p
            id="date-convert-error"
            role="alert"
            className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
          >
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
