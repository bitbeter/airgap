# Keyboard layout fixer

Public entry: `index.ts`. Route: `#/keyboard-fix`. Title: «اصلاح چیدمان صفحه‌کلید». Icon: `Keyboard`.

The page fixes text typed with the wrong keyboard layout. Conversion is live, local, and synchronous; no text leaves the browser and no worker is needed because the operation is a linear character mapping.

## File responsibilities

- `page.tsx`: composes the input column (input card followed by the settings card) and the output column.
- `hooks/use-keyboard-fix.ts`: input and settings state, persistence of layout/direction/mode, and the swap/clear actions.
- `components/controls.tsx`: direction, layout, experimental mode, swap, clear, and storage status.
- `components/input-panel.tsx`: input textarea, character/line counts, and the sample button.
- `components/output-panel.tsx`: converted text, copy action, direction summary, protected-range count, and notices.
- `lib/layouts.mjs`: layout tables, reverse lookup, and settings storage; public types in `layouts.d.mts`.
- `lib/convert.mjs`: direction detection, character conversion, word heuristics, and protected-range handling; public types in `convert.d.mts`.
- `lib/protect.mjs`: local URL/email range detection; public types in `protect.d.mts`.
- `lib/sample.mjs`: English and Persian demo texts; public types in `sample.d.mts`.
- `tests/convert.test.mjs`: acceptance cases, both directions, both layouts, Shift, digits, line endings, URL/email protection, auto detection, wrong-only mode, full table round-trip, and settings storage.

## Layouts

Two character tables are provided. They map the character produced by a US English key to the character produced by the same key in the Persian layout, separately for unshifted and Shift states. The tool works on pasted text, so it cannot see actual key events; Shift is inferred from the input character (uppercase letters and shifted symbols).

1. **استاندارد (ISIRI 9147)** — default. Includes the Persian number row, ZWNJ on Shift+B, ZWJ on the backtick key, `؟ ، ؛ « »`, and the Shift+Space half-space behavior described below.
2. **ویندوز قدیمی** — the Persian layout shipped with Windows before Windows 8 (Microsoft KLID `00000429`, `kbdfa`). It uses Latin digits, puts `پ` on the backslash key and `ئ` on M, and has different Shift punctuation.

The standard table follows ISIRI 9147 and its Windows «Persian (Standard)» implementation. On that layout, `[` produces `ج` and `]` produces `چ`; the correct wrong-layout sequence for «دنیا» is therefore `nkdh`. The PRD's acceptance example writes `]kdh`, which would produce «چنیا» under the standard table. The tests use the corrected sequence `sghl nkdh` for «سلام دنیا». Similarly, the PRD's «ش‌شذ» does not reverse to `asd` under ISIRI 9147; `asd` typed with the Persian layout is «شسی».

## Directions

- **خودکار** (default): counts Persian and Latin letters outside protected URLs/emails. A strict majority selects the direction; a tie, or text with no letters, leaves the text unchanged and shows a notice. The user can always choose a direction manually.
- **انگلیسی به فارسی**: maps Latin letters and shifted symbols to Persian.
- **فارسی به انگلیسی**: maps Persian/Arabic-script characters back to the English key that produces them. ASCII punctuation already present in English text is left alone, so a literal `)` is not turned into `(`.

## Preservation

- Latin and Persian/Arabic digits are never translated.
- Spaces, tabs, CRLF/LF line endings, and other whitespace are preserved exactly.
- URLs (`http://`, `https://`, `ftp://`, `www.`) and emails are protected in both directions. Trailing sentence punctuation is not treated as part of a URL.
- In the `fa-en` direction, ZWNJ becomes a normal space because Shift+Space in the English layout produces a space. In the `en-fa` direction a plain space stays a plain space: pasted text does not record whether it came from Shift+Space or Ctrl+Shift+2, so the tool does not invent a half-space. Users can add ZWNJ manually or use the Persian-text tool.
- Shift mappings include `؟ ، ؛ « »`, `! @ # $ % ^ & * ( ) _ +`, the Persian diacritics, `ژ`, `آ`, `أ`, `إ`, `ؤ`, `ئ`, `ة`, `ي`, `ك`, and the legacy layout's punctuation.

## Wrong-only mode (experimental)

The checkbox «فقط بخش‌های اشتباه» is marked experimental. It processes whitespace-delimited words and leaves the rest of the text untouched:

- Latin words are converted when they contain `[`, `]`, `\`, or `;`, have no English vowel (`a e i o u y`), or contain a rare Latin bigram such as `sg`, `sd`, `df`, or `qw`. Ordinary words such as `hello` and `world` stay.
- Persian words are converted when they have at least three letters, no long vowel (`ا آ و ی`), and are not in a short list of common words such as `مدرسه`, `شهر`, or `درس`. This is deliberately conservative and still has false positives and false negatives; it is not a dictionary or a language model.

The mode is a convenience, not a correctness guarantee. Turn it off for predictable whole-text conversion.

## Sample

The input card has a «نمونه» button. It loads a demo text matching the current direction: the English sample for `en-fa`/`auto`, and the Persian sample for `fa-en`. The samples include numbers, a URL, an email, shifted punctuation, layout-specific keys (`m` and `\`), and a mixed-script line. They are meant to exercise the direction, layout, wrong-only, swap, copy, and preservation behavior. Loading a sample does not change the saved settings. If the input is not empty, replacement asks for confirmation first; editing the text or changing a setting hides the sample notice.

## Storage

Key: `airgap:keyboard-fix:settings:v1`. Value: `{ "layout": "standard" | "legacy", "direction": "auto" | "en-fa" | "fa-en", "mode": "all" | "wrong-only" }`. The PRD originally asked for only the layout to be stored; at the user's request, direction and mode are now stored too, so a reload keeps the whole setup. Missing, malformed, partial, or unknown values fall back per field (`standard`, `auto`, `all`). A storage write failure keeps the in-memory settings and shows a Persian message. The text itself is never stored.

## Validation

```sh
node --test src/features/keyboard-fix/tests/*.test.mjs
npm test
npm run build
npm run build:web
```

Browser checks should cover direct `#/keyboard-fix` navigation, refresh, back/forward, RTL layout, live conversion in both directions, both layouts, auto direction, wrong-only mode, the sample button, copy, swap, clear, persistence of layout/direction/mode across reload, and the generated navigation entry. The repository architecture test checks import boundaries.
