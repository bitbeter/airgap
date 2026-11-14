import { useEffect, useRef, useState, type RefObject } from "react"
import { Check, ClipboardCopy, FileCode, FileText, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { renderMermaid } from "../markdown-components.mjs"
import { documentFileName } from "../lib/filename.mjs"

type Action = "markdown" | "html" | "copy"
type Status = { action: Action | "print"; success: boolean; message: string }

// The renderer and react-dom/server load only when an export is requested.
async function renderDocument(markdown: string) {
  const { renderExportDocument } = await import("../lib/render-export.mjs")
  return renderExportDocument(markdown, (source) => renderMermaid(source))
}

function download(content: string, type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  // Revoke after the click has handed the URL to the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function plainTextOf(element: HTMLElement | null) {
  return (element?.innerText ?? "").replace(/\n{3,}/g, "\n\n").trim()
}

interface ExportMenuProps {
  text: string
  previewRef: RefObject<HTMLElement | null>
}

export function ExportMenu({ text, previewRef }: ExportMenuProps) {
  const [pending, setPending] = useState<Action | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const mounted = useRef(true)
  const empty = !text.trim()

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!status?.success) return
    const timeout = window.setTimeout(() => setStatus(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [status])

  async function run(action: Action, task: () => Promise<string>) {
    setPending(action)
    setStatus(null)
    let next: Status
    try {
      next = { action, success: true, message: await task() }
    } catch {
      next = { action, success: false, message: action === "copy"
        ? "کپی انجام نشد؛ متن پیش‌نمایش را انتخاب و دستی کپی کنید."
        : "ساخت فایل انجام نشد؛ دوباره تلاش کنید." }
    }
    if (!mounted.current) return
    setPending(null)
    setStatus(next)
  }

  const downloadMarkdown = () => run("markdown", async () => {
    // The exact draft; Blob encodes strings as UTF-8.
    download(text, "text/markdown;charset=utf-8", documentFileName(text, "md"))
    return "فایل ‎.md آماده شد."
  })

  const downloadHtml = () => run("html", async () => {
    const { html } = await renderDocument(text)
    download(html, "text/html;charset=utf-8", documentFileName(text, "html"))
    return "فایل HTML آماده شد."
  })

  const copyHtml = () => run("copy", async () => {
    const plain = plainTextOf(previewRef.current) || text
    const rendered = renderDocument(text)
    try {
      if (typeof ClipboardItem === "undefined") throw new Error("ClipboardItem unavailable")
      // Promised blobs keep the click's user activation while rendering finishes.
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": rendered.then(({ body }) => new Blob([`<div lang="fa" dir="rtl">${body}</div>`], { type: "text/html" })),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      })])
      return "HTML کپی شد."
    } catch {
      rendered.catch(() => {})
      await navigator.clipboard.writeText(plain)
      return "کپی HTML پشتیبانی نشد؛ متن ساده کپی شد."
    }
  })

  function print() {
    try {
      window.print()
      setStatus(null)
    } catch {
      setStatus({ action: "print", success: false, message: "چاپ در این مرورگر ممکن نشد." })
    }
  }

  const icon = (action: Action, Icon: typeof FileText) =>
    pending === action ? <Loader2 className="animate-spin" /> : status?.action === action && status.success ? <Check /> : <Icon />

  return (
    <div className="space-y-1">
      <div role="group" aria-label="خروجی سند" className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={empty || pending !== null} onClick={downloadMarkdown}>
          {icon("markdown", FileText)}دانلود ‎.md
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={empty || pending !== null} onClick={downloadHtml}>
          {icon("html", FileCode)}دانلود HTML
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={empty || pending !== null} onClick={copyHtml}>
          {icon("copy", ClipboardCopy)}کپی HTML
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={empty} onClick={print}>
          <Printer />چاپ / ذخیره به PDF
        </Button>
      </div>
      <p role="status" className={status && !status.success ? "text-xs leading-6 text-red-400" : status ? "text-xs leading-6 text-muted-foreground" : "sr-only"}>
        {pending ? "در حال آماده‌سازی خروجی…" : status?.message ?? ""}
      </p>
    </div>
  )
}
