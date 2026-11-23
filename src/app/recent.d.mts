export interface RecentStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const RECENT_KEY: string
export const RECENT_LIMIT: number
export function readRecentPaths(storage: RecentStorage | null | undefined): string[]
export function rememberRecentPath(storage: RecentStorage | null | undefined, path: string): string[]
