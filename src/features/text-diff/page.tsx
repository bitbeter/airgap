import { useRef, useState } from "react"
import { ArrowLeftRight, FileDiff, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileDropZone } from "@/components/file-drop-zone"
import { describeReadResult, readTextFile } from "@/lib/read-text-file"
import { TextInput } from "./components/text-input"
import { DiffResult } from "./components/diff-result"
import { DiffHistory } from "./components/diff-history"
import { useTextDiff } from "./hooks/use-text-diff"

type FileStatus = { kind: "info" | "error"; text: string } | null

export function TextDiffPage() {
  const diff = useTextDiff()
  const [preview, setPreview] = useState(false)
  const [fileStatus, setFileStatus] = useState<FileStatus>(null)
  const fileRequests = useRef({ before: 0, after: 0, pair: 0 })
  const empty = !diff.before && !diff.after

  async function openInto(side: "before" | "after", file: File) {
    const request = ++fileRequests.current[side]
    const result = await readTextFile(file)
    if (request !== fileRequests.current[side]) return
    if (!result.ok) {
      setFileStatus({ kind: "error", text: result.error })
      return
    }
    if (side === "before") diff.updateBefore(result.text)
    else diff.updateAfter(result.text)
    setFileStatus({ kind: "info", text: describeReadResult(result, side === "before" ? "متن اصلی" : "متن جدید") })
  }

  async function openFiles(files: File[], target: Element) {
    if (files.length >= 2) {
      const [firstFile, secondFile] = [...files]
        .sort((a, b) => a.name.localeCompare(b.name, "fa", { numeric: true, sensitivity: "base" }))
        .slice(0, 2)
      const pairRequest = ++fileRequests.current.pair
      const beforeRequest = ++fileRequests.current.before
      const afterRequest = ++fileRequests.current.after
      const [first, second] = await Promise.all([readTextFile(firstFile), readTextFile(secondFile)])
      const current = fileRequests.current
      if (pairRequest !== current.pair || beforeRequest !== current.before || afterRequest !== current.after) return
      if (!first.ok) {
        setFileStatus({ kind: "error", text: first.error })
        return
      }
      if (!second.ok) {
        setFileStatus({ kind: "error", text: second.error })
        return
      }
      diff.replaceTexts(first.text, second.text)
      setFileStatus({
        kind: "info",
        text: `دو فایل بر اساس نام مرتب شدند. ${describeReadResult(first, "متن اصلی")} ${describeReadResult(second, "متن جدید")}`,
      })
      return
    }
    const side = target.closest<HTMLElement>("[data-diff-input]")?.dataset.diffInput
    if (side !== "before" && side !== "after") {
      setFileStatus({ kind: "error", text: "برای باز کردن یک فایل، آن را روی یکی از دو ورودی رها کنید." })
      return
    }
    await openInto(side, files[0])
  }

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
      <FileDropZone className="grid gap-4 md:grid-cols-2" onFiles={openFiles}>
        <TextInput preview={preview} id="before" title="متن اصلی" text={diff.before} onChange={diff.updateBefore} onOpenFile={(file) => openInto("before", file)} placeholder="نسخهٔ قبلی متن را اینجا وارد کنید…" />
        <TextInput preview={preview} id="after" title="متن جدید" text={diff.after} onChange={diff.updateAfter} onOpenFile={(file) => openInto("after", file)} placeholder="نسخهٔ جدید متن را اینجا وارد کنید…" />
      </FileDropZone>
      {fileStatus && (
        <p role="status" className={fileStatus.kind === "error" ? "text-sm leading-7 text-red-400" : "text-sm leading-7 text-muted-foreground"}>
          {fileStatus.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={diff.compare} disabled={diff.busy || empty}>{diff.busy ? <Loader2 className="animate-spin" /> : <FileDiff />}{diff.busy ? "در حال مقایسه…" : "نمایش تفاوت‌ها"}</Button>
        <Button variant="outline" disabled={empty} onClick={diff.swapTexts}><ArrowLeftRight />جابه‌جایی متن‌ها</Button>
        <Button variant="ghost" disabled={empty} onClick={diff.clearTexts}><Trash2 />پاک کردن</Button>
      </div>
      <DiffResult result={diff.result} patch={diff.patch} busy={diff.busy} error={diff.error} onCancel={diff.cancel} />
      <DiffHistory entries={diff.historyState.entries} error={diff.historyState.error} onOpen={diff.openHistory} onClear={diff.removeHistory} />
    </div>
  )
}
