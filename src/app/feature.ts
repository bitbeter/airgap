import type { ComponentType, LazyExoticComponent } from "react"
import type { LucideIcon } from "lucide-react"

export interface Feature {
  path: `/${string}`
  title: string
  icon: LucideIcon
  Page: LazyExoticComponent<ComponentType>
}
