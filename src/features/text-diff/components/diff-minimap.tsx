import { useEffect, useRef, useState, type RefObject } from "react"
import type { DiffRow } from "../lib/compare.mjs"

type Props = {
  rows: DiffRow[]
  scrollRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  showWhitespace: boolean
}

export function DiffMinimap({ rows, scrollRef, contentRef, showWhitespace }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [position, setPosition] = useState(0)

  useEffect(() => {
    const scroll = scrollRef.current
    const content = contentRef.current
    const canvas = canvasRef.current
    if (!scroll || !content || !canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    let frame = 0
    let markers: { top: number; height: number; kind: DiffRow["kind"] }[] = []

    function paint() {
      if (!scroll || !canvas || !context) return
      const { width, height } = canvas.getBoundingClientRect()
      const scale = window.devicePixelRatio || 1
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.scale(scale, scale)
      const total = Math.max(1, scroll.scrollHeight)
      for (const marker of markers) {
        const y = marker.top / total * height
        const h = Math.max(2, marker.height / total * height)
        // Original is the right column in the RTL comparison.
        if (marker.kind !== "added") {
          context.fillStyle = "#f87171"
          context.fillRect(width / 2 + 1, y, width / 2 - 3, h)
        }
        if (marker.kind !== "removed") {
          context.fillStyle = "#4ade80"
          context.fillRect(2, y, width / 2 - 3, h)
        }
      }
      const viewHeight = Math.min(height, Math.max(6, scroll.clientHeight / total * height))
      const top = Math.min(height - viewHeight, scroll.scrollTop / total * height)
      context.fillStyle = "rgba(255,255,255,0.10)"
      context.fillRect(0, top, width, viewHeight)
      context.strokeStyle = "rgba(255,255,255,0.85)"
      context.lineWidth = 1
      context.strokeRect(.5, top + .5, width - 1, Math.max(0, viewHeight - 1))
      const maxScroll = scroll.scrollHeight - scroll.clientHeight
      setPosition(maxScroll > 0 ? Math.round(scroll.scrollTop / maxScroll * 100) : 0)
    }

    function measure() {
      if (!content) return
      const origin = content.getBoundingClientRect().top
      markers = Array.from(content.querySelectorAll<HTMLElement>("[data-diff-row]")).flatMap((element, index) => {
        const kind = rows[index]?.kind
        if (!kind || kind === "same") return []
        const bounds = element.getBoundingClientRect()
        return [{ top: bounds.top - origin, height: bounds.height, kind }]
      })
      paint()
    }

    function onScroll() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(paint)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(scroll)
    observer.observe(content)
    observer.observe(canvas)
    scroll.addEventListener("scroll", onScroll, { passive: true })
    measure()
    return () => {
      observer.disconnect()
      scroll.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [rows, scrollRef, contentRef, showWhitespace])

  function seek(clientY: number) {
    const scroll = scrollRef.current
    const canvas = canvasRef.current
    if (!scroll || !canvas) return
    const bounds = canvas.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - bounds.top) / Math.max(1, bounds.height)))
    scroll.scrollTop = ratio * scroll.scrollHeight - scroll.clientHeight / 2
  }

  return (
    <div className="relative w-10 shrink-0 rounded-md border bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="slider" tabIndex={0} aria-label="نقشهٔ تغییرات؛ برای جابه‌جایی از کلیدهای بالا و پایین استفاده کنید"
      aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={position}
      aria-valuetext={`${position.toLocaleString("fa-IR")} درصد از مسیر پیمایش`}
      title="نقشهٔ تغییرات: قرمز متن اصلی، سبز متن جدید؛ برای رفتن به هر بخش کلیک کنید یا بکشید."
      onKeyDown={(event) => {
        const scroll = scrollRef.current
        if (!scroll) return
        const steps: Record<string, number> = { ArrowDown: 40, ArrowUp: -40, PageDown: scroll.clientHeight, PageUp: -scroll.clientHeight }
        if (event.key in steps) scroll.scrollTop += steps[event.key]
        else if (event.key === "Home") scroll.scrollTop = 0
        else if (event.key === "End") scroll.scrollTop = scroll.scrollHeight
        else return
        event.preventDefault()
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        seek(event.clientY)
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) seek(event.clientY)
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      style={{ touchAction: "none" }}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-pointer rounded-md" />
    </div>
  )
}
