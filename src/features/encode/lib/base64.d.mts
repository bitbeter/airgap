export interface Base64Error {
  ok: false
  code: "alphabet" | "padding" | "length" | "utf8" | "surrogate"
  message: string
  position: number
}

export type Base64EncodeResult = { ok: true; output: string } | Base64Error
export type Base64DecodeResult = { ok: true; text: string; bytes: Uint8Array } | Base64Error

export function bytesToBase64(bytes: Uint8Array, urlSafe?: boolean): string
export function encodeBase64(text: string, options?: { urlSafe?: boolean }): Base64EncodeResult
export function decodeBase64(text: string, options?: { urlSafe?: boolean }): Base64DecodeResult
