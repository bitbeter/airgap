export const settingsKey = "airgap:encode:settings:v1"

export const encodeTabs = ["base64", "url", "entities", "jwt", "hash", "uuid", "codepoints"]

export const defaultSettings = Object.freeze({ tab: "base64" })

export function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {}
  return {
    tab: encodeTabs.includes(source.tab) ? source.tab : defaultSettings.tab,
  }
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
