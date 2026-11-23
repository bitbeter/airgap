import { useEffect, useRef, useState } from "react"
import InlineNormalizeWorker from "../normalize.worker?worker&inline"
import { buildInlineChanges, type ChangeSegment } from "../lib/changes.mjs"
import {
  defaultSettings,
  normalize,
  normalizeSettings,
  readSettings,
  ruleDefinitions,
  saveSettings,
  type NormalizeResult,
  type PersianTextSettings,
} from "../lib/rules.mjs"

export const largeTextThreshold = 200_000
const debounceMs = 250

function zeroCounts() {
  return Object.fromEntries(ruleDefinitions.map((definition) => [definition.id, 0])) as NormalizeResult["counts"]
}

export function usePersianText() {
  const [input, setInput] = useState("")
  const [settingsState, setSettingsState] = useState<{ settings: PersianTextSettings; error: string }>(() => {
    try {
      return { settings: readSettings(window.localStorage), error: "" }
    } catch {
      return {
        settings: { ...defaultSettings },
        error: "دسترسی به تنظیمات ذخیره‌شده ممکن نیست؛ تنظیمات پیش‌فرض استفاده می‌شوند.",
      }
    }
  })
  const [result, setResult] = useState<NormalizeResult | null>(null)
  const [segments, setSegments] = useState<ChangeSegment[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [cancelled, setCancelled] = useState(false)
  const [revision, setRevision] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    const request = ++requestRef.current
    workerRef.current?.terminate()
    workerRef.current = null
    setError("")
    setCancelled(false)
    if (input === "") {
      setResult({ text: "", counts: zeroCounts(), total: 0 })
      setSegments([])
      setBusy(false)
      return
    }
    setBusy(true)
    const timer = window.setTimeout(() => {
      if (request !== requestRef.current) return
      if (input.length > largeTextThreshold) runWorker(input, settingsState.settings, request)
      else runSync(input, settingsState.settings, request)
    }, debounceMs)
    return () => {
      window.clearTimeout(timer)
      workerRef.current?.terminate()
      workerRef.current = null
    }
    // The worker is recreated whenever the input or the rule settings change.
  }, [input, settingsState.settings, revision])

  function runSync(text: string, settings: PersianTextSettings, request: number) {
    try {
      const next = normalize(text, settings)
      const nextSegments = buildInlineChanges(text, next.text)
      if (request !== requestRef.current) return
      setResult(next)
      setSegments(nextSegments)
      setBusy(false)
    } catch {
      if (request !== requestRef.current) return
      setError("پردازش متن انجام نشد. دوباره تلاش کنید.")
      setBusy(false)
    }
  }

  function runWorker(text: string, settings: PersianTextSettings, request: number) {
    try {
      const worker = import.meta.env.DEV || import.meta.env.MODE === "web"
        ? new Worker(new URL("../normalize.worker.ts", import.meta.url), { type: "module" })
        : new InlineNormalizeWorker()
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<{ result?: NormalizeResult; segments?: ChangeSegment[] | null; error?: string }>) => {
        if (workerRef.current !== worker || request !== requestRef.current) return
        if (event.data.error) {
          setError("پردازش متن انجام نشد. دوباره تلاش کنید.")
          setResult(null)
          setSegments(null)
        } else if (event.data.result) {
          setResult(event.data.result)
          setSegments(event.data.segments ?? null)
        }
        setBusy(false)
        worker.terminate()
        workerRef.current = null
      }
      worker.onerror = () => {
        if (workerRef.current !== worker || request !== requestRef.current) return
        setError("پردازش متن انجام نشد. دوباره تلاش کنید.")
        setBusy(false)
        worker.terminate()
        workerRef.current = null
      }
      worker.postMessage({ text, settings })
    } catch {
      workerRef.current?.terminate()
      workerRef.current = null
      setError("مرورگر نتوانست پردازش پس‌زمینه را اجرا کند. صفحه را دوباره بارگذاری کنید.")
      setBusy(false)
    }
  }

  function updateInput(text: string) {
    setInput(text)
  }

  function updateSettings(next: PersianTextSettings) {
    const normalized = normalizeSettings(next)
    let storageError = ""
    try {
      saveSettings(window.localStorage, normalized)
    } catch {
      storageError = "تنظیمات اعمال شدند، اما در مرورگر ذخیره نشدند؛ فضای ذخیره‌سازی پر یا غیرفعال است."
    }
    setSettingsState({ settings: normalized, error: storageError })
  }

  function resetSettings() {
    updateSettings({ ...defaultSettings })
  }

  function applyToInput() {
    if (result) setInput(result.text)
  }

  function clear() {
    setInput("")
  }

  function cancel() {
    requestRef.current += 1
    workerRef.current?.terminate()
    workerRef.current = null
    setBusy(false)
    setResult(null)
    setSegments(null)
    setError("")
    setCancelled(true)
  }

  function retry() {
    setCancelled(false)
    setRevision((value) => value + 1)
  }

  return {
    input,
    settings: settingsState.settings,
    settingsError: settingsState.error,
    result,
    segments,
    busy,
    error,
    cancelled,
    large: input.length > largeTextThreshold,
    updateInput,
    updateSettings,
    resetSettings,
    applyToInput,
    clear,
    cancel,
    retry,
  }
}
