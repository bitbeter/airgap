export interface TextStats {
  words: number
  characters: number
  lines: number
  readingMinutes: number
}

export function textStats(text: string): TextStats
