import { useEffect, useMemo, useRef, useState } from "react"
import InlineRedactWorker from "../redact.worker?worker&inline"
import {
  clearTerms,
  defaultSettings,
  normalizeSettings,
  normalizeTerms,
  readSettings,
  readTerms,
  redact,
  restore,
  saveSettings,
  saveTerms,
  type DetectorId,
  type RedactResult,
  type RedactSettings,
} from "../lib/redact.mjs"

export type RedactMode = "redact" | "restore"

export const largeTextThreshold = 200_000
const debounceMs = 250

export function useRedact() {
  const [mode, setMode] = useState<RedactMode>("redact")
  const [input, setInput] = useState("")
  const [restoreInput, setRestoreInput] = useState("")
  const [settingsState, setSettingsState] = useState<{ settings: RedactSettings; error: string }>(() => {
    try {
      return { settings: readSettings(window.localStorage), error: "" }
    } catch {
      return {
        settings: { ...defaultSettings },
        error: "دسترسی به تنظیمات ذخیره‌شده ممکن نیست؛ تنظیمات پیش‌فرض استفاده می‌شوند.",
      }
    }
  })
  const [termsState, setTermsState] = useState<{ termsText: string; remembered: boolean; error: string }>(() => {
    try {
      const stored = readTerms(window.localStorage)
      return { termsText: stored.terms.join("\n"), remembered: stored.remembered, error: "" }
    } catch {
      return { termsText: "", remembered: false, error: "دسترسی به واژه‌های ذخیره‌شده ممکن نیست." }
    }
  })
  const [result, setResult] = useState<RedactResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [cancelled, setCancelled] = useState(false)
  const [excluded, setExcluded] = useState<string[]>([])
  const [revision, setRevision] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const requestRef = useRef(0)

  const terms = useMemo(() => normalizeTerms(termsState.termsText), [termsState.termsText])

  useEffect(() => {
    const request = ++requestRef.current
    workerRef.current?.terminate()
    workerRef.current = null
    setError("")
    setCancelled(false)
    if (input === "") {
      setResult({ text: "", findings: [], mapping: {} })
      setBusy(false)
      return
    }
    setBusy(true)
    const timer = window.setTimeout(() => {
      if (request !== requestRef.current) return
      if (input.length > largeTextThreshold) runWorker(input, settingsState.settings, terms, excluded, request)
      else runSync(input, settingsState.settings, terms, excluded, request)
    }, debounceMs)
    return () => {
      window.clearTimeout(timer)
      workerRef.current?.terminate()
      workerRef.current = null
    }
    // The worker is recreated whenever the input, settings, terms, or exclusions change.
  }, [input, settingsState.settings, terms, excluded, revision])

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  function runSync(text: string, settings: RedactSettings, termList: string[], excludedList: string[], request: number) {
    try {
      const next = redact(text, { settings, terms: termList, excluded: excludedList })
      if (request !== requestRef.current) return
      setResult(next)
      setBusy(false)
    } catch {
      if (request !== requestRef.current) return
      setError("پردازش متن انجام نشد. دوباره تلاش کنید.")
      setResult(null)
      setBusy(false)
    }
  }

  function runWorker(text: string, settings: RedactSettings, termList: string[], excludedList: string[], request: number) {
    try {
      const worker = import.meta.env.DEV || import.meta.env.MODE === "web"
        ? new Worker(new URL("../redact.worker.ts", import.meta.url), { type: "module" })
        : new InlineRedactWorker()
      workerRef.current = worker
      worker.onmessage = (event: MessageEvent<{ result?: RedactResult; error?: string }>) => {
        if (workerRef.current !== worker || request !== requestRef.current) return
        if (event.data.error) {
          setError("پردازش متن انجام نشد. دوباره تلاش کنید.")
          setResult(null)
        } else if (event.data.result) {
          setResult(event.data.result)
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
      worker.postMessage({ text, options: { settings, terms: termList, excluded: excludedList } })
    } catch {
      workerRef.current?.terminate()
      workerRef.current = null
      setError("مرورگر نتوانست پردازش پس‌زمینه را اجرا کند. صفحه را دوباره بارگذاری کنید.")
      setBusy(false)
    }
  }

  function updateInput(text: string) {
    setInput(text)
    setExcluded([])
    setResult(null)
  }

  function updateSettings(next: Partial<RedactSettings>) {
    const normalized = normalizeSettings({ ...settingsState.settings, ...next })
    let storageError = ""
    try {
      saveSettings(window.localStorage, normalized)
    } catch {
      storageError = "تنظیمات اعمال شدند، اما در مرورگر ذخیره نشدند؛ فضای ذخیره‌سازی پر یا غیرفعال است."
    }
    setSettingsState({ settings: normalized, error: storageError })
    setExcluded([])
    setResult(null)
  }

  function toggleType(id: DetectorId, enabled: boolean) {
    updateSettings({ [id]: enabled } as Partial<RedactSettings>)
  }

  function resetSettings() {
    updateSettings({ ...defaultSettings })
  }

  function updateTermsText(text: string) {
    let storageError = termsState.error
    if (termsState.remembered) {
      try {
        saveTerms(window.localStorage, normalizeTerms(text))
        storageError = ""
      } catch {
        storageError = "واژه‌ها اعمال شدند، اما در مرورگر ذخیره نشدند؛ فضای ذخیره‌سازی پر یا غیرفعال است."
      }
    }
    setTermsState((current) => ({ ...current, termsText: text, error: storageError }))
    setExcluded([])
    setResult(null)
  }

  function setRememberTerms(remember: boolean) {
    let storageError = ""
    try {
      if (remember) saveTerms(window.localStorage, terms)
      else clearTerms(window.localStorage)
    } catch {
      storageError = remember
        ? "واژه‌ها در مرورگر ذخیره نشدند؛ فضای ذخیره‌سازی پر یا غیرفعال است."
        : "پاک کردن واژه‌های ذخیره‌شده ممکن نشد."
    }
    setTermsState((current) => ({ ...current, remembered: remember, error: storageError }))
  }

  function toggleFinding(id: string) {
    setExcluded((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  function clear() {
    setInput("")
    setExcluded([])
    setResult(null)
  }

  function cancel() {
    requestRef.current += 1
    workerRef.current?.terminate()
    workerRef.current = null
    setBusy(false)
    setResult(null)
    setError("")
    setCancelled(true)
  }

  function retry() {
    setCancelled(false)
    setRevision((value) => value + 1)
  }

  const restored = useMemo(() => restore(restoreInput, result?.mapping ?? {}), [restoreInput, result])
  const placeholders = useMemo(() => Object.keys(result?.mapping ?? {}), [result])

  return {
    mode,
    setMode,
    input,
    restoreInput,
    restored,
    settings: settingsState.settings,
    settingsError: settingsState.error,
    terms,
    termsText: termsState.termsText,
    rememberTerms: termsState.remembered,
    termsError: termsState.error,
    result,
    findings: result?.findings ?? [],
    mappingCount: placeholders.length,
    placeholders,
    busy,
    error,
    cancelled,
    large: input.length > largeTextThreshold,
    updateInput,
    updateRestoreInput: setRestoreInput,
    updateSettings,
    toggleType,
    resetSettings,
    updateTermsText,
    setRememberTerms,
    toggleFinding,
    clear,
    cancel,
    retry,
  }
}
