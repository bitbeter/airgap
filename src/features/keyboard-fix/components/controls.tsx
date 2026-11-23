import { ArrowLeftRight, FlaskConical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { layoutIds, layouts, type LayoutId } from "../lib/layouts.mjs"
import type { Direction, Mode } from "../hooks/use-keyboard-fix"

interface ControlsProps {
  direction: Direction
  layout: LayoutId
  mode: Mode
  storageError: string
  hasInput: boolean
  hasOutput: boolean
  onDirectionChange: (direction: Direction) => void
  onLayoutChange: (layout: LayoutId) => void
  onModeChange: (mode: Mode) => void
  onSwap: () => void
  onClear: () => void
}

const directionOptions: { value: Direction; label: string; sample: string }[] = [
  { value: "auto", label: "خودکار", sample: "تشخیص از غلبهٔ نویسه‌ها" },
  { value: "en-fa", label: "انگلیسی به فارسی", sample: "sghl → سلام" },
  { value: "fa-en", label: "فارسی به انگلیسی", sample: "سلام → sghl" },
]

export function Controls({
  direction,
  layout,
  mode,
  storageError,
  hasInput,
  hasOutput,
  onDirectionChange,
  onLayoutChange,
  onModeChange,
  onSwap,
  onClear,
}: ControlsProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle><h2 className="text-base">تنظیمات تبدیل</h2></CardTitle>
        <CardDescription>
          جهت تبدیل و چیدمان صفحه‌کلید را انتخاب کنید. تبدیل به‌صورت زنده و فقط در مرورگر انجام می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">جهت تبدیل</legend>
          <div role="radiogroup" aria-label="جهت تبدیل" className="grid gap-2 sm:grid-cols-3">
            {directionOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  type="radio"
                  name="keyboard-fix-direction"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={direction === option.value}
                  onChange={() => onDirectionChange(option.value)}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  <span dir={option.value === "auto" ? "auto" : "ltr"} className="mt-0.5 block text-xs text-muted-foreground">{option.sample}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">چیدمان صفحه‌کلید</legend>
          <div role="radiogroup" aria-label="چیدمان صفحه‌کلید" className="grid gap-2 sm:grid-cols-2">
            {layoutIds.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  type="radio"
                  name="keyboard-fix-layout"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={layout === id}
                  onChange={() => onLayoutChange(id)}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{layouts[id].label}</span>
                  <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">{layouts[id].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            checked={mode === "wrong-only"}
            onChange={(event) => onModeChange(event.target.checked ? "wrong-only" : "all")}
          />
          <span>
            <span className="font-medium">فقط بخش‌های اشتباه</span>
            <span className="ms-2 inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <FlaskConical className="size-3" aria-hidden="true" />آزمایشی
            </span>
            <span className="mt-1 block text-xs leading-6 text-muted-foreground">
              واژه‌هایی که با یک ابتکار ساده «نادرست» تشخیص داده شوند تبدیل می‌شوند و واژه‌های سالم می‌مانند.
              این حالت هنوز قابل‌اعتماد نیست؛ برای اطمینان خاموشش کنید.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={!hasOutput} onClick={onSwap}>
            <ArrowLeftRight />جابه‌جایی ورودی و خروجی
          </Button>
          <Button type="button" variant="ghost" disabled={!hasInput} onClick={onClear}>
            <Trash2 />پاک کردن
          </Button>
        </div>

        {storageError && <p role="status" className="text-xs leading-6 text-red-400">{storageError}</p>}
      </CardContent>
    </Card>
  )
}
