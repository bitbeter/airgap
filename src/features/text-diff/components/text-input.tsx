import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/copy-button"

interface TextInputProps {
  id: string
  title: string
  text: string
  placeholder: string
  onChange: (text: string) => void
}

export function TextInput({ id, title, text, placeholder, onChange }: TextInputProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><label htmlFor={id}>{title}</label></CardTitle>
          <CopyButton text={text} label={title} />
        </div>
        <CardDescription>{text.length.toLocaleString("fa-IR")} نویسه · {(text ? text.split("\n").length : 0).toLocaleString("fa-IR")} خط</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea id={id} dir="auto" value={text} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-72 resize-y leading-7 md:text-sm" spellCheck={false} />
      </CardContent>
    </Card>
  )
}
