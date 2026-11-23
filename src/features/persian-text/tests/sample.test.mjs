import { test } from "node:test"
import assert from "node:assert/strict"
import { sampleText } from "../lib/sample.mjs"
import { defaultSettings, normalize, normalizeSettings, ruleDefinitions } from "../lib/rules.mjs"

const allRules = normalizeSettings({
  ...defaultSettings,
  taMarbuta: true,
  quotes: true,
  kashida: true,
  diacritics: true,
})

test("the sample exercises every rule", () => {
  const result = normalize(sampleText, allRules)
  for (const definition of ruleDefinitions) {
    assert.ok(result.counts[definition.id] > 0, `${definition.id} should change in the sample`)
  }
  assert.equal(normalize(result.text, allRules).text, result.text)
})

test("the sample keeps URLs, emails and Markdown code untouched", () => {
  const result = normalize(sampleText, allRules)
  assert.match(result.text, /https:\/\/example\.com\/123\?x=1/)
  assert.match(result.text, /test123@example\.com/)
  assert.match(result.text, /`const x = 123;`/)
  assert.match(result.text, /const message = "سلام, دنيا\?";/)
})

test("the sample keeps exception words and shows the ZWNJ cases", () => {
  const result = normalize(sampleText, allRules)
  assert.match(result.text, /میز، میهن، ترانه، هایکو/)
  assert.match(result.text, /می‌روم/)
  assert.match(result.text, /کتاب‌های/)
  assert.match(result.text, /بزرگ‌ترین/)
  assert.match(result.text, /خانه‌ام/)
})
