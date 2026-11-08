const words = new Intl.Segmenter("fa", { granularity: "word" })
const graphemes = new Intl.Segmenter("fa", { granularity: "grapheme" })
const wordsPerMinute = 200

export function textStats(text) {
  let wordCount = 0
  for (const segment of words.segment(text)) if (segment.isWordLike) wordCount++
  let characters = 0
  for (const _ of graphemes.segment(text)) characters++
  return {
    words: wordCount,
    characters,
    lines: text === "" ? 0 : text.split("\n").length,
    readingMinutes: wordCount && Math.max(1, Math.round(wordCount / wordsPerMinute)),
  }
}
