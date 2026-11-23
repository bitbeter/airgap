import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { detectorDefinitions, type DetectorId, type RedactSettings } from "../lib/redact.mjs"

interface RedactSettingsProps {
  settings: RedactSettings
  settingsError: string
  termsText: string
  termsError: string
  rememberTerms: boolean
  onToggle: (id: DetectorId, enabled: boolean) => void
  onTermsChange: (text: string) => void
  onRememberChange: (remember: boolean) => void
  onReset: () => void
}

export function RedactSettings({
  settings,
  settingsError,
  termsText,
  termsError,
  rememberTerms,
  onToggle,
  onTermsChange,
  onRememberChange,
  onReset,
}: RedactSettingsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><h2 className="text-base">انواع اطلاعات حساس</h2></CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw />پیش‌فرض
          </Button>
        </div>
        <CardDescription>هر نوع را می‌توانید جداگانه روشن یا خاموش کنید.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset>
          <legend className="sr-only">انواع تشخیص</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {detectorDefinitions.map((definition) => (
              <label
                key={definition.id}
                className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={settings[definition.id]}
                  onChange={(event) => onToggle(definition.id, event.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{definition.label}</span>
                  <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">{definition.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {settingsError && <p role="status" className="text-xs leading-6 text-red-400">{settingsError}</p>}

        <div className="space-y-3 border-t pt-5">
          <label htmlFor="redact-terms" className="block text-sm font-medium">واژه‌های دلخواه</label>
          <p className="text-xs leading-6 text-muted-foreground">
            نام اشخاص، شرکت یا پروژه؛ هر واژه در یک خط. واژه‌ها به‌صورت پیش‌فرض ذخیره نمی‌شوند.
          </p>
          <Textarea
            id="redact-terms"
            dir="auto"
            value={termsText}
            onChange={(event) => onTermsChange(event.target.value)}
            placeholder={"شرکت آلفا\nعلی رضایی"}
            spellCheck={false}
            className="min-h-24 resize-y leading-7 md:text-sm"
          />
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-primary"
              checked={rememberTerms}
              onChange={(event) => onRememberChange(event.target.checked)}
            />
            <span>
              <span className="font-medium">به‌خاطر سپردن در این مرورگر</span>
              <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">
                فهرست واژه‌ها در کلید <span dir="ltr" className="font-mono">airgap:redact:terms:v1</span> ذخیره می‌شود.
                مقادیر شناسایی‌شده هرگز ذخیره نمی‌شوند.
              </span>
            </span>
          </label>
          {termsError && <p role="status" className="text-xs leading-6 text-red-400">{termsError}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
