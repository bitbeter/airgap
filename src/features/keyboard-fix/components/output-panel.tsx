import { ArrowLeftRight, ClipboardCheck, FlaskConical, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import type { ConvertResult } from "../lib/convert.mjs"
import type { Direction, Mode } from "../hooks/use-keyboard-fix"

interface OutputPanelProps {
  result: ConvertResult
  hasInput: boolean
  direction: Direction
  mode: Mode
}

function directionLabel(result: ConvertResult): string {
  if (result.direction === "en-fa") return "انگلیسی به فارسی"
  if (result.direction === "fa-en") return "فارسی به انگلیسی"
  return "تشخیص داده نشد"
}

export function OutputPanel({ result, hasInput, direction, mode }: OutputPanelProps) {
  const changed = result.changed.toLocaleString("fa-IR")
  const protectedCount = result.protectedCount.toLocaleString("fa-IR")
  const noDirection = hasInput && result.direction === null
  const nothingChanged = hasInput && result.direction !== null && result.changed === 0

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle><h2 className="text-base">متن اصلاح‌شده</h2></CardTitle>
          <CopyButton text={result.text} label="خروجی" />
        </div>
        <CardDescription aria-live="polite">
          {!hasInput
            ? "خروجی به‌صورت زنده پس از نوشتن متن در این بخش نمایش داده می‌شود."
            : noDirection
              ? "جهت تبدیل تشخیص داده نشد."
              : `${changed} نویسه تبدیل شد · جهت: ${directionLabel(result)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasInput ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <ArrowLeftRight className="size-8" aria-hidden="true" />
            <p>متن را در ستون ورودی بنویسید تا نسخهٔ اصلاح‌شده اینجا نمایش داده شود.</p>
          </div>
        ) : (
          <div
            dir="auto"
            className="min-h-72 whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 text-sm leading-8"
          >
            {result.text || " "}
          </div>
        )}

        {noDirection && (
          <p role="status" className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <ClipboardCheck className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>
              نویسه‌های فارسی و لاتین برابرند یا هیچ نویسهٔ قابل‌تشخیصی وجود ندارد. جهت را دستی انتخاب کنید؛
              متن فعلی بدون تغییر مانده است.
            </span>
          </p>
        )}

        {nothingChanged && (
          <p role="status" className="text-xs leading-6 text-muted-foreground">
            نویسه‌ای برای تبدیل در این جهت پیدا نشد؛ متن بدون تغییر ماند.
          </p>
        )}

        {result.protectedCount > 0 && (
          <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <ShieldCheck className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>{protectedCount} نشانی اینترنتی یا ایمیل بدون تغییر ماند.</span>
          </p>
        )}

        {mode === "wrong-only" && (
          <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <FlaskConical className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>
              حالت آزمایشی «فقط بخش‌های اشتباه» روشن است؛ ممکن است برخی واژه‌های سالم تبدیل نشوند یا واژه‌های
              نادرست باقی بمانند.
            </span>
          </p>
        )}

        {direction === "auto" && hasInput && result.direction !== null && (
          <p className="text-xs leading-6 text-muted-foreground">
            جهت خودکار بر اساس غلبهٔ نویسه‌ها انتخاب شد. برای کنترل کامل، جهت را دستی انتخاب کنید.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
