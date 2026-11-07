import { useRef } from "react"
import { ChevronsUpDown } from "lucide-react"
import { DiffMinimap } from "./diff-minimap"
import { cn } from "@/lib/utils"
import type { compareTexts } from "../lib/compare.mjs"
import type { ChangeRange, DisplayItem } from "../lib/hunks.mjs"

type Row = ReturnType<typeof compareTexts>["rows"][number]

const invisibleCharacters: Record<string, string> = {
  " ": "·", "\t": "⇥", "\r": "␍", "\u00a0": "⍽", "\u200b": "[ZWSP]",
  "\u200c": "[ZWNJ]", "\u200d": "[ZWJ]", "\u200e": "[LRM]", "\u200f": "[RLM]",
  "\u202a": "[LRE]", "\u202b": "[RLE]", "\u202c": "[PDF]", "\u202d": "[LRO]", "\u202e": "[RLO]",
  "\u2066": "[LRI]", "\u2067": "[RLI]", "\u2068": "[FSI]", "\u2069": "[PDI]", "\ufeff": "[BOM]",
}

function visibleText(text: string) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
  return Array.from(segmenter.segment(text), ({ segment }) => /\p{Extended_Pictographic}/u.test(segment)
    ? segment
    : Array.from(segment, (character) => invisibleCharacters[character] ?? character).join("")
  ).join("")
}

function DiffCell({ line, other, side, showWhitespace }: { line: Row["before"]; other: Row["after"]; side: "before" | "after"; showWhitespace: boolean }) {
  if (!line) return <div className="border-e bg-muted/50 px-4 py-1 text-center text-muted-foreground" aria-label="خط متناظر وجود ندارد">—</div>
  const changed = !other || line.text !== other.text || line.ending !== other.ending
  const endingChanged = !other || line.ending !== other.ending
  return (
    <div className={cn("grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] border-e", changed && (side === "before" ? "bg-red-950/40" : "bg-green-950/40"))}>
      <span className="select-none border-e px-2 py-1 text-center font-mono text-xs text-muted-foreground" aria-label="شمارهٔ خط">{line.number}</span>
      <pre dir="auto" className="min-w-0 whitespace-pre-wrap break-words px-3 py-1 font-mono [tab-size:4] [unicode-bidi:plaintext]">
        {line.segments.map((segment, index) => segment.changed ? (
          <mark key={index} className={cn("rounded-sm py-0.5 underline decoration-2", side === "before" ? "bg-red-900 text-red-100 decoration-red-400" : "bg-green-900 text-green-100 decoration-green-400")} title={side === "before" ? "حذف یا جایگزین شده" : "اضافه یا جایگزین شده"}>{visibleText(segment.text)}</mark>
        ) : <span key={index}>{showWhitespace ? visibleText(segment.text) : segment.text}</span>)}
        {!line.text && !endingChanged && "\u00a0"}
        {(endingChanged || showWhitespace) && <span dir="ltr" className={cn("ms-1 inline-block select-none rounded border px-1 font-sans text-[10px] leading-4", endingChanged ? side === "before" ? "border-red-700 bg-red-900 text-red-100" : "border-green-700 bg-green-900 text-green-100" : "text-muted-foreground")} title="پایان خط">{line.ending === "\r\n" ? "CRLF ↵" : line.ending === "\n" ? "LF ↵" : "EOF ∅"}</span>}
      </pre>
    </div>
  )
}

function CollapsedRow({ item, rows, onExpand }: { item: Extract<DisplayItem, { kind: "collapsed" }>; rows: Row[]; onExpand: (from: number) => void }) {
  const first = rows[item.from].before?.number ?? 0
  const last = rows[item.to - 1].before?.number ?? 0
  const count = item.count.toLocaleString("fa-IR")
  return (
    <button type="button" onClick={() => onExpand(item.from)}
      aria-label={`نمایش ${count} خط بدون تغییر، خط ${first.toLocaleString("fa-IR")} تا ${last.toLocaleString("fa-IR")} متن اصلی`}
      className="flex w-full items-center justify-center gap-2 border-y bg-muted/30 px-4 py-1 text-xs leading-6 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <ChevronsUpDown className="size-3.5" aria-hidden="true" />
      {count} خط بدون تغییر · نمایش
    </button>
  )
}

type DiffViewProps = {
  rows: Row[]
  items: DisplayItem[]
  activeChange: ChangeRange | null
  showWhitespace: boolean
  onExpand: (from: number) => void
}

export function DiffView({ rows, items, activeChange, showWhitespace, onExpand }: DiffViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex items-stretch gap-2">
    <div ref={scrollRef} className="min-w-0 flex-1 max-h-[36rem] overflow-auto rounded-md border" role="region" aria-label="مقایسهٔ کنارهم متن اصلی و جدید" tabIndex={0}>
      <div ref={contentRef} className="min-w-[640px]">
        <div className="sticky top-0 z-10 grid grid-cols-2 border-b bg-background text-sm font-medium"><div className="border-e px-4 py-3">متن اصلی <span className="text-red-400">(−)</span></div><div className="px-4 py-3">متن جدید <span className="text-green-400">(+)</span></div></div>
        {items.map((item) => {
          if (item.kind === "collapsed") return <CollapsedRow key={`collapsed-${item.from}`} item={item} rows={rows} onExpand={onExpand} />
          const row = rows[item.index]
          const active = !!activeChange && item.index >= activeChange.start && item.index < activeChange.end
          return (
            <div key={item.index} data-diff-row={row.kind} data-diff-index={item.index}
              className={cn("grid grid-cols-2 text-sm leading-7", active && "relative before:absolute before:inset-y-0 before:start-0 before:z-[1] before:w-1 before:bg-ring before:content-['']")}>
              <DiffCell line={row.before} other={row.after} side="before" showWhitespace={showWhitespace} />
              <DiffCell line={row.after} other={row.before} side="after" showWhitespace={showWhitespace} />
            </div>
          )
        })}
      </div>
    </div>
    <DiffMinimap rows={rows} scrollRef={scrollRef} contentRef={contentRef} showWhitespace={showWhitespace} />
    </div>
  )
}
