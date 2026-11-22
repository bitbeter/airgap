import { useRef, useState, type ChangeEvent } from "react"
import { FolderOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ACCEPTED_FILE_TYPES } from "@/lib/text-file.mjs"

interface FileOpenButtonProps {
  onFiles: (files: File[]) => void | Promise<void>
  label?: string
  disabled?: boolean
  multiple?: boolean
}

/** Opens the native file picker and hands the chosen local files to the caller. */
export function FileOpenButton({ onFiles, label = "باز کردن فایل", disabled = false, multiple = false }: FileOpenButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    // Reset so choosing the same file again fires change.
    event.target.value = ""
    if (!files.length) return
    setBusy(true)
    try {
      await onFiles(files)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={choose}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled || busy}>
        {busy ? <Loader2 className="animate-spin" /> : <FolderOpen />}
        {label}
      </Button>
    </>
  )
}
