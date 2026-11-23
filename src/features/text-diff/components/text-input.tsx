import { lazy, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/copy-button"
import { FileOpenButton } from "@/components/file-open-button"
import { FullscreenButton, useFullscreen } from "@/components/fullscreen"
import { cn } from "@/lib/utils"

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
  const fullscreen = useFullscreen<HTMLDivElement>()

  return (
    <Card ref={fullscreen.ref} className={cn("min-w-0", fullscreen.panelClassName)} data-diff-input={id}>
      <CardHeader className={fullscreen.active ? "shrink-0" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{preview ? title : <label htmlFor={id}>{title}</label>}</CardTitle>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <FileOpenButton onFiles={(files) => (files[0] ? onOpenFile(files[0]) : undefined)} />
            <CopyButton text={text} label={title} />
            <FullscreenButton active={fullscreen.active} onToggle={fullscreen.toggle} label={title} />
          </div>
        </div>
        <CardDescription>{text.length.toLocaleString("fa-IR")} نویسه · {(text ? text.split("\n").length : 0).toLocaleString("fa-IR")} خط</CardDescription>
      </CardHeader>
      <CardContent className={cn(fullscreen.active && "flex min-h-0 flex-1 flex-col")}>
        {preview ? (
          <Suspense fallback={<p role="status" className="min-h-72 text-sm text-muted-foreground">در حال آماده‌سازی پیش‌نمایش…</p>}>
            <MarkdownPreview text={text} title={title} className={fullscreen.active ? "min-h-0 flex-1 overflow-auto" : undefined} />
          </Suspense>
        ) : <Textarea id={id} dir="auto" value={text} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={cn("min-h-72 resize-y leading-7 md:text-sm", fullscreen.active && "min-h-0 flex-1 resize-none")} spellCheck={false} />}
      </CardContent>
    </Card>
  )
}
