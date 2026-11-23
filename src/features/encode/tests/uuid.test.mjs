import { test } from "node:test"
import assert from "node:assert/strict"
import { generateUuidV4, isUuidV4 } from "../lib/uuid.mjs"

test("uses crypto.randomUUID when available", () => {
  const uuid = "123e4567-e89b-42d3-a456-426614174000"
  const result = generateUuidV4({ crypto: { randomUUID: () => uuid } })
  assert.deepEqual(result, { ok: true, uuid })
})

test("falls back to getRandomValues with the version and variant bits set", () => {
  const bytes = new Uint8Array(16)
  for (let index = 0; index < bytes.length; index++) bytes[index] = 0xff
  const result = generateUuidV4({
    crypto: {
      getRandomValues: (target) => {
        target.set(bytes)
        return target
      },
    },
  })
  assert.equal(result.ok, true)
  assert.equal(result.uuid, "ffffffff-ffff-4fff-bfff-ffffffffffff")
  assert.equal(isUuidV4(result.uuid), true)
})

test("reports a Persian error when no secure random source exists", () => {
  const result = generateUuidV4({})
  assert.equal(result.ok, false)
  assert.match(result.message, /UUID/)
})

test("randomUUID failures fall back to getRandomValues", () => {
  const result = generateUuidV4({
    crypto: {
      randomUUID: () => {
        throw new Error("blocked")
      },
      getRandomValues: (target) => {
        target.fill(0)
        return target
      },
    },
  })
  assert.equal(result.ok, true)
  assert.equal(result.uuid, "00000000-0000-4000-8000-000000000000")
})

test("isUuidV4 validates format, version, and variant", () => {
  assert.equal(isUuidV4("123e4567-e89b-42d3-a456-426614174000"), true)
  assert.equal(isUuidV4("123E4567-E89B-42D3-A456-426614174000"), true)
  assert.equal(isUuidV4("123e4567-e89b-12d3-a456-426614174000"), false)
  assert.equal(isUuidV4("123e4567-e89b-42d3-c456-426614174000"), false)
  assert.equal(isUuidV4("not-a-uuid"), false)
  assert.equal(isUuidV4(""), false)
})

test("generated UUIDs are valid v4 values", () => {
  for (let index = 0; index < 20; index++) {
    const result = generateUuidV4(globalThis)
    assert.equal(result.ok, true)
    assert.equal(isUuidV4(result.uuid), true)
  }
})
