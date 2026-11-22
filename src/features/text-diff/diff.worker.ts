import { compareTexts, type DiffOptions } from "./lib/compare.mjs"
import { createPatch } from "./lib/patch.mjs"

self.onmessage = (event: MessageEvent<{ before: string; after: string; options?: DiffOptions }>) => {
  try {
    const result = compareTexts(event.data.before, event.data.after, event.data.options)
    // The patch has its own four-second budget; a timeout only disables export.
    // Patch export always describes the raw texts, regardless of ignore options.
    self.postMessage({ result, patch: createPatch(event.data.before, event.data.after, 4000) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "مقایسه انجام نشد. دوباره تلاش کنید." })
  }
}
