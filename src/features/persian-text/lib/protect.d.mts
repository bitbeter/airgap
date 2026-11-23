export type ProtectedKind = "url" | "email" | "code"

export interface ProtectedRange {
  start: number
  end: number
  kind: ProtectedKind
}

export function mergeRanges(ranges: ProtectedRange[]): ProtectedRange[]
export function findProtectedRanges(text: string, options?: { code?: boolean }): ProtectedRange[]
export function isProtected(index: number, ranges: ProtectedRange[]): boolean
export function overlapsProtected(start: number, end: number, ranges: ProtectedRange[]): boolean
export function replaceOutside(
  text: string,
  ranges: ProtectedRange[],
  regex: RegExp,
  replacer: (...args: any[]) => string,
): { text: string; count: number }
