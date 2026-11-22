import { useEffect, useRef, useState } from "react"
import InlineDiffWorker from "../diff.worker?worker&inline"
import { clearHistory, readHistory, saveHistory, type HistoryEntry } from "../lib/history.mjs"
import { defaultOptions, normalizeOptions, readOptions, saveOptions } from "../lib/options.mjs"
import type { DiffOptions, DiffResult } from "../lib/compare.mjs"
import type { StructuredPatch } from "../lib/patch.mjs"

export function useTextDiff() {
  const [before, setBefore] = useState("")
  const [after, setAfter] = useState("")
  const [result, setResult] = useState<DiffResult | null>(null)
  const [patch, setPatch] = useState<StructuredPatch | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [optionsState, setOptionsState] = useState<{ options: DiffOptions; error: string }>(() => {
    try {
      return { options: readOptions(window.localStorage), error: "" }
    } catch {
      return { options: { ...defaultOptions }, error: "دسترسی به گزینه‌های ذخیره‌شده ممکن نیست؛ گزینه‌های پیش‌فرض استفاده می‌شوند." }
    }
  })
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
    setPatch(null)
    setError("")
  }

  function compare(beforeText = before, afterText = after, remember = true) {
    resetResult()
    setBusy(true)
    try {
      const worker = import.meta.env.DEV || import.meta.env.MODE === "web"
        ? new Worker(new URL("../diff.worker.ts", import.meta.url), { type: "module" })
        : new InlineDiffWorker()
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<{ result?: DiffResult; patch?: StructuredPatch | null; error?: string }>) => {
        if (workerRef.current !== worker) return
        setResult(event.data.result ?? null)
        setPatch(event.data.patch ?? null)
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
      worker.postMessage({ before: beforeText, after: afterText, options: optionsState.options })
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

  function replaceTexts(nextBefore: string, nextAfter: string) {
    resetResult()
    setBefore(nextBefore)
    setAfter(nextAfter)
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

  function updateOptions(next: DiffOptions) {
    // Changing matching rules invalidates the current result and stops its worker.
    resetResult()
    const normalized = normalizeOptions(next)
    let error = ""
    try {
      saveOptions(window.localStorage, normalized)
    } catch {
      error = "گزینه‌ها اعمال شدند، اما در مرورگر ذخیره نشدند؛ فضای ذخیره‌سازی پر یا غیرفعال است."
    }
    setOptionsState({ options: normalized, error })
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
    before, after, result, patch, busy, error, historyState,
    options: optionsState.options, optionsError: optionsState.error,
    updateBefore, updateAfter, swapTexts, clearTexts, openHistory, removeHistory, replaceTexts,
    updateOptions,
    compare: () => compare(), cancel: resetResult,
  }
}
