import { useId, useMemo, useState } from "react"
import { Download } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatUnifiedPatch, patchContext, patchFileName, type StructuredPatch } from "../lib/patch.mjs"

interface PatchExportProps {
  patch: StructuredPatch | null
  names: { old: string; new: string }
  onNamesChange: (names: { old: string; new: string }) => void
}

export function PatchExport({ patch, names, onNamesChange }: PatchExportProps) {
  const id = useId()
  const [downloadFailed, setDownloadFailed] = useState(false)
  const text = useMemo(() => patch ? formatUnifiedPatch(patch, names.old, names.new) : "", [patch, names])

  function download() {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/x-diff;charset=utf-8" }))
      const link = document.createElement("a")
      link.href = url
      link.download = patchFileName(names.new)
      link.click()
      // Revoke after the click has handed the URL to the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setDownloadFailed(false)
    } catch {
      setDownloadFailed(true)
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-3 rounded-md border p-4">
      <div className="space-y-1">
        <h3 id={`${id}-title`} className="text-sm font-medium">خروجی patch</h3>
        <p className="text-xs leading-6 text-muted-foreground">
          قالب unified diff با {patchContext.toLocaleString("fa-IR")} خط اطراف هر تغییر؛ قابل استفاده با <span dir="ltr">git apply</span> و ابزارهای بازبینی کد.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-old`} className="text-xs text-muted-foreground">نام فایل اصلی</label>
          <Input id={`${id}-old`} dir="ltr" value={names.old} spellCheck={false} onChange={(event) => onNamesChange({ ...names, old: event.target.value })} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-new`} className="text-xs text-muted-foreground">نام فایل جدید</label>
          <Input id={`${id}-new`} dir="ltr" value={names.new} spellCheck={false} onChange={(event) => onNamesChange({ ...names, new: event.target.value })} />
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <CopyButton text={text} label="patch" />
        <Button type="button" variant="outline" size="sm" disabled={!text} onClick={download}><Download />دانلود ‎.patch</Button>
      </div>
      <p role="status" className={downloadFailed ? "text-xs leading-6 text-red-400" : "text-xs leading-6 text-muted-foreground"}>
        {downloadFailed ? "دانلود انجام نشد؛ از دکمهٔ کپی استفاده کنید."
          : !patch ? "ساخت patch برای این متن‌ها بیش از حد طول کشید؛ نتیجهٔ مقایسه همچنان معتبر است."
          : !text ? "دو متن یکسان هستند؛ patch خالی است."
          : "فاصله‌ها و پایان خط‌ها دقیقاً حفظ می‌شوند. نام‌ها فقط در سربرگ patch استفاده می‌شوند و فاصله در آن‌ها به _ تبدیل می‌شود."}
      </p>
    </section>
  )
}
