import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  msFullscreenElement?: Element | null
  msExitFullscreen?: () => Promise<void> | void
}

function currentFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null
}

function requestElementFullscreen(element: FullscreenElement): Promise<void> | void | null {
  const request = element.requestFullscreen ?? element.webkitRequestFullscreen ?? element.msRequestFullscreen
  return request ? request.call(element) : null
}

function exitDocumentFullscreen(): Promise<void> | void {
  const doc = document as FullscreenDocument
  const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen
  return exit?.call(doc)
}

export interface FullscreenControls<T extends HTMLElement = HTMLDivElement> {
  ref: RefObject<T | null>
  active: boolean
  overlay: boolean
  /** Classes that turn the target card into a full-viewport panel. */
  panelClassName: string
  toggle: () => void
  exit: () => void
}

/**
 * Fullscreen for a card: the browser Fullscreen API when available, with a
 * fixed in-page overlay as a fallback (for example on iOS Safari). The overlay
 * locks page scrolling and closes with Escape.
 */
export function useFullscreen<T extends HTMLElement = HTMLDivElement>(): FullscreenControls<T> {
  const ref = useRef<T>(null)
  const [native, setNative] = useState(false)
  const [overlay, setOverlay] = useState(false)

  useEffect(() => {
    const element = ref.current
    function sync() {
      setNative(currentFullscreenElement() === element)
    }
    sync()
    document.addEventListener("fullscreenchange", sync)
    document.addEventListener("webkitfullscreenchange", sync)
    document.addEventListener("MSFullscreenChange", sync)
    return () => {
      document.removeEventListener("fullscreenchange", sync)
      document.removeEventListener("webkitfullscreenchange", sync)
      document.removeEventListener("MSFullscreenChange", sync)
      // Leaving the page while its card is fullscreen should not strand the
      // browser in fullscreen mode.
      if (element && currentFullscreenElement() === element) {
        void Promise.resolve(exitDocumentFullscreen()).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (!overlay) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      setOverlay(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [overlay])

  const exit = useCallback(() => {
    setOverlay(false)
    if (currentFullscreenElement() === ref.current) {
      void Promise.resolve(exitDocumentFullscreen()).catch(() => {})
    }
  }, [])

  const toggle = useCallback(() => {
    if (native || overlay) {
      exit()
      return
    }
    const element = ref.current as FullscreenElement | null
    if (!element) return
    try {
      const request = requestElementFullscreen(element)
      if (request === null) {
        setOverlay(true)
        return
      }
      const promise = request as Promise<void> | undefined
      if (promise && typeof promise.catch === "function") {
        // A rejected request (unsupported or blocked) still gets a usable
        // in-page fullscreen.
        promise.catch(() => setOverlay(true))
      }
    } catch {
      setOverlay(true)
    }
  }, [native, overlay, exit])

  // `!m-0` beats the page's `space-y-*` margin on the card, which would
  // otherwise shift the fullscreen panel down by one spacing step.
  const panelClassName = overlay
    ? "fixed inset-0 z-50 !m-0 flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 bg-card"
    : native
      ? "!m-0 flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-card"
      : ""

  return { ref, active: native || overlay, overlay, panelClassName, toggle, exit }
}

interface FullscreenButtonProps {
  active: boolean
  onToggle: () => void
  /** Names the panel in the accessible label, for example "نتیجهٔ مقایسه". */
  label: string
}

export function FullscreenButton({ active, onToggle, label }: FullscreenButtonProps) {
  const action = active ? "خروج از تمام‌صفحه" : "تمام‌صفحه"
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="px-2"
      aria-pressed={active}
      aria-label={`${action} ${label}`}
      title={`${action} ${label}`}
      onClick={onToggle}
    >
      {active ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
    </Button>
  )
}
