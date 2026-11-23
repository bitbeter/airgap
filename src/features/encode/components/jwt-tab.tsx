import { useEffect, useMemo, useState } from "react"
import { CircleCheck, CircleX, Clock, Info, KeyRound, ShieldAlert, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Textarea } from "@/components/ui/textarea"
import { decodeJwt, type JwtResult, type JwtStatusState } from "../lib/jwt.mjs"

const statusStyles: Record<JwtStatusState, string> = {
  valid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  expired: "border-red-500/40 bg-red-500/10 text-red-200",
  "not-yet-valid": "border-amber-500/30 bg-amber-500/10 text-amber-100",
  "no-expiry": "border-border bg-muted/30 text-muted-foreground",
}

function StatusIcon({ state }: { state: JwtStatusState }) {
  if (state === "valid") return <CircleCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />
  if (state === "expired") return <CircleX className="mt-1 size-5 shrink-0" aria-hidden="true" />
  if (state === "not-yet-valid") return <Clock className="mt-1 size-5 shrink-0" aria-hidden="true" />
  return <Info className="mt-1 size-5 shrink-0" aria-hidden="true" />
}

function JsonPanel({
  title,
  description,
  json,
  label,
}: {
  title: string
  description: string
  json: string
  label: string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle><h3 className="text-base">{title}</h3></CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <CopyButton text={json} label={label} />
        </div>
      </CardHeader>
      <CardContent>
        <pre
          dir="ltr"
          className="max-h-80 overflow-auto whitespace-pre rounded-md border bg-muted/20 p-3 font-mono text-xs leading-6"
        >
          {json}
        </pre>
      </CardContent>
    </Card>
  )
}

function TimesCard({ result }: { result: JwtResult }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle><h3 className="text-base">ادعاهای زمانی</h3></CardTitle>
        <CardDescription>
          زمان‌ها به وقت محلی مرورگر و UTC نمایش داده می‌شوند. مقدار خام بر حسب ثانیهٔ یونیکس است.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.times.length === 0 ? (
          <p className="text-sm leading-7 text-muted-foreground">
            این توکن ادعای زمانی exp، iat یا nbf ندارد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b text-right">
                  <th scope="col" className="p-2 font-medium">ادعا</th>
                  <th scope="col" className="p-2 font-medium">ثانیه</th>
                  <th scope="col" className="p-2 font-medium">شمسی</th>
                  <th scope="col" className="p-2 font-medium">میلادی</th>
                  <th scope="col" className="p-2 font-medium">ISO (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {result.times.map((time) => (
                  <tr key={time.claim} className="border-b last:border-0">
                    <th scope="row" className="p-2 text-right font-mono text-xs" dir="ltr">
                      {time.claim}
                      <span className="ms-2 font-sans text-muted-foreground" dir="rtl">{time.label}</span>
                    </th>
                    <td className="p-2 font-mono text-xs" dir="ltr">{time.seconds.toLocaleString("en-US")}</td>
                    <td className="p-2">{time.jalali}</td>
                    <td className="p-2">{time.gregorian}</td>
                    <td className="p-2 font-mono text-xs" dir="ltr">{time.iso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result.invalidTimeClaims.length > 0 && (
          <p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">
            مقدار {result.invalidTimeClaims.join("، ")} عدد معتبر نیست و به تاریخ تبدیل نشد.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function JwtTab() {
  const [token, setToken] = useState("")
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const result = useMemo(
    () => (token.trim() ? decodeJwt(token, { now }) : null),
    [token, now],
  )

  return (
    <div className="space-y-6">
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle><h2 className="text-base">توکن JWT</h2></CardTitle>
              <CardDescription>
                header و payload را بدون اعتبارسنجی امضا ببینید. توکن ذخیره یا ارسال نمی‌شود.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setToken("")} disabled={!token}>
              <Trash2 />پاک کردن
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            id="jwt-token-input"
            aria-label="توکن JWT"
            dir="ltr"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={5}
            className="min-h-32 resize-y font-mono text-xs leading-6 md:text-xs"
          />
          <div
            role="note"
            className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100"
          >
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              امضای توکن بررسی نمی‌شود. این ابزار فقط محتوای header و payload را نمایش می‌دهد و دربارهٔ معتبر بودن
              توکن یا هویت صادرکننده قضاوت نمی‌کند.
            </p>
          </div>
        </CardContent>
      </Card>

      {!result ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <KeyRound className="size-8" aria-hidden="true" />
            <p>توکن JWT را در کادر بالا بچسبانید تا header، payload و وضعیت انقضا اینجا نمایش داده شود.</p>
          </CardContent>
        </Card>
      ) : !result.ok ? (
        <div role="alert" className="space-y-1 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm leading-7">
          <p className="text-red-200">{result.message}</p>
          <p className="text-xs leading-6 text-red-300/80">توکن را بررسی کنید؛ توکن خراب صفحه را متوقف نمی‌کند.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div role="status" className={`flex items-start gap-3 rounded-lg border p-4 text-sm leading-7 ${statusStyles[result.status.state]}`}>
            <StatusIcon state={result.status.state} />
            <div>
              <p>{result.status.message}</p>
              <p className="mt-1 text-xs leading-6 opacity-80">
                وضعیت بر اساس ادعاهای exp و nbf و ساعت فعلی مرورگر محاسبه شده است؛ امضا بررسی نشده است.
              </p>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <JsonPanel
              title="Header"
              description="الگوریتم و نوع توکن"
              json={result.headerJson}
              label="header"
            />
            <JsonPanel
              title="Payload"
              description="ادعاهای توکن"
              json={result.payloadJson}
              label="payload"
            />
          </div>

          <TimesCard result={result} />

          <Card className="min-w-0">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle><h3 className="text-base">امضا (Signature)</h3></CardTitle>
                  <CardDescription>فقط برای نمایش؛ اعتبارسنجی انجام نمی‌شود.</CardDescription>
                </div>
                <CopyButton text={result.signature} label="امضا" />
              </div>
            </CardHeader>
            <CardContent>
              <pre
                dir="ltr"
                className="overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/20 p-3 font-mono text-xs leading-6"
              >
                {result.signature || "—"}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
