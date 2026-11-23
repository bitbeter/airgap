import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommandPalette } from "./command-palette"
import type { Feature } from "./feature"
import { defaultPath, features } from "./features"
import { Home } from "./home"
import { readRecentPaths, rememberRecentPath } from "./recent.mjs"

function subscribeToRoute(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function currentPath() {
  return window.location.hash.slice(1) || defaultPath
}

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const shortcutLabel =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "⌘K" : "Ctrl K"

export function App() {
  const path = useSyncExternalStore(subscribeToRoute, currentPath, () => defaultPath)
  const isHome = path === "/"
  const feature = features.find((entry) => entry.path === path)
  const Page = feature?.Page
  const pageTitle = isHome ? "خانه" : (feature?.title ?? "صفحه پیدا نشد")

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [recentPaths, setRecentPaths] = useState(() => readRecentPaths(getStorage()))
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = `${pageTitle} | Airgap`
  }, [pageTitle])

  useEffect(() => {
    setMenuOpen(false)
    setPaletteOpen(false)
  }, [path])

  useEffect(() => {
    const active = features.find((entry) => entry.path === path)
    if (!active) return
    setRecentPaths(rememberRecentPath(getStorage(), active.path))
  }, [path])

  useEffect(() => {
    if (paletteOpen) setMenuOpen(false)
  }, [paletteOpen])

  useEffect(() => {
    if (!menuOpen) return

    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  function openPalette() {
    setMenuOpen(false)
    setPaletteOpen(true)
  }

  function selectFeature(selected: Feature) {
    window.location.hash = selected.path
    setPaletteOpen(false)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <a href="#/" className="text-lg font-semibold" dir="ltr" aria-label="Airgap، صفحهٔ خانه">
              Airgap
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openPalette}
              aria-label="جست‌وجوی ابزارها (Ctrl+K)"
              className="gap-2 text-muted-foreground"
            >
              <Search />
              <span className="hidden sm:inline">جست‌وجو</span>
              <kbd className="hidden rounded border px-1 font-sans text-[10px] lg:inline">{shortcutLabel}</kbd>
            </Button>
          </div>

          <nav aria-label="ابزارها" className="hidden items-center gap-0.5 xl:flex">
            {features.map(({ path: featurePath, title, icon: Icon }) => (
              <Button
                key={featurePath}
                variant={path === featurePath ? "secondary" : "ghost"}
                size="sm"
                asChild
                className="gap-1 px-1.5"
              >
                <a href={`#${featurePath}`} aria-current={path === featurePath ? "page" : undefined}>
                  <Icon />
                  {title}
                </a>
              </Button>
            ))}
          </nav>

          <div ref={menuRef} className="relative xl:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="منوی ابزارها"
              aria-expanded={menuOpen}
              aria-controls="mobile-tools-menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <Menu />
            </Button>
            {menuOpen ? (
              <nav
                id="mobile-tools-menu"
                aria-label="ابزارها"
                className="absolute end-0 top-full z-40 mt-2 w-64 rounded-md border bg-card p-2 shadow-lg"
              >
                {features.map(({ path: featurePath, title, icon: Icon }) => (
                  <Button
                    key={featurePath}
                    variant={path === featurePath ? "secondary" : "ghost"}
                    asChild
                    className="w-full justify-start"
                  >
                    <a
                      href={`#${featurePath}`}
                      aria-current={path === featurePath ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon />
                      {title}
                    </a>
                  </Button>
                ))}
              </nav>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">در حال بارگذاری…</p>}>
          {isHome ? (
            <Home features={features} />
          ) : Page ? (
            <Page key={path} />
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">صفحه پیدا نشد</h1>
              <Button variant="outline" asChild>
                <a href="#/">بازگشت به صفحهٔ اصلی</a>
              </Button>
            </div>
          )}
        </Suspense>
      </main>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        features={features}
        recentPaths={recentPaths}
        onSelect={selectFeature}
      />
    </div>
  )
}
