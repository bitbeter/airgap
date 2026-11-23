import { useId, type ReactNode } from "react"
import { ArrowLeftRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Textarea } from "@/components/ui/textarea"

interface TransformError {
  message: string
  position?: number
}

interface TransformCardProps {
  title: string
  description: string
  inputLabel: string
  outputLabel: string
  inputValue: string
  outputValue: string
  inputPlaceholder: string
  outputPlaceholder: string
  error?: TransformError | null
  notice?: string
  inputHint?: string
  outputHint?: string
  controls?: ReactNode
  onInputChange: (value: string) => void
  onClear: () => void
  onSwap?: () => void
  swapDisabled?: boolean
  inputDir?: "ltr" | "rtl"
  outputDir?: "ltr" | "rtl"
  inputRows?: number
}

export function TransformCard({
  title,
  description,
  inputLabel,
  outputLabel,
  inputValue,
  outputValue,
  inputPlaceholder,
  outputPlaceholder,
  error = null,
  notice = "",
  inputHint = "",
  outputHint = "",
  controls,
  onInputChange,
  onClear,
  onSwap,
  swapDisabled = false,
  inputDir = "ltr",
  outputDir = "ltr",
  inputRows = 10,
}: TransformCardProps) {
  const inputId = useId()

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle><h2 className="text-base">{title}</h2></CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-start justify-end gap-2">
            {onSwap && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSwap}
                disabled={swapDisabled || !outputValue}
                title="خروجی را به ورودی می‌برد و جهت تبدیل را برمی‌گرداند"
              >
                <ArrowLeftRight />جابه‌جایی جهت
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={!inputValue && !outputValue}
            >
              <Trash2 />پاک کردن
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {controls}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label htmlFor={inputId} className="block text-sm font-medium">{inputLabel}</label>
            <Textarea
              id={inputId}
              dir={inputDir}
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={inputPlaceholder}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={inputRows}
              className="min-h-64 resize-y font-mono text-xs leading-6 md:text-xs"
            />
            <p className="text-xs leading-6 text-muted-foreground">
              {inputValue.length.toLocaleString("fa-IR")} نویسه
              {inputHint ? ` · ${inputHint}` : ""}
            </p>
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium">{outputLabel}</span>
              <CopyButton text={outputValue} label={outputLabel} />
            </div>
            <pre
              dir={outputDir}
              aria-live="polite"
              className="min-h-64 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 font-mono text-xs leading-6"
            >
              {outputValue || <span className="text-muted-foreground">{outputPlaceholder}</span>}
            </pre>
            <p className="text-xs leading-6 text-muted-foreground">
              {outputValue.length.toLocaleString("fa-IR")} نویسه
              {outputHint ? ` · ${outputHint}` : ""}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="space-y-1 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm leading-7">
            <p className="text-red-200">{error.message}</p>
            {typeof error.position === "number" && error.position > 0 && (
              <p className="text-xs leading-6 text-red-300/80">
                موقعیت: {error.position.toLocaleString("fa-IR")}
              </p>
            )}
          </div>
        )}

        {notice && (
          <p role="status" className="text-xs leading-6 text-muted-foreground">{notice}</p>
        )}
      </CardContent>
    </Card>
  )
}
