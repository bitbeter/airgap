import { useState } from "react"
import { FileDiff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiffView } from "./diff-view"
import type { DiffResult as ComparisonResult } from "../lib/compare.mjs"

interface DiffResultProps {
  result: ComparisonResult | null
  busy: boolean
  error: string
  onCancel: () => void
}

export function DiffResult({ result, busy, error, onCancel }: DiffResultProps) {
  const [showWhitespace, setShowWhitespace] = useState(false)

  return (
    <Card aria-busy={busy}>
      <CardHeader>
        <CardTitle><h2>نتیجهٔ مقایسه</h2></CardTitle>
        <CardDescription aria-live="polite">
          {busy ? "در حال بررسی تفاوت‌ها…" : result ? result.added || result.removed || result.modified ? `${result.modified.toLocaleString("fa-IR")} خط ویرایش‌شده · ${result.added.toLocaleString("fa-IR")} خط اضافه‌شده · ${result.removed.toLocaleString("fa-IR")} خط حذف‌شده` : "دو متن یکسان هستند." : "نتیجه پس از مقایسه در این بخش نمایش داده می‌شود."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
        {!result ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <FileDiff className="size-8" aria-hidden="true" />
            <p>{busy ? "مقایسه در حال انجام است؛ می‌توانید آن را لغو کنید." : "متن‌ها را وارد کنید و «نمایش تفاوت‌ها» را بزنید."}</p>
            {busy && <Button variant="outline" onClick={onCancel}>لغو مقایسه</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-6 text-muted-foreground">بخش‌های پررنگ و زیرخط‌دار تغییر کرده‌اند؛ قرمز در متن اصلی و سبز در متن جدید.</p>
              <Button variant="outline" size="sm" aria-pressed={showWhitespace} onClick={() => setShowWhitespace(!showWhitespace)}>نمایش همهٔ فاصله‌ها {showWhitespace ? "✓" : ""}</Button>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">فاصلهٔ تغییرکرده: · ، تب: ⇥ ، نیم‌فاصله: [ZWNJ]؛ LF و CRLF پایان خط و EOF انتهای متن است.</p>
            <DiffView rows={result.rows} showWhitespace={showWhitespace} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
