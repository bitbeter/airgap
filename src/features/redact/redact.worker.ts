import { redact, type RedactOptions } from "./lib/redact.mjs"

self.onmessage = (event: MessageEvent<{ text: string; options: RedactOptions }>) => {
  try {
    const { text, options } = event.data
    self.postMessage({ result: redact(text, options) })
  } catch {
    self.postMessage({ error: "پردازش متن انجام نشد. دوباره تلاش کنید." })
  }
}
