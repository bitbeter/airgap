import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { detectorDefinitions, type DetectorId, type RedactResult } from "../lib/redact.mjs"

interface RedactOutputProps {
  result: RedactResult | null
  busy: boolean
  error: string
  cancelled: boolean
  hasInput: boolean
  large: boolean
  mappingCount: number
  onToggleFinding: (id: string) => void
  onCancel: () => void
  onRetry: () => void
}

const labels = new Map<DetectorId, string>(detectorDefinitions.map((definition) => [definition.id, definition.label]))

function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\[[A-Z_]+_\d+\])/g)
  return (
    <>
      {parts.map((part, index) => (
        /^\[[A-Z_]+_\d+\]$/.test(part)
          ? <mark key={index} className="rounded bg-emerald-500/20 px-1 py-0.5 font-mono text-emerald-200">{part}</mark>
          : <span key={index}>{part}</span>
      ))}
    </>
  )
}

function countSummary(result: RedactResult | null): string {
  if (!result) return ""
  const counts = new Map<DetectorId, number>()
  for (const finding of result.findings) {
    if (finding.excluded) continue
    counts.set(finding.type, (counts.get(finding.type) ?? 0) + finding.count)
  }
  return [...counts.entries()]
    .map(([type, count]) => `${labels.get(type) ?? type} ${count.toLocaleString("fa-IR")}`)
    .join(" · ")
}

export function RedactOutput({
  result,
  busy,
  error,
  cancelled,
  hasInput,
  large,
  mappingCount,
  onToggleFinding,
  onCancel,
  onRetry,
}: RedactOutputProps) {
  const findings = result?.findings ?? []
  const summary = countSummary(result)
  const allExcluded = findings.length > 0 && findings.every((finding) => finding.excluded)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><h2 className="text-base">متن پنهان‌شده</h2></CardTitle>
          <CopyButton text={result?.text ?? ""} label="خروجی" />
        </div>
        <CardDescription aria-live="polite">
          {!hasInput
            ? "خروجی پس از نوشتن متن در این بخش نمایش داده می‌شود."
            : busy
              ? large ? "متن بزرگ است؛ پردازش در پس‌زمینه انجام می‌شود…" : "در حال پردازش…"
              : summary || (allExcluded ? "همهٔ موارد پیدا‌شده از پنهان‌سازی خارج شدند." : "موردی از انواع فعال پیدا نشد.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasInput ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <ShieldCheck className="size-8" aria-hidden="true" />
            <p>متن را در ستون ورودی بنویسید تا نسخهٔ پنهان‌شده اینجا نمایش داده شود.</p>
          </div>
        ) : (
          <div
            dir="auto"
            className="min-h-72 whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 text-sm leading-8"
          >
            {result?.text ? <HighlightedText text={result.text} /> : " "}
          </div>
        )}

        {busy && (
          <div className="flex flex-wrap items-center gap-2 text-xs leading-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>در حال پنهان‌سازی…</span>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>لغو</Button>
          </div>
        )}

        {cancelled && !busy && (
          <div className="flex flex-wrap items-center gap-2 text-xs leading-6 text-muted-foreground">
            <span>پردازش لغو شد.</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>تلاش دوباره</Button>
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-2 text-xs leading-6 text-red-400">
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>تلاش دوباره</Button>
          </div>
        )}

        {hasInput && !busy && !error && findings.length === 0 && (
          <p role="status" className="text-xs leading-6 text-muted-foreground">
            موردی از انواع فعال پیدا نشد. این ابزار تضمینی نیست؛ پیش از ارسال، متن را خودتان بازبینی کنید.
          </p>
        )}

        {findings.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">موارد پیدا‌شده</h3>
              <span className="text-xs text-muted-foreground">{findings.length.toLocaleString("fa-IR")} مورد</span>
            </div>
            <ul className="space-y-2">
              {findings.map((finding) => (
                <li
                  key={finding.id}
                  className={finding.excluded
                    ? "rounded-md border border-dashed p-3 opacity-60"
                    : "rounded-md border p-3"}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border bg-muted px-2 py-0.5 text-xs">
                          {labels.get(finding.type) ?? finding.type}
                        </span>
                        <span dir="ltr" className="font-mono text-xs text-emerald-300">{finding.placeholder}</span>
                        {finding.count > 1 && (
                          <span className="text-xs text-muted-foreground">{finding.count.toLocaleString("fa-IR")} بار</span>
                        )}
                      </div>
                      <p dir="auto" className="break-all font-mono text-xs leading-6 text-muted-foreground">{finding.value}</p>
                    </div>
                    <Button
                      type="button"
                      variant={finding.excluded ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => onToggleFinding(finding.id)}
                    >
                      {finding.excluded ? <><Eye />پنهان کن</> : <><EyeOff />لغو پنهان‌سازی</>}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="flex items-start gap-2 border-t pt-3 text-xs leading-6 text-muted-foreground">
          <LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>
            {mappingCount > 0
              ? `${mappingCount.toLocaleString("fa-IR")} جای‌نگهدار در حافظهٔ این صفحه آمادهٔ بازگردانی است.`
              : "هنوز جای‌نگهداری در حافظه نیست."}
            {" "}نگاشت با مقادیر واقعی هرگز در مرورگر ذخیره نمی‌شود و با ترک صفحه پاک می‌شود.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
