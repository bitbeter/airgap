export function findLoneSurrogate(text: string): number
export function findInvalidUtf8(bytes: Uint8Array): number
export function encodeUtf8(text: string): Uint8Array
export function decodeUtf8(bytes: Uint8Array): { ok: true; text: string } | { ok: false; position: number }
export function bytesToHex(bytes: Uint8Array, separator?: string): string
