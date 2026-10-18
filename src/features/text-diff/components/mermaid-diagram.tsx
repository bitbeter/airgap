import { useEffect, useState } from "react"

let nextId = 0
const maxSourceLength = 50_000
let renderer: Promise<typeof import("mermaid")["default"]> | undefined

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

export function MermaidDiagram({ source }: { source: string }) {
  const [image, setImage] = useState("")
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setImage("")
    setFailed(false)
    const timer = window.setTimeout(async () => {
      let container: HTMLDivElement | undefined
      try {
        if (source.length > maxSourceLength) throw new Error("Diagram too large")
        const mermaid = await loadRenderer()
        if (cancelled) return
        container = document.createElement("div")
        container.style.cssText = "position:absolute;left:-100000px;top:0;visibility:hidden;width:1000px"
        container.setAttribute("aria-hidden", "true")
        document.body.appendChild(container)
        const { svg } = await mermaid.render(`airgap-mermaid-${++nextId}`, source, container)
        // SVG loaded as an image cannot execute scripts or load external resources.
        if (!cancelled) setImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
      } catch {
        if (!cancelled) setFailed(true)
      } finally {
        container?.remove()
      }
    }, 150)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [source])

  return (
    <figure className="my-4 overflow-x-auto rounded-md border bg-background p-3" aria-label="نمودار Mermaid">
      {failed ? (
        <>
          <p role="alert" className="text-sm text-red-400">نمایش نمودار ممکن نشد؛ کد Mermaid را بررسی کنید یا نمودار را کوچک‌تر کنید.</p>
          <pre dir="ltr"><code>{source}</code></pre>
        </>
      ) : image ? <img className="mx-auto h-auto max-w-full" src={image} alt="نمودار Mermaid" onError={() => setFailed(true)} /> : <p role="status" className="text-sm text-muted-foreground">در حال رسم نمودار…</p>}
      {!failed && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer">کد نمودار</summary><pre dir="ltr"><code>{source}</code></pre></details>}
    </figure>
  )
}
