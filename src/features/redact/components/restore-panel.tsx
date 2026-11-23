import { LockKeyhole, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Textarea } from "@/components/ui/textarea"

interface RestorePanelProps {
  input: string
  output: string
  mappingCount: number
  placeholders: string[]
  onChange: (text: string) => void
  onClear: () => void
}

export function RestorePanel({ input, output, mappingCount, placeholders, onChange, onClear }: RestorePanelProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle><label htmlFor="restore-input">پاسخ دریافتی</label></CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={!input}>
              <Trash2 />پاک کردن
            </Button>
          </div>
          <CardDescription>متنی را که جای‌نگهدارها در آن هستند بچسبانید.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            id="restore-input"
            dir="auto"
            value={input}
            onChange={(event) => onChange(event.target.value)}
            placeholder="مثلاً: برای پیگیری با [EMAIL_1] تماس بگیرید."
            spellCheck={false}
            className="min-h-72 resize-y leading-8 md:text-sm"
          />
          <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <RotateCcw className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>
              بازگردانی فقط با نگاشت همین صفحه انجام می‌شود. اگر صفحه را ترک کنید، نگاشت پاک می‌شود و
              جای‌نگهدارها بدون تغییر می‌مانند.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle><h2 className="text-base">متن بازگردانی‌شده</h2></CardTitle>
            <CopyButton text={output} label="خروجی بازگردانی" />
          </div>
          <CardDescription aria-live="polite">
            {mappingCount === 0
              ? "نگاشتی در حافظه نیست."
              : `${mappingCount.toLocaleString("fa-IR")} جای‌نگهدار در حافظهٔ این صفحه است.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mappingCount === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <RotateCcw className="size-8" aria-hidden="true" />
              <p>ابتدا در زبانهٔ «پنهان‌سازی» متن را پردازش کنید تا نگاشت در حافظه ساخته شود.</p>
            </div>
          ) : (
            <div
              dir="auto"
              className="min-h-72 whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 text-sm leading-8"
            >
              {output || " "}
            </div>
          )}

          {placeholders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs leading-6 text-muted-foreground">جای‌نگهدارهای موجود:</p>
              <div className="flex flex-wrap gap-1">
                {placeholders.map((placeholder) => (
                  <span key={placeholder} dir="ltr" className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                    {placeholder}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="flex items-start gap-2 border-t pt-3 text-xs leading-6 text-muted-foreground">
            <LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>مقادیر واقعی فقط در حافظهٔ این صفحه هستند و در مرورگر ذخیره نمی‌شوند.</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
