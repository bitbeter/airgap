# Add an independent feature

## Required changes

1. Choose a kebab-case slug, for example `json-format`.
2. Create `src/features/<slug>/page.tsx` and `index.ts`.
3. Implement the page using shared shadcn components. Add local `components/`, `hooks/`, `lib/`, or workers only when needed.
4. Add one registration in `src/app/features.ts`. Import the icon there. Do not edit `App.tsx`, `main.tsx`, or `text-diff` to add a page.
5. Add a short feature README describing its behavior, state/storage, and tests. Add meaningful logic tests under the feature's `tests/` directory.
6. Run `npm test` and `npm run build`. Check the new hash URL, generated navigation, refresh, back/forward, and existing diff behavior in a browser when available.

## Minimal page

`src/features/json-format/page.tsx`:

```tsx
export function JsonFormatPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">قالب‌بندی JSON</h1>
    </div>
  )
}
```

`src/features/json-format/index.ts`:

```ts
export { JsonFormatPage as default } from "./page"
```

In `src/app/features.ts`, import `Braces` from `lucide-react` and append this object to `features`:

```ts
{
  path: "/json-format",
  title: "قالب‌بندی JSON",
  icon: Braces,
  Page: lazy(() => import("@/features/json-format")),
},
```

The page is now available at `#/json-format`, with its own navigation item, active state, document title, and lazy-loaded bundle. Keep the existing `defaultPath` unless the requested feature should become the landing page.

## Feature-specific behavior

- Keep inputs and business logic local to the feature. Do not add feature conditions to the shell.
- Import shared components such as `@/components/ui/button` and `@/components/copy-button`; do not import another feature's components.
- Use a distinct versioned key such as `airgap:json-format:history:v1` if persistence is required. Never call `localStorage.clear()`.
- Handle unavailable storage and clipboard failures without breaking the page.
- Dispose workers, subscriptions, and timers when the feature unmounts.
- New pure `.mjs` helpers need matching `.d.mts` types if consumed by TypeScript, following the existing diff feature's convention.

## Example request for an AI agent

> طبق AGENTS.md و docs/adding-a-feature.md، قابلیت «قالب‌بندی JSON» را در src/features/json-format اضافه کن. صفحه باید ورودی چندخطی، قالب‌بندی JSON، نمایش خطای ورودی نامعتبر و کپی خروجی داشته باشد. رابط فارسی، راست‌به‌چپ و فقط دارک باشد و از shadcn موجود استفاده کند. قابلیت را در src/app/features.ts ثبت کن؛ منطق اختصاصی را داخل همان پوشه نگه دار و صفحهٔ diff را تغییر نده. README و تست‌های لازم را اضافه کن و npm test و npm run build را اجرا کن.
