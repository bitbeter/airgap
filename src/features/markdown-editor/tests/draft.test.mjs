import { test } from "node:test"
import assert from "node:assert/strict"
import { draftKey, readDraft, saveDraft } from "../draft.mjs"

function storage() {
  const entries = new Map()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  }
}

test("restores the exact latest draft, including Persian, whitespace, and Markdown", () => {
  const store = storage()
  assert.equal(readDraft(store), "")
  saveDraft(store, "old text")
  const latest = "# سلام\n\nEnglish **text**\r\n  \t"
  saveDraft(store, latest)
  assert.equal(readDraft(store), latest)
  assert.equal(store.getItem(draftKey), latest)
  saveDraft(store, " \n\t")
  assert.equal(readDraft(store), " \n\t")
})

test("clearing or deleting all text removes the draft without touching other tools", () => {
  const store = storage()
  store.setItem("airgap:diff-history:v1", "existing history")
  saveDraft(store, "draft")
  saveDraft(store, "")
  assert.equal(store.getItem(draftKey), null)
  assert.equal(readDraft(store), "")
  saveDraft(store, "")
  assert.equal(store.getItem("airgap:diff-history:v1"), "existing history")
})

test("quota failure leaves the previous draft intact and is reported to the caller", () => {
  const store = storage()
  saveDraft(store, "last saved")
  store.setItem = () => { throw new Error("QuotaExceededError") }
  assert.throws(() => saveDraft(store, "new unsaved text"), /QuotaExceededError/)
  assert.equal(readDraft(store), "last saved")
  saveDraft(store, "")
  assert.equal(readDraft(store), "")
})

test("unavailable storage reports read and removal failures to the UI", () => {
  const unavailable = {
    getItem() { throw new Error("SecurityError") },
    removeItem() { throw new Error("SecurityError") },
  }
  assert.throws(() => readDraft(unavailable), /SecurityError/)
  assert.throws(() => saveDraft(unavailable, ""), /SecurityError/)
})
