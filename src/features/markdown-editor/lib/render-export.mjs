import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createMarkdownComponents } from "../markdown-components.mjs"
import { buildHtmlDocument } from "./export-html.mjs"
import { documentTitle } from "./filename.mjs"

const diagramLabel = "نمودار Mermaid"
const svgImage = /^data:image\/svg\+xml[;,]/

function renderWith(markdown, Diagram) {
  // Same safe pipeline as the preview: skipped raw HTML, filtered URLs, image placeholders.
  return renderToStaticMarkup(createElement(Markdown, {
    remarkPlugins: [remarkGfm], skipHtml: true, components: createMarkdownComponents(Diagram),
  }, markdown))
}

// Renders the body HTML. Diagrams are rendered first with `renderDiagram`, which
// returns an SVG data URI; any failure falls back to the diagram source as code.
export async function renderExportBody(markdown, renderDiagram) {
  const sources = new Set()
  renderWith(markdown, function CollectDiagram({ source }) {
    sources.add(source)
    return null
  })
  const images = new Map()
  for (const source of sources) {
    try {
      const image = await renderDiagram(source)
      if (typeof image === "string" && svgImage.test(image)) images.set(source, image)
    } catch {
      // Fall back to the source below.
    }
  }
  return renderWith(markdown, function ExportDiagram({ source }) {
    const image = images.get(source)
    if (image) return createElement("figure", { "aria-label": diagramLabel }, createElement("img", { src: image, alt: diagramLabel }))
    return createElement("figure", { "aria-label": diagramLabel },
      createElement("p", { className: "diagram-error" }, "نمایش نمودار ممکن نشد؛ کد آن:"),
      createElement("pre", { dir: "ltr" }, createElement("code", { dir: "ltr" }, source)))
  })
}

export async function renderExportDocument(markdown, renderDiagram) {
  const body = await renderExportBody(markdown, renderDiagram)
  return { body, html: buildHtmlDocument({ title: documentTitle(markdown) || "سند Markdown", body }) }
}
