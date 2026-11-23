import type { KeyboardEvent } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EncodeTab } from "../lib/settings.mjs"

export interface EncodeTabDefinition {
  id: EncodeTab
  label: string
  icon: LucideIcon
}

interface ToolTabsProps {
  tabs: readonly EncodeTabDefinition[]
  active: EncodeTab
  onChange: (tab: EncodeTab) => void
}

export function ToolTabs({ tabs, active, onChange }: ToolTabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = tabs.length - 1
    else return
    event.preventDefault()
    onChange(tabs[next].id)
    document.getElementById(`encode-tab-${tabs[next].id}`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="ابزارهای کدگذاری و هش"
      className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1"
    >
      {tabs.map(({ id, label, icon: Icon }, index) => (
        <Button
          key={id}
          type="button"
          role="tab"
          id={`encode-tab-${id}`}
          aria-selected={active === id}
          aria-controls={`encode-panel-${id}`}
          tabIndex={active === id ? 0 : -1}
          variant={active === id ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  )
}
