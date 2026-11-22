import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { defaultOptions, diffOptionDefinitions, type DiffOptionId } from "../lib/options.mjs"
import type { DiffOptions as DiffOptionsValue } from "../lib/compare.mjs"

interface DiffOptionsProps {
  options: DiffOptionsValue
  error: string
  onChange: (options: DiffOptionsValue) => void
}

export function DiffOptions({ options, error, onChange }: DiffOptionsProps) {
  const active = diffOptionDefinitions.some((definition) => options[definition.id] === true)

  function toggle(id: DiffOptionId, checked: boolean) {
    onChange({ ...options, [id]: checked })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle><h2 className="text-base">گزینه‌های نادیده‌گرفتن</h2></CardTitle>
          <Button variant="ghost" size="sm" disabled={!active} onClick={() => onChange({ ...defaultOptions })}>
            <RotateCcw />پیش‌فرض
          </Button>
        </div>
        <CardDescription>فقط برای تطبیق خط‌ها استفاده می‌شوند؛ متن اصلی همیشه بدون تغییر نمایش داده می‌شود.</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="grid gap-2 md:grid-cols-2">
          <legend className="sr-only">گزینه‌های نادیده‌گرفتن در مقایسه</legend>
          {diffOptionDefinitions.map((definition) => (
            <label key={definition.id} className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm leading-6 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-primary focus-visible:outline-none"
                checked={options[definition.id] === true}
                onChange={(event) => toggle(definition.id, event.target.checked)}
              />
              <span>{definition.label}</span>
            </label>
          ))}
        </fieldset>
        {error && <p role="status" className="mt-3 text-xs leading-6 text-red-400">{error}</p>}
      </CardContent>
    </Card>
  )
}
