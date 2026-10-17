# Working in Airgap

Read `docs/architecture.md` before changing project structure. For a new feature, follow `docs/adding-a-feature.md` and register it in `src/app/features.ts`.

## Product constraints

- Persian, RTL, dark-only web app. Use existing shadcn/ui components and theme tokens.
- Each tool has its own page. Do not add authentication, access management, a theme switcher, or a custom design system unless requested.
- Process user text locally. Do not introduce server calls or telemetry for text content.

## Ownership and boundaries

- `src/app/` owns the shell, navigation, feature registry, and hash routing. No tool business logic here.
- `src/features/<slug>/` owns one feature: page, components, hooks, pure logic, workers, tests, and its README.
- A feature's `index.ts` is its public entry point; it default-exports a page with no required props.
- Features may import their own files and shared code. Never import another feature or `src/app/` from a feature.
- Shared code lives in `src/components/` and `src/lib/`. It must not import feature or app code.
- App code imports features only through their root entry points. Register each page once; navigation is generated from the registry.
- Use relative imports within a feature and `@/` for shared modules. Keep feature-specific helpers out of shared directories.
- Add only the subdirectories a feature actually needs. Do not create generic frameworks for hypothetical features.

## Existing diff feature

- Start with `src/features/text-diff/README.md`.
- Preserve `#/text-diff`, the `airgap:diff-history:v1` storage key, the three-entry history limit, clipboard actions, and precise side-by-side diff behavior.
- Keep expensive comparisons in the worker. Terminate workers on cancellation, input changes, and unmount; ignore stale responses.
- Use jsdiff for comparison, not a handwritten diff algorithm.

## Validation

- `npm test`: Node tests, including feature boundaries and comparisons against Git. Git must be installed.
- `npm run build`: TypeScript and Vite, including lazy feature chunks and worker assets.
- Tests live beside their feature in `tests/*.test.mjs`; shared architecture tests live in root `tests/`.
- Pure `.mjs` modules run directly in Node; keep adjacent `.d.mts` declarations in sync when their public API changes.
- For page changes, check direct hash navigation, refresh, browser back/forward, RTL layout, and worker cleanup when a browser is available. Report any validation you cannot run.
