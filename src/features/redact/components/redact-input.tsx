import { ShieldCheck, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface RedactInputProps {
  text: string
  notice: string
  onChange: (text: string) => void
  onClear: () => void
  onLoadSample: () => void
}

export function RedactInput({ text, notice, onChange, onClear, onLoadSample }: RedactInputProps) {
  const characters = text.length.toLocaleString("fa-IR")
  const lines = (text ? text.split("\n").length : 0).toLocaleString("fa-IR")

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><label htmlFor="redact-input">متن ورودی</label></CardTitle>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLoadSample}
              title="بارگذاری نمونهٔ کامل برای دیدن همهٔ انواع تشخیص"
              aria-label="بارگذاری نمونهٔ کامل"
            >
              <Sparkles />نمونه
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={!text}>
              <Trash2 />پاک کردن
            </Button>
          </div>
        </div>
        <CardDescription>{characters} نویسه · {lines} خط</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && <p role="status" className="text-xs leading-6 text-muted-foreground">{notice}</p>}
        <Textarea
          id="redact-input"
          dir="auto"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="مثلاً: با ali@example.com تماس بگیرید یا به 09121234567 پیام دهید."
          spellCheck={false}
          className="min-h-72 resize-y leading-8 md:text-sm"
        />
        <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
          <ShieldCheck className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>
            متن فقط در مرورگر شما پردازش می‌شود. نگاشت جای‌نگهدارها با مقادیر واقعی در حافظهٔ همین صفحه می‌ماند،
            در مرورگر ذخیره نمی‌شود و با ترک صفحه پاک می‌شود.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
