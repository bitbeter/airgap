import { useEffect, useRef, type RefObject } from "react"
import {
  estimateRowsPerLine, lineFromBlocks, lineScrollTops, topForLine,
} from "../lib/scroll-map.mjs"

interface ScrollSyncOptions {
  sourceRef: RefObject<HTMLTextAreaElement | null>
  previewRef: RefObject<HTMLElement | null>
  /** Current editor text; used to estimate source-line offsets. */
  text: string
  /** Text currently rendered in the preview; invalidates block positions. */
  previewText: string
  enabled: boolean
}

function lineHeightOf(style: CSSStyleDeclaration): number {
  const lineHeight = Number.parseFloat(style.lineHeight)
  if (Number.isFinite(lineHeight)) return lineHeight
  const fontSize = Number.parseFloat(style.fontSize)
  return Number.isFinite(fontSize) ? fontSize * 1.5 : 20
}

function contentWidth(source: HTMLTextAreaElement, style: CSSStyleDeclaration): number {
  const padding = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
  return Math.max(0, source.clientWidth - padding)
}

// Measures text with the textarea's own font. Canvas metrics are cached per
// distinct word, so a long document costs one measurement per unique token.
function createMeasure(style: CSSStyleDeclaration) {
  const context = document.createElement("canvas").getContext("2d")
  if (context) context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const cache = new Map<string, number>()
  const fallback = (Number.parseFloat(style.fontSize) || 16) * 0.6
  return (value: string) => {
    if (!context) return value.length * fallback
    const cached = cache.get(value)
    if (cached !== undefined) return cached
    const width = context.measureText(value).width
    cache.set(value, width)
    return width
  }
}

// Scroll offset that puts a source line at the top of the editor. Textarea
// wrapping is estimated, so this is approximate rather than exact.
export function editorScrollTopForLine(source: HTMLTextAreaElement, text: string, line: number): number {
  const style = window.getComputedStyle(source)
  const measure = createMeasure(style)
  const rows = estimateRowsPerLine(text, measure, contentWidth(source, style))
  const tops = lineScrollTops(rows, lineHeightOf(style), Number.parseFloat(style.paddingTop) || 0)
  const maximum = Math.max(0, source.scrollHeight - source.clientHeight)
  return Math.min(Math.max(topForLine(tops, line), 0), maximum)
}

// Scrolls the editor to follow the preview (preview → editor only). Work is
// coalesced into one animation frame per scroll burst, and the listener is
// removed when sync is disabled or the page unmounts. There is no editor
// scroll listener, so the two panes cannot feed back into each other.
export function useScrollSync({ sourceRef, previewRef, text, previewText, enabled }: ScrollSyncOptions) {
  const textRef = useRef(text)
  const previewTextRef = useRef(previewText)
  textRef.current = text
  previewTextRef.current = previewText

  useEffect(() => {
    if (!enabled) return
    const preview = previewRef.current
    const source = sourceRef.current
    if (!preview || !source) return

    const style = window.getComputedStyle(source)
    const measure = createMeasure(style)
    const lineHeight = lineHeightOf(style)
    const paddingTop = Number.parseFloat(style.paddingTop) || 0
    let frame = 0
    let lineCache: { text: string; width: number; tops: number[] } | null = null
    let blockCache: { key: string; blocks: { line: number; top: number }[] } | null = null

    const topsForCurrentText = () => {
      const width = contentWidth(source, style)
      const current = textRef.current
      if (!lineCache || lineCache.text !== current || lineCache.width !== width) {
        lineCache = {
          text: current,
          width,
          tops: lineScrollTops(estimateRowsPerLine(current, measure, width), lineHeight, paddingTop),
        }
      }
      return lineCache.tops
    }

    const blocksForCurrentPreview = () => {
      // Rendered heights change with the preview text, with async Mermaid
      // rendering, and with resizes; scrollHeight covers the last two.
      const key = `${previewTextRef.current}\u0000${preview.scrollHeight}`
      if (blockCache?.key === key) return blockCache.blocks
      const previewTop = preview.getBoundingClientRect().top
      const blocks = Array.from(preview.querySelectorAll<HTMLElement>("[data-source-line]"))
        .map((element) => ({
          line: Number(element.dataset.sourceLine),
          top: element.getBoundingClientRect().top - previewTop + preview.scrollTop,
        }))
        .filter((block) => Number.isFinite(block.line) && block.line > 0)
        .sort((a, b) => a.top - b.top)
      blockCache = { key, blocks }
      return blocks
    }

    const sync = () => {
      frame = 0
      const blocks = blocksForCurrentPreview()
      if (blocks.length === 0) return
      const line = lineFromBlocks(blocks, preview.scrollTop)
      const maximum = Math.max(0, source.scrollHeight - source.clientHeight)
      const next = Math.min(Math.max(topForLine(topsForCurrentText(), line), 0), maximum)
      if (Math.abs(source.scrollTop - next) > 1) source.scrollTop = next
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    const invalidate = () => {
      lineCache = null
      blockCache = null
    }

    preview.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", invalidate)
    return () => {
      preview.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", invalidate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [enabled, previewRef, sourceRef])
}
