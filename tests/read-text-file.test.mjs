import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ACCEPTED_FILE_TYPES,
  MAX_TEXT_FILE_BYTES,
  checkTextFile,
  decodeTextBytes,
  hasAcceptedTextExtension,
  isAcceptedTextFile,
} from "../src/lib/text-file.mjs"

test("accepts the documented extensions and any text/* type", () => {
  for (const name of ["notes.txt", "README.MD", "guide.markdown", "data.json", "rows.csv", "app.log", "config.yaml", "config.yml", "page.xml", "page.html"]) {
    assert.ok(isAcceptedTextFile({ name, type: "" }), name)
  }
  assert.ok(isAcceptedTextFile({ name: "README", type: "text/plain" }))
  assert.ok(isAcceptedTextFile({ name: "unknown", type: "text/csv" }))
  assert.ok(!isAcceptedTextFile({ name: "photo.png", type: "image/png" }))
  assert.ok(!isAcceptedTextFile({ name: "archive.zip", type: "application/zip" }))
  assert.ok(!hasAcceptedTextExtension("notes.txt.bak"))
  assert.equal(ACCEPTED_FILE_TYPES, ".txt,.md,.markdown,.json,.csv,.log,.yaml,.yml,.xml,.html,text/*")
})

test("rejects unsupported types and files above the size cap", () => {
  assert.deepEqual(checkTextFile({ name: "a.txt", type: "text/plain", size: 10 }), { ok: true })
  assert.deepEqual(checkTextFile({ name: "a.txt", type: "text/plain", size: MAX_TEXT_FILE_BYTES }), { ok: true })
  assert.deepEqual(checkTextFile({ name: "a.txt", type: "text/plain", size: MAX_TEXT_FILE_BYTES + 1 }), { ok: false, reason: "size" })
  assert.deepEqual(checkTextFile({ name: "a.png", type: "image/png", size: 10 }), { ok: false, reason: "type" })
  assert.deepEqual(checkTextFile({ name: "a.txt", type: "text/plain", size: 11 }, 10), { ok: false, reason: "size" })
})

test("decodes UTF-8 and preserves CRLF exactly", () => {
  const text = "خط اول\r\nخط دوم\nپایان"
  const result = decodeTextBytes(new TextEncoder().encode(text))
  assert.deepEqual(result, { text, encoding: "utf-8", hadBom: false })
})

test("removes a UTF-8 BOM and reports it", () => {
  const text = "سلام\r\nدنیا"
  const encoded = new TextEncoder().encode(text)
  const bytes = Uint8Array.from([0xef, 0xbb, 0xbf, ...encoded])
  const result = decodeTextBytes(bytes)
  assert.deepEqual(result, { text, encoding: "utf-8", hadBom: true })
  assert.equal(result.text.charCodeAt(0), "س".charCodeAt(0))
})

test("falls back to windows-1256 for legacy Persian files", () => {
  // "سلام" in windows-1256, followed by CRLF and the same word again.
  const bytes = Uint8Array.from([0xd3, 0xe1, 0xc7, 0xe3, 0x0d, 0x0a, 0xd3, 0xe1, 0xc7, 0xe3])
  const result = decodeTextBytes(bytes)
  assert.deepEqual(result, { text: "سلام\r\nسلام", encoding: "windows-1256", hadBom: false })
})

test("handles empty files and a BOM-only file without throwing", () => {
  assert.deepEqual(decodeTextBytes(new Uint8Array()), { text: "", encoding: "utf-8", hadBom: false })
  assert.deepEqual(decodeTextBytes(Uint8Array.from([0xef, 0xbb, 0xbf])), { text: "", encoding: "utf-8", hadBom: true })
})
