export interface HistoryEntry {
  before: string
  after: string
  savedAt: number
}

type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

export const historyKey: string
export function readHistory(storage: HistoryStorage): HistoryEntry[]
export function saveHistory(storage: HistoryStorage, before: string, after: string, savedAt?: number): HistoryEntry[]
export function clearHistory(storage: HistoryStorage): void
