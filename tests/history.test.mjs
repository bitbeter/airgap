import { test } from "node:test"
import assert from "node:assert/strict"
import { clearHistory, historyKey, readHistory, saveHistory } from "../src/lib/history.mjs"

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test("persists only the three newest comparisons across reads", () => {
  const storage = memoryStorage()
  for (let index = 1; index <= 4; index++) saveHistory(storage, `قبل ${index}\n\t`, `بعد ${index}\r\n`, index)
  const restored = readHistory(storage)
  assert.deepEqual(restored.map((entry) => entry.savedAt), [4, 3, 2])
  assert.equal(restored[0].before, "قبل 4\n\t")
  assert.equal(restored[0].after, "بعد 4\r\n")
  assert.equal(JSON.parse(storage.getItem(historyKey)).length, 3)
})

test("repeating a pair promotes it without consuming another slot", () => {
  const storage = memoryStorage()
  saveHistory(storage, "a", "b", 1)
  saveHistory(storage, "c", "d", 2)
  saveHistory(storage, "a", "b", 3)
  assert.deepEqual(readHistory(storage), [
    { before: "a", after: "b", savedAt: 3 },
    { before: "c", after: "d", savedAt: 2 },
  ])
  saveHistory(storage, "b", "a", 4)
  assert.equal(readHistory(storage).length, 3)
})

test("allows one empty side but does not save two empty inputs", () => {
  const storage = memoryStorage()
  saveHistory(storage, "", "new", 1)
  saveHistory(storage, "old", "", 2)
  saveHistory(storage, "", "", 3)
  assert.equal(readHistory(storage).length, 2)
})

test("recovers from malformed data and rejects invalid entries", () => {
  const storage = memoryStorage()
  for (const raw of ["{broken", "null", "{}", "42"]) {
    storage.setItem(historyKey, raw)
    assert.deepEqual(readHistory(storage), [])
  }
  storage.setItem(historyKey, JSON.stringify([
    null, {}, { before: 1, after: "b", savedAt: 1 },
    { before: "a", after: "b", savedAt: 1e30 },
    { before: "a", after: "b", savedAt: 2 },
    { before: "a", after: "b", savedAt: 1 },
  ]))
  assert.deepEqual(readHistory(storage), [{ before: "a", after: "b", savedAt: 2 }])
})

test("quota errors preserve the last successfully saved history", () => {
  const storage = memoryStorage()
  saveHistory(storage, "saved", "pair", 1)
  const failingStorage = { ...storage, setItem() { throw new Error("quota exceeded") } }
  assert.throws(() => saveHistory(failingStorage, "too", "large", 2), /quota exceeded/)
  assert.deepEqual(readHistory(storage), [{ before: "saved", after: "pair", savedAt: 1 }])
  assert.throws(() => readHistory({ ...storage, getItem() { throw new Error("access denied") } }), /access denied/)
})

test("clearing history leaves other local storage data intact", () => {
  const storage = memoryStorage()
  storage.setItem("other-key", "keep")
  saveHistory(storage, "a", "b", 1)
  clearHistory(storage)
  assert.deepEqual(readHistory(storage), [])
  assert.equal(storage.getItem("other-key"), "keep")
})
