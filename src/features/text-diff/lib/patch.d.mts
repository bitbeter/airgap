import type { StructuredPatch } from "diff"

export type { StructuredPatch }

export const patchContext: number
export const defaultOldName: string
export const defaultNewName: string

export function createPatch(before: string, after: string, timeout: number): StructuredPatch | null
export function cleanFileName(name: string, fallback: string): string
export function formatUnifiedPatch(patch: StructuredPatch, oldName: string, newName: string): string
export function patchFileName(newName: string): string
