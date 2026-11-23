import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ruleDefinitions, type DigitMode, type PersianTextSettings } from "../lib/rules.mjs"

interface RulesPanelProps {
  settings: PersianTextSettings
  error: string
  onChange: (settings: PersianTextSettings) => void
  onReset: () => void
}

type BooleanRuleId = Exclude<keyof PersianTextSettings, "digits" | "protectCode">

const digitModes: { value: DigitMode; label: string; sample: string }[] = [
  { value: "persian", label: "همه فارسی", sample: "۱۲۳" },
  { value: "latin", label: "همه لاتین", sample: "123" },
  { value: "none", label: "بدون تغییر", sample: "۱۲۳ / 123" },
]

export function RulesPanel({ settings, error, onChange, onReset }: RulesPanelProps) {
  function toggle(id: BooleanRuleId, checked: boolean) {
    onChange({ ...settings, [id]: checked })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle><h2 className="text-base">قواعد یکدست‌سازی</h2></CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw />پیش‌فرض</Button>
        </div>
        <CardDescription>هر قاعده را جداگانه روشن یا خاموش کنید. فقط تنظیمات در این مرورگر ذخیره می‌شود، نه متن.</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="grid gap-2 md:grid-cols-2">
          <legend className="sr-only">قواعد ویرایش متن فارسی</legend>
          {ruleDefinitions.map((definition) => (
            definition.kind === "digits" ? (
              <div key={definition.id} className="rounded-md border p-3 md:col-span-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">{definition.label}</span>
                  <span className="text-xs leading-6 text-muted-foreground">مثال: {definition.example}</span>
                </div>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">{definition.description}</p>
                <div role="radiogroup" aria-label={definition.label} className="mt-2 flex flex-wrap gap-2">
                  {digitModes.map((mode) => (
                    <label key={mode.value} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
                      <input
                        type="radio"
                        name="persian-text-digits"
                        className="size-4 shrink-0 accent-primary"
                        checked={settings.digits === mode.value}
                        onChange={() => onChange({ ...settings, digits: mode.value })}
                      />
                      <span>{mode.label}</span>
                      <span dir="auto" className="text-xs text-muted-foreground">{mode.sample}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <label key={definition.id} className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-primary focus-visible:outline-none"
                  checked={settings[definition.id] === true}
                  onChange={(event) => toggle(definition.id as BooleanRuleId, event.target.checked)}
                />
                <span className="min-w-0">
                  <span className="font-medium">{definition.label}</span>
                  {definition.optional && <span className="ms-2 text-xs text-muted-foreground">اختیاری</span>}
                  <span className="mt-1 block text-xs leading-6 text-muted-foreground">{definition.description}</span>
                  <span dir="auto" className="mt-1 block text-xs leading-6 text-muted-foreground">مثال: {definition.example}</span>
                </span>
              </label>
            )
          ))}
          <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring md:col-span-2">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-primary focus-visible:outline-none"
              checked={settings.protectCode}
              onChange={(event) => onChange({ ...settings, protectCode: event.target.checked })}
            />
            <span>
              <span className="font-medium">محافظت از بلوک‌های کد Markdown</span>
              <span className="mt-1 block text-xs leading-6 text-muted-foreground">کد درون‌خطی و بلوک‌های ``` و ~~~ بدون تغییر می‌مانند. URL و ایمیل همیشه محافظت می‌شوند.</span>
            </span>
          </label>
        </fieldset>
        {error && <p role="status" className="mt-3 text-xs leading-6 text-red-400">{error}</p>}
      </CardContent>
    </Card>
  )
}
