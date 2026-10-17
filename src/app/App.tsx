import { Suspense, useEffect, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { defaultPath, features } from "./features"

function subscribeToRoute(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function currentPath() {
  return window.location.hash.slice(1) || defaultPath
}

export function App() {
  const path = useSyncExternalStore(subscribeToRoute, currentPath, () => defaultPath)
  const feature = features.find((entry) => entry.path === path)
  const Page = feature?.Page

  useEffect(() => {
    document.title = `${feature?.title ?? "صفحه پیدا نشد"} | Airgap`
  }, [feature])

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold" dir="ltr">Airgap</span>
          <nav aria-label="ابزارها" className="flex flex-wrap gap-2">
            {features.map(({ path: featurePath, title, icon: Icon }) => (
              <Button key={featurePath} variant={path === featurePath ? "secondary" : "ghost"} asChild>
                <a href={`#${featurePath}`} aria-current={path === featurePath ? "page" : undefined}><Icon />{title}</a>
              </Button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">در حال بارگذاری…</p>}>
          {Page ? <Page key={path} /> : (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">صفحه پیدا نشد</h1>
              <Button variant="outline" asChild><a href={`#${defaultPath}`}>بازگشت به صفحهٔ اصلی</a></Button>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}
