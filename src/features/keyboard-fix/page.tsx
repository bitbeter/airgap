import { useState } from "react"
import { Controls } from "./components/controls"
import { InputPanel } from "./components/input-panel"
import { OutputPanel } from "./components/output-panel"
import { useKeyboardFix } from "./hooks/use-keyboard-fix"
import { englishSampleText, persianSampleText } from "./lib/sample.mjs"

export function KeyboardFixPage() {
  const keyboard = useKeyboardFix()
  const [sampleNotice, setSampleNotice] = useState("")

  function updateInput(text: string) {
    setSampleNotice("")
    keyboard.updateInput(text)
  }

  function loadSample() {
    if (keyboard.input !== "" && !window.confirm("متن فعلی با نمونهٔ آزمایشی جایگزین شود؟")) return
    const persian = keyboard.direction === "fa-en"
    keyboard.updateInput(persian ? persianSampleText : englishSampleText)
    setSampleNotice(
      persian
        ? "نمونهٔ فارسی بارگذاری شد؛ خروجی انگلیسی، حفظ اعداد و نشانی‌ها و حالت «فقط بخش‌های اشتباه» را بررسی کنید."
        : "نمونهٔ انگلیسی بارگذاری شد؛ خروجی فارسی، حفظ اعداد و نشانی‌ها، Shift و تفاوت چیدمان‌ها را بررسی کنید.",
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">اصلاح چیدمان صفحه‌کلید</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          متنی که با زبان اشتباه صفحه‌کلید تایپ شده را در یک نگاه درست کنید؛ مثلاً <span dir="ltr" className="font-mono">sghl nkdh</span> به
          «سلام دنیا» یا «سلام دنیا» به <span dir="ltr" className="font-mono">sghl nkdh</span>. تبدیل کاملاً در مرورگر
          انجام می‌شود و متن شما جایی ارسال یا ذخیره نمی‌شود.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <InputPanel
            text={keyboard.input}
            notice={sampleNotice}
            onChange={updateInput}
            onLoadSample={loadSample}
          />
          <Controls
            direction={keyboard.direction}
            layout={keyboard.layout}
            mode={keyboard.mode}
            storageError={keyboard.storageError}
            hasInput={keyboard.input !== ""}
            hasOutput={keyboard.result.text !== ""}
            onDirectionChange={(direction) => {
              setSampleNotice("")
              keyboard.updateDirection(direction)
            }}
            onLayoutChange={(layout) => {
              setSampleNotice("")
              keyboard.updateLayout(layout)
            }}
            onModeChange={(mode) => {
              setSampleNotice("")
              keyboard.updateMode(mode)
            }}
            onSwap={() => {
              setSampleNotice("")
              keyboard.swap()
            }}
            onClear={() => {
              setSampleNotice("")
              keyboard.clear()
            }}
          />
        </div>
        <OutputPanel
          result={keyboard.result}
          hasInput={keyboard.input !== ""}
          direction={keyboard.direction}
          mode={keyboard.mode}
        />
      </div>
    </div>
  )
}
