import type { ComponentType, LazyExoticComponent } from "react"
import type { LucideIcon } from "lucide-react"

export interface Feature {
  path: `/${string}`
  title: string
  /** One Persian sentence shown on the home page and in search results. */
  description?: string
  /** Persian and English synonyms used by the command palette. */
  keywords?: string[]
  icon: LucideIcon
  Page: LazyExoticComponent<ComponentType>
}
