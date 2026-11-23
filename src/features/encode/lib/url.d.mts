export interface UrlError {
  ok: false
  code: "percent" | "utf8" | "surrogate"
  message: string
  position: number
}

export type UrlResult = { ok: true; output: string } | UrlError

export function encodeUrl(value: string, options?: { full?: boolean }): UrlResult
export function decodeUrl(value: string, options?: { full?: boolean }): UrlResult
