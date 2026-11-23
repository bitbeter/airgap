export interface OutlineHeading {
  level: number
  text: string
  line: number
}

export function extractOutline(text: string, maxLevel?: number): OutlineHeading[]
