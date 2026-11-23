import { test } from "node:test"
import assert from "node:assert/strict"
import { redact, restore } from "../lib/redact.mjs"
import { sampleTerms, sampleText } from "../lib/sample.mjs"

test("the sample exercises every detector type", () => {
  const result = redact(sampleText, { terms: sampleTerms })
  const types = new Set(result.findings.map((finding) => finding.type))

  for (const type of ["email", "url", "ip", "phone", "nationalId", "card", "iban", "apiKey", "terms"]) {
    assert.equal(types.has(type), true, `expected a ${type} finding in the sample`)
  }
  assert.ok(result.text.includes("[EMAIL_1]"))
  assert.ok(result.text.includes("[PHONE_1]"))
  assert.ok(result.text.includes("[NAME_1]"))
  assert.equal(restore(result.text, result.mapping), sampleText)
})

test("the sample repeats an email so the stable placeholder is visible", () => {
  const result = redact(sampleText, { terms: sampleTerms })
  const email = result.findings.find((finding) => finding.type === "email")
  assert.equal(email.count, 2)
  assert.equal(result.text.split("[EMAIL_1]").length - 1, 2)
})
