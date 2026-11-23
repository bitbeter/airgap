import { useMemo, useState } from "react"
import { ScanText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Textarea } from "@/components/ui/textarea"
import {
  codepointReport,
  codepointSummary,
  describeCodepoints,
} from "../lib/codepoints.mjs"

const maxRows = 2000

export function CodepointsTab() {
  const [text, setText] = useState("")
  const [invisibleOnly, setInvisibleOnly] = useState(false)

  const entries = useMemo(() => describeCodepoints(text), [text])
  const filtered = useMemo(
    () => (invisibleOnly ? entries.filter((entry) => entry.isInvisible) : entries),
    [entries, invisibleOnly],
  )
  const summary = useMemo(() => codepointSummary(entries), [entries])
  const report = useMemo(() => codepointReport(filtered), [filtered])
  const rows = filtered.slice(0, maxRows)

  return (
    <div className="space-y-6">
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle><h2 className="text-base">کدپوینت‌های یونیکد</h2></CardTitle>
              <CardDescription>
                هر نویسه، کدپوینت، بایت‌های UTF-8 و دستهٔ آن را ببینید. برای پیدا کردن نویسه‌های نامرئی مثل نیم‌فاصله
                و علامت‌های جهت‌گیری مفید است.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              <CopyButton text={report} label="گزارش کدپوینت‌ها" />
              <Button type="button" variant="outline" size="sm" onClick={() => setText("")} disabled={!text}>
                <Trash2 />پاک کردن
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            id="codepoints-input"
            aria-label="متن برای بررسی کدپوینت‌ها"
            dir="ltr"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="متن را اینجا بچسبانید؛ مثلاً «سلام دنیا»"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={8}
            className="min-h-40 resize-y font-mono text-xs leading-6 md:text-xs"
          />
          <div className="flex flex-wrap items-center gap-4 text-xs leading-6 text-muted-foreground">
            <span>{summary.total.toLocaleString("fa-IR")} کدپوینت</span>
            <span>{summary.unique.toLocaleString("fa-IR")} یکتا</span>
            <span className={summary.invisible > 0 ? "text-amber-200" : ""}>
              {summary.invisible.toLocaleString("fa-IR")} نامرئی/کنترلی
            </span>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={invisibleOnly}
                onChange={(event) => setInvisibleOnly(event.target.checked)}
              />
              <span>فقط نویسه‌های نامرئی/کنترلی</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle><h2 className="text-base">جزئیات نویسه‌ها</h2></CardTitle>
          <CardDescription>
            {filtered.length === 0
              ? "برای دیدن جزئیات، متن را در کادر بالا وارد کنید."
              : `${filtered.length.toLocaleString("fa-IR")} مورد${invisibleOnly ? " نامرئی/کنترلی" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <ScanText className="size-8" aria-hidden="true" />
              <p>
                {text
                  ? invisibleOnly
                    ? "در این متن نویسهٔ نامرئی یا کنترلی پیدا نشد."
                    : "نویسه‌ای برای نمایش وجود ندارد."
                  : "متن را وارد کنید تا کدپوینت‌ها اینجا فهرست شوند."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th scope="col" className="p-2 font-medium">#</th>
                      <th scope="col" className="p-2 font-medium">نویسه</th>
                      <th scope="col" className="p-2 font-medium">کدپوینت</th>
                      <th scope="col" className="p-2 font-medium">اعشاری</th>
                      <th scope="col" className="p-2 font-medium">UTF-8</th>
                      <th scope="col" className="p-2 font-medium">دسته</th>
                      <th scope="col" className="p-2 font-medium">توضیح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry) => (
                      <tr
                        key={`${entry.index}-${entry.codePoint}`}
                        className={entry.isInvisible ? "border-b bg-amber-500/5 last:border-0" : "border-b last:border-0"}
                      >
                        <td className="p-2 font-mono text-xs text-muted-foreground" dir="ltr">
                          {entry.ordinal.toLocaleString("en-US")}
                        </td>
                        <td className="p-2 font-mono text-base" dir="ltr">{entry.display}</td>
                        <td className="p-2 font-mono text-xs" dir="ltr">{entry.hex}</td>
                        <td className="p-2 font-mono text-xs" dir="ltr">{entry.decimal.toLocaleString("en-US")}</td>
                        <td className="p-2 font-mono text-xs" dir="ltr">{entry.utf8}</td>
                        <td className="p-2 text-xs">{entry.category}</td>
                        <td className="p-2 text-xs">
                          {entry.name || (entry.isInvisible ? "نویسهٔ نامرئی" : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > maxRows && (
                <p role="status" className="text-xs leading-6 text-muted-foreground">
                  برای عملکرد بهتر فقط {maxRows.toLocaleString("fa-IR")} مورد اول نمایش داده می‌شود؛ گزارش کپی‌شده
                  شامل همهٔ {filtered.length.toLocaleString("fa-IR")} مورد است.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
