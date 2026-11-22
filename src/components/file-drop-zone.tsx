import { useState, type DragEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FileDropZoneProps {
  onFiles: (files: File[], target: Element) => void | Promise<void>
  children: ReactNode
  className?: string
  disabled?: boolean
}

function hasFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("Files")
}

/** Wraps content so local files can be dropped onto it. */
export function FileDropZone({ onFiles, children, className, disabled = false }: FileDropZoneProps) {
  const [active, setActive] = useState(false)

  return (
    <div
      className={cn("relative rounded-xl transition-shadow", active && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background", className)}
      onDragEnter={(event) => {
        if (disabled || !hasFiles(event)) return
        event.preventDefault()
        setActive(true)
      }}
      onDragOver={(event) => {
        if (disabled || !hasFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={(event) => {
        if (disabled) return
        const next = event.relatedTarget
        if (next instanceof Node && event.currentTarget.contains(next)) return
        setActive(false)
      }}
      onDrop={(event) => {
        if (disabled) return
        event.preventDefault()
        setActive(false)
        const files = Array.from(event.dataTransfer.files)
        if (!files.length) return
        const target = event.target instanceof Element ? event.target : event.currentTarget
        void onFiles(files, target)
      }}
    >
      {children}
      {active && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/80 text-sm font-medium">
          فایل را رها کنید
        </div>
      )}
    </div>
  )
}
