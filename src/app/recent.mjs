export const RECENT_KEY = "airgap:shell:recent:v1"
export const RECENT_LIMIT = 5

function isPath(value) {
  return typeof value === "string" && value.startsWith("/") && value !== "/"
}

/**
 * Read the most recently opened tool paths. Storage failures and malformed
 * values degrade to an empty list instead of breaking the shell.
 */
export function readRecentPaths(storage) {
  if (!storage) return []

  try {
    const raw = storage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter(isPath))].slice(0, RECENT_LIMIT)
  } catch {
    return []
  }
}

/**
 * Move a tool path to the front of the recent list and persist paths only.
 * Returns the updated list, or an empty list when storage is unavailable.
 */
export function rememberRecentPath(storage, path) {
  if (!storage || !isPath(path)) return []

  const next = [path, ...readRecentPaths(storage).filter((entry) => entry !== path)].slice(0, RECENT_LIMIT)
  try {
    storage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    return []
  }
  return next
}
