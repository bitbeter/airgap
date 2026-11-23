import { test } from "node:test"
import assert from "node:assert/strict"
import { defaultSettings, readSettings, saveSettings, settingsKey, viewModes } from "../settings.mjs"

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

test("uses the versioned settings key and safe defaults", () => {
  assert.equal(settingsKey, "airgap:markdown-editor:settings:v1")
  assert.deepEqual(defaultSettings, { scrollSync: true, viewMode: "both" })
  assert.deepEqual(viewModes, ["editor", "both", "preview"])
  assert.deepEqual(readSettings(memoryStorage()), { scrollSync: true, viewMode: "both" })
})

test("round-trips scroll sync and view mode", () => {
  const storage = memoryStorage()
  saveSettings(storage, { scrollSync: false, viewMode: "preview" })
  assert.deepEqual(readSettings(storage), { scrollSync: false, viewMode: "preview" })
  saveSettings(storage, { scrollSync: true, viewMode: "editor" })
  assert.deepEqual(readSettings(storage), { scrollSync: true, viewMode: "editor" })
})

test("falls back to defaults for invalid JSON and unknown values", () => {
  const invalid = memoryStorage({ [settingsKey]: "{not json" })
  assert.deepEqual(readSettings(invalid), { scrollSync: true, viewMode: "both" })
  const unknown = memoryStorage({ [settingsKey]: JSON.stringify({ scrollSync: "no", viewMode: "sideways" }) })
  assert.deepEqual(readSettings(unknown), { scrollSync: true, viewMode: "both" })
  const partial = memoryStorage({ [settingsKey]: JSON.stringify({ scrollSync: false }) })
  assert.deepEqual(readSettings(partial), { scrollSync: false, viewMode: "both" })
})

test("survives unavailable storage and reports save failures to the caller", () => {
  const unavailable = { getItem: () => { throw new Error("blocked") } }
  assert.deepEqual(readSettings(unavailable), { scrollSync: true, viewMode: "both" })
  assert.throws(() => saveSettings({ setItem: () => { throw new Error("quota") } }, defaultSettings))
})

test("saveSettings normalizes unknown values", () => {
  const storage = memoryStorage()
  saveSettings(storage, { scrollSync: undefined, viewMode: "unknown" })
  assert.deepEqual(readSettings(storage), { scrollSync: true, viewMode: "both" })
})
