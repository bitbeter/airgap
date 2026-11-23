export type JsonTokenType = "{" | "}" | "[" | "]" | ":" | "," | "string" | "number" | "literal"

export interface JsonToken {
  type: JsonTokenType
  raw: string
  value?: string | number
  start: number
  end: number
}

export class JsonSyntaxError extends Error {
  code: string
  position: number
  detail: Record<string, unknown>
  constructor(code: string, position: number, detail?: Record<string, unknown>)
}

export function tokenize(text: string, options?: { jsonc?: boolean }): JsonToken[]
