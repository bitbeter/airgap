import { useEffect, useState } from "react"
import { Check, ChevronDown, ChevronLeft, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  pathForIndex,
  pathForKey,
  serializeNode,
  type JsonNode,
} from "../lib/format.mjs"

const typeLabels: Record<JsonNode["type"], string> = {
  object: "شیء",
  array: "آرایه",
  string: "رشته",
  number: "عدد",
  boolean: "بولین",
  null: "null",
}

interface TreeChild {
  key: string
  label: string
  path: string
  node: JsonNode
}

function childrenOf(node: JsonNode, path: string): TreeChild[] {
  if (node.type === "object") {
    return node.entries.map((entry) => ({
      key: entry.key,
      label: entry.key,
      path: pathForKey(path, entry.key),
      node: entry.value,
    }))
  }
  if (node.type === "array") {
    return node.items.map((item, index) => ({
      key: String(index),
      label: `[${index}]`,
      path: pathForIndex(path, index),
      node: item,
    }))
  }
  return []
}

function previewNode(node: JsonNode): string {
  switch (node.type) {
    case "string": {
      const text = node.value.length > 80 ? `${node.value.slice(0, 80)}…` : node.value
      return JSON.stringify(text)
    }
    case "number":
      return node.raw
    case "boolean":
      return node.value ? "true" : "false"
    case "null":
      return "null"
    case "object":
      return `{ ${node.entries.length.toLocaleString("fa-IR")} کلید }`
    case "array":
      return `[ ${node.items.length.toLocaleString("fa-IR")} عضو ]`
  }
}

function valueForCopy(node: JsonNode): string {
  switch (node.type) {
    case "string":
      return node.value
    case "number":
      return node.raw
    case "boolean":
      return node.value ? "true" : "false"
    case "null":
      return "null"
    default:
      return serializeNode(node, { indent: 2 })
  }
}

function CopyValueButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-6 w-6 shrink-0 p-0"
      onClick={copy}
      aria-label={label}
      title={label}
    >
      {copied ? <Check className="text-emerald-400" /> : <Copy />}
    </Button>
  )
}

interface TreeNodeProps {
  node: JsonNode
  path: string
  label: string
  depth: number
  defaultExpanded?: boolean
}

function TreeNode({ node, path, label, depth, defaultExpanded = false }: TreeNodeProps) {
  const children = childrenOf(node, path)
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [visible, setVisible] = useState(100)

  useEffect(() => {
    setExpanded(defaultExpanded)
    setVisible(100)
  }, [node, defaultExpanded])

  const shown = children.slice(0, visible)

  return (
    <li className="min-w-0">
      <div
        className="flex flex-wrap items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30"
        style={{ paddingInlineStart: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-0.5 h-6 w-6 shrink-0 p-0"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-label={expanded ? `بستن ${path}` : `باز کردن ${path}`}
          >
            {expanded ? <ChevronDown /> : <ChevronLeft />}
          </Button>
        ) : (
          <span className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span dir="auto" className="break-all font-mono text-xs font-medium">{label}</span>
            <span className="rounded-full border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {typeLabels[node.type]}
            </span>
            {node.type === "number" && node.unsafe && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200">
                دقت ناامن
              </span>
            )}
            <span dir="ltr" className="min-w-0 break-all font-mono text-xs text-muted-foreground">
              {previewNode(node)}
            </span>
            <span className="ms-auto flex shrink-0 items-center gap-1">
              <CopyValueButton text={path} label={`کپی مسیر ${path}`} />
              <CopyValueButton text={valueForCopy(node)} label={`کپی مقدار ${path}`} />
            </span>
          </div>
          <p dir="ltr" className="break-all font-mono text-[10px] leading-4 text-muted-foreground/70">{path}</p>
        </div>
      </div>

      {hasChildren && expanded && (
        <>
          <ul className="space-y-0.5">
            {shown.map((child, index) => (
              <TreeNode
                key={`${child.key}-${index}`}
                node={child.node}
                path={child.path}
                label={child.label}
                depth={depth + 1}
              />
            ))}
          </ul>
          {children.length > visible && (
            <div style={{ paddingInlineStart: `${(depth + 1) * 14 + 8}px` }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVisible((current) => current + 100)}
              >
                نمایش ۱۰۰ مورد بعدی ({(children.length - visible).toLocaleString("fa-IR")} باقی‌مانده)
              </Button>
            </div>
          )}
        </>
      )}
    </li>
  )
}

export function JsonTree({ root }: { root: JsonNode }) {
  return (
    <div
      role="region"
      aria-label="نمای درختی JSON"
      className="max-h-[32rem] overflow-auto rounded-md border bg-muted/10 p-2"
    >
      <ul className="space-y-0.5">
        <TreeNode node={root} path="$" label="$" depth={0} defaultExpanded />
      </ul>
    </div>
  )
}
