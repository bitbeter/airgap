import { forwardRef } from "react"
import { Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface JsonInputProps {
  text: string
  notice: string
  onChange: (text: string) => void
  onClear: () => void
  onLoadSample: () => void
}

export const JsonInput = forwardRef<HTMLTextAreaElement, JsonInputProps>(function JsonInput(
  { text, notice, onChange, onClear, onLoadSample },
  ref,
) {
  const characters = text.length.toLocaleString("fa-IR")
  const lines = (text ? text.split("\n").length : 0).toLocaleString("fa-IR")

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><label htmlFor="json-format-input">JSON ورودی</label></CardTitle>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLoadSample}
              title="بارگذاری نمونهٔ آموزشی با عدد بزرگ و رشته‌های فارسی"
              aria-label="بارگذاری نمونهٔ آموزشی"
            >
              <Sparkles />نمونه
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!text} onClick={onClear}>
              <Trash2 />پاک کردن
            </Button>
          </div>
        </div>
        <CardDescription>{characters} نویسه · {lines} خط · پردازش خودکار</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && <p role="status" className="text-xs leading-6 text-muted-foreground">{notice}</p>}
        <Textarea
          id="json-format-input"
          ref={ref}
          dir="ltr"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder={'{\n  "name": "Airgap",\n  "local": true\n}'}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="min-h-80 resize-y font-mono text-xs leading-6 md:text-xs"
        />
        <p className="text-xs leading-6 text-muted-foreground">
          متن در مرورگر پردازش می‌شود و ذخیره یا ارسال نمی‌شود. فقط تنظیمات قالب‌بندی در همین مرورگر می‌ماند.
        </p>
      </CardContent>
    </Card>
  )
})
