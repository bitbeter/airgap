# Architecture

Airgap is a client-side React + TypeScript + Vite application. Each tool is an isolated feature. The app shell discovers pages through one explicit registry, without importing their internals.

```text
src/
  main.tsx                       Mount React and global CSS
  index.css                      Global dark shadcn theme
  app/
    App.tsx                      Shell, hash navigation, header, loading and not-found states
    feature.ts                   Page registration contract, including description/keywords
    features.ts                  The only feature registration list
    home.tsx                     Tool launcher cards generated from the registry
    command-palette.tsx          Accessible fuzzy tool search and recent tools
    search.mjs                   Pure Persian-aware normalization and fuzzy ranking
    recent.mjs                   Versioned recent-path storage helpers
  components/
    ui/                          Shared shadcn primitives
    copy-button.tsx              Shared clipboard action
    file-open-button.tsx         Shared local file picker
    file-drop-zone.tsx           Shared drag-and-drop wrapper
    fullscreen.tsx               Shared fullscreen toggle and overlay fallback
  lib/
    utils.ts                     Shared class-name utility
    text-file.mjs                Pure file acceptance and decoding
    read-text-file.ts            Browser file reading and Persian messages
  features/
    text-diff/
      index.ts                   Public entry point
      page.tsx                   Compose the page
      hooks/use-text-diff.ts     State, worker lifecycle, history actions
      components/                Inputs, results, history, side-by-side rows
      lib/                       Pure comparison and persistence helpers
      diff.worker.ts             Background comparison
      tests/                     Feature tests
      README.md                  Feature-specific behavior and maintenance notes
tests/
  architecture.test.mjs          Import boundary checks
docs/
  adding-a-feature.md            New-page recipe and example agent prompt
```

## Dependency direction

```text
main → app → feature entry point → feature internals
         ↘ shared components and utilities ↗
```

Features do not depend on other features or the app shell. Shared modules do not depend on the app or features. `tests/architecture.test.mjs` checks these import boundaries. Move code into shared directories only when its responsibility is genuinely shared.

## Routing and loading

`src/app/features.ts` registers each page's path, Persian title, one-sentence description, search keywords, Lucide icon, and lazy component. The shell uses that same registry for navigation, the home page cards, and command-palette search. Adding a feature does not require editing the shell or another feature.

Routes use hashes, such as `#/text-diff`, so static hosting needs no history fallback configuration. `#/` is the home page; an empty hash still selects `defaultPath` (`/text-diff`). Unknown hashes show a not-found state. Native anchors and the `hashchange` subscription support refresh, direct links, and browser back/forward. The document title follows the selected page.

The header shows the full tool navigation on wide screens and a dropdown menu below the `xl` breakpoint. The logo links to `#/`. A command palette opens with Ctrl/⌘+K or `/` (the slash shortcut is ignored while typing in an input, textarea, select, or contenteditable element). Search is local and fuzzy over titles, descriptions, and keywords; it normalizes Arabic/Persian yeh and kaf, diacritics, and ZWNJ. The palette traps focus, closes with Escape, restores the previous focus, and supports arrow keys plus Enter. It lists the five most recently opened tool paths from `airgap:shell:recent:v1` (paths only, never tool content) and degrades quietly when storage is unavailable.

Features load lazily in development and the web build (`npm run build:web`). The default `npm run build` embeds JavaScript, CSS, and dynamic imports into a portable `dist/index.html` using `vite-plugin-singlefile`, so the file can be opened directly without a server. Both builds replace `dist`. The portable build trades deferred network loading for a larger self-contained file.

Features mount on demand. Navigating away unmounts the feature, so temporary form state resets. A feature must explicitly persist anything it needs to retain, using its own versioned storage key. The diff feature already retains its last three successful comparisons.

## State and side effects

Page components compose the interface. Feature hooks coordinate React state, workers, and storage. Pure comparison/storage helpers remain independently testable. Presentation components receive typed props and callbacks.

Keep expensive CPU work in a feature-local worker. Create worker URLs with the static `new URL("../diff.worker.ts", import.meta.url)` form so Vite emits the worker asset. Moving a hook or worker requires updating that relative path. The portable build uses the Vite `?worker&inline` import to create the same worker from an embedded Blob; development and web builds retain the separate worker asset. Both paths use the same cancellation and cleanup logic.

## Shared UI

Keep `src/components/ui`, `src/lib/utils.ts`, and the aliases in `components.json` stable so shadcn components remain easy to add. Use the existing dark tokens, Persian labels, and RTL document direction. Each page supplies its own heading; the shell supplies the header, navigation, and main container.

## Validation

`npm test` discovers `.test.mjs` files recursively, including new feature-local tests. `npm run build` checks TypeScript and builds the portable app with its embedded worker. `npm run build:web` checks the split build with lazy feature modules and worker assets. There is no configured browser-test runner; a successful build is not a browser interaction test.
