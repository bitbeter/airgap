import { defaultSettings, detect, normalizeSettings } from "./detectors.mjs"

export { defaultSettings, detectorDefinitions, normalizeSettings } from "./detectors.mjs"

export const settingsKey = "airgap:redact:settings:v1"
export const termsKey = "airgap:redact:terms:v1"

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Trim, drop empty values, and remove case-insensitive duplicates. */
export function normalizeTerms(terms) {
  const list = Array.isArray(terms) ? terms : typeof terms === "string" ? terms.split(/\r?\n/) : []
  const seen = new Set()
  const normalized = []
  for (const raw of list) {
    if (typeof raw !== "string") continue
    const term = raw.trim()
    if (!term) continue
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(term)
  }
  return normalized
}

/**
 * Replace every detected sensitive value with a stable placeholder.
 *
 * `excluded` contains placeholders the user chose to keep visible. The mapping
 * only includes placeholders that are actually present in the returned text.
 */
export function redact(text, options = {}) {
  const source = typeof text === "string" ? text : ""
  const settings = normalizeSettings(options?.settings)
  const terms = normalizeTerms(options?.terms)
  const excluded = new Set(
    Array.isArray(options?.excluded) ? options.excluded.filter((value) => typeof value === "string") : [],
  )

  const { findings, occurrences } = detect(source, { settings, terms })
  const accepted = occurrences.filter((occurrence) => !excluded.has(occurrence.placeholder))
  const acceptedPlaceholders = new Set(accepted.map((occurrence) => occurrence.placeholder))

  const mapping = {}
  for (const finding of findings) {
    if (acceptedPlaceholders.has(finding.placeholder)) mapping[finding.placeholder] = finding.value
  }

  let output = ""
  let cursor = 0
  for (const occurrence of accepted) {
    if (occurrence.start < cursor) continue
    output += source.slice(cursor, occurrence.start)
    output += occurrence.placeholder
    cursor = occurrence.end
  }
  output += source.slice(cursor)

  return {
    text: output,
    findings: findings.map((finding) => ({ ...finding, excluded: excluded.has(finding.placeholder) })),
    mapping,
  }
}

/** Replace placeholders in a pasted response with their in-memory values. */
export function restore(text, mapping) {
  const source = typeof text === "string" ? text : ""
  if (!mapping || typeof mapping !== "object") return source

  const entries = Object.entries(mapping)
    .filter(([key, value]) => typeof key === "string" && key !== "" && typeof value === "string")
    .sort((left, right) => right[0].length - left[0].length)
  if (entries.length === 0) return source

  const values = new Map(entries)
  const pattern = new RegExp(entries.map(([key]) => escapeRegExp(key)).join("|"), "g")
  return source.replace(pattern, (match) => values.get(match) ?? match)
}

export function readSettings(storage) {
  const raw = storage.getItem(settingsKey)
  if (!raw) return { ...defaultSettings }
  try {
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(storage, settings) {
  const normalized = normalizeSettings(settings)
  storage.setItem(settingsKey, JSON.stringify(normalized))
  return normalized
}

export function readTerms(storage) {
  const raw = storage.getItem(termsKey)
  if (raw == null) return { terms: [], remembered: false }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { terms: [], remembered: false }
    return { terms: normalizeTerms(parsed), remembered: true }
  } catch {
    return { terms: [], remembered: false }
  }
}

export function saveTerms(storage, terms) {
  const normalized = normalizeTerms(terms)
  storage.setItem(termsKey, JSON.stringify(normalized))
  return normalized
}

export function clearTerms(storage) {
  storage.removeItem(termsKey)
}
