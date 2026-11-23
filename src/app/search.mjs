const COMBINING_MARKS = /[\u064b-\u065f\u0670\u0640]/g
const WHITESPACE = /\s+/g

/**
 * Normalize Persian/Arabic text for tolerant matching: unify Arabic yeh/kaf
 * with their Persian forms, drop diacritics and tatweel, remove ZWNJ, and
 * collapse whitespace.
 */
export function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    .replace(/ة/g, "ه")
    .replace(/ۀ/g, "ه")
    .replace(COMBINING_MARKS, "")
    .replace(/\u200c/g, "")
    .replace(WHITESPACE, " ")
    .trim()
}

function subsequenceScore(text, token) {
  if (token.length < 2) return 0

  let cursor = 0
  let gaps = 0
  let previous = -1

  for (let index = 0; index < text.length && cursor < token.length; index += 1) {
    if (text[index] !== token[cursor]) continue
    if (previous >= 0) gaps += index - previous - 1
    previous = index
    cursor += 1
  }

  if (cursor < token.length) return 0
  return Math.max(1, 14 - gaps)
}

function fieldScore(field, token) {
  if (!field) return 0
  if (field === token) return 60
  if (field.startsWith(token)) return 50
  if (field.includes(` ${token}`)) return 45
  if (field.includes(token)) return 30
  return subsequenceScore(field, token)
}

function scoreFeature(feature, tokens) {
  const title = normalizeSearchText(feature.title)
  const description = normalizeSearchText(feature.description)
  const keywords = (feature.keywords ?? []).map(normalizeSearchText).filter(Boolean)

  let total = 0
  for (const token of tokens) {
    let best = fieldScore(title, token) * 3
    best = Math.max(best, fieldScore(description, token))
    for (const keyword of keywords) best = Math.max(best, fieldScore(keyword, token) * 2)
    if (best === 0) return 0
    total += best
  }

  return total
}

/**
 * Return features matching every query token, best match first. An empty
 * query keeps the registry order. Matching is case-insensitive, tolerant of
 * Persian letter variants and ZWNJ, and falls back to subsequence matching.
 */
export function searchFeatures(features, query) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean)
  if (tokens.length === 0) return [...features]

  return features
    .map((feature, index) => ({ feature, index, score: scoreFeature(feature, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.feature)
}
