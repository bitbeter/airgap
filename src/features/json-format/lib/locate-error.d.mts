export interface LineColumn {
  line: number
  column: number
  lineStart: number
  lineEnd: number
  lineText: string
}

export interface LocatedJsonError {
  code: string
  position: number
  line: number
  column: number
  lineText: string
  message: string
}

export function lineColumnAt(text: string, position: number): LineColumn
export function locateError(
  text: string,
  error: { code?: string; position?: number; detail?: Record<string, unknown> } | null | undefined,
): LocatedJsonError
