export interface DiffOptions {
  trimLines?: boolean
  ignoreWhitespace?: boolean
  ignoreCrLf?: boolean
  ignoreCase?: boolean
  normalizePersian?: boolean
  ignoreBlankLines?: boolean
}

export interface DiffSegment {
  text: string
  changed: boolean
}

export interface DiffSide {
  number: number
  text: string
  ending: string
  segments: DiffSegment[]
}

export interface DiffRow {
  kind: "same" | "modified" | "added" | "removed"
  before: DiffSide | null
  after: DiffSide | null
  /** True when the row is `same` only because an active option ignored the difference. */
  ignored?: boolean
}

export interface DiffResult {
  rows: DiffRow[]
  added: number
  removed: number
  modified: number
}

export function compareTexts(before: string, after: string, options?: DiffOptions): DiffResult
