import { useRef, useState, type KeyboardEvent } from "react"
import {
  Bold, Code, Heading1, Heading2, Heading3, Italic, Link, List, ListOrdered, ListTodo,
  SeparatorHorizontal, SquareCode, Strikethrough, Table, TextQuote, Workflow, type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FormatAction } from "../format.mjs"

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
export const modifierLabel = isMac ? "⌘" : "Ctrl"

type Tool = { action: FormatAction; label: string; icon: LucideIcon; shortcut?: string }

const groups: Tool[][] = [
  [
    { action: "heading1", label: "تیتر ۱", icon: Heading1 },
    { action: "heading2", label: "تیتر ۲", icon: Heading2 },
    { action: "heading3", label: "تیتر ۳", icon: Heading3 },
  ],
  [
    { action: "bold", label: "پررنگ", icon: Bold, shortcut: "B" },
    { action: "italic", label: "ایتالیک", icon: Italic, shortcut: "I" },
    { action: "strikethrough", label: "خط‌خورده", icon: Strikethrough },
    { action: "code", label: "کد درون‌خطی", icon: Code },
    { action: "link", label: "پیوند", icon: Link, shortcut: "K" },
  ],
  [
    { action: "bullet", label: "فهرست نقطه‌ای", icon: List },
    { action: "ordered", label: "فهرست شماره‌دار", icon: ListOrdered },
    { action: "task", label: "چک‌لیست", icon: ListTodo },
    { action: "quote", label: "نقل‌قول", icon: TextQuote },
  ],
  [
    { action: "codeBlock", label: "بلوک کد", icon: SquareCode },
    { action: "table", label: "جدول", icon: Table },
    { action: "rule", label: "خط جداکننده", icon: SeparatorHorizontal },
    { action: "mermaid", label: "نمودار Mermaid", icon: Workflow },
  ],
]

const tools = groups.flat()

export function MarkdownToolbar({ controls, onAction }: { controls: string; onAction: (action: FormatAction) => void }) {
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  // One tab stop; arrow keys move between tools in visual order.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[event.key]
    const next = step !== undefined ? (active + step + tools.length) % tools.length
      : event.key === "Home" ? 0 : event.key === "End" ? tools.length - 1 : null
    if (next === null) return
    event.preventDefault()
    setActive(next)
    buttons.current[next]?.focus()
  }

  return (
    <div role="toolbar" aria-label="قالب‌بندی Markdown" aria-controls={controls} onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-y-1 rounded-md border p-1">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex shrink-0 items-center gap-0.5">
          {groupIndex > 0 && <div role="separator" aria-orientation="vertical" className="mx-1 h-5 w-px bg-border" />}
          {group.map((tool) => {
            const index = tools.indexOf(tool)
            const Icon = tool.icon
            const title = tool.shortcut ? `${tool.label} (${modifierLabel}+${tool.shortcut})` : tool.label
            return (
              <Button key={tool.action} ref={(element) => { buttons.current[index] = element }}
                type="button" variant="ghost" size="sm" className="h-8 w-8 px-0"
                tabIndex={index === active ? 0 : -1} aria-label={title} title={title}
                aria-keyshortcuts={tool.shortcut ? `${isMac ? "Meta" : "Control"}+${tool.shortcut}` : undefined}
                onFocus={() => setActive(index)}
                // Keep the editor selection visible while clicking a tool.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onAction(tool.action)}>
                <Icon aria-hidden="true" />
              </Button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
