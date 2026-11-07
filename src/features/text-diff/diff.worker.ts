import { compareTexts } from "./lib/compare.mjs"
import { createPatch } from "./lib/patch.mjs"

self.onmessage = (event: MessageEvent<{ before: string; after: string }>) => {
  try {
    const result = compareTexts(event.data.before, event.data.after)
    // The patch has its own four-second budget; a timeout only disables export.
    self.postMessage({ result, patch: createPatch(event.data.before, event.data.after, 4000) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "مقایسه انجام نشد. دوباره تلاش کنید." })
  }
}
