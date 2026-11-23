import { formatJson, type JsonFormatSettings } from "./lib/format.mjs"
import { locateError } from "./lib/locate-error.mjs"

interface JsonWorkerRequest {
  text: string
  settings: JsonFormatSettings
}

self.onmessage = (event: MessageEvent<JsonWorkerRequest>) => {
  const { text, settings } = event.data
  try {
    self.postMessage({ result: formatJson(text, settings) })
  } catch (error) {
    const detail = error as { code?: string; position?: number; detail?: Record<string, unknown> }
    self.postMessage({ error: locateError(text, detail) })
  }
}
