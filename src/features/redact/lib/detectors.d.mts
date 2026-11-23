export type DetectorId =
  | "email"
  | "url"
  | "ip"
  | "phone"
  | "nationalId"
  | "card"
  | "iban"
  | "apiKey"
  | "terms"

export interface DetectorDefinition {
  id: DetectorId
  label: string
  description: string
  placeholder: string
  priority: number
  defaultEnabled: boolean
}

export type RedactSettings = Record<DetectorId, boolean>

export interface Finding {
  id: string
  type: DetectorId
  value: string
  placeholder: string
  start: number
  end: number
  count: number
}

export interface FindingOccurrence {
  type: DetectorId
  value: string
  start: number
  end: number
  placeholder: string
}

export interface DetectorOptions {
  settings?: Partial<RedactSettings>
  terms?: string[]
}

export const detectorDefinitions: DetectorDefinition[]
export const placeholderByType: Record<DetectorId, string>
export const defaultSettings: RedactSettings
export function normalizeSettings(value: unknown): RedactSettings
export function detect(text: string, options?: DetectorOptions): { findings: Finding[]; occurrences: FindingOccurrence[] }
