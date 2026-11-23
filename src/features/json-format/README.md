# JSON formatter and validator

Public entry: `index.ts`. Route: `#/json-format`. Title: «قالب‌بندی JSON». Icon: `Braces`.

The page formats, minifies, validates, and explores JSON locally. It never stores the input and never sends text anywhere.

## File responsibilities

- `page.tsx`: heading, privacy note, two-column workspace, sample loading, and jumping the caret to an error or warning position.
- `hooks/use-json-format.ts`: input/settings state, debounced processing, worker lifecycle, cancellation, and settings storage.
- `components/json-input.tsx`: LTR monospace input, character/line counts, sample and clear actions.
- `components/json-settings.tsx`: format/minify mode, indent choice, recursive key sorting, JSONC acceptance, reset, and storage status.
- `components/json-output.tsx`: text/tree tabs, copy action, stats, unsafe-number warnings, located errors, cancellation, and retry.
- `components/json-tree.tsx`: collapsible tree with the path and type of every node, copy-path/copy-value actions, and chunked child rendering.
- `lib/tokenize.mjs`: lossless JSON/JSONC lexer; public types in `tokenize.d.mts`.
- `lib/format.mjs`: parser, lossless serializer, stats, unsafe-number detection, paths, and settings storage; public types in `format.d.mts`.
- `lib/locate-error.mjs`: line/column calculation and Persian error messages; public types in `locate-error.d.mts`.
- `lib/sample.mjs`: the demo document behind the «نمونه» button; public type in `sample.d.mts`.
- `json.worker.ts`: background adapter for inputs larger than 1,000,000 characters.
- `tests/format.test.mjs`: formatting/minifying against `JSON.stringify(JSON.parse(...))`, big numbers, escapes, JSONC, stats, paths, and storage.
- `tests/locate-error.test.mjs`: line/column and Persian messages for trailing commas, missing quotes, unclosed brackets, and other syntax errors.

## Lossless formatting

The formatter is token-based, not `JSON.parse` + `JSON.stringify`. String tokens and number tokens are emitted with their original spelling, so:

- `12345678901234567890` and `-9007199254740993` stay exactly as written.
- Persian strings stay Persian.
- Escapes such as `\n`, `\"`, `\/`, and `\u06A9` keep their original spelling.
- Exponent forms such as `1e3` are not rewritten as `1000`.

The tradeoff is that the output is not always byte-identical to `JSON.stringify(JSON.parse(x))`; tests compare against it for inputs whose number and string spellings are already canonical.

Indent choices are two spaces, four spaces, or a tab. Minify removes all insignificant whitespace. Recursive key sorting compares decoded keys by code unit and never reorders array items. Empty objects and arrays stay `{}` and `[]`.

## Validation and errors

The parser rejects trailing commas, comments, missing commas/colons, unterminated strings, invalid escapes, raw control characters, invalid numbers/literals, unexpected characters, trailing content, and unclosed brackets. Errors carry a code, a character position, and an optional detail object.

`locateError` converts that into a Persian message plus 1-based line and column and the offending line text. The output card highlights the character at the error position; clicking the line focuses the input and places the caret at the exact offset. For an unclosed bracket the message names both the opening position and the end of the input. CRLF and LF produce the same line/column results.

## JSONC

When «پذیرش JSONC» is on, `//` and `/* … */` comments are skipped and a single trailing comma before `}` or `]` is accepted. Comment markers inside strings are not treated as comments. The output is always standard JSON; comments are removed and trailing commas are not emitted. With the setting off, the same inputs report the corresponding syntax error.

## Tree view

The tree is built from the same lossless syntax tree as the formatted output. Each node shows its type, a short preview, and its path such as `$.users[2].name`. Keys that are valid Unicode identifiers use dot notation; other keys use bracket notation with JSON quoting, for example `$["first name"]`. Every node has separate copy-path and copy-value buttons. Objects and arrays are collapsible and render at most 100 children at a time with a «نمایش ۱۰۰ مورد بعدی» action. Numbers outside the safe range get a «دقت ناامن» badge.

## Stats and unsafe numbers

Stats show input and output byte sizes, the total number of object keys, the maximum container depth, and the node count. A primitive root has depth 0; an object or array root has depth 1.

A number is flagged when it is an integer outside `Number.MIN_SAFE_INTEGER`/`Number.MAX_SAFE_INTEGER`, when it is not finite, or when a decimal/exponent form has more than 15 significant digits. The warning lists the path and the original token, and clicking it jumps to the number. The output still contains the original token, so the warning only matters if the output is later read with `JSON.parse`.

## Storage and privacy

Key: `airgap:json-format:settings:v1`. Value: `{ indent, sortKeys, jsonc, minify }`, where `indent` is `2`, `4`, or `"tab"`. Missing, malformed, partial, or unknown fields fall back per field to the defaults. Settings are saved on every change. The JSON text, parsed tree, warnings, and errors are never written to `localStorage` or `sessionStorage` and disappear when the page unmounts.

Storage failures keep the in-memory settings and show a Persian message. Clipboard failures are handled by the shared copy button and by the tree's copy buttons without breaking the page.

## Worker

Inputs longer than 1,000,000 characters are processed in `json.worker.ts`; smaller inputs run synchronously after a 300 ms debounce. Changing the input or a setting, cancelling, or unmounting terminates the worker. Stale responses are ignored by request id and worker identity. The portable build uses the inline worker import; development and the web build use the emitted worker asset. Cancelling shows a retry action instead of a stale result.

## Limits

- Duplicate object keys are preserved in the output and shown in the tree. The formatter does not silently keep only the last value.
- Sorting uses code-unit order, not locale-aware Persian collation.
- The tree renders children in chunks; very large documents still produce a large syntax tree in memory.
- JSONC accepts comments and trailing commas only; it does not accept single quotes, unquoted keys, or other JSON5 extensions.
- The worker threshold is based on JavaScript string length, not UTF-8 bytes.

## Validation

```sh
node --test src/features/json-format/tests/*.test.mjs
npm test
npm run build
npm run build:web
```

Browser checks should cover direct `#/json-format` navigation, refresh, back/forward, RTL layout with an LTR code area, format/minify and indent changes, key sorting, JSONC on/off, error highlighting and caret jumps, tree expansion and copy actions, settings persistence across reload, and a >1,000,000-character input through the worker with cancellation. The repository architecture test checks import boundaries.
