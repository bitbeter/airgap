import { Keyboard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface InputPanelProps {
  text: string
  notice: string
  onChange: (text: string) => void
  onLoadSample: () => void
}

export function InputPanel({ text, notice, onChange, onLoadSample }: InputPanelProps) {
  const characters = text.length.toLocaleString("fa-IR")
  const lines = (text ? text.split("\n").length : 0).toLocaleString("fa-IR")

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><label htmlFor="keyboard-fix-input">متن ورودی</label></CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            title="بارگذاری نمونهٔ آزمایشی متناسب با جهت فعلی"
            aria-label="بارگذاری نمونه"
          >
            <Sparkles />نمونه
          </Button>
        </div>
        <CardDescription>{characters} نویسه · {lines} خط</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && <p role="status" className="text-xs leading-6 text-muted-foreground">{notice}</p>}
        <Textarea
          id="keyboard-fix-input"
          dir="auto"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="مثلاً: sghl nkdh"
          spellCheck={false}
          className="min-h-72 resize-y leading-8 md:text-sm"
        />
        <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
          <Keyboard className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>
            متن را همان‌طور که تایپ شده بچسبانید. اعداد، فاصله‌ها، خطوط، نشانی‌های اینترنتی و ایمیل‌ها دست‌نخورده می‌مانند.
            نیم‌فاصله در تبدیل فارسی به انگلیسی به فاصله تبدیل می‌شود؛ در جهت دیگر از فاصلهٔ ساده نیم‌فاصله ساخته نمی‌شود.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
