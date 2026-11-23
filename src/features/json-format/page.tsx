import { useRef, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { JsonInput } from "./components/json-input"
import { JsonOutput } from "./components/json-output"
import { JsonSettings } from "./components/json-settings"
import { useJsonFormat } from "./hooks/use-json-format"
import { sampleJson } from "./lib/sample.mjs"
import type { JsonFormatSettings } from "./lib/format.mjs"

export function JsonFormatPage() {
  const json = useJsonFormat()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [sampleNotice, setSampleNotice] = useState("")

  function updateInput(text: string) {
    setSampleNotice("")
    json.updateInput(text)
  }

  function updateSettings(next: Partial<JsonFormatSettings>) {
    setSampleNotice("")
    json.updateSettings(next)
  }

  function resetSettings() {
    setSampleNotice("")
    json.resetSettings()
  }

  function clear() {
    setSampleNotice("")
    json.clear()
  }

  function loadSample() {
    if (json.input !== "" && !window.confirm("متن فعلی با نمونهٔ آموزشی جایگزین شود؟")) return
    json.updateInput(sampleJson)
    setSampleNotice(
      "نمونه بارگذاری شد؛ عدد بزرگ «امتیاز» هشدار دقت را نشان می‌دهد و متن عدد در خروجی بدون تغییر می‌ماند.",
    )
  }

  function jumpToPosition(position: number) {
    const element = inputRef.current
    if (!element) return
    element.focus()
    element.setSelectionRange(position, position)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">قالب‌بندی JSON</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          JSON را قالب‌بندی، فشرده یا اعتبارسنجی کنید؛ خطاها با شمارهٔ خط و ستون، آمار اندازه و عمق، و نمای درختی
          با مسیر هر گره. پردازش کاملاً در مرورگر انجام می‌شود و متن شما ذخیره یا ارسال نمی‌شود.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-200"
      >
        <ShieldCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <p>متن JSON ذخیره نمی‌شود؛ فقط تنظیمات قالب‌بندی در همین مرورگر می‌ماند.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <JsonInput
            ref={inputRef}
            text={json.input}
            notice={sampleNotice}
            onChange={updateInput}
            onClear={clear}
            onLoadSample={loadSample}
          />
          <JsonSettings
            settings={json.settings}
            error={json.settingsError}
            onChange={updateSettings}
            onReset={resetSettings}
          />
        </div>
        <JsonOutput
          result={json.result}
          error={json.error}
          busy={json.busy}
          cancelled={json.cancelled}
          hasInput={json.input.trim() !== ""}
          large={json.large}
          onCancel={json.cancel}
          onRetry={json.retry}
          onJumpToPosition={jumpToPosition}
        />
      </div>
    </div>
  )
}
