import { useEffect, useState } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null)
  const currentFeedback = feedback?.text === text ? feedback : null

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  async function copy() {
    setPending(true)
    setFeedback(null)
    try {
      await navigator.clipboard.writeText(text)
      setFeedback({ text, success: true })
    } catch {
      setFeedback({ text, success: false })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" onClick={copy} disabled={!text || pending} aria-label={`کپی ${label}`}>
        {pending ? <Loader2 className="animate-spin" /> : currentFeedback?.success ? <Check /> : <Copy />}
        {currentFeedback?.success ? "کپی شد" : "کپی"}
      </Button>
      <span role="status" className={currentFeedback?.success === false ? "max-w-48 text-xs leading-5 text-red-400" : "sr-only"}>
        {currentFeedback ? currentFeedback.success ? `${label} کپی شد.` : "کپی انجام نشد؛ متن را انتخاب و دستی کپی کنید." : ""}
      </span>
    </div>
  )
}
