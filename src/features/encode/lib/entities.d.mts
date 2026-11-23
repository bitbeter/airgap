export interface EntitiesError {
  ok: false
  code: "numeric" | "surrogate"
  message: string
  position: number
}

export type EntitiesResult = { ok: true; output: string } | EntitiesError

export function encodeEntities(value: string): EntitiesResult
export function decodeEntities(value: string): EntitiesResult
