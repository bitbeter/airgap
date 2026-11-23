export type DigitMode = "persian" | "latin" | "none"

export type RuleId =
  | "letters"
  | "taMarbuta"
  | "digits"
  | "zwnj"
  | "spacing"
  | "punctuation"
  | "quotes"
  | "kashida"
  | "diacritics"
  | "invisible"

export interface PersianTextSettings {
  letters: boolean
  taMarbuta: boolean
  digits: DigitMode
  zwnj: boolean
  spacing: boolean
  punctuation: boolean
  quotes: boolean
  kashida: boolean
  diacritics: boolean
  invisible: boolean
  protectCode: boolean
}

export interface RuleDefinition {
  id: RuleId
  label: string
  description: string
  example: string
  shortLabel: string
  optional?: boolean
  kind?: "digits"
}

export type NormalizeCounts = Record<RuleId, number>

export interface NormalizeResult {
  text: string
  counts: NormalizeCounts
  total: number
}

type SettingsStorage = Pick<Storage, "getItem" | "setItem">

export const settingsKey: string
export const defaultSettings: Readonly<PersianTextSettings>
export const ruleDefinitions: RuleDefinition[]
export const pipelineOrder: RuleId[]

export function normalizeSettings(value: unknown): PersianTextSettings
export function readSettings(storage: Pick<Storage, "getItem">): PersianTextSettings
export function saveSettings(storage: SettingsStorage, settings: PersianTextSettings): void
export function isRuleEnabled(settings: PersianTextSettings, id: RuleId): boolean
export function normalize(text: string, settings?: PersianTextSettings | unknown): NormalizeResult
export function describeCounts(counts: Partial<NormalizeCounts>): string
