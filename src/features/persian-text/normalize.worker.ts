import { buildInlineChanges } from "./lib/changes.mjs"
import { normalize, type PersianTextSettings } from "./lib/rules.mjs"

self.onmessage = (event: MessageEvent<{ text: string; settings: PersianTextSettings }>) => {
  try {
    const { text, settings } = event.data
    const result = normalize(text, settings)
    const segments = buildInlineChanges(text, result.text)
    self.postMessage({ result, segments })
  } catch {
    self.postMessage({ error: "پردازش متن انجام نشد. دوباره تلاش کنید." })
  }
}
