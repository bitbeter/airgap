export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"

export const hashAlgorithms: readonly HashAlgorithm[]
export const largeFileThreshold: number

export type HashAvailability =
  | { available: true; subtle: SubtleCrypto }
  | { available: false; reason: "missing" | "insecure"; message: string }

export interface HashResult {
  algorithm: HashAlgorithm
  hex: string
  base64: string
  bytes: Uint8Array
  byteLength: number
}

export function detectSubtleCrypto(scope?: unknown): HashAvailability
export function hashBytes(bytes: Uint8Array, algorithm: HashAlgorithm, subtle: SubtleCrypto): Promise<HashResult>
export function hashText(text: string, algorithm: HashAlgorithm, subtle: SubtleCrypto): Promise<HashResult>
export function hashFile(file: Blob, algorithm: HashAlgorithm, subtle: SubtleCrypto): Promise<HashResult>

export type ExpectedHash =
  | { kind: "empty" | "invalid"; normalized: "" }
  | { kind: "hex" | "base64"; normalized: string }

export function parseExpectedHash(value: string): ExpectedHash

export interface HashComparison {
  status: "empty" | "invalid" | "mismatch" | "match"
  format: "hex" | "base64" | ""
}

export function compareHash(expected: string, result: Pick<HashResult, "hex" | "base64">): HashComparison
