export interface RenderedBlock {
  line: number
  top: number
}

export function lineStartOffset(text: string, line: number): number
export function estimateRows(line: string, measure: (value: string) => number, width: number): number
export function estimateRowsPerLine(text: string, measure: (value: string) => number, width: number): number[]
export function lineScrollTops(rows: number[], lineHeight: number, paddingTop?: number): number[]
export function topForLine(tops: number[], line: number): number
export function lineAtOffset(tops: number[], offset: number): number
export function lineFromBlocks(blocks: RenderedBlock[], offset: number): number
