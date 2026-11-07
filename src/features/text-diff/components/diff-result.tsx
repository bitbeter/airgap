import { useMemo, useRef, useState, type KeyboardEvent } from "react"
import { ChevronDown, ChevronUp, FileDiff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiffView } from "./diff-view"
import { PatchExport } from "./patch-export"
import type { DiffResult as ComparisonResult } from "../lib/compare.mjs"
import { collapseRows, groupChanges, type DisplayItem } from "../lib/hunks.mjs"
import { defaultNewName, defaultOldName, type StructuredPatch } from "../lib/patch.mjs"

const contextLines = 3
const noExpanded: number[] = []

interface DiffResultProps {
  result: ComparisonResult | null
  patch: StructuredPatch | null
  busy: boolean
  error: string
  onCancel: () => void
}

export function DiffResult({ result, patch, busy, error, onCancel }: DiffResultProps) {
  const [showWhitespace, setShowWhitespace] = useState(false)
  const [collapse, setCollapse] = useState(false)
  const [patchNames, setPatchNames] = useState({ old: defaultOldName, new: defaultNewName })
  // Position and expanded ranges belong to one result; a new result starts fresh.
  const [navigation, setNavigation] = useState<{ result: ComparisonResult | null; current: number | null; expanded: number[] }>({ result: null, current: null, expanded: noExpanded })
  const { current, expanded } = navigation.result === result ? navigation : { current: null, expanded: noExpanded }
  const regionRef = useRef<HTMLDivElement>(null)

  const changes = useMemo(() => result ? groupChanges(result.rows) : [], [result])
  const items = useMemo<DisplayItem[]>(() => !result ? [] : collapse
    ? collapseRows(result.rows, contextLines, expanded)
    : result.rows.map((_, index) => ({ kind: "row", index })), [result, collapse, expanded])

  function goTo(index: number) {
    if (index < 0 || index >= changes.length) return
    setNavigation({ result, current: index, expanded })
    const row = regionRef.current?.querySelector(`[data-diff-index="${changes[index].start}"]`)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    row?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" })
  }

  const previous = current === null ? -1 : current - 1
  const next = current === null ? 0 : current + 1

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    // Physical key codes work with both Persian and English keyboard layouts.
    if (event.code === "KeyN" || event.code === "KeyJ") goTo(next)
    else if (event.code === "KeyP" || event.code === "KeyK") goTo(previous)
    else return
    event.preventDefault()
  }

  return (
    <Card aria-busy={busy}>
      <CardHeader>
        <CardTitle><h2>نتیجهٔ مقایسه</h2></CardTitle>
        <CardDescription aria-live="polite">
          {busy ? "در حال بررسی تفاوت‌ها…" : result ? result.added || result.removed || result.modified ? `${result.modified.toLocaleString("fa-IR")} خط ویرایش‌شده · ${result.added.toLocaleString("fa-IR")} خط اضافه‌شده · ${result.removed.toLocaleString("fa-IR")} خط حذف‌شده` : "دو متن یکسان هستند." : "نتیجه پس از مقایسه در این بخش نمایش داده می‌شود."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
        {!result ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <FileDiff className="size-8" aria-hidden="true" />
            <p>{busy ? "مقایسه در حال انجام است؛ می‌توانید آن را لغو کنید." : "متن‌ها را وارد کنید و «نمایش تفاوت‌ها» را بزنید."}</p>
            {busy && <Button variant="outline" onClick={onCancel}>لغو مقایسه</Button>}
          </div>
        ) : (
          <div className="space-y-4">
          <div ref={regionRef} className="space-y-4" onKeyDown={onKeyDown}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="پیمایش تغییرات">
                <Button variant="outline" size="sm" disabled={previous < 0} onClick={() => goTo(previous)} title="تغییر قبلی (P یا K)"><ChevronUp />تغییر قبلی</Button>
                <Button variant="outline" size="sm" disabled={next >= changes.length} onClick={() => goTo(next)} title="تغییر بعدی (N یا J)"><ChevronDown />تغییر بعدی</Button>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {!changes.length ? "تغییری وجود ندارد" : current === null ? `${changes.length.toLocaleString("fa-IR")} تغییر` : `تغییر ${(current + 1).toLocaleString("fa-IR")} از ${changes.length.toLocaleString("fa-IR")}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" aria-pressed={collapse} onClick={() => setCollapse(!collapse)}>فقط تغییرات و {contextLines.toLocaleString("fa-IR")} خط اطراف {collapse ? "✓" : ""}</Button>
                <Button variant="outline" size="sm" aria-pressed={showWhitespace} onClick={() => setShowWhitespace(!showWhitespace)}>نمایش همهٔ فاصله‌ها {showWhitespace ? "✓" : ""}</Button>
              </div>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">بخش‌های پررنگ و زیرخط‌دار تغییر کرده‌اند؛ قرمز در متن اصلی و سبز در متن جدید. برای رفتن به تغییر بعدی و قبلی کلید N و P را بزنید.</p>
            <p className="text-xs leading-6 text-muted-foreground">فاصلهٔ تغییرکرده: · ، تب: ⇥ ، نیم‌فاصله: [ZWNJ]؛ LF و CRLF پایان خط و EOF انتهای متن است.</p>
            <DiffView rows={result.rows} items={items} activeChange={current === null ? null : changes[current]} showWhitespace={showWhitespace}
              onExpand={(from) => setNavigation({ result, current, expanded: [...expanded, from] })} />
          </div>
          <PatchExport patch={patch} names={patchNames} onNamesChange={setPatchNames} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
