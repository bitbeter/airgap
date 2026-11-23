import { test } from "node:test"
import assert from "node:assert/strict"
import { defaultPath, features } from "../src/app/features.ts"
import { normalizeSearchText, searchFeatures } from "../src/app/search.mjs"

function paths(results) {
  return results.map((feature) => feature.path)
}

test("normalizes Persian letter variants, diacritics, and ZWNJ", () => {
  assert.equal(normalizeSearchText("مقايسه"), "مقایسه")
  assert.equal(normalizeSearchText("كدگذاري"), "کدگذاری")
  assert.equal(normalizeSearchText("نيم‌فاصله"), "نیمفاصله")
  assert.equal(normalizeSearchText("  مقایسهٔ  متن  "), "مقایسه متن")
  assert.equal(normalizeSearchText(null), "")
  assert.equal(normalizeSearchText(undefined), "")
})

test("finds the diff tool with English and Persian queries", () => {
  for (const query of ["diff", "تفاوت", "مقايسه", "مقایسه", "مقایسهٔ"]) {
    assert.equal(searchFeatures(features, query)[0]?.path, "/text-diff", query)
  }
})

test("matches kaf and yeh variants in queries", () => {
  assert.equal(searchFeatures(features, "كدگذاري")[0]?.path, "/encode")
})

test("supports fuzzy subsequence queries", () => {
  assert.equal(searchFeatures(features, "mrkdown")[0]?.path, "/markdown-editor")
})

test("returns no results for unrelated queries", () => {
  assert.deepEqual(searchFeatures(features, "zzzzzz"), [])
})

test("an empty query keeps the registry order", () => {
  assert.deepEqual(paths(searchFeatures(features, "")), paths(features))
  assert.deepEqual(paths(searchFeatures(features, "   ")), paths(features))
})

test("every registered feature has a description and keywords", () => {
  assert.ok(features.length > 0)
  for (const feature of features) {
    assert.equal(typeof feature.description, "string", feature.path)
    assert.ok(feature.description.trim().length > 0, feature.path)
    assert.ok(Array.isArray(feature.keywords) && feature.keywords.length > 0, feature.path)
  }
})

test("the default path stays text-diff and paths are unique", () => {
  assert.equal(defaultPath, "/text-diff")
  assert.equal(new Set(paths(features)).size, features.length)
})
