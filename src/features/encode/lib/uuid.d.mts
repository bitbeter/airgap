export type UuidResult = { ok: true; uuid: string } | { ok: false; message: string }

export function generateUuidV4(scope?: unknown): UuidResult
export function isUuidV4(value: string): boolean
