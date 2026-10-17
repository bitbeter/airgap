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
}

export interface DiffResult {
  rows: DiffRow[]
  added: number
  removed: number
  modified: number
}

export function compareTexts(before: string, after: string): DiffResult
