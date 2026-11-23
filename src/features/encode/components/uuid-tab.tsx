import { useState } from "react"
import { Fingerprint, RefreshCw, ShieldAlert, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { generateUuidV4 } from "../lib/uuid.mjs"

const maxHistory = 10

export function UuidTab() {
  const [state, setState] = useState<{ items: string[]; error: string }>(() => {
    const first = generateUuidV4()
    return { items: first.ok ? [first.uuid] : [], error: first.ok ? "" : first.message }
  })

  const current = state.items[0] ?? ""

  function generate() {
    const next = generateUuidV4()
    if (!next.ok) {
      setState({ items: [], error: next.message })
      return
    }
    setState((previous) => ({
      items: [next.uuid, ...previous.items].slice(0, maxHistory),
      error: "",
    }))
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><h2 className="text-base">UUID v4 تصادفی</h2></CardTitle>
          <CardDescription>
            شناسهٔ یکتای تصادفی با <span dir="ltr" className="font-mono">crypto.randomUUID</span> بسازید. مقدار ذخیره
            یا ارسال نمی‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error ? (
            <div role="alert" className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-7 text-amber-100">
              <p className="flex items-start gap-2">
                <ShieldAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
                <span>{state.error}</span>
              </p>
              <Button type="button" variant="outline" size="sm" onClick={generate}>
                <RefreshCw />تلاش دوباره
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">UUID فعلی</span>
                  <CopyButton text={current} label="UUID" />
                </div>
                <p
                  dir="ltr"
                  className="break-all rounded-md border bg-muted/20 p-4 text-center font-mono text-lg leading-8"
                >
                  {current || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={generate}>
                  <RefreshCw />ساخت UUID جدید
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setState({ items: [], error: "" })}
                  disabled={state.items.length === 0}
                >
                  <Trash2 />پاک کردن فهرست
                </Button>
              </div>
            </>
          )}

          <p className="text-xs leading-6 text-muted-foreground">
            UUID نسخهٔ ۴ دارای ۱۲۲ بیت تصادفی است. احتمال تکرار آن در عمل ناچیز است، اما تضمین ریاضی یکتایی جهانی
            نیست.
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><h2 className="text-base">UUIDهای این نشست</h2></CardTitle>
          <CardDescription>
            حداکثر {maxHistory.toLocaleString("fa-IR")} مقدار آخر. با بستن یا ترک صفحه پاک می‌شوند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.items.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Fingerprint className="size-8" aria-hidden="true" />
              <p>هنوز UUIDای ساخته نشده است.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {state.items.map((uuid, index) => (
                <li
                  key={`${uuid}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-2"
                >
                  <span dir="ltr" className="break-all font-mono text-xs leading-6">{uuid}</span>
                  <CopyButton text={uuid} label={`UUID ${index + 1}`} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
