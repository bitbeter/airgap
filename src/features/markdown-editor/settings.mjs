export const settingsKey = "airgap:markdown-editor:settings:v1"

export const viewModes = ["editor", "both", "preview"]

export const defaultSettings = { scrollSync: true, viewMode: "both" }

// Settings are optional: invalid JSON, unknown values, and unavailable
// storage all fall back to the defaults without breaking the editor.
export function readSettings(storage) {
  try {
    const raw = storage.getItem(settingsKey)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw)
    return {
      scrollSync: typeof parsed?.scrollSync === "boolean" ? parsed.scrollSync : defaultSettings.scrollSync,
      viewMode: viewModes.includes(parsed?.viewMode) ? parsed.viewMode : defaultSettings.viewMode,
    }
  } catch {
    return { ...defaultSettings }
  }
}

// Storage failures are the caller's concern; the page keeps the in-memory
// setting and stays usable when a save fails.
export function saveSettings(storage, settings) {
  storage.setItem(settingsKey, JSON.stringify({
    scrollSync: settings.scrollSync !== false,
    viewMode: viewModes.includes(settings.viewMode) ? settings.viewMode : defaultSettings.viewMode,
  }))
}
