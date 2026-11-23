export type IndentOption = 2 | 4 | "tab"

export interface JsonFormatSettings {
  indent: IndentOption
  sortKeys: boolean
  jsonc: boolean
  minify: boolean
}

export interface JsonStringNode {
  type: "string"
  raw: string
  value: string
  start: number
}

export interface JsonNumberNode {
  type: "number"
  raw: string
  value: number
  unsafe: boolean
  start: number
}

export interface JsonBooleanNode {
  type: "boolean"
  raw: string
  value: boolean
  start: number
}

export interface JsonNullNode {
  type: "null"
  raw: string
  start: number
}

export interface JsonObjectEntry {
  key: string
  keyRaw: string
  value: JsonNode
}

export interface JsonObjectNode {
  type: "object"
  entries: JsonObjectEntry[]
  start: number
}

export interface JsonArrayNode {
  type: "array"
  items: JsonNode[]
  start: number
}

export type JsonNode =
  | JsonStringNode
  | JsonNumberNode
  | JsonBooleanNode
  | JsonNullNode
  | JsonObjectNode
  | JsonArrayNode

export interface JsonStats {
  keys: number
  depth: number
  nodes: number
  inputBytes: number
  outputBytes: number
}

export interface JsonWarning {
  raw: string
  path: string
  start: number
}

export interface JsonFormatResult {
  output: string
  root: JsonNode
  stats: JsonStats
  warnings: JsonWarning[]
}

export interface SerializeOptions {
  indent?: IndentOption
  sortKeys?: boolean
  minify?: boolean
}

type SettingsStorage = Pick<Storage, "getItem" | "setItem">

export const settingsKey: string
export const defaultSettings: Readonly<JsonFormatSettings>

export function normalizeSettings(value: unknown): JsonFormatSettings
export function readSettings(storage: Pick<Storage, "getItem">): JsonFormatSettings
export function saveSettings(storage: SettingsStorage, settings: Partial<JsonFormatSettings>): JsonFormatSettings
export function isUnsafeNumber(raw: string): boolean
export function parseJson(text: string, options?: { jsonc?: boolean }): JsonNode
export function serializeNode(node: JsonNode, options?: SerializeOptions): string
export function collectStats(root: JsonNode): { keys: number; depth: number; nodes: number }
export function pathForKey(parent: string, key: string): string
export function pathForIndex(parent: string, index: number): string
export function collectUnsafeNumbers(root: JsonNode): JsonWarning[]
export function formatJson(text: string, options?: Partial<JsonFormatSettings>): JsonFormatResult
