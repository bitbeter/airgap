import { useState } from "react"
import { Braces, Loader2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { JsonTree } from "./json-tree"
import type { JsonFormatResult } from "../lib/format.mjs"
import type { JsonFormatError } from "../hooks/use-json-format"

interface JsonOutputProps {
  result: JsonFormatResult | null
  error: JsonFormatError | null
  busy: boolean
  cancelled: boolean
  hasInput: boolean
  large: boolean
  onCancel: () => void
  onRetry: () => void
  onJumpToPosition: (position: number) => void
}

type OutputView = "text" | "tree"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes.toLocaleString("fa-IR")} بایت`
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوبایت`
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`
}

function ErrorCard({ error, onJump }: { error: JsonFormatError; onJump: (position: number) => void }) {
  const index = Math.max(0, Math.min(error.column - 1, error.lineText.length))
  const before = error.lineText.slice(0, index)
  const at = error.lineText.slice(index, index + 1)
  const after = error.lineText.slice(index + 1)

  return (
    <div role="alert" className="space-y-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm leading-7">
      <p className="text-red-200">{error.message}</p>
      {error.line > 0 && (
        <>
          <button
            type="button"
            onClick={() => onJump(error.position)}
            className="block w-full overflow-x-auto rounded border border-red-500/30 bg-background/40 p-2 text-left font-mono text-xs leading-6 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            dir="ltr"
            title="رفتن به محل خطا"
          >
            <span className="text-muted-foreground">{error.line.toLocaleString("fa-IR")}: </span>
            <span>{before}</span>
            <mark className="rounded bg-red-500/40 px-0.5 text-red-100">{at || " "}</mark>
            <span>{after}</span>
          </button>
          <p className="text-xs leading-6 text-red-300/80">برای رفتن به محل خطا روی خط بالا کلیک کنید.</p>
        </>
      )}
    </div>
  )
}

function WarningCard({
  warnings,
  onJump,
}: {
  warnings: JsonFormatResult["warnings"]
  onJump: (position: number) => void
}) {
  return (
    <div role="status" className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">
      <p className="flex items-center gap-2 text-sm font-medium">
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
        هشدار دقت اعداد
      </p>
      <p>
        این اعداد از محدودهٔ دقت امن JavaScript بیرون‌اند. متن اصلی آن‌ها در خروجی حفظ شده است، اما اگر خروجی را با
        <span dir="ltr" className="mx-1 font-mono">JSON.parse</span>
        بخوانید ممکن است دقت از دست برود.
      </p>
      <ul className="space-y-1">
        {warnings.slice(0, 5).map((warning) => (
          <li key={`${warning.path}-${warning.start}`} className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onJump(warning.start)}
              className="break-all font-mono text-[11px] text-amber-200 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              dir="ltr"
              title="رفتن به این عدد"
            >
              {warning.path}
            </button>
            <span dir="ltr" className="break-all font-mono text-[11px] text-amber-100/80">{warning.raw}</span>
          </li>
        ))}
        {warnings.length > 5 && (
          <li>و {(warnings.length - 5).toLocaleString("fa-IR")} مورد دیگر…</li>
        )}
      </ul>
    </div>
  )
}

export function JsonOutput({
  result,
  error,
  busy,
  cancelled,
  hasInput,
  large,
  onCancel,
  onRetry,
  onJumpToPosition,
}: JsonOutputProps) {
  const [view, setView] = useState<OutputView>("text")

  return (
    <Card className="min-w-0" aria-busy={busy}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><h2 className="text-base">خروجی</h2></CardTitle>
          <CopyButton text={result?.output ?? ""} label="خروجی JSON" />
        </div>
        <CardDescription aria-live="polite">
          {!hasInput
            ? "خروجی، خطاها و آمار پس از نوشتن JSON در این بخش نمایش داده می‌شوند."
            : busy && !result
              ? large
                ? "ورودی بزرگ است؛ پردازش در پس‌زمینه انجام می‌شود…"
                : "در حال پردازش…"
              : result
                ? `${formatBytes(result.stats.inputBytes)} ورودی · ${formatBytes(result.stats.outputBytes)} خروجی · ${result.stats.keys.toLocaleString("fa-IR")} کلید · عمق ${result.stats.depth.toLocaleString("fa-IR")}`
                : "خروجی در این بخش نمایش داده می‌شود."}
        </CardDescription>
        {large && (
          <p className="text-xs leading-6 text-muted-foreground">
            ورودی بیش از ۱ مگابایت است؛ پردازش در worker انجام می‌شود و قابل لغو است.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasInput ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Braces className="size-8" aria-hidden="true" />
            <p>JSON را در ستون ورودی بچسبانید تا خروجی، خطاها و آمار اینجا نمایش داده شود.</p>
          </div>
        ) : error ? (
          <div className="space-y-2">
            <ErrorCard error={error} onJump={onJumpToPosition} />
            {error.code === "worker" && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>تلاش دوباره</Button>
            )}
          </div>
        ) : cancelled && !result ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <p>پردازش لغو شد.</p>
            <Button type="button" variant="outline" onClick={onRetry}>تلاش دوباره</Button>
          </div>
        ) : !result ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <p>در حال آماده‌سازی خروجی…</p>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>لغو پردازش</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div role="tablist" aria-label="نمای خروجی" className="inline-flex rounded-lg border bg-muted/30 p-1">
                <Button
                  type="button"
                  role="tab"
                  id="json-output-text-tab"
                  aria-selected={view === "text"}
                  aria-controls="json-output-text"
                  variant={view === "text" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("text")}
                >
                  متن
                </Button>
                <Button
                  type="button"
                  role="tab"
                  id="json-output-tree-tab"
                  aria-selected={view === "tree"}
                  aria-controls="json-output-tree"
                  variant={view === "tree" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("tree")}
                >
                  درخت
                </Button>
              </div>
              {busy && (
                <span className="flex items-center gap-2 text-xs leading-6 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  در حال به‌روزرسانی…
                  <Button type="button" variant="ghost" size="sm" onClick={onCancel}>لغو</Button>
                </span>
              )}
            </div>

            {result.warnings.length > 0 && (
              <WarningCard warnings={result.warnings} onJump={onJumpToPosition} />
            )}

            {view === "text" ? (
              <div role="tabpanel" id="json-output-text" aria-labelledby="json-output-text-tab">
                <pre
                  dir="ltr"
                  className="max-h-[32rem] overflow-auto whitespace-pre rounded-md border bg-muted/20 p-3 font-mono text-xs leading-6"
                >
                  {result.output}
                </pre>
              </div>
            ) : (
              <div role="tabpanel" id="json-output-tree" aria-labelledby="json-output-tree-tab">
                <JsonTree root={result.root} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
