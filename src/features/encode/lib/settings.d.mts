export type EncodeTab = "base64" | "url" | "entities" | "jwt" | "hash" | "uuid" | "codepoints"

export interface EncodeSettings {
  tab: EncodeTab
}

export const settingsKey: string
export const encodeTabs: readonly EncodeTab[]
export const defaultSettings: Readonly<EncodeSettings>

export function normalizeSettings(value: unknown): EncodeSettings
export function readSettings(storage: Pick<Storage, "getItem">): EncodeSettings
export function saveSettings(storage: Pick<Storage, "setItem">, settings: Partial<EncodeSettings>): EncodeSettings
