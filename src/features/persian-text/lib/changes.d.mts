export type ChangeKind = "same" | "added" | "removed"

export interface ChangeSegment {
  value: string
  kind: ChangeKind
}

export const inlineHighlightLimit: number

export function buildInlineChanges(
  before: string,
  after: string,
  options?: { timeout?: number },
): ChangeSegment[] | null
