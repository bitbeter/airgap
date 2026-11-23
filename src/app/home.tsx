import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Feature } from "./feature"

export function Home({ features }: { features: Feature[] }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">ابزارهای Airgap</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          ابزارهای متنی و توسعه‌دهنده، همه در مرورگر و بدون ارسال داده. برای پیدا کردن سریع، از جست‌وجو
          (Ctrl/⌘+K یا /) استفاده کنید.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ path, title, description, icon: Icon }) => (
          <a
            key={path}
            href={`#${path}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors group-hover:border-foreground/30 group-hover:bg-accent/40">
              <CardHeader className="gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <CardDescription className="leading-6">
                  {description ?? "ابزاری محلی برای کار با متن."}
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
