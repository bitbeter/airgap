export const MAX_TEXT_FILE_BYTES: number
export const acceptedTextExtensions: readonly string[]
export const ACCEPTED_FILE_TYPES: string

export type TextEncoding = "utf-8" | "windows-1256"

export interface TextFileLike {
  name?: string
  type?: string
  size?: number
}

export type TextFileCheck = { ok: true } | { ok: false; reason: "type" | "size" }

export function hasAcceptedTextExtension(name: string): boolean
export function isAcceptedTextFile(file: TextFileLike): boolean
export function checkTextFile(file: TextFileLike, maxBytes?: number): TextFileCheck

export function decodeTextBytes(bytes: Uint8Array): {
  text: string
  encoding: TextEncoding
  hadBom: boolean
}
