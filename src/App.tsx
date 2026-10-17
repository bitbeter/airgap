import { useEffect, useRef, useState } from "react"
import { ArrowLeftRight, FileDiff, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DiffView } from "@/components/diff-view"
import { CopyButton } from "@/components/copy-button"
import { clearHistory, readHistory, saveHistory, type HistoryEntry } from "@/lib/history.mjs"
import type { compareTexts } from "@/lib/compare.mjs"

type Result = ReturnType<typeof compareTexts>
const pageSize = 200

export function App() {
  const [before, setBefore] = useState("")
  const [after, setAfter] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [showWhitespace, setShowWhitespace] = useState(false)
  const [historyState, setHistoryState] = useState<{ entries: HistoryEntry[]; error: string }>(() => {
    try {
      return { entries: readHistory(window.localStorage), error: "" }
    } catch {
      return { entries: [], error: "دسترسی به تاریخچهٔ مرورگر ممکن نیست." }
    }
  })
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => () => workerRef.current?.terminate(), [])

  function resetResult() {
    workerRef.current?.terminate()
    workerRef.current = null
    setBusy(false)
    setResult(null)
    setError("")
    setPage(0)
  }

  function compare(beforeText = before, afterText = after, remember = true) {
    resetResult()
    setBusy(true)
    try {
      const worker = new Worker(new URL("./diff.worker.ts", import.meta.url), { type: "module" })
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<{ result?: Result; error?: string }>) => {
        if (workerRef.current !== worker) return
        setResult(event.data.result ?? null)
        setError(event.data.error ?? "")
        setBusy(false)
        worker.terminate()
        workerRef.current = null
        if (event.data.result && remember) {
          try {
            const entries = saveHistory(window.localStorage, beforeText, afterText)
            setHistoryState({ entries, error: "" })
          } catch {
            setHistoryState((current) => ({ ...current, error: "مقایسه انجام شد، اما تاریخچه ذخیره نشد؛ فضای ذخیره‌سازی مرورگر پر یا غیرفعال است." }))
          }
        }
      }
      worker.onerror = () => {
        if (workerRef.current !== worker) return
        setError("مقایسه انجام نشد. دوباره تلاش کنید.")
        setBusy(false)
        worker.terminate()
        workerRef.current = null
      }
      worker.postMessage({ before: beforeText, after: afterText })
    } catch {
      setBusy(false)
      setError("مرورگر نتوانست ابزار مقایسه را اجرا کند. صفحه را دوباره بارگذاری کنید.")
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.rows.length / pageSize)) : 1

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold" dir="ltr">Airgap</span>
          <nav aria-label="ابزارها">
            <Button variant="secondary" asChild><a href="#/text-diff" aria-current="page"><FileDiff />مقایسهٔ متن</a></Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">مقایسهٔ متن</h1>
          <p className="text-sm leading-7 text-muted-foreground">دو متن را کنار هم، با مشخص شدن دقیق تغییرات داخل هر خط مقایسه کنید. متن‌ها فقط در مرورگر شما پردازش می‌شوند.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {([
            { id: "before", title: "متن اصلی", text: before, setter: setBefore, placeholder: "نسخهٔ قبلی متن را اینجا وارد کنید…" },
            { id: "after", title: "متن جدید", text: after, setter: setAfter, placeholder: "نسخهٔ جدید متن را اینجا وارد کنید…" },
          ]).map(({ id, title, text, setter, placeholder }) => (
            <Card key={id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle><label htmlFor={id}>{title}</label></CardTitle>
                  <CopyButton text={text} label={title} />
                </div>
                <CardDescription>{text.length.toLocaleString("fa-IR")} نویسه · {(text ? text.split("\n").length : 0).toLocaleString("fa-IR")} خط</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea id={id} dir="auto" value={text} onChange={(event) => { resetResult(); setter(event.target.value) }} placeholder={placeholder} className="min-h-72 resize-y leading-7 md:text-sm" spellCheck={false} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => compare()} disabled={busy || (!before && !after)}>{busy ? <Loader2 className="animate-spin" /> : <FileDiff />}{busy ? "در حال مقایسه…" : "نمایش تفاوت‌ها"}</Button>
          <Button variant="outline" disabled={!before && !after} onClick={() => { resetResult(); setBefore(after); setAfter(before) }}><ArrowLeftRight />جابه‌جایی متن‌ها</Button>
          <Button variant="ghost" disabled={!before && !after} onClick={() => { resetResult(); setBefore(""); setAfter("") }}><Trash2 />پاک کردن</Button>
        </div>
        <Card aria-busy={busy}>
          <CardHeader>
            <CardTitle><h2>نتیجهٔ مقایسه</h2></CardTitle>
            <CardDescription aria-live="polite">
              {busy ? "در حال بررسی تفاوت‌ها…" : result ? result.added || result.removed || result.modified ? `${result.modified.toLocaleString("fa-IR")} خط ویرایش‌شده · ${result.added.toLocaleString("fa-IR")} خط اضافه‌شده · ${result.removed.toLocaleString("fa-IR")} خط حذف‌شده` : "دو متن یکسان هستند." : "نتیجه پس از مقایسه در این بخش نمایش داده می‌شود."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
            {!result ? <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"><FileDiff className="size-8" aria-hidden="true" /><p>{busy ? "مقایسه در حال انجام است؛ می‌توانید آن را لغو کنید." : "متن‌ها را وارد کنید و «نمایش تفاوت‌ها» را بزنید."}</p>{busy && <Button variant="outline" onClick={resetResult}>لغو مقایسه</Button>}</div> : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-6 text-muted-foreground">بخش‌های پررنگ و زیرخط‌دار تغییر کرده‌اند؛ قرمز در متن اصلی و سبز در متن جدید.</p><Button variant="outline" size="sm" aria-pressed={showWhitespace} onClick={() => setShowWhitespace(!showWhitespace)}>نمایش همهٔ فاصله‌ها {showWhitespace ? "✓" : ""}</Button></div>
                <p className="text-xs leading-6 text-muted-foreground">فاصلهٔ تغییرکرده: · ، تب: ⇥ ، نیم‌فاصله: [ZWNJ]؛ LF و CRLF پایان خط و EOF انتهای متن است.</p>
                <DiffView rows={result.rows.slice(page * pageSize, (page + 1) * pageSize)} showWhitespace={showWhitespace} />
                {totalPages > 1 && <div className="flex items-center justify-between gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>قبلی</Button><span className="text-xs text-muted-foreground">صفحهٔ {(page + 1).toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span><Button variant="outline" size="sm" disabled={page + 1 === totalPages} onClick={() => setPage(page + 1)}>بعدی</Button></div>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle><h2>تاریخچهٔ مقایسه‌ها</h2></CardTitle>
              <Button variant="ghost" size="sm" disabled={!historyState.entries.length} onClick={() => {
                try {
                  clearHistory(window.localStorage)
                  setHistoryState({ entries: [], error: "" })
                } catch {
                  setHistoryState((current) => ({ ...current, error: "پاک کردن تاریخچه ممکن نشد. دوباره تلاش کنید." }))
                }
              }}><Trash2 />پاک کردن تاریخچه</Button>
            </div>
            <CardDescription>سه مقایسهٔ موفق آخر همراه متن‌ها فقط در همین مرورگر ذخیره می‌شوند.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyState.error && <p role="status" className="text-sm text-red-400">{historyState.error}</p>}
            {!historyState.entries.length && <p className="text-sm text-muted-foreground">هنوز مقایسه‌ای ذخیره نشده است.</p>}
            {historyState.entries.map((entry, index) => (
              <div key={`${entry.savedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <time dateTime={new Date(entry.savedAt).toISOString()} className="text-xs text-muted-foreground">{new Date(entry.savedAt).toLocaleString("fa-IR")}</time>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p className="min-w-0 truncate"><span className="text-muted-foreground">اصلی: </span><bdi>{entry.before.slice(0, 100) || "(خالی)"}</bdi></p>
                    <p className="min-w-0 truncate"><span className="text-muted-foreground">جدید: </span><bdi>{entry.after.slice(0, 100) || "(خالی)"}</bdi></p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setBefore(entry.before)
                  setAfter(entry.after)
                  compare(entry.before, entry.after, false)
                }}>باز کردن</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
