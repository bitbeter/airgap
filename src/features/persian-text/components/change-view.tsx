import type { ChangeSegment } from "../lib/changes.mjs"

export function ChangeView({ segments }: { segments: ChangeSegment[] }) {
  return (
    <div className="space-y-2">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-6 text-muted-foreground">
        <span><span className="me-1 inline-block size-2 rounded-sm bg-red-900 align-middle" aria-hidden="true" />حذف‌شده</span>
        <span><span className="me-1 inline-block size-2 rounded-sm bg-green-900 align-middle" aria-hidden="true" />اضافه‌شده</span>
      </p>
      <div
        dir="auto"
        aria-label="تغییرات درون‌خطی"
        className="min-h-72 whitespace-pre-wrap break-words rounded-md border bg-muted/20 p-3 text-sm leading-8"
      >
        {segments.map((segment, index) => {
          if (segment.kind === "removed") {
            return (
              <span key={index} className="rounded-sm bg-red-900 px-0.5 text-red-100 line-through decoration-red-400 decoration-2" title="حذف یا جایگزین شده">
                {segment.value}
              </span>
            )
          }
          if (segment.kind === "added") {
            return (
              <span key={index} className="rounded-sm bg-green-900 px-0.5 text-green-100 decoration-green-400 decoration-2" title="اضافه یا جایگزین شده">
                {segment.value}
              </span>
            )
          }
          return <span key={index}>{segment.value}</span>
        })}
      </div>
    </div>
  )
}
