import { useDeferredValue, useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { readDraft, saveDraft } from "./draft.mjs"
import { markdownComponents } from "./markdown-components.mjs"
import "./preview.css"

export function MarkdownEditorPage() {
  const [{ text, storageError }, setDraft] = useState(() => {
    try {
      return { text: readDraft(window.localStorage), storageError: false }
    } catch {
      return { text: "", storageError: true }
    }
  })

  function updateText(nextText: string) {
    let failed = false
    try {
      // Save immediately, so a reload before the preview updates loses nothing.
      saveDraft(window.localStorage, nextText)
    } catch {
      failed = true
    }
    setDraft({ text: nextText, storageError: failed })
  }

  const preview = useDeferredValue(text)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">ویرایشگر Markdown</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          متن را بنویسید و پیش‌نمایش آن را هم‌زمان ببینید. پردازش متن فقط در مرورگر شما انجام می‌شود.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle><label htmlFor="markdown-source">متن Markdown</label></CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => updateText("")}>
                پاک کردن
              </Button>
            </div>
            <p id="markdown-storage-status" role="status" className="text-sm leading-7 text-muted-foreground">
              {storageError
                ? "دسترسی به ذخیره‌سازی محلی ناموفق بود؛ تغییرات ممکن است پس از بارگذاری دوباره از بین بروند یا متن قبلی برگردد."
                : text !== ""
                  ? "آخرین متن در این مرورگر ذخیره شده است."
                  : "متن به‌صورت خودکار در این مرورگر ذخیره می‌شود؛ با پاک کردن کامل متن، نسخهٔ ذخیره‌شده هم حذف می‌شود."}
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              id="markdown-source"
              dir="auto"
              value={text}
              onChange={(event) => updateText(event.target.value)}
              aria-describedby="markdown-storage-status"
              placeholder="متن Markdown را اینجا بنویسید…"
              spellCheck={false}
              className="markdown-editor-source min-h-[28rem] resize-y font-mono leading-7"
            />
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader><CardTitle id="markdown-preview-title">پیش‌نمایش زنده</CardTitle></CardHeader>
          <CardContent>
            <section
              aria-labelledby="markdown-preview-title"
              aria-busy={text !== preview}
              dir="rtl"
              className="markdown-editor-preview min-h-[28rem] overflow-x-auto rounded-md border p-4 text-sm leading-7"
            >
              {preview.trim() ? (
                <Markdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponents}>{preview}</Markdown>
              ) : (
                <p className="text-muted-foreground">با نوشتن متن، پیش‌نمایش اینجا نمایش داده می‌شود.</p>
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
