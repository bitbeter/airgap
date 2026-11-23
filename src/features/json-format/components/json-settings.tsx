import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { IndentOption, JsonFormatSettings } from "../lib/format.mjs"

interface JsonSettingsProps {
  settings: JsonFormatSettings
  error: string
  onChange: (next: Partial<JsonFormatSettings>) => void
  onReset: () => void
}

const indentOptions: { value: IndentOption; label: string }[] = [
  { value: 2, label: "۲ فاصله" },
  { value: 4, label: "۴ فاصله" },
  { value: "tab", label: "تب" },
]

export function JsonSettings({ settings, error, onChange, onReset }: JsonSettingsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><h2 className="text-base">تنظیمات قالب‌بندی</h2></CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw />پیش‌فرض
          </Button>
        </div>
        <CardDescription>
          تنظیمات در کلید <span dir="ltr" className="font-mono">airgap:json-format:settings:v1</span> ذخیره می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <span className="block text-sm font-medium">حالت خروجی</span>
          <div role="group" aria-label="حالت خروجی" className="inline-flex rounded-lg border bg-muted/30 p-1">
            <Button
              type="button"
              size="sm"
              variant={settings.minify ? "ghost" : "secondary"}
              aria-pressed={!settings.minify}
              onClick={() => onChange({ minify: false })}
            >
              قالب‌بندی
            </Button>
            <Button
              type="button"
              size="sm"
              variant={settings.minify ? "secondary" : "ghost"}
              aria-pressed={settings.minify}
              onClick={() => onChange({ minify: true })}
            >
              فشرده‌سازی
            </Button>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">تورفتگی</legend>
          <div className="flex flex-wrap gap-2">
            {indentOptions.map((option) => (
              <label
                key={String(option.value)}
                className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  type="radio"
                  name="json-format-indent"
                  className="size-4 shrink-0 accent-primary"
                  checked={settings.indent === option.value}
                  disabled={settings.minify}
                  onChange={() => onChange({ indent: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {settings.minify && (
            <p className="text-xs leading-6 text-muted-foreground">در حالت فشرده، تورفتگی اعمال نمی‌شود.</p>
          )}
        </fieldset>

        <label className="flex cursor-pointer items-start gap-2 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            checked={settings.sortKeys}
            onChange={(event) => onChange({ sortKeys: event.target.checked })}
          />
          <span>
            <span className="font-medium">مرتب‌سازی کلیدها</span>
            <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">
              کلیدهای همهٔ شیءها به‌صورت بازگشتی مرتب می‌شوند؛ ترتیب اعضای آرایه‌ها تغییر نمی‌کند.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            checked={settings.jsonc}
            onChange={(event) => onChange({ jsonc: event.target.checked })}
          />
          <span>
            <span className="font-medium">پذیرش JSONC</span>
            <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">
              کامنت‌ها و ویرگول انتهایی برای خواندن پذیرفته می‌شوند؛ خروجی همیشه JSON استاندارد است.
            </span>
          </span>
        </label>

        {error && <p role="status" className="text-xs leading-6 text-red-400">{error}</p>}
      </CardContent>
    </Card>
  )
}
