import { useEffect, useRef, useState } from "react"
import InlineJsonWorker from "../json.worker?worker&inline"
import {
  defaultSettings,
  formatJson,
  normalizeSettings,
  readSettings,
  saveSettings,
  type JsonFormatResult,
  type JsonFormatSettings,
} from "../lib/format.mjs"
import { locateError, type LocatedJsonError } from "../lib/locate-error.mjs"

export const largeTextThreshold = 1_000_000
const debounceMs = 300

export type JsonFormatError = LocatedJsonError

function workerFailure(message: string): JsonFormatError {
  return { code: "worker", position: 0, line: 0, column: 0, lineText: "", message }
}

export function useJsonFormat() {
  const [input, setInput] = useState("")
  const [settingsState, setSettingsState] = useState<{ settings: JsonFormatSettings; error: string }>(() => {
    try {
      return { settings: readSettings(window.localStorage), error: "" }
    } catch {
      return {
        settings: { ...defaultSettings },
        error: "دسترسی به تنظیمات ذخیره‌شده ممکن نیست؛ تنظیمات پیش‌فرض استفاده می‌شوند.",
      }
    }
  })
  const [result, setResult] = useState<JsonFormatResult | null>(null)
  const [error, setError] = useState<JsonFormatError | null>(null)
  const [busy, setBusy] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [revision, setRevision] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    const request = ++requestRef.current
    workerRef.current?.terminate()
    workerRef.current = null
    setError(null)
    setCancelled(false)
    if (input.trim() === "") {
      setResult(null)
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
    // The worker is recreated whenever the input or a formatting setting changes.
  }, [input, settingsState.settings, revision])

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  function runSync(text: string, settings: JsonFormatSettings, request: number) {
    try {
      const next = formatJson(text, settings)
      if (request !== requestRef.current) return
      setResult(next)
      setError(null)
      setBusy(false)
    } catch (caught) {
      if (request !== requestRef.current) return
      setResult(null)
      setError(
        locateError(
          text,
          caught as { code?: string; position?: number; detail?: Record<string, unknown> },
        ),
      )
      setBusy(false)
    }
  }

  function runWorker(text: string, settings: JsonFormatSettings, request: number) {
    try {
      const worker = import.meta.env.DEV || import.meta.env.MODE === "web"
        ? new Worker(new URL("../json.worker.ts", import.meta.url), { type: "module" })
        : new InlineJsonWorker()
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<{ result?: JsonFormatResult; error?: JsonFormatError }>) => {
        if (workerRef.current !== worker || request !== requestRef.current) return
        if (event.data.error) {
          setError(event.data.error)
          setResult(null)
        } else if (event.data.result) {
          setResult(event.data.result)
          setError(null)
        }
        setBusy(false)
        worker.terminate()
        workerRef.current = null
      }
      worker.onerror = () => {
        if (workerRef.current !== worker || request !== requestRef.current) return
        setError(workerFailure("پردازش پس‌زمینه انجام نشد. دوباره تلاش کنید."))
        setResult(null)
        setBusy(false)
        worker.terminate()
        workerRef.current = null
      }
      worker.postMessage({ text, settings })
    } catch {
      workerRef.current?.terminate()
      workerRef.current = null
      setError(workerFailure("مرورگر نتوانست پردازش پس‌زمینه را اجرا کند. صفحه را دوباره بارگذاری کنید."))
      setResult(null)
      setBusy(false)
    }
  }

  function updateInput(text: string) {
    setInput(text)
    setResult(null)
    setError(null)
  }

  function updateSettings(next: Partial<JsonFormatSettings>) {
    const normalized = normalizeSettings({ ...settingsState.settings, ...next })
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

  function clear() {
    setInput("")
    setResult(null)
    setError(null)
    setCancelled(false)
  }

  function cancel() {
    requestRef.current += 1
    workerRef.current?.terminate()
    workerRef.current = null
    setBusy(false)
    setResult(null)
    setError(null)
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
    error,
    busy,
    cancelled,
    large: input.length > largeTextThreshold,
    updateInput,
    updateSettings,
    resetSettings,
    clear,
    cancel,
    retry,
  }
}
