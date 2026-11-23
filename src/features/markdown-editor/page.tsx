import { useDeferredValue, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { flushSync } from "react-dom"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileDropZone } from "@/components/file-drop-zone"
import { FileOpenButton } from "@/components/file-open-button"
import { describeReadResult, readTextFile } from "@/lib/read-text-file"
import { ExportMenu } from "./components/export-menu"
import { Outline } from "./components/outline"
import { MarkdownToolbar, modifierLabel } from "./components/toolbar"
import { readDraft, saveDraft } from "./draft.mjs"
import { changedRange, continueList, formatText, indentList, type FormatAction, type FormatResult } from "./format.mjs"
import { editorScrollTopForLine, useScrollSync } from "./hooks/use-scroll-sync"
import { extractOutline } from "./lib/outline.mjs"
import { lineStartOffset } from "./lib/scroll-map.mjs"
import { textStats } from "./stats.mjs"
import { markdownComponentsWithSourceLines } from "./markdown-components.mjs"
import { defaultSettings, readSettings, saveSettings, type EditorSettings, type ViewMode } from "./settings.mjs"
import "./preview.css"
import "./print.css"

type FileStatus = { kind: "info" | "error"; text: string } | null

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: "editor", label: "فقط ویرایشگر" },
  { value: "both", label: "دوستونه" },
  { value: "preview", label: "فقط پیش‌نمایش" },
]

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
  const headings = useMemo(() => extractOutline(text), [text])
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLElement>(null)
  const fileRequest = useRef(0)
  const [fileStatus, setFileStatus] = useState<FileStatus>(null)
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      return readSettings(window.localStorage)
    } catch {
      return { ...defaultSettings }
    }
  })

  // Settings are best-effort: a failed save keeps the in-memory choice and
  // never blocks editing.
  function updateSettings(patch: Partial<EditorSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    try {
      saveSettings(window.localStorage, next)
    } catch {
      // Storage is optional; the editor stays usable.
    }
  }

  useScrollSync({
    sourceRef,
    previewRef,
    text,
    previewText: preview,
    enabled: settings.scrollSync && settings.viewMode !== "editor",
  })

  // Moves the caret to the heading line and brings the same heading into view
  // in the preview. The preview lookup uses the rendered source-line marker.
  function jumpToLine(line: number) {
    const source = sourceRef.current
    if (source) {
      const offset = lineStartOffset(text, line)
      source.focus()
      source.setSelectionRange(offset, offset)
      source.scrollTop = editorScrollTopForLine(source, text, line)
    }
    const previewElement = previewRef.current
    const target = previewElement?.querySelector<HTMLElement>(`[data-source-line="${line}"]`)
    if (previewElement && target) {
      const top = target.getBoundingClientRect().top - previewElement.getBoundingClientRect().top + previewElement.scrollTop
      previewElement.scrollTo({ top })
    }
  }

  async function openFile(file: File) {
    if (text !== "" && !window.confirm("متن فعلی ویرایشگر با محتوای فایل جایگزین شود؟")) return
    const request = ++fileRequest.current
    const result = await readTextFile(file)
    if (request !== fileRequest.current) return
    if (!result.ok) {
      setFileStatus({ kind: "error", text: result.error })
      return
    }
    updateText(result.text)
    setFileStatus({ kind: "info", text: describeReadResult(result) })
  }

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">ویرایشگر Markdown</h1>
          <p className="text-sm leading-7 text-muted-foreground">
            متن را بنویسید و پیش‌نمایش آن را هم‌زمان ببینید. پردازش متن فقط در مرورگر شما انجام می‌شود.
          </p>
        </div>
        <div role="group" aria-label="حالت نمایش" className="hidden items-center gap-2 lg:flex">
          {viewModeOptions.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={settings.viewMode === value ? "default" : "outline"}
              aria-pressed={settings.viewMode === value}
              onClick={() => updateSettings({ viewMode: value })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <Outline headings={headings} onSelect={jumpToLine} />
      <div className={`grid items-start gap-6 ${settings.viewMode === "both" ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        <FileDropZone
          className={settings.viewMode === "preview" ? "min-w-0 lg:hidden" : "min-w-0"}
          onFiles={(files) => (files[0] ? openFile(files[0]) : undefined)}
        >
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle><label htmlFor="markdown-source">متن Markdown</label></CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <FileOpenButton onFiles={(files) => (files[0] ? openFile(files[0]) : undefined)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => updateText("")}>
                    پاک کردن
                  </Button>
                </div>
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
              {fileStatus && (
                <p role="status" className={fileStatus.kind === "error" ? "text-sm leading-7 text-red-400" : "text-sm leading-7 text-muted-foreground"}>
                  {fileStatus.text}
                </p>
              )}
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
        </FileDropZone>
        <Card className={settings.viewMode === "editor" ? "min-w-0 lg:hidden" : "min-w-0"}>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle id="markdown-preview-title">پیش‌نمایش زنده</CardTitle>
              <label className="flex cursor-pointer items-center gap-2 text-xs leading-6 text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={settings.scrollSync}
                  onChange={(event) => updateSettings({ scrollSync: event.target.checked })}
                />
                همگام‌سازی اسکرول
              </label>
            </div>
            <ExportMenu text={text} previewRef={previewRef} />
          </CardHeader>
          <CardContent>
            <section
              ref={previewRef}
              aria-labelledby="markdown-preview-title"
              aria-busy={text !== preview}
              dir="rtl"
              className="markdown-editor-preview max-h-[32rem] min-h-[28rem] overflow-auto rounded-md border p-4 text-sm leading-7"
            >
              {preview.trim() ? (
                <Markdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponentsWithSourceLines}>{preview}</Markdown>
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
