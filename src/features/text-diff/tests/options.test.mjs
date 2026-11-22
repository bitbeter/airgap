import { test } from "node:test"
import assert from "node:assert/strict"
import {
  defaultOptions,
  describeOptions,
  diffOptionDefinitions,
  hasActiveOptions,
  normalizeOptions,
  optionsKey,
  readOptions,
  saveOptions,
} from "../lib/options.mjs"
import { historyKey } from "../lib/history.mjs"

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test("all ignore options default to off and use a separate versioned key", () => {
  assert.equal(optionsKey, "airgap:diff-options:v1")
  assert.notEqual(optionsKey, historyKey)
  assert.deepEqual(defaultOptions, {
    trimLines: false,
    ignoreWhitespace: false,
    ignoreCrLf: false,
    ignoreCase: false,
    normalizePersian: false,
    ignoreBlankLines: false,
  })
  assert.equal(hasActiveOptions(defaultOptions), false)
  assert.equal(hasActiveOptions({ ...defaultOptions, ignoreCase: true }), true)
})

test("normalizes partial, malformed and unknown values to booleans", () => {
  for (const value of [null, undefined, 42, "options", []]) {
    assert.deepEqual(normalizeOptions(value), { ...defaultOptions })
  }
  assert.deepEqual(normalizeOptions({ ignoreCase: true, trimLines: "yes", unknown: true }), {
    ...defaultOptions,
    ignoreCase: true,
  })
})

test("describes active options and skips trimming when all whitespace is ignored", () => {
  assert.equal(describeOptions(defaultOptions), "")
  assert.equal(describeOptions({ trimLines: true, ignoreCase: true }), "فاصله‌های ابتدا/انتها، حروف لاتین")
  assert.equal(describeOptions({ trimLines: true, ignoreWhitespace: true }), "همهٔ فاصله‌ها")
  assert.equal(
    describeOptions({ ignoreWhitespace: true, ignoreCrLf: true, ignoreCase: true, normalizePersian: true, ignoreBlankLines: true }),
    "همهٔ فاصله‌ها، LF/CRLF، حروف لاتین، ي/ی، ك/ک و ارقام، خطوط خالی",
  )
  assert.equal(diffOptionDefinitions.length, 6)
})

test("reads defaults when nothing is stored and recovers from malformed JSON", () => {
  const storage = memoryStorage()
  assert.deepEqual(readOptions(storage), { ...defaultOptions })
  storage.setItem(optionsKey, "{broken")
  assert.deepEqual(readOptions(storage), { ...defaultOptions })
  storage.setItem(optionsKey, "null")
  assert.deepEqual(readOptions(storage), { ...defaultOptions })
})

test("saves and restores only known boolean options", () => {
  const storage = memoryStorage()
  saveOptions(storage, { ignoreCase: true, ignoreBlankLines: true, unknown: true })
  assert.deepEqual(JSON.parse(storage.getItem(optionsKey)), {
    ...defaultOptions,
    ignoreCase: true,
    ignoreBlankLines: true,
  })
  assert.deepEqual(readOptions(storage), { ...defaultOptions, ignoreCase: true, ignoreBlankLines: true })
})

test("storage failures stay visible to the caller instead of being swallowed", () => {
  assert.throws(() => readOptions({ getItem() { throw new Error("access denied") } }), /access denied/)
  assert.throws(() => saveOptions({ setItem() { throw new Error("quota exceeded") } }, defaultOptions), /quota exceeded/)
})
