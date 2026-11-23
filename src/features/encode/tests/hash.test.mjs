import { test } from "node:test"
import assert from "node:assert/strict"
import { webcrypto } from "node:crypto"
import {
  compareHash,
  detectSubtleCrypto,
  hashBytes,
  hashFile,
  hashText,
  largeFileThreshold,
  parseExpectedHash,
} from "../lib/hash.mjs"

const subtle = webcrypto.subtle

test("SHA-256 of abc matches the standard test vector", async () => {
  const result = await hashText("abc", "SHA-256", subtle)
  assert.equal(result.hex, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  assert.equal(result.base64, "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=")
  assert.equal(result.byteLength, 32)
})

test("SHA-1, SHA-384, and SHA-512 match standard test vectors for abc", async () => {
  assert.equal(
    (await hashText("abc", "SHA-1", subtle)).hex,
    "a9993e364706816aba3e25717850c26c9cd0d89d",
  )
  assert.equal(
    (await hashText("abc", "SHA-384", subtle)).hex,
    "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
  )
  assert.equal(
    (await hashText("abc", "SHA-512", subtle)).hex,
    "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
  )
})

test("empty text and Persian text hash deterministically", async () => {
  const empty = await hashText("", "SHA-256", subtle)
  assert.equal(empty.hex, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
  const first = await hashText("سلام دنیا", "SHA-256", subtle)
  const second = await hashText("سلام دنیا", "SHA-256", subtle)
  assert.equal(first.hex, second.hex)
  assert.equal(first.hex.length, 64)
})

test("hashBytes and hashFile produce the same digest", async () => {
  const bytes = new TextEncoder().encode("abc")
  const fromBytes = await hashBytes(bytes, "SHA-256", subtle)
  const file = {
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  }
  const fromFile = await hashFile(file, "SHA-256", subtle)
  assert.equal(fromBytes.hex, fromFile.hex)
})

test("unsupported algorithms throw a Persian error", async () => {
  await assert.rejects(() => hashText("abc", "MD5", subtle), /پشتیبانی/)
})

test("Web Crypto failures and unreadable files produce Persian errors", async () => {
  const failingSubtle = { digest: async () => { throw new Error("boom") } }
  await assert.rejects(() => hashBytes(new Uint8Array([1]), "SHA-256", failingSubtle), /مرورگر/)
  const unreadable = { arrayBuffer: async () => { throw new Error("boom") } }
  await assert.rejects(() => hashFile(unreadable, "SHA-256", subtle), /خواندن فایل/)
})

test("lone surrogate text cannot be hashed", async () => {
  await assert.rejects(() => hashText("a\uD800", "SHA-256", subtle), /یونیکد/)
})

test("detectSubtleCrypto reports missing and insecure contexts", () => {
  const available = detectSubtleCrypto({ crypto: { subtle } })
  assert.equal(available.available, true)
  assert.equal(available.subtle, subtle)

  const missing = detectSubtleCrypto({})
  assert.equal(missing.available, false)
  assert.equal(missing.reason, "missing")
  assert.match(missing.message, /Web Crypto/)

  const insecure = detectSubtleCrypto({ crypto: { subtle }, isSecureContext: false })
  assert.equal(insecure.available, false)
  assert.equal(insecure.reason, "insecure")
  assert.match(insecure.message, /ناامن/)
})

test("the large file threshold is 50 MiB", () => {
  assert.equal(largeFileThreshold, 50 * 1024 * 1024)
})

test("parseExpectedHash accepts hex, Base64, prefixes, and separators", () => {
  assert.deepEqual(parseExpectedHash(""), { kind: "empty", normalized: "" })
  assert.deepEqual(parseExpectedHash("BA7816BF 8F01CFEA"), { kind: "hex", normalized: "ba7816bf8f01cfea" })
  assert.deepEqual(parseExpectedHash("ba:78:16:bf"), { kind: "hex", normalized: "ba7816bf" })
  assert.deepEqual(parseExpectedHash("0xBA7816BF"), { kind: "hex", normalized: "ba7816bf" })
  assert.deepEqual(parseExpectedHash("sha256:ba7816bf"), { kind: "hex", normalized: "ba7816bf" })
  assert.deepEqual(parseExpectedHash("ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0="), {
    kind: "base64",
    normalized: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0",
  })
  assert.deepEqual(parseExpectedHash("  "), { kind: "empty", normalized: "" })
})

test("compareHash matches hex case-insensitively and Base64 with or without padding", async () => {
  const result = await hashText("abc", "SHA-256", subtle)
  assert.deepEqual(compareHash(result.hex.toUpperCase(), result), { status: "match", format: "hex" })
  assert.deepEqual(compareHash(result.hex.replace(/(..)/g, "$1 "), result), { status: "match", format: "hex" })
  assert.deepEqual(compareHash(result.base64, result), { status: "match", format: "base64" })
  assert.deepEqual(compareHash(result.base64.replace(/=+$/, ""), result), { status: "match", format: "base64" })
  assert.deepEqual(
    compareHash(result.base64.replace(/\+/g, "-").replace(/\//g, "_"), result),
    { status: "match", format: "base64" },
  )
  assert.deepEqual(compareHash("deadbeef", result), { status: "mismatch", format: "hex" })
  assert.deepEqual(compareHash("", result), { status: "empty", format: "" })
  assert.deepEqual(compareHash("!!!", result), { status: "invalid", format: "" })
})
