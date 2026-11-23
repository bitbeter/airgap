export interface SearchableFeature {
  path: string
  title: string
  description?: string
  keywords?: readonly string[]
}

export function normalizeSearchText(value: unknown): string
export function searchFeatures<T extends SearchableFeature>(features: readonly T[], query: string): T[]
