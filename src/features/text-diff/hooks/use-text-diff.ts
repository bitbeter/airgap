import { useEffect, useRef, useState } from "react"
import { clearHistory, readHistory, saveHistory, type HistoryEntry } from "../lib/history.mjs"
import type { DiffResult } from "../lib/compare.mjs"

export function useTextDiff() {
  const [before, setBefore] = useState("")
  const [after, setAfter] = useState("")
  const [result, setResult] = useState<DiffResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [historyState, setHistoryState] = useState<{ entries: HistoryEntry[]; error: string }>(() => {
    try {
      return { entries: readHistory(window.localStorage), error: "" }
    } catch {
      return { entries: [], error: "دسترسی به تاریخچهٔ مرورگر ممکن نیست." }
    }
  })
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

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
      const worker = new Worker(new URL("../diff.worker.ts", import.meta.url), { type: "module" })
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<{ result?: DiffResult; error?: string }>) => {
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
      workerRef.current?.terminate()
      workerRef.current = null
      setBusy(false)
      setError("مرورگر نتوانست ابزار مقایسه را اجرا کند. صفحه را دوباره بارگذاری کنید.")
    }
  }

  function updateBefore(text: string) {
    resetResult()
    setBefore(text)
  }

  function updateAfter(text: string) {
    resetResult()
    setAfter(text)
  }

  function swapTexts() {
    resetResult()
    setBefore(after)
    setAfter(before)
  }

  function clearTexts() {
    resetResult()
    setBefore("")
    setAfter("")
  }

  function openHistory(entry: HistoryEntry) {
    setBefore(entry.before)
    setAfter(entry.after)
    compare(entry.before, entry.after, false)
  }

  function removeHistory() {
    try {
      clearHistory(window.localStorage)
      setHistoryState({ entries: [], error: "" })
    } catch {
      setHistoryState((current) => ({ ...current, error: "پاک کردن تاریخچه ممکن نشد. دوباره تلاش کنید." }))
    }
  }

  return {
    before, after, result, busy, error, page, setPage, historyState,
    updateBefore, updateAfter, swapTexts, clearTexts, openHistory, removeHistory,
    compare: () => compare(), cancel: resetResult,
  }
}
