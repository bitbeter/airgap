export const historyKey = "airgap:diff-history:v1"

export function readHistory(storage) {
  const raw = storage.getItem(historyKey)
  if (!raw) return []
  let entries
  try {
    entries = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(entries)) return []
  return entries.filter((entry) => entry && typeof entry.before === "string" && typeof entry.after === "string"
    && (entry.before || entry.after) && Number.isFinite(entry.savedAt) && Math.abs(entry.savedAt) <= 8640000000000000)
    .sort((left, right) => right.savedAt - left.savedAt)
    .filter((entry, index, validEntries) => validEntries.findIndex((candidate) => candidate.before === entry.before && candidate.after === entry.after) === index)
    .slice(0, 3)
    .map(({ before, after, savedAt }) => ({ before, after, savedAt }))
}

export function saveHistory(storage, before, after, savedAt = Date.now()) {
  const entries = readHistory(storage)
  if (!before && !after) return entries
  const next = [{ before, after, savedAt }, ...entries.filter((entry) => entry.before !== before || entry.after !== after)].slice(0, 3)
  storage.setItem(historyKey, JSON.stringify(next))
  return next
}

export function clearHistory(storage) {
  storage.removeItem(historyKey)
}
