import { Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface InputPanelProps {
  text: string
  notice: string
  onChange: (text: string) => void
  onClear: () => void
  onLoadSample: () => void
}

export function InputPanel({ text, notice, onChange, onClear, onLoadSample }: InputPanelProps) {
  const characters = text.length.toLocaleString("fa-IR")
  const lines = (text ? text.split("\n").length : 0).toLocaleString("fa-IR")

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><label htmlFor="persian-text-input">متن ورودی</label></CardTitle>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLoadSample}
              title="بارگذاری نمونهٔ کامل برای دیدن همهٔ قاعده‌ها"
              aria-label="بارگذاری نمونهٔ کامل"
            >
              <Sparkles />نمونه
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!text} onClick={onClear}>
              <Trash2 />پاک کردن
            </Button>
          </div>
        </div>
        <CardDescription>{characters} نویسه · {lines} خط</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && <p role="status" className="text-xs leading-6 text-muted-foreground">{notice}</p>}
        <Textarea
          id="persian-text-input"
          dir="auto"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          placeholder="متن فارسی را اینجا بچسبانید یا بنویسید…"
          spellCheck={false}
          className="min-h-72 resize-y leading-7 md:text-sm"
        />
      </CardContent>
    </Card>
  )
}
