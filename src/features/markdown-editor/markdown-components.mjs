import { createElement, useEffect, useState } from "react"

let nextDiagramId = 0
const maxSourceLength = 50_000
let renderer

function loadRenderer() {
  renderer ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "strict",
      suppressErrorRendering: true,
      maxTextSize: maxSourceLength,
      maxEdges: 500,
      flowchart: { htmlLabels: false },
      secure: ["secure", "securityLevel", "startOnLoad", "maxTextSize", "maxEdges", "suppressErrorRendering", "theme", "flowchart"],
    })
    return mermaid
  }).catch((error) => {
    renderer = undefined
    throw error
  })
  return renderer
}

export function looksLikeMermaid(source) {
  const firstLine = source.trim().split(/\r?\n/, 1)[0].trim()
  if (/^(?:graph|flowchart)\s+(?:TB|TD|BT|RL|LR)\b/i.test(firstLine)) return true
  return /^(?:sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|gitGraph|mindmap|timeline|zenuml|sankey|xychart(?:-beta)?|block-beta)\b/.test(firstLine)
}

function codeSource(node) {
  return (node?.children ?? []).map((child) => child?.value ?? "").join("")
}

// Renders a diagram to an SVG data URI. An SVG loaded as an image cannot
// execute scripts or load external resources, in the page or in exports.
export async function renderMermaid(source, isCancelled = () => false) {
  if (source.length > maxSourceLength) throw new Error("Diagram too large")
  const mermaid = await loadRenderer()
  if (isCancelled()) throw new Error("Cancelled")
  const container = document.createElement("div")
  container.style.cssText = "position:absolute;left:-100000px;top:0;visibility:hidden;width:1000px"
  container.setAttribute("aria-hidden", "true")
  document.body.appendChild(container)
  try {
    const { svg } = await mermaid.render(`airgap-mermaid-${++nextDiagramId}`, source, container)
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } finally {
    container.remove()
  }
}

export function MermaidDiagram({ source }) {
  const [image, setImage] = useState("")
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setImage("")
    setFailed(false)
    const timer = window.setTimeout(async () => {
      try {
        const image = await renderMermaid(source, () => cancelled)
        if (!cancelled) setImage(image)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }, 150)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [source])

  return createElement(
    "figure",
    { className: "my-4 overflow-x-auto rounded-md border bg-background p-3", "aria-label": "نمودار Mermaid" },
    failed
      ? createElement(
        "div",
        null,
        createElement("p", { role: "alert", className: "text-sm text-red-400" }, "نمایش نمودار ممکن نشد؛ کد Mermaid را بررسی کنید یا نمودار را کوچک‌تر کنید."),
        createElement("pre", { dir: "ltr" }, createElement("code", null, source)),
      )
      : image
        ? createElement("img", {
            className: "mx-auto h-auto max-w-full",
            src: image,
            alt: "نمودار Mermaid",
            onError: () => setFailed(true),
          })
        : createElement("p", { role: "status", className: "text-sm text-muted-foreground" }, "در حال رسم نمودار…"),
    !failed && createElement(
      "details",
      { className: "mt-2 text-xs text-muted-foreground" },
      createElement("summary", { className: "cursor-pointer" }, "کد نمودار"),
      createElement("pre", { dir: "ltr" }, createElement("code", null, source)),
    ),
  )
}

function plainText(children) {
  if (typeof children === "string" || typeof children === "number") return String(children)
  if (Array.isArray(children)) return children.map(plainText).join("")
  if (children && typeof children === "object" && "props" in children) return plainText(children.props.children)
  return ""
}

// Let the browser apply Unicode first-strong detection to each text block.
// A single auto direction on the preview would make later blocks inherit it.
const autoBlocks = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "th", "td"]

// `data-source-line` maps a rendered block back to its Markdown line for the
// outline and scroll sync. It is opt-in so exports and direction tests keep
// their exact markup.
function sourceLineAttributes(node) {
  const line = node?.position?.start?.line
  return typeof line === "number" && Number.isFinite(line) ? { "data-source-line": String(line) } : {}
}

// The preview and exports share one safe renderer and differ only in how a
// Mermaid diagram is displayed.
export function createMarkdownComponents(Diagram, options = {}) {
  const withSourceLines = options.sourceLines === true
  const lineAttributes = (node) => withSourceLines ? sourceLineAttributes(node) : {}

  const components = Object.fromEntries(autoBlocks.map((tag) => [
    tag,
    function AutoDirection({ node, ...props }) {
      return createElement(tag, { ...props, dir: "auto", ...lineAttributes(node) })
    },
  ]))

  components.p = function Paragraph({ node, children, ...props }) {
    const source = plainText(children).trim()
    if (looksLikeMermaid(source)) return createElement(Diagram, { source })
    return createElement("p", { ...props, dir: "auto", ...lineAttributes(node) }, children)
  }

  components.pre = function CodeBlock({ children, node }) {
    const code = node?.children?.find((child) => child?.type === "element" && child?.tagName === "code")
    const className = code?.properties?.className
    const classes = Array.isArray(className) ? className : typeof className === "string" ? className.split(/\s+/) : []
    const source = codeSource(code)
    const isMermaid = classes.some((name) => name.toLowerCase() === "language-mermaid") || looksLikeMermaid(source)
    if (isMermaid) return createElement(Diagram, { source: source.trim() })
    return createElement("pre", { dir: "ltr", ...lineAttributes(node) }, children)
  }

  components.code = function Code({ node: _node, ...props }) {
    return createElement("code", { ...props, dir: "ltr" })
  }

  components.img = function ImagePlaceholder({ alt }) {
    return createElement("span", { dir: "rtl", className: "text-muted-foreground" },
      "[تصویر: ", createElement("bdi", null, alt || "بدون توضیح"), " — بارگیری خارجی غیرفعال است]")
  }

  components.a = function Link({ href, children }) {
    return createElement("a", { href, target: "_blank", rel: "noopener noreferrer" }, children)
  }

  return components
}

export const markdownComponents = createMarkdownComponents(MermaidDiagram)
export const markdownComponentsWithSourceLines = createMarkdownComponents(MermaidDiagram, { sourceLines: true })
