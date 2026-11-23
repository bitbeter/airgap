import type { Finding, RedactSettings } from "./detectors.mjs"

export { defaultSettings, detectorDefinitions, normalizeSettings } from "./detectors.mjs"
export type { DetectorDefinition, DetectorId, Finding, RedactSettings } from "./detectors.mjs"

export interface RedactOptions {
  settings?: Partial<RedactSettings>
  terms?: string[]
  excluded?: string[]
}

export interface RedactFinding extends Finding {
  excluded: boolean
}

export interface RedactResult {
  text: string
  findings: RedactFinding[]
  mapping: Record<string, string>
}

type SettingsStorage = Pick<Storage, "getItem" | "setItem">
type TermsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

export const settingsKey: string
export const termsKey: string

export function normalizeTerms(terms: string[] | string): string[]
export function redact(text: string, options?: RedactOptions): RedactResult
export function restore(text: string, mapping?: Record<string, string> | null): string
export function readSettings(storage: SettingsStorage): RedactSettings
export function saveSettings(storage: SettingsStorage, settings: Partial<RedactSettings>): RedactSettings
export function readTerms(storage: TermsStorage): { terms: string[]; remembered: boolean }
export function saveTerms(storage: TermsStorage, terms: string[] | string): string[]
export function clearTerms(storage: TermsStorage): void
