import { test } from "node:test"
import assert from "node:assert/strict"
import {
  defaultSettings,
  encodeTabs,
  normalizeSettings,
  readSettings,
  saveSettings,
  settingsKey,
} from "../lib/settings.mjs"

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  }
}

test("the settings key is versioned and distinct", () => {
  assert.equal(settingsKey, "airgap:encode:settings:v1")
})

test("defaults to the Base64 tab", () => {
  assert.deepEqual(defaultSettings, { tab: "base64" })
  assert.deepEqual(normalizeSettings(undefined), { tab: "base64" })
  assert.deepEqual(normalizeSettings({}), { tab: "base64" })
})

test("keeps every known tab and rejects unknown values", () => {
  for (const tab of encodeTabs) {
    assert.deepEqual(normalizeSettings({ tab }), { tab })
  }
  assert.deepEqual(normalizeSettings({ tab: "unknown" }), { tab: "base64" })
  assert.deepEqual(normalizeSettings({ tab: 42 }), { tab: "base64" })
  assert.deepEqual(normalizeSettings(null), { tab: "base64" })
})

test("reads and writes the last tab", () => {
  const storage = memoryStorage()
  assert.deepEqual(readSettings(storage), { tab: "base64" })
  saveSettings(storage, { tab: "jwt" })
  assert.equal(storage.getItem(settingsKey), JSON.stringify({ tab: "jwt" }))
  assert.deepEqual(readSettings(storage), { tab: "jwt" })
})

test("malformed stored JSON falls back to defaults", () => {
  const storage = memoryStorage({ [settingsKey]: "{not json" })
  assert.deepEqual(readSettings(storage), { tab: "base64" })
})

test("unknown stored tabs fall back to defaults", () => {
  const storage = memoryStorage({ [settingsKey]: JSON.stringify({ tab: "nope" }) })
  assert.deepEqual(readSettings(storage), { tab: "base64" })
})

test("saveSettings normalizes before writing", () => {
  const storage = memoryStorage()
  const saved = saveSettings(storage, { tab: "nope" })
  assert.deepEqual(saved, { tab: "base64" })
  assert.deepEqual(JSON.parse(storage.getItem(settingsKey)), { tab: "base64" })
})
