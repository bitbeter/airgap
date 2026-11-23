import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RedactInput } from "./components/redact-input"
import { RedactOutput } from "./components/redact-output"
import { RedactSettings } from "./components/redact-settings"
import { RestorePanel } from "./components/restore-panel"
import { useRedact } from "./hooks/use-redact"
import { sampleTerms, sampleText } from "./lib/sample.mjs"

export function RedactPage() {
  const redact = useRedact()
  const [sampleNotice, setSampleNotice] = useState("")

  function updateInput(text: string) {
    setSampleNotice("")
    redact.updateInput(text)
  }

  function updateTermsText(text: string) {
    setSampleNotice("")
    redact.updateTermsText(text)
  }

  function loadSample() {
    if (redact.input !== "" && !window.confirm("متن فعلی با نمونهٔ آموزشی جایگزین شود؟")) return
    const additions = sampleTerms.filter(
      (term) => !redact.terms.some((existing) => existing.toLowerCase() === term.toLowerCase()),
    )
    redact.updateInput(sampleText)
    redact.updateTermsText([...redact.terms, ...additions].join("\n"))
    setSampleNotice(
      additions.length > 0
        ? "نمونه بارگذاری شد؛ واژه‌های نمونه هم به فهرست واژه‌های دلخواه اضافه شدند. خروجی را کپی کنید و در زبانهٔ «بازگردانی» بچسبانید."
        : "نمونه بارگذاری شد؛ خروجی را کپی کنید و در زبانهٔ «بازگردانی» بچسبانید.",
    )
  }

  function clear() {
    setSampleNotice("")
    redact.clear()
  }

  function resetSettings() {
    setSampleNotice("")
    redact.resetSettings()
  }

  function setRememberTerms(remember: boolean) {
    setSampleNotice("")
    redact.setRememberTerms(remember)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">پنهان‌سازی اطلاعات حساس</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          ایمیل، نشانی، شمارهٔ تلفن، کد ملی، کارت، شبا، کلیدهای API و واژه‌های دلخواه را پیش از اشتراک‌گذاری با
          جای‌نگهدار جایگزین کنید و بعد پاسخ را با همان جای‌نگهدارها به مقدار واقعی برگردانید. پردازش کاملاً در
          مرورگر انجام می‌شود و متنی ارسال یا ذخیره نمی‌شود.
        </p>
      </div>

      <div role="note" className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-200">
        <ShieldAlert className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <p>این ابزار همهٔ اطلاعات حساس را تضمینی پیدا نمی‌کند؛ پیش از ارسال خروجی را بازبینی کنید.</p>
      </div>

      <div role="tablist" aria-label="حالت ابزار" className="inline-flex rounded-lg border bg-muted/30 p-1">
        <Button
          type="button"
          role="tab"
          aria-selected={redact.mode === "redact"}
          variant={redact.mode === "redact" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => redact.setMode("redact")}
        >
          پنهان‌سازی
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={redact.mode === "restore"}
          variant={redact.mode === "restore" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => redact.setMode("restore")}
        >
          بازگردانی
        </Button>
      </div>

      {redact.mode === "redact" ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-6">
            <RedactInput
              text={redact.input}
              notice={sampleNotice}
              onChange={updateInput}
              onClear={clear}
              onLoadSample={loadSample}
            />
            <RedactSettings
              settings={redact.settings}
              settingsError={redact.settingsError}
              termsText={redact.termsText}
              termsError={redact.termsError}
              rememberTerms={redact.rememberTerms}
              onToggle={(id, enabled) => {
                setSampleNotice("")
                redact.toggleType(id, enabled)
              }}
              onTermsChange={updateTermsText}
              onRememberChange={setRememberTerms}
              onReset={resetSettings}
            />
          </div>
          <RedactOutput
            result={redact.result}
            busy={redact.busy}
            error={redact.error}
            cancelled={redact.cancelled}
            hasInput={redact.input !== ""}
            large={redact.large}
            mappingCount={redact.mappingCount}
            onToggleFinding={redact.toggleFinding}
            onCancel={redact.cancel}
            onRetry={redact.retry}
          />
        </div>
      ) : (
        <RestorePanel
          input={redact.restoreInput}
          output={redact.restored}
          mappingCount={redact.mappingCount}
          placeholders={redact.placeholders}
          onChange={redact.updateRestoreInput}
          onClear={() => redact.updateRestoreInput("")}
        />
      )}
    </div>
  )
}
