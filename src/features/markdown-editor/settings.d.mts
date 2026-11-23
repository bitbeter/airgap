export type ViewMode = "editor" | "both" | "preview"

export interface EditorSettings {
  scrollSync: boolean
  viewMode: ViewMode
}

export const settingsKey: "airgap:markdown-editor:settings:v1"
export const viewModes: ViewMode[]
export const defaultSettings: EditorSettings
export function readSettings(storage: Pick<Storage, "getItem">): EditorSettings
export function saveSettings(storage: Pick<Storage, "setItem">, settings: EditorSettings): void
