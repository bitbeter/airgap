export type FormatAction =
  | "bold" | "italic" | "strikethrough" | "code" | "link"
  | "heading1" | "heading2" | "heading3" | "bullet" | "ordered" | "task" | "quote"
  | "codeBlock" | "table" | "rule" | "mermaid"

export interface FormatResult {
  text: string
  selectionStart: number
  selectionEnd: number
}

export const formatActions: FormatAction[]
export function formatText(text: string, start: number, end: number, action: FormatAction): FormatResult | null
export function continueList(text: string, start: number, end: number): FormatResult | null
export function indentList(text: string, start: number, end: number, outdent: boolean): FormatResult | null
export function changedRange(previous: string, next: string): { start: number; end: number; insert: string }
