# Persian text normalizer

Public entry: `index.ts`. Route: `#/persian-text`. Title: «ویرایش متن فارسی».

## File responsibilities

- `page.tsx`: compose the input column (input card followed by the rules panel) and the output column; owns only the highlight toggle.
- `hooks/use-persian-text.ts`: input/settings state, debounced normalization, worker lifecycle, cancellation, and settings storage.
- `components/input-panel.tsx`: editable input, character/line counts, clear action.
- `components/output-panel.tsx`: normalized output, copy action, summary, highlight toggle, apply-to-input and cancel actions.
- `components/change-view.tsx`: independent inline red/green change rendering.
- `components/rules-panel.tsx`: per-rule toggles with Persian labels, descriptions, examples, digit mode, and code protection.
- `lib/protect.mjs`: URL, email, fenced-code, and inline-code ranges; public types in `protect.d.mts`.
- `lib/rules.mjs`: pure rule functions, settings, normalization pipeline, and summary text; public types in `rules.d.mts`.
- `lib/changes.mjs`: jsdiff `diffChars`/`diffWordsWithSpace` segments for highlighting; public types in `changes.d.mts`.
- `lib/sample.mjs`: the comprehensive demo text behind the «نمونه» button; public type in `sample.d.mts`.
- `normalize.worker.ts`: background adapter for inputs larger than 200,000 characters.
- `tests/rules.test.mjs`: per-rule tables, idempotency, protected ranges, and settings storage.
- `tests/sample.test.mjs`: the demo text exercises every rule and keeps protected ranges intact.

## Rules

The pipeline runs in this order: invisibles, kashida, diacritics, letters, ة, punctuation, quotes, spacing, digits, ZWNJ. Every rule is a pure function and reports a change count.

1. **Letters**: `ي`/`ى` → `ی`, `ك` → `ک`, `ۀ` → `هٔ`. Optional `ة` → `ه`.
2. **Digits**: all Persian, all Latin, or no change. Persian is the default. URLs, emails, and Markdown code are skipped.
3. **ZWNJ**: `می`/`نمی` + verb, `ها`/`های`, `تر`/`ترین`, and possessive/indefinite suffixes after a final `ه`.
4. **Spacing**: collapses repeated spaces/tabs, trims line ends, removes spaces before punctuation, and adds a space after punctuation when text follows.
5. **Punctuation**: `,` → `،`, `;` → `؛`, `?` → `؟` only when a Persian letter is on either side. Optional `"…"` → `«…»` when the quoted text contains Persian.
6. **Kashida and diacritics** (both optional): removes `ـ` and Arabic harakat. Hamza above/below is kept so `هٔ` stays meaningful.
7. **Invisibles**: removes ZWJ, LRM/RLM, ZWSP, BOM, soft hyphen, word joiner, and bidi controls; NBSP becomes a normal space. ZWNJ is never removed.

## ZWNJ heuristics and limits

The rules only join across an existing space or a word boundary; they never split a word at an arbitrary position. Suffixes after non-joining letters (`ا آ د ذ ر ز ژ و`) are joined directly, matching Persian orthography: `میزها`, `آقاها`, `روزها`, but `کتاب‌ها`, `خانه‌ها`, `بزرگ‌تر`.

A curated exception list protects words such as `میز`, `میهن`, `میخ`, `میدان`, `میوه`, `ترانه`, `هایکو`, `ترین`, `بهتر`, `کمتر`, `بیشتر`, `دختر`, `دفتر`, `کامپیوتر`, and `کبوتر`. Short exceptions are matched exactly so real verbs still normalize: `میزنم` → `می‌زنم`, `میخوام` → `می‌خوام`, `میروم` → `می‌روم`.

Known limits:

- Attached `های` is only split for the unambiguous `ههای` form (`بچههای` → `بچه‌های`). `کتابهای` and `خانهای` are left unchanged because a single `های` can also be an indefinite `ای`; use the separated form (`کتاب های`) or add the half-space manually.
- Possessive and indefinite suffixes are joined only after a final `ه` (`خانه ام` → `خانه‌ام`, `خانه ای` → `خانه‌ای`). `کتاب ام` is left unchanged because the correct attached form is `کتابم`, not `کتاب‌ام`.
- The exception lists are heuristics, not a dictionary. They cover common words and the acceptance cases, not every name or loanword.

## Demo sample

The input card has a «نمونه» button that loads `lib/sample.mjs` and turns every rule on, including the optional ones, so the output summary shows all ten counters at once. The sample contains Arabic letters, mixed digits, ZWNJ cases, spacing and punctuation mistakes, Latin quotes, kashida, harakat, invisible characters, protected URL/email/code, and the exception words. It replaces the current text only after a confirmation when the input is not empty. Editing the text, changing a rule, clearing, applying, or resetting hides the sample notice. «پیش‌فرض» in the rules panel restores the default settings.

## Protection

URLs (`http://`, `https://`, `ftp://`, `www.`) and emails are always protected. Markdown fenced blocks (``` or ~~~) and inline backtick spans are protected while the "محافظت از بلوک‌های کد" setting is on (default). A trailing sentence period after a URL is not part of the protected range. Turning code protection off allows digits and punctuation inside code to be normalized.

## Idempotency

`normalize(normalize(text))` equals `normalize(text)` for every test fixture with default settings and with every optional rule enabled. New rules must preserve this property; the tests include a mixed fixture list that runs the pipeline twice.

## Storage

Key: `airgap:persian-text:settings:v1`. Value: one object with boolean rule ids, `digits` (`persian` | `latin` | `none`), and `protectCode`. Every rule change is saved immediately, so the rules panel keeps its state across reloads and navigation. Missing or malformed values fall back to defaults. The text itself is never stored. Storage failures keep the in-memory settings and show a Persian message.

## Worker

Inputs longer than 200,000 characters are normalized in `normalize.worker.ts`; smaller inputs run synchronously after a 250 ms debounce. Changing the input, changing a rule, cancelling, or unmounting terminates the worker. Stale responses are ignored by request id and worker identity. The portable build uses the inline worker import; development and the web build use the emitted worker asset. Cancelling shows a retry action instead of a stale result.

## Inline changes

The output uses jsdiff `diffChars` for short texts and `diffWordsWithSpace` for larger ones, with a four-second timeout. Removed text is red with strikethrough and added text is green, matching the diff feature's color convention. The highlighting is implemented locally and does not import anything from `text-diff`. Texts over 150,000 characters skip highlighting and show the plain normalized output with a note.

## Validation

```sh
node --test src/features/persian-text/tests/*.test.mjs
npm test
npm run build
npm run build:web
```

Browser checks performed in headless Chrome: direct `#/persian-text` navigation, refresh, back/forward, RTL layout, the «نمونه» button with all ten counters and optional rules enabled, apply-to-input, the letters toggle and its persistence across reload, the generated navigation entry, and a 210,000-character input through the worker with the large-text note. Not automated: clipboard copy, every optional rule toggle, highlight on/off, cancelling and navigating away mid-worker, and the existing diff and Markdown interactions.
