import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Feature } from "./feature"
import { searchFeatures } from "./search.mjs"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  features: Feature[]
  recentPaths: string[]
  onSelect: (feature: Feature) => void
}

interface PaletteItem {
  feature: Feature
  index: number
}

interface PaletteGroup {
  id: string
  label: string
  items: PaletteItem[]
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable
}

export function CommandPalette({ open, onOpenChange, features, recentPaths, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey) return

      const modifier = event.metaKey || event.ctrlKey
      if (modifier && (event.code === "KeyK" || event.key.toLowerCase() === "k")) {
        event.preventDefault()
        onOpenChange(!open)
        return
      }

      if (!open && !modifier && !event.shiftKey && (event.key === "/" || event.code === "Slash") && !isTypingTarget(event.target)) {
        event.preventDefault()
        onOpenChange(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onOpenChange, open])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setActiveIndex(0)
      return
    }

    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus()
    }
  }, [open])

  const groups = useMemo<PaletteGroup[]>(() => {
    const trimmed = query.trim()
    if (trimmed) {
      const results = searchFeatures(features, trimmed)
      return results.length
        ? [{ id: "results", label: "نتایج", items: results.map((feature, index) => ({ feature, index })) }]
        : []
    }

    const recent = recentPaths
      .map((path) => features.find((feature) => feature.path === path))
      .filter((feature): feature is Feature => Boolean(feature))
    const recentSet = new Set(recent.map((feature) => feature.path))
    const rest = features.filter((feature) => !recentSet.has(feature.path))
    const next: PaletteGroup[] = []

    if (recent.length) {
      next.push({
        id: "recent",
        label: "اخیراً استفاده‌شده",
        items: recent.map((feature, index) => ({ feature, index })),
      })
    }
    if (rest.length) {
      next.push({
        id: "all",
        label: recent.length ? "همهٔ ابزارها" : "ابزارها",
        items: rest.map((feature, index) => ({ feature, index: recent.length + index })),
      })
    }
    return next
  }, [features, query, recentPaths])

  const items = useMemo(() => groups.flatMap((group) => group.items), [groups])
  const safeActiveIndex = items.length === 0 ? -1 : Math.min(activeIndex, items.length - 1)
  const activeFeature = safeActiveIndex >= 0 ? items[safeActiveIndex].feature : null

  useEffect(() => {
    if (!open || safeActiveIndex < 0) return
    document.getElementById(`palette-option-${items[safeActiveIndex].feature.path}`)?.scrollIntoView({ block: "nearest" })
  }, [items, open, safeActiveIndex])

  if (!open) return null

  function move(delta: number) {
    if (items.length === 0) return
    setActiveIndex((safeActiveIndex + delta + items.length) % items.length)
  }

  function select(feature: Feature) {
    onSelect(feature)
    onOpenChange(false)
  }

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('[data-palette-focusable="true"]')).filter(
      (element) => !element.hasAttribute("disabled"),
    )
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault()
        last.focus()
      }
    } else if (active === last || !dialog.contains(active)) {
      event.preventDefault()
      first.focus()
    }
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      onOpenChange(false)
      return
    }
    if (event.key === "Tab") {
      trapFocus(event)
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      move(1)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      move(-1)
      return
    }
    if (event.key === "Enter" && activeFeature) {
      event.preventDefault()
      select(activeFeature)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 p-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        className="w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-2xl"
        onKeyDown={onDialogKeyDown}
      >
        <h2 id="command-palette-title" className="sr-only">
          جست‌وجوی ابزارها
        </h2>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            placeholder="جست‌وجوی ابزار…"
            className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-autocomplete="list"
            aria-activedescendant={activeFeature ? `palette-option-${activeFeature.path}` : undefined}
            data-palette-focusable="true"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="بستن جست‌وجو"
            data-palette-focusable="true"
          >
            <X />
          </Button>
        </div>

        <div id="command-palette-results" role="listbox" aria-label="ابزارها" className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">ابزاری پیدا نشد.</p>
          ) : (
            groups.map((group) => (
              <div key={group.id} role="group" aria-labelledby={`palette-group-${group.id}`}>
                <div id={`palette-group-${group.id}`} className="px-2 pb-1 pt-3 text-xs font-medium text-muted-foreground">
                  {group.label}
                </div>
                {group.items.map(({ feature, index }) => {
                  const Icon = feature.icon
                  const active = index === safeActiveIndex
                  return (
                    <div
                      key={feature.path}
                      id={`palette-option-${feature.path}`}
                      role="option"
                      aria-selected={active}
                      onMouseMove={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => select(feature)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2",
                        active && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{feature.title}</p>
                        {feature.description ? (
                          <p className="truncate text-xs text-muted-foreground">{feature.description}</p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>↑↓ پیمایش · Enter باز کردن · Esc بستن</span>
          <span>{query.trim() ? `${items.length} نتیجه` : `${items.length} ابزار`}</span>
        </div>
      </div>
    </div>
  )
}
