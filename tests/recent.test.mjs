import { test } from "node:test"
import assert from "node:assert/strict"
import { RECENT_KEY, RECENT_LIMIT, readRecentPaths, rememberRecentPath } from "../src/app/recent.mjs"

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
  }
}

test("stores paths only, newest first, without duplicates", () => {
  const storage = memoryStorage()
  rememberRecentPath(storage, "/text-diff")
  rememberRecentPath(storage, "/json-format")
  rememberRecentPath(storage, "/text-diff")

  assert.deepEqual(readRecentPaths(storage), ["/text-diff", "/json-format"])
  assert.deepEqual(JSON.parse(storage.getItem(RECENT_KEY)), ["/text-diff", "/json-format"])
})

test("caps the list and ignores malformed values", () => {
  const storage = memoryStorage({
    [RECENT_KEY]: JSON.stringify(["/a", 1, null, "/b", "/a", "/c", "/d", "/e", "/f", "/"]),
  })
  assert.equal(RECENT_LIMIT, 5)
  assert.deepEqual(readRecentPaths(storage), ["/a", "/b", "/c", "/d", "/e"])
})

test("survives unavailable or throwing storage", () => {
  assert.deepEqual(readRecentPaths(null), [])
  assert.deepEqual(rememberRecentPath(null, "/text-diff"), [])

  const throwing = {
    getItem() {
      throw new Error("unavailable")
    },
    setItem() {
      throw new Error("unavailable")
    },
  }
  assert.deepEqual(readRecentPaths(throwing), [])
  assert.deepEqual(rememberRecentPath(throwing, "/text-diff"), [])
})

test("ignores paths that are not tool routes", () => {
  const storage = memoryStorage()
  assert.deepEqual(rememberRecentPath(storage, "/"), [])
  assert.deepEqual(rememberRecentPath(storage, "text-diff"), [])
  assert.deepEqual(readRecentPaths(storage), [])
})
