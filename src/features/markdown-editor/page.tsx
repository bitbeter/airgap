import { useDeferredValue, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { flushSync } from "react-dom"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownToolbar, modifierLabel } from "./components/toolbar"
import { readDraft, saveDraft } from "./draft.mjs"
import { changedRange, continueList, formatText, indentList, type FormatAction, type FormatResult } from "./format.mjs"
import { textStats } from "./stats.mjs"
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
  const stats = useMemo(() => textStats(preview), [preview])
  const sourceRef = useRef<HTMLTextAreaElement>(null)

  function applyEdit(result: FormatResult | null) {
    const source = sourceRef.current
    if (!result || !source) return
    const { start, end, insert } = changedRange(source.value, result.text)
    source.focus()
    source.setSelectionRange(start, end)
    let inserted = start === end && !insert
    try {
      // Native editing keeps browser undo; its input event saves through onChange.
      if (!inserted) inserted = document.execCommand(insert ? "insertText" : "delete", false, insert)
    } catch {
      inserted = false
    }
    if (!inserted || source.value !== result.text) flushSync(() => updateText(result.text))
    source.setSelectionRange(result.selectionStart, result.selectionEnd)
  }

  function runAction(action: FormatAction) {
    const source = sourceRef.current
    if (source) applyEdit(formatText(source.value, source.selectionStart, source.selectionEnd, action))
  }

  function onSourceKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return
    const { value, selectionStart, selectionEnd } = event.currentTarget
    const modifier = modifierLabel === "⌘" ? event.metaKey : event.ctrlKey
    let result: FormatResult | null = null
    if (modifier && !event.altKey && !event.shiftKey) {
      // Physical key codes also work with a Persian keyboard layout.
      const action = ({ KeyB: "bold", KeyI: "italic", KeyK: "link" } as const)[event.code as "KeyB" | "KeyI" | "KeyK"]
      if (!action) return
      result = formatText(value, selectionStart, selectionEnd, action)
    } else if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      result = continueList(value, selectionStart, selectionEnd)
    } else if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
      // Tab outside lists, or with nothing to change, still moves focus.
      result = indentList(value, selectionStart, selectionEnd, event.shiftKey)
    }
    if (!result) return
    event.preventDefault()
    applyEdit(result)
  }

  const number = (value: number) => value.toLocaleString("fa-IR")

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
          <CardContent className="space-y-3">
            <MarkdownToolbar controls="markdown-source" onAction={runAction} />
            <Textarea
              ref={sourceRef}
              id="markdown-source"
              dir="auto"
              value={text}
              onChange={(event) => updateText(event.target.value)}
              onKeyDown={onSourceKeyDown}
              aria-describedby="markdown-storage-status markdown-editor-help"
              placeholder="متن Markdown را اینجا بنویسید…"
              spellCheck={false}
              className="markdown-editor-source min-h-[28rem] resize-y font-mono leading-7"
            />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs leading-6 text-muted-foreground">
              <p aria-label="آمار متن">
                {number(stats.words)} کلمه · {number(stats.characters)} نویسه · {number(stats.lines)} خط · {stats.readingMinutes ? `حدود ${number(stats.readingMinutes)} دقیقه مطالعه` : "بدون زمان مطالعه"}
              </p>
              <p id="markdown-editor-help">
                <span dir="ltr">{modifierLabel}+B</span> پررنگ، <span dir="ltr">{modifierLabel}+I</span> ایتالیک، <span dir="ltr">{modifierLabel}+K</span> پیوند؛ Tab و Shift+Tab تورفتگی آیتم فهرست
              </p>
            </div>
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
