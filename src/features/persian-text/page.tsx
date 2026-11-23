import { useState } from "react"
import { InputPanel } from "./components/input-panel"
import { OutputPanel } from "./components/output-panel"
import { RulesPanel } from "./components/rules-panel"
import { usePersianText } from "./hooks/use-persian-text"
import { sampleText } from "./lib/sample.mjs"
import type { PersianTextSettings } from "./lib/rules.mjs"

const allRulesOn: PersianTextSettings = {
  letters: true,
  taMarbuta: true,
  digits: "persian",
  zwnj: true,
  spacing: true,
  punctuation: true,
  quotes: true,
  kashida: true,
  diacritics: true,
  invisible: true,
  protectCode: true,
}

export function PersianTextPage() {
  const persian = usePersianText()
  const [highlight, setHighlight] = useState(true)
  const [sampleNotice, setSampleNotice] = useState("")

  function updateInput(text: string) {
    setSampleNotice("")
    persian.updateInput(text)
  }

  function updateSettings(next: PersianTextSettings) {
    setSampleNotice("")
    persian.updateSettings(next)
  }

  function resetSettings() {
    setSampleNotice("")
    persian.resetSettings()
  }

  function clear() {
    setSampleNotice("")
    persian.clear()
  }

  function applyToInput() {
    setSampleNotice("")
    persian.applyToInput()
  }

  function loadSample() {
    if (persian.input !== "" && !window.confirm("متن فعلی با نمونهٔ آموزشی جایگزین شود؟")) return
    // The sample is meant to demonstrate every rule, including the optional
    // ones, so loading it turns them all on. The reset button restores defaults.
    persian.updateSettings(allRulesOn)
    persian.updateInput(sampleText)
    setSampleNotice("نمونه با همهٔ قاعده‌ها بارگذاری شد؛ خروجی و تغییرات در ستون کنار نمایش داده می‌شود.")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">ویرایش متن فارسی</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          ي و ك عربی، ارقام مختلط، نیم‌فاصله‌های جاافتاده، فاصله‌های تکراری و علائم لاتین را اصلاح کنید.
          متن فقط در مرورگر شما پردازش می‌شود و جایی ذخیره یا ارسال نمی‌شود.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <InputPanel
          text={persian.input}
          notice={sampleNotice}
          onChange={updateInput}
          onClear={clear}
          onLoadSample={loadSample}
        />
        <OutputPanel
          result={persian.result}
          segments={persian.segments}
          busy={persian.busy}
          error={persian.error}
          cancelled={persian.cancelled}
          highlight={highlight}
          hasInput={persian.input !== ""}
          large={persian.large}
          onToggleHighlight={setHighlight}
          onApply={applyToInput}
          onCancel={persian.cancel}
          onRetry={persian.retry}
        />
      </div>
      <RulesPanel
        settings={persian.settings}
        error={persian.settingsError}
        onChange={updateSettings}
        onReset={resetSettings}
      />
    </div>
  )
}
