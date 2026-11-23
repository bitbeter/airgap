export type ProtectedKind = "url" | "email"

export interface ProtectedRange {
  start: number
  end: number
  kind: ProtectedKind
}

export function mergeRanges(ranges: ProtectedRange[]): ProtectedRange[]
export function findProtectedRanges(text: string): ProtectedRange[]
