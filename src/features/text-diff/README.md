# Text diff

Public entry: `index.ts`. Route: `#/text-diff`.

## File responsibilities

- `page.tsx`: compose inputs, actions, result, and history.
- `hooks/use-text-diff.ts`: input/result state, worker creation and cleanup, cancellation, pagination reset, and history actions.
- `components/text-input.tsx`: labeled input, character/line counts, and shared copy button.
- `components/diff-result.tsx`: result status, whitespace toggle, cancellation, and pagination.
- `components/diff-view.tsx`: aligned side-by-side rows, grapheme highlights, and invisible-character markers.
- `components/diff-history.tsx`: stored comparisons, previews, reopen and clear actions.
- `lib/compare.mjs`: pure jsdiff comparison; public types in `compare.d.mts`.
- `lib/history.mjs`: storage validation and retention; public types in `history.d.mts`.
- `diff.worker.ts`: worker request/response adapter.
- `tests/`: comparison, Git compatibility, and storage regression tests.

## Behavior to preserve

Both text inputs support copying, swapping, and clearing. Editing cancels pending work and invalidates the old result. Comparison runs locally in a Web Worker. Leaving the page terminates its worker; stale responses must not update state or save history.

jsdiff `diffLines` uses Myers for line changes. `diffArrays` handles block alignment and grapheme-level inline changes. The app does not execute Git in the browser; repeated content and Git's hunk-shifting heuristics can produce different output. Compatibility tests compare selected fixtures to `git diff --no-index --diff-algorithm=myers --no-indent-heuristic`.

Preserve spaces, tabs, ZWNJ, LF/CRLF differences, and missing final newlines. Do not split emoji or combining characters. Render user content as React text, never injected HTML. Results paginate at 200 aligned rows. The comparison has a four-second algorithm timeout and an explicit cancel action.

## Storage contract

Key: `airgap:diff-history:v1`. Value: an array of `{ before, after, savedAt }` objects. Keep the three most recent distinct successful pairs, newest first. Repeating a pair promotes it; opening an entry recalculates the result without changing history order. Failed or cancelled comparisons do not save. Do not change this key or schema without a migration.

Storage failures show a message without discarding the displayed comparison. Clearing history removes only this feature's key. Neither text nor results are sent to a server.

## Validation

```sh
node --test src/features/text-diff/tests/*.test.mjs
npm test
npm run build
```

Git is required for compatibility tests. In a browser, also check copy, cancel, swap, inline highlights, whitespace display, pagination, history across reloads, and navigation away during comparison.
