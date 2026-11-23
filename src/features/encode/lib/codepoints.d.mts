export interface CodepointEntry {
  index: number
  ordinal: number
  char: string
  codePoint: number
  hex: string
  decimal: number
  utf8: string
  display: string
  name: string
  category: string
  isControl: boolean
  isFormat: boolean
  isWhitespace: boolean
  isMark: boolean
  isInvisible: boolean
}

export function describeCodepoints(value: string): CodepointEntry[]
export function codepointSummary(entries: CodepointEntry[]): { total: number; unique: number; invisible: number }
export function codepointReport(entries: CodepointEntry[]): string
