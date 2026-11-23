import { useState } from "react"
import { ChevronDown, ListTree } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OutlineHeading } from "../lib/outline.mjs"

interface OutlineProps {
  headings: OutlineHeading[]
  onSelect: (line: number) => void
}

const indentation = ["0.5rem", "1.5rem", "2.5rem"]

export function Outline({ headings, onSelect }: OutlineProps) {
  const [open, setOpen] = useState(true)
  const count = headings.length.toLocaleString("fa-IR")

  return (
    <section className="rounded-xl border bg-card text-card-foreground shadow" aria-labelledby="markdown-outline-title">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 id="markdown-outline-title" className="flex items-center gap-2 text-sm font-semibold">
          <ListTree className="size-4" aria-hidden="true" />
          فهرست مطالب
          <span className="text-xs font-normal text-muted-foreground">({count} تیتر)</span>
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls={open ? "markdown-outline-list" : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden="true" />
          {open ? "بستن" : "نمایش"}
        </Button>
      </div>
      {open && (
        <div id="markdown-outline-list" className="border-t p-2">
          {headings.length === 0 ? (
            <p className="p-2 text-sm leading-7 text-muted-foreground">
              تیتری برای نمایش وجود ندارد؛ با <span dir="ltr">#</span> تیتر بسازید.
            </p>
          ) : (
            <nav aria-label="فهرست تیترها">
              <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                {headings.map((heading, index) => (
                  <li key={`${heading.line}-${index}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(heading.line)}
                      title={`سطح ${heading.level.toLocaleString("fa-IR")} · خط ${heading.line.toLocaleString("fa-IR")}`}
                      style={{ paddingInlineStart: indentation[heading.level - 1] ?? indentation[0] }}
                      className="block w-full rounded px-2 py-1 text-start text-sm leading-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span dir="auto" className="block">{heading.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      )}
    </section>
  )
}
