import { lazy, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/copy-button"
import { FileOpenButton } from "@/components/file-open-button"

const MarkdownPreview = lazy(() => import("./markdown-preview"))

interface TextInputProps {
  preview: boolean
  id: string
  title: string
  text: string
  placeholder: string
  onChange: (text: string) => void
  onOpenFile: (file: File) => void | Promise<void>
}

export function TextInput({ id, title, text, placeholder, onChange, onOpenFile, preview }: TextInputProps) {
  return (
    <Card className="min-w-0" data-diff-input={id}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{preview ? title : <label htmlFor={id}>{title}</label>}</CardTitle>
          <div className="flex items-start gap-2">
            <FileOpenButton onFiles={(files) => (files[0] ? onOpenFile(files[0]) : undefined)} />
            <CopyButton text={text} label={title} />
          </div>
        </div>
        <CardDescription>{text.length.toLocaleString("fa-IR")} نویسه · {(text ? text.split("\n").length : 0).toLocaleString("fa-IR")} خط</CardDescription>
      </CardHeader>
      <CardContent>
        {preview ? (
          <Suspense fallback={<p role="status" className="min-h-72 text-sm text-muted-foreground">در حال آماده‌سازی پیش‌نمایش…</p>}>
            <MarkdownPreview text={text} title={title} />
          </Suspense>
        ) : <Textarea id={id} dir="auto" value={text} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-72 resize-y leading-7 md:text-sm" spellCheck={false} />}
      </CardContent>
    </Card>
  )
}
