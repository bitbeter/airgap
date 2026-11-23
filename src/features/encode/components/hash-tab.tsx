import { useEffect, useMemo, useRef, useState } from "react"
import { Hash, Loader2, ShieldAlert, Trash2, TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { FileOpenButton } from "@/components/file-open-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SegmentedControl } from "./segmented-control"
import {
  compareHash,
  detectSubtleCrypto,
  hashAlgorithms,
  hashFile,
  hashText,
  largeFileThreshold,
  type HashAlgorithm,
  type HashResult,
} from "../lib/hash.mjs"

type Source = "text" | "file"

const algorithmOptions = hashAlgorithms.map((algorithm) => ({ value: algorithm, label: algorithm }))
const sourceOptions = [
  { value: "text" as const, label: "متن" },
  { value: "file" as const, label: "فایل" },
]

function formatBytes(size: number): string {
  if (size < 1024) return `${size.toLocaleString("fa-IR")} بایت`
  const units = ["کیلوبایت", "مگابایت", "گیگابایت"]
  let value = size / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ${units[unit]}`
}

function HashValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <CopyButton text={value} label={label} />
      </div>
      <pre
        dir="ltr"
        className="overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/20 p-3 font-mono text-xs leading-6"
      >
        {value}
      </pre>
    </div>
  )
}

export function HashTab() {
  const availability = useMemo(() => detectSubtleCrypto(globalThis), [])
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256")
  const [source, setSource] = useState<Source>("text")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [confirmedLarge, setConfirmedLarge] = useState(false)
  const [result, setResult] = useState<HashResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [expected, setExpected] = useState("")
  const requestRef = useRef(0)

  const large = source === "file" && file !== null && file.size > largeFileThreshold
  const needsConfirmation = large && !confirmedLarge

  useEffect(() => {
    if (!availability.available) {
      setResult(null)
      setBusy(false)
      setError("")
      return
    }
    if (source === "text" && text === "") {
      setResult(null)
      setBusy(false)
      setError("")
      return
    }
    if (source === "file" && !file) {
      setResult(null)
      setBusy(false)
      setError("")
      return
    }
    if (source === "file" && file && file.size > largeFileThreshold && !confirmedLarge) {
      setResult(null)
      setBusy(false)
      setError("")
      return
    }

    const subtle = availability.subtle
    const request = ++requestRef.current
    setBusy(true)
    setError("")
    let timer: number | undefined

    const run = async () => {
      try {
        const next =
          source === "text"
            ? await hashText(text, algorithm, subtle)
            : await hashFile(file as File, algorithm, subtle)
        if (request !== requestRef.current) return
        setResult(next)
        setBusy(false)
      } catch (caught) {
        if (request !== requestRef.current) return
        setResult(null)
        setError(caught instanceof Error ? caught.message : "محاسبهٔ هش انجام نشد. دوباره تلاش کنید.")
        setBusy(false)
      }
    }

    if (source === "text") timer = window.setTimeout(run, 200)
    else void run()

    return () => {
      requestRef.current += 1
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [availability, source, text, file, algorithm, confirmedLarge])

  const comparison = useMemo(
    () => (result ? compareHash(expected, result) : { status: "empty" as const, format: "" as const }),
    [expected, result],
  )

  function updateText(value: string) {
    setText(value)
    setResult(null)
    setError("")
  }

  function updateAlgorithm(value: HashAlgorithm) {
    setAlgorithm(value)
    setResult(null)
    setError("")
  }

  function updateSource(value: Source) {
    setSource(value)
    setResult(null)
    setError("")
  }

  function chooseFile(files: File[]) {
    const next = files[0]
    if (!next) return
    setFile(next)
    setConfirmedLarge(false)
    setResult(null)
    setError("")
  }

  function clearFile() {
    setFile(null)
    setConfirmedLarge(false)
    setResult(null)
    setError("")
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card className="min-w-0" aria-busy={busy}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle><h2 className="text-base">محاسبهٔ هش</h2></CardTitle>
              <CardDescription>
                هش SHA-1، SHA-256، SHA-384 یا SHA-512 را با Web Crypto محاسبه کنید. متن یا فایل از مرورگر خارج نمی‌شود.
              </CardDescription>
            </div>
            {busy && (
              <span className="flex items-center gap-2 text-xs leading-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                در حال محاسبه…
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!availability.available && (
            <div role="alert" className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-7 text-amber-100">
              <p className="flex items-center gap-2 font-medium">
                <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
                بخش هش غیرفعال است
              </p>
              <p className="text-xs leading-6">{availability.message}</p>
              <p className="text-xs leading-6">بقیهٔ ابزارهای این صفحه بدون Web Crypto کار می‌کنند.</p>
            </div>
          )}

          <SegmentedControl
            label="الگوریتم"
            value={algorithm}
            options={algorithmOptions}
            onChange={updateAlgorithm}
            disabled={!availability.available}
          />

          <SegmentedControl
            label="منبع"
            value={source}
            options={sourceOptions}
            onChange={updateSource}
            disabled={!availability.available}
          />

          {source === "text" ? (
            <div className="space-y-2">
              <label htmlFor="hash-text-input" className="block text-sm font-medium">متن ورودی</label>
              <Textarea
                id="hash-text-input"
                dir="ltr"
                value={text}
                onChange={(event) => updateText(event.target.value)}
                placeholder="abc"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={8}
                disabled={!availability.available}
                className="min-h-48 resize-y font-mono text-xs leading-6 md:text-xs"
              />
              <p className="text-xs leading-6 text-muted-foreground">
                {text.length.toLocaleString("fa-IR")} نویسه · متن به UTF-8 تبدیل می‌شود.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <FileOpenButton
                  accept="*/*"
                  label="انتخاب فایل"
                  onFiles={chooseFile}
                  disabled={!availability.available}
                />
                {file && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFile}>
                    <X />حذف فایل
                  </Button>
                )}
              </div>
              {file ? (
                <div className="space-y-2 rounded-md border bg-muted/20 p-3 text-sm leading-7">
                  <p className="break-all font-medium">{file.name}</p>
                  <p className="text-xs leading-6 text-muted-foreground">
                    {formatBytes(file.size)}
                    {file.type ? ` · ${file.type}` : ""}
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-7 text-muted-foreground">
                  فایلی انتخاب نشده است. هر نوع فایلی پذیرفته می‌شود و فقط در حافظهٔ مرورگر خوانده می‌شود.
                </p>
              )}

              {needsConfirmation && (
                <div role="status" className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                    فایل بزرگ است
                  </p>
                  <p>
                    حجم فایل بیش از {formatBytes(largeFileThreshold)} است. Web Crypto هش تدریجی ندارد؛ کل فایل در
                    حافظه خوانده می‌شود و محاسبه ممکن است چند ثانیه طول بکشد.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmedLarge(true)}>
                    <Hash />محاسبهٔ هش فایل
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm leading-7 text-red-200">
              {error}
            </div>
          )}

          <p className="text-xs leading-6 text-muted-foreground">
            هش یک‌طرفه است و به‌تنهایی ثابت نمی‌کند فایل یا متن امن است. برای فایل‌های بزرگ، محاسبه در همین صفحه و
            بدون ارسال داده انجام می‌شود.
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><h2 className="text-base">خروجی و مقایسه</h2></CardTitle>
          <CardDescription>
            هش محاسبه‌شده را به Hex یا Base64 کپی کنید یا با هش مورد انتظار مقایسه کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!availability.available ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <ShieldAlert className="size-8" aria-hidden="true" />
              <p>برای محاسبهٔ هش، صفحه را از HTTPS یا localhost باز کنید.</p>
            </div>
          ) : !result ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Hash className="size-8" aria-hidden="true" />
              <p>
                {busy
                  ? "در حال محاسبهٔ هش…"
                  : source === "file" && !file
                    ? "یک فایل انتخاب کنید تا هش آن اینجا نمایش داده شود."
                    : "متن یا فایل را وارد کنید تا هش آن اینجا نمایش داده شود."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <HashValue label="Hex" value={result.hex} />
              <HashValue label="Base64" value={result.base64} />
              <p className="text-xs leading-6 text-muted-foreground">
                الگوریتم {result.algorithm} · خروجی {result.byteLength.toLocaleString("fa-IR")} بایت
              </p>

              <div className="space-y-2 border-t pt-4">
                <label htmlFor="hash-expected" className="block text-sm font-medium">
                  هش مورد انتظار (Hex یا Base64)
                </label>
                <Input
                  id="hash-expected"
                  dir="ltr"
                  value={expected}
                  onChange={(event) => setExpected(event.target.value)}
                  placeholder={result.hex}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="font-mono text-xs"
                />
                {comparison.status === "empty" && (
                  <p className="text-xs leading-6 text-muted-foreground">
                    برای مقایسه، هش مورد انتظار را وارد کنید. فاصله، دونقطه و پیشوند sha256 پذیرفته می‌شود.
                  </p>
                )}
                {comparison.status === "match" && (
                  <p role="status" className="text-sm leading-7 text-emerald-300">
                    هش واردشده با خروجی یکسان است ({comparison.format === "hex" ? "Hex" : "Base64"}).
                  </p>
                )}
                {comparison.status === "mismatch" && (
                  <p role="alert" className="text-sm leading-7 text-red-300">
                    هش واردشده با خروجی یکسان نیست.
                  </p>
                )}
                {comparison.status === "invalid" && (
                  <p role="status" className="text-sm leading-7 text-amber-200">
                    قالب هش واردشده شناسایی نشد؛ یک هش Hex یا Base64 کامل وارد کنید.
                  </p>
                )}
              </div>
            </div>
          )}

          {result && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setExpected("")} disabled={!expected}>
              <Trash2 />پاک کردن هش مورد انتظار
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
