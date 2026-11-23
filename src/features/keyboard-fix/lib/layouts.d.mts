export type LayoutId = "standard" | "legacy"
export type DirectionSetting = "auto" | "en-fa" | "fa-en"
export type ModeSetting = "all" | "wrong-only"

export interface LayoutDefinition {
  id: LayoutId
  label: string
  description: string
  base: Record<string, string>
  shift: Record<string, string>
}

export interface KeyMapping {
  key: string
  shift: boolean
}

export interface KeyboardFixSettings {
  layout: LayoutId
  direction: DirectionSetting
  mode: ModeSetting
}

export const ZWNJ: string
export const ZWJ: string
export const layoutIds: LayoutId[]
export const layouts: Record<LayoutId, LayoutDefinition>
export const settingsKey: string
export const defaultLayout: LayoutId
export const defaultDirection: DirectionSetting
export const defaultMode: ModeSetting
export const defaultSettings: Readonly<KeyboardFixSettings>

export function normalizeLayout(value: unknown): LayoutId
export function normalizeDirection(value: unknown): DirectionSetting
export function normalizeMode(value: unknown): ModeSetting
export function normalizeSettings(value: unknown): KeyboardFixSettings
export function mapEnglishKey(char: string, layoutId: LayoutId | string): string | null
export function mapPersianChar(char: string, layoutId: LayoutId | string): KeyMapping | null
export function readSettings(storage: Pick<Storage, "getItem">): KeyboardFixSettings
export function saveSettings(storage: Pick<Storage, "setItem">, settings: KeyboardFixSettings | unknown): void
