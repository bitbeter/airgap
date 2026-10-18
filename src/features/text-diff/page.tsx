import { useState } from "react"
import { ArrowLeftRight, FileDiff, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextInput } from "./components/text-input"
import { DiffResult } from "./components/diff-result"
import { DiffHistory } from "./components/diff-history"
import { useTextDiff } from "./hooks/use-text-diff"

export function TextDiffPage() {
  const diff = useTextDiff()
  const [preview, setPreview] = useState(false)
  const empty = !diff.before && !diff.after

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">مقایسهٔ متن</h1>
        <p className="text-sm leading-7 text-muted-foreground">دو متن را کنار هم، با مشخص شدن دقیق تغییرات داخل هر خط مقایسه کنید. متن‌ها فقط در مرورگر شما پردازش می‌شوند.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="حالت نمایش متن‌ها">
        <Button variant={preview ? "outline" : "secondary"} aria-pressed={!preview} onClick={() => setPreview(false)}>متن</Button>
        <Button variant={preview ? "secondary" : "outline"} aria-pressed={preview} onClick={() => setPreview(true)}>پیش‌نمایش Markdown</Button>
        {preview && <p className="text-xs text-muted-foreground">برای ویرایش به حالت متن برگردید. تفاوت‌های دقیق در بخش نتیجه نمایش داده می‌شوند.</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput preview={preview} id="before" title="متن اصلی" text={diff.before} onChange={diff.updateBefore} placeholder="نسخهٔ قبلی متن را اینجا وارد کنید…" />
        <TextInput preview={preview} id="after" title="متن جدید" text={diff.after} onChange={diff.updateAfter} placeholder="نسخهٔ جدید متن را اینجا وارد کنید…" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={diff.compare} disabled={diff.busy || empty}>{diff.busy ? <Loader2 className="animate-spin" /> : <FileDiff />}{diff.busy ? "در حال مقایسه…" : "نمایش تفاوت‌ها"}</Button>
        <Button variant="outline" disabled={empty} onClick={diff.swapTexts}><ArrowLeftRight />جابه‌جایی متن‌ها</Button>
        <Button variant="ghost" disabled={empty} onClick={diff.clearTexts}><Trash2 />پاک کردن</Button>
      </div>
      <DiffResult result={diff.result} busy={diff.busy} error={diff.error} page={diff.page} onPageChange={diff.setPage} onCancel={diff.cancel} />
      <DiffHistory entries={diff.historyState.entries} error={diff.historyState.error} onOpen={diff.openHistory} onClear={diff.removeHistory} />
    </div>
  )
}
