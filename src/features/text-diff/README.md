# Text diff

Public entry: `index.ts`. Route: `#/text-diff`.

## File responsibilities

- `page.tsx`: compose inputs, actions, result, and history.
- `hooks/use-text-diff.ts`: input/result state, worker creation and cleanup, cancellation, and history actions.
- `components/text-input.tsx`: labeled input, character/line counts, and shared copy button.
- `components/diff-result.tsx`: result status, whitespace toggle, cancellation, and full results.
- `components/diff-view.tsx`: aligned side-by-side rows, grapheme highlights, and invisible-character markers.
- `components/diff-minimap.tsx`: canvas change overview, viewport indicator, pointer and keyboard scroll navigation; measures rendered row heights and observes layout changes.
- `components/diff-history.tsx`: stored comparisons, previews, reopen and clear actions.
- `lib/compare.mjs`: pure jsdiff comparison; public types in `compare.d.mts`.
- `lib/history.mjs`: storage validation and retention; public types in `history.d.mts`.
- `diff.worker.ts`: worker request/response adapter.
- `tests/`: comparison, Git compatibility, and storage regression tests.

## Behavior to preserve

Both text inputs support copying, swapping, and clearing. Editing cancels pending work and invalidates the old result. Comparison runs locally in a Web Worker. Leaving the page terminates its worker; stale responses must not update state or save history.

jsdiff `diffLines` uses Myers for line changes. `diffArrays` handles block alignment and grapheme-level inline changes. The app does not execute Git in the browser; repeated content and Git's hunk-shifting heuristics can produce different output. Compatibility tests compare selected fixtures to `git diff --no-index --diff-algorithm=myers --no-indent-heuristic`.

Preserve spaces, tabs, ZWNJ, LF/CRLF differences, and missing final newlines. Do not split emoji or combining characters. Render user content as React text, never injected HTML. All aligned result rows are displayed together in one scrollable view without pagination. A minimap beside the results marks original changes in red and new changes in green, with an outlined viewport. Click or drag to scroll; keyboard users can use arrows, Page Up/Down, Home, and End. Wrapped rows are mapped by their rendered heights. Scroll drawing is scheduled with animation frames; observers and listeners are cleaned up on unmount. The comparison has a four-second algorithm timeout and an explicit cancel action.

## Markdown preview

A shared text/preview toggle renders both current inputs side by side without requiring a comparison. Returning to text preserves the inputs and comparison. Markdown supports GFM tables, task lists, strikethrough, and fenced code; fenced `mermaid` blocks render dark diagrams. Preview and Mermaid load lazily. Raw HTML is skipped and remote Markdown images are replaced with labels to avoid background requests. Links open only on user action.

Mermaid uses strict security, bounded source/edge counts, and SVG image output rather than injecting generated HTML into the page. Diagram errors show the source and a Persian error; stale asynchronous results are ignored, and temporary render containers are removed. The preview displays formatted documents, not highlighted semantic differences; precise changes remain in the existing comparison result.

## Storage contract

Key: `airgap:diff-history:v1`. Value: an array of `{ before, after, savedAt }` objects. Keep the three most recent distinct successful pairs, newest first. Repeating a pair promotes it; opening an entry recalculates the result without changing history order. Failed or cancelled comparisons do not save. Do not change this key or schema without a migration.

Storage failures show a message without discarding the displayed comparison. Clearing history removes only this feature's key. Neither text nor results are sent to a server.

## Validation

```sh
node --test src/features/text-diff/tests/*.test.mjs
npm test
npm run build
```

Git is required for compatibility tests. In a browser, also check copy, cancel, swap, inline highlights, whitespace display, results longer than 200 rows, history across reloads, and navigation away during comparison.
