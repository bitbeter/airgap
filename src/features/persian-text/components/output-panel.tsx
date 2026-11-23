import { CheckCheck, Loader2, SpellCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { ChangeView } from "./change-view"
import { describeCounts, type NormalizeResult } from "../lib/rules.mjs"
import type { ChangeSegment } from "../lib/changes.mjs"

interface OutputPanelProps {
  result: NormalizeResult | null
  segments: ChangeSegment[] | null
  busy: boolean
  error: string
  cancelled: boolean
  highlight: boolean
  hasInput: boolean
  large: boolean
  onToggleHighlight: (value: boolean) => void
  onApply: () => void
  onCancel: () => void
  onRetry: () => void
}

export function OutputPanel({
  result, segments, busy, error, cancelled, highlight, hasInput, large,
  onToggleHighlight, onApply, onCancel, onRetry,
}: OutputPanelProps) {
  const highlightUnavailable = hasInput && !busy && !error && !cancelled && segments === null
  const characters = result ? result.text.length.toLocaleString("fa-IR") : "۰"

  return (
    <Card className="min-w-0" aria-busy={busy}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><h2 className="text-base">متن نرمال‌شده</h2></CardTitle>
          <CopyButton text={result?.text ?? ""} label="خروجی" />
        </div>
        <CardDescription aria-live="polite">
          {busy
            ? "در حال پردازش متن…"
            : result
              ? `${characters} نویسه · ${describeCounts(result.counts)}`
              : "خروجی پس از پردازش در این بخش نمایش داده می‌شود."}
        </CardDescription>
        {large && <p className="text-xs leading-6 text-muted-foreground">متن بزرگ است؛ پردازش در پس‌زمینه انجام می‌شود و ممکن است چند لحظه طول بکشد.</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={highlight && Boolean(segments)}
              disabled={!segments}
              onChange={(event) => onToggleHighlight(event.target.checked)}
            />
            <span>هایلایت تغییرات</span>
          </label>
          <Button type="button" disabled={!result || result.total === 0 || busy} onClick={onApply}>
            <CheckCheck />اعمال بر ورودی
          </Button>
          {busy && <Button type="button" variant="outline" onClick={onCancel}>لغو پردازش</Button>}
        </div>
        {error && <p role="alert" className="text-sm leading-7 text-red-400">{error}</p>}
        {!hasInput ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <SpellCheck className="size-8" aria-hidden="true" />
            <p>متن را در ستون ورودی بنویسید تا نسخهٔ یکدست‌شده اینجا نمایش داده شود.</p>
          </div>
        ) : cancelled && !result ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <p>پردازش لغو شد.</p>
            <Button type="button" variant="outline" onClick={onRetry}>تلاش دوباره</Button>
          </div>
        ) : !result ? (
          <div className="flex min-h-72 items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" aria-hidden="true" />
            <p>در حال آماده‌سازی خروجی…</p>
          </div>
        ) : highlight && segments ? (
          <div className="space-y-2">
            <p className="text-xs leading-6 text-muted-foreground">بخش زیر تغییرات را نشان می‌دهد؛ متن نهایی با دکمهٔ کپی یا «اعمال بر ورودی» در دسترس است.</p>
            <ChangeView segments={segments} />
          </div>
        ) : (
          <div dir="auto" className="min-h-72 whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 text-sm leading-8">
            {result.text}
          </div>
        )}
        {highlightUnavailable && (
          <p className="text-xs leading-6 text-muted-foreground">برای این متن، هایلایت تغییرات غیرفعال شد؛ خروجی کامل در همین بخش نمایش داده می‌شود.</p>
        )}
      </CardContent>
    </Card>
  )
}
