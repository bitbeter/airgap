import { ShieldCheck } from "lucide-react"
import { DateDifferenceCard } from "./components/date-difference-card"
import { DateInputCard } from "./components/date-input-card"
import { DateResultCard } from "./components/date-result-card"
import { DateShiftCard } from "./components/date-shift-card"
import { useDateConvert } from "./hooks/use-date-convert"

export function DateConvertPage() {
  const converter = useDateConvert()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">تبدیل تاریخ</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          تاریخ شمسی، میلادی و قمری را هم‌زمان ببینید، فاصلهٔ دو تاریخ را حساب کنید و روز اضافه یا کم
          کنید. همهٔ محاسبات در مرورگر انجام می‌شود.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-200"
      >
        <ShieldCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <p>تاریخ‌ها ذخیره یا ارسال نمی‌شوند؛ با ترک صفحه پاک می‌شوند.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DateInputCard
          value={converter.input}
          mode={converter.mode}
          error={converter.error}
          onChange={converter.updateInput}
          onModeChange={converter.updateMode}
          onToday={converter.setToday}
          onClear={converter.clear}
        />
        <DateResultCard result={converter.result} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DateDifferenceCard />
        <DateShiftCard />
      </div>
    </div>
  )
}
