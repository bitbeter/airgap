import type { ComponentType } from "react"
import type { Components } from "react-markdown"

export type DiagramComponent = ComponentType<{ source: string }>

export interface MarkdownComponentOptions {
  sourceLines?: boolean
}

export function looksLikeMermaid(source: string): boolean
export function renderMermaid(source: string, isCancelled?: () => boolean): Promise<string>
export function createMarkdownComponents(Diagram: DiagramComponent, options?: MarkdownComponentOptions): Components
export const markdownComponents: Components
export const markdownComponentsWithSourceLines: Components
