import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { HistoryEntry } from "../lib/history.mjs"

interface DiffHistoryProps {
  entries: HistoryEntry[]
  error: string
  onClear: () => void
  onOpen: (entry: HistoryEntry) => void
}

export function DiffHistory({ entries, error, onClear, onOpen }: DiffHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle><h2>تاریخچهٔ مقایسه‌ها</h2></CardTitle>
          <Button variant="ghost" size="sm" disabled={!entries.length} onClick={onClear}><Trash2 />پاک کردن تاریخچه</Button>
        </div>
        <CardDescription>سه مقایسهٔ موفق آخر همراه متن‌ها فقط در همین مرورگر ذخیره می‌شوند.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p role="status" className="text-sm text-red-400">{error}</p>}
        {!entries.length && <p className="text-sm text-muted-foreground">هنوز مقایسه‌ای ذخیره نشده است.</p>}
        {entries.map((entry, index) => (
          <div key={`${entry.savedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <div className="min-w-0 flex-1 space-y-2">
              <time dateTime={new Date(entry.savedAt).toISOString()} className="text-xs text-muted-foreground">{new Date(entry.savedAt).toLocaleString("fa-IR")}</time>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="min-w-0 truncate"><span className="text-muted-foreground">اصلی: </span><bdi>{entry.before.slice(0, 100) || "(خالی)"}</bdi></p>
                <p className="min-w-0 truncate"><span className="text-muted-foreground">جدید: </span><bdi>{entry.after.slice(0, 100) || "(خالی)"}</bdi></p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpen(entry)}>باز کردن</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
