import type { DiffRow } from "./compare.mjs"

type RowKind = Pick<DiffRow, "kind">

export interface ChangeRange {
  start: number
  end: number
}

export type DisplayItem =
  | { kind: "row"; index: number }
  | { kind: "collapsed"; from: number; to: number; count: number }

export function groupChanges(rows: readonly RowKind[]): ChangeRange[]
export function collapseRows(rows: readonly RowKind[], context: number, expanded?: Iterable<number>): DisplayItem[]
