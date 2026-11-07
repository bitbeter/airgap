# Text diff

Public entry: `index.ts`. Route: `#/text-diff`.

## File responsibilities

- `page.tsx`: compose inputs, actions, result, and history.
- `hooks/use-text-diff.ts`: input/result state, worker creation and cleanup, cancellation, and history actions.
- `components/text-input.tsx`: labeled input, character/line counts, and shared copy button.
- `components/diff-result.tsx`: result status, change navigation, collapse and whitespace toggles, cancellation, and full results.
- `components/diff-view.tsx`: aligned side-by-side rows, collapsed-range placeholders, active-change marker, grapheme highlights, and invisible-character markers.
- `components/diff-minimap.tsx`: canvas change overview, viewport indicator, pointer and keyboard scroll navigation; measures rendered row heights and observes layout changes.
- `components/diff-history.tsx`: stored comparisons, previews, reopen and clear actions.
- `lib/compare.mjs`: pure jsdiff comparison; public types in `compare.d.mts`.
- `lib/hunks.mjs`: pure grouping of changed rows and collapsing of unchanged runs; public types in `hunks.d.mts`.
- `lib/history.mjs`: storage validation and retention; public types in `history.d.mts`.
- `diff.worker.ts`: worker request/response adapter.
- `tests/`: comparison, Git compatibility, change navigation/collapsing, and storage regression tests.

## Behavior to preserve

Both text inputs support copying, swapping, and clearing. Editing cancels pending work and invalidates the old result. Comparison runs locally in a Web Worker. Leaving the page terminates its worker; stale responses must not update state or save history.

jsdiff `diffLines` uses Myers for line changes. `diffArrays` handles block alignment and grapheme-level inline changes. The app does not execute Git in the browser; repeated content and Git's hunk-shifting heuristics can produce different output. Compatibility tests compare selected fixtures to `git diff --no-index --diff-algorithm=myers --no-indent-heuristic`.

Preserve spaces, tabs, ZWNJ, LF/CRLF differences, and missing final newlines. Do not split emoji or combining characters. Render user content as React text, never injected HTML. All aligned result rows are displayed together in one scrollable view without pagination. A minimap beside the results marks original changes in red and new changes in green, with an outlined viewport. Click or drag to scroll; keyboard users can use arrows, Page Up/Down, Home, and End. Wrapped rows are mapped by their rendered heights. Scroll drawing is scheduled with animation frames; observers and listeners are cleaned up on unmount. The comparison has a four-second algorithm timeout and an explicit cancel action.

## Change navigation and collapsing

A change is one contiguous block of modified, added, or removed rows. "Previous change" and "Next change" buttons, and the N/J and P/K keys while focus is inside the result, move between blocks without wrapping. Shortcuts use physical key codes, so they also work with a Persian keyboard layout. The current block gets a side marker and is scrolled to the center (instantly when reduced motion is preferred); a polite live counter reports "change 3 of 12".

"Only changes and 3 surrounding lines" is off by default, so the full result is unchanged unless the user opts in. When on, unchanged runs keep three context lines next to each change; leading and trailing runs keep context only on the changed side. A hidden range must contain at least two rows, otherwise it stays visible. Each hidden range is a keyboard-accessible button that expands only that range. Change rows are never hidden. The setting persists while the page stays open; the navigation position and expanded ranges reset with each new result, so editing an input resets them. Nothing is stored.

Rendered rows carry `data-diff-row` (their kind) and `data-diff-index`. The minimap reads kinds from the rendered rows, so collapsed ranges do not shift its markers; its resize observer remeasures after expanding.

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

Git is required for compatibility tests. In a browser, also check copy, cancel, swap, change navigation and shortcuts, collapsing and expanding with the minimap, inline highlights, whitespace display, results longer than 200 rows, history across reloads, and navigation away during comparison.
