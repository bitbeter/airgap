import type { DiffOptions } from "./compare.mjs"

export type DiffOptionId = keyof Required<DiffOptions>

export interface DiffOptionDefinition {
  id: DiffOptionId
  label: string
  shortLabel: string
}

type OptionsStorage = Pick<Storage, "getItem" | "setItem">

export const optionsKey: string
export const defaultOptions: Readonly<Required<DiffOptions>>
export const diffOptionDefinitions: DiffOptionDefinition[]

export function normalizeOptions(value: unknown): Required<DiffOptions>
export function hasActiveOptions(options: DiffOptions | null | undefined): boolean
export function describeOptions(options: DiffOptions | null | undefined): string
export function readOptions(storage: OptionsStorage): Required<DiffOptions>
export function saveOptions(storage: OptionsStorage, options: DiffOptions): void
