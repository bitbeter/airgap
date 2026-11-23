# Sensitive data redactor

Public entry: `index.ts`. Route: `#/redact`. Title: «پنهان‌سازی اطلاعات حساس». Icon: `ShieldCheck`.

The page replaces sensitive values with stable placeholders before the user pastes text into an AI chat, support ticket, or messenger. A second tab restores the placeholders in a pasted response. Detection, replacement, and restoration are local; no text or mapping leaves the browser.

## File responsibilities

- `page.tsx`: heading, permanent warning, redact/restore tabs, and workspace composition.
- `hooks/use-redact.ts`: redact/restore state, debounced processing, worker lifecycle, exclusions, settings/terms storage, and cancellation.
- `components/redact-input.tsx`: input textarea, character/line counts, sample button, clear action, and the in-memory mapping notice.
- `components/redact-settings.tsx`: per-type toggles, custom-term list, remember checkbox, and storage status.
- `components/redact-output.tsx`: highlighted output, copy action, per-type counts, findings review with per-item cancel, and mapping status.
- `components/restore-panel.tsx`: response input, restored output, available placeholders, and mapping notice.
- `lib/sample.mjs`: the fake demo text and sample custom terms behind the «نمونه» button; public types in `sample.d.mts`.
- `lib/validators.mjs`: digit conversion, national-ID check digit, Luhn, IBAN mod-97, IPv4/IPv6, and Iranian phone validation; public types in `validators.d.mts`.
- `lib/detectors.mjs`: regex detectors, overlap resolution, placeholder assignment, and settings normalization; public types in `detectors.d.mts`.
- `lib/redact.mjs`: `redact`/`restore`, settings/terms storage, and term normalization; public types in `redact.d.mts`.
- `redact.worker.ts`: background adapter for inputs larger than 200,000 characters.
- `tests/validators.test.mjs`: validator tables, Persian digits, and phone normalization.
- `tests/redact.test.mjs`: all detector types, invalid-card/national-ID rejection, overlap, duplicates, exclusions, round-trip, and storage behavior.
- `tests/sample.test.mjs`: the demo text exercises every detector and the stable duplicate-email placeholder.

## Detection types

Every type has an independent toggle. Defaults are all on.

| Type | Placeholder | Validation |
| --- | --- | --- |
| Email | `[EMAIL_n]` | Local/domain shape checks |
| URL | `[URL_n]` | `http://`, `https://`, `ftp://`, or `www.`; trailing sentence punctuation is excluded |
| IPv4 / IPv6 | `[IP_n]` | Octet range and full IPv6 group rules, including embedded IPv4 |
| Iranian mobile and fixed line | `[PHONE_n]` | Mobile `09…`, `+989…`, `00989…`; fixed line `0` + known area code + eight digits |
| National ID | `[NATIONAL_ID_n]` | Ten digits with the official check digit; all-identical numbers are rejected |
| Card | `[CARD_n]` | Exactly 16 digits with a valid Luhn checksum |
| IBAN | `[IBAN_n]` | `IR` + 24 digits with mod-97 |
| API keys/tokens | `[API_KEY_n]` | `sk-…`, `ghp_…`, `AKIA…`, JWT, and PEM private keys |
| Custom terms | `[NAME_n]` | Case-insensitive, word-boundary-aware literal matching |

Persian and Arabic-Indic digits are accepted in phone, national-ID, card, and IBAN values. Separators such as spaces and hyphens are allowed where the PRD requires them.

## Placeholders and overlap

Placeholders are numbered per type in order of first appearance. An exact duplicate value reuses its placeholder, so `ali@example.com` twice becomes `[EMAIL_1]` twice and restores both occurrences. Values that differ only in formatting (for example `0912…` and `+98912…`) are different raw strings and receive separate placeholders; this is required so `restore(redact(x).text, mapping)` returns `x` byte-for-byte.

When candidates overlap, the longer match wins; for equal lengths, the more precise detector wins. This covers the PRD case of an email inside a URL: the URL is replaced as a whole and the email is not separately exposed. Custom terms also lose to longer email, URL, card, or IBAN matches.

## Review and exclusions

The findings list shows the type, placeholder, raw value, and occurrence count. «لغو پنهان‌سازی» keeps that value visible and removes its placeholder from the mapping; «پنهان کن» restores it. Exclusions are cleared whenever the input, settings, or term list changes, because placeholder assignment may change.

The output highlights every `[TYPE_n]` placeholder. The permanent warning states that detection is not guaranteed and the output must be reviewed before sending.

## Sample

The input card has a «نمونه» button. It loads `lib/sample.mjs`, a fake text that exercises every detector: email (twice, to show the stable placeholder), URL, IPv4, IPv6, Persian-digit mobile, fixed line, national ID, card, IBAN, OpenAI/GitHub/AWS keys, JWT, a PEM private key, and two custom terms. Loading the sample appends the two sample terms to the existing custom-term list instead of replacing the user's list. If the input is not empty, replacement asks for confirmation first. The notice suggests copying the output and pasting it into the «بازگردانی» tab to see the round-trip. Editing the text, changing a type, changing terms, remembering terms, resetting settings, or clearing hides the sample notice.

## Restore

The «بازگردانی» tab replaces placeholders in a pasted response using the current in-memory mapping. Unknown placeholders are left untouched. Replacement values are inserted literally, so `$&`, `$1`, or other replacement syntax in a real value is not interpreted.

## Storage and privacy

- Settings key: `airgap:redact:settings:v1`. Value: one object with a boolean per detector id. Missing, malformed, partial, or unknown values fall back per field to the defaults.
- Terms key: `airgap:redact:terms:v1`. Value: a JSON array of trimmed, case-insensitively deduplicated terms. It is written only when «به‌خاطر سپردن در این مرورگر» is checked; unchecking removes the key.
- The placeholder-to-real-value mapping is never written to `localStorage` or `sessionStorage`. It lives only in the page hook state, is rebuilt after every input/settings/term/exclusion change, and disappears when the page unmounts. Navigating to another tool and back therefore loses the mapping by design.
- Detection results, raw values, and the mapping are never sent anywhere. Storage failures keep the in-memory state and show a Persian message.
- The text itself is never stored.

## Worker

Inputs longer than 200,000 characters are processed in `redact.worker.ts`; smaller inputs run synchronously after a 250 ms debounce. Changing the input, settings, terms, exclusions, cancelling, or unmounting terminates the worker. Stale responses are ignored by request id and worker identity. The portable build uses the inline worker import; development and the web build use the emitted worker asset. Cancelling shows a retry action instead of a stale result.

## Limits

- Detection is pattern- and checksum-based, not a language model. Names, addresses, and unusual secrets that are not in the custom-term list are not detected.
- The fixed-line area-code list and mobile prefixes are heuristics for Iran. Non-Iranian numbers are not detected.
- URLs are matched with an ASCII character set; a URL containing non-ASCII path characters is only partially covered.
- IPv6 detection covers standard colon groups and IPv4-embedded forms, not zone identifiers (`%eth0`).
- A custom term that is longer than a real sensitive value can win the overlap rule, because the user explicitly asked to hide it.

## Validation

```sh
node --test src/features/redact/tests/*.test.mjs
npm test
npm run build
npm run build:web
```

Browser checks should cover direct `#/redact` navigation, refresh, back/forward, RTL layout, both tabs, type toggles and their persistence across reload, custom terms with and without remembering, per-item exclusion, placeholder highlighting, copy, restore after switching tabs, mapping loss after navigating away and back, and a >200,000-character input through the worker. The repository architecture test checks import boundaries.
