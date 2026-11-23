import { CopyButton } from "@/components/copy-button"
import {
  calendarIds,
  epochDayToCalendar,
  formatCanonicalDate,
  formatCanonicalPersian,
  type CalendarId,
} from "../lib/parse.mjs"
import { calendarLabel, formatLongDate } from "../lib/format.mjs"

const copyPrefixes: Record<CalendarId, string> = {
  jalali: "شمسی",
  gregorian: "میلادی",
  hijri: "قمری",
}

export function CalendarSummary({ epochDay, hijriNote = false }: { epochDay: number; hijriNote?: boolean }) {
  return (
    <div className="space-y-3">
      {calendarIds.map((calendar) => {
        const date = epochDayToCalendar(epochDay, calendar)
        return (
          <div
            key={calendar}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{calendarLabel(calendar)}</p>
              <p className="text-sm font-medium leading-6">{formatLongDate(epochDay, calendar)}</p>
              <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                {formatCanonicalPersian(date)}
              </p>
            </div>
            <CopyButton
              text={`${copyPrefixes[calendar]}: ${formatCanonicalDate(date)}`}
              label={`تاریخ ${calendarLabel(calendar)}`}
            />
          </div>
        )
      })}
      {hijriNote && (
        <p className="text-xs leading-6 text-muted-foreground">
          تقویم قمری بر پایهٔ امالقری است؛ تقویم رسمی ایران ممکن است یک روز اختلاف داشته باشد.
        </p>
      )}
    </div>
  )
}
