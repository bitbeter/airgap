import { test } from "node:test"
import assert from "node:assert/strict"
import {
  defaultSettings,
  formatJson,
  isUnsafeNumber,
  normalizeSettings,
  parseJson,
  pathForIndex,
  pathForKey,
  readSettings,
  saveSettings,
  serializeNode,
  settingsKey,
} from "../lib/format.mjs"
import { sampleJson } from "../lib/sample.mjs"

const safeFixtures = [
  '{"a":1,"b":[true,false,null,"x"],"c":{"d":-2500}}',
  "[1,2,3]",
  '{"empty":{},"list":[]}',
  '{"fa":"سلام دنیا","city":"تهران"}',
  '{"s":"a\\nb\\t\\"c\\"\\\\d"}',
]

test("pretty output matches JSON.stringify for safe inputs", () => {
  for (const fixture of safeFixtures) {
    const expected = JSON.parse(fixture)
    for (const indent of [2, 4]) {
      assert.equal(formatJson(fixture, { indent }).output, JSON.stringify(expected, null, indent))
    }
  }
})

test("tab indentation is supported", () => {
  assert.equal(
    formatJson('{"a":[1]}', { indent: "tab" }).output,
    '{\n\t"a": [\n\t\t1\n\t]\n}',
  )
})

test("minify output matches JSON.stringify for safe inputs", () => {
  for (const fixture of safeFixtures) {
    assert.equal(formatJson(fixture, { minify: true }).output, JSON.stringify(JSON.parse(fixture)))
  }
})

test("root primitive values are valid JSON documents", () => {
  assert.equal(formatJson('"hello"').output, '"hello"')
  assert.equal(formatJson("null").output, "null")
  assert.equal(formatJson("true").output, "true")
  assert.equal(formatJson("123").output, "123")
  assert.equal(formatJson('"سلام"').output, '"سلام"')
})

test("sorting keys is recursive and leaves array order alone", () => {
  const text = '{"b":1,"a":{"d":2,"c":3},"arr":[{"z":1,"y":2}]}'
  const expected = `{
  "a": {
    "c": 3,
    "d": 2
  },
  "arr": [
    {
      "y": 2,
      "z": 1
    }
  ],
  "b": 1
}`
  assert.equal(formatJson(text, { sortKeys: true }).output, expected)
})

test("large integers keep their original token text", () => {
  const text = '{"n":12345678901234567890,"m":-9007199254740993,"safe":9007199254740991,"decimal":0.123456789012345678}'
  const result = formatJson(text)
  assert.ok(result.output.includes("12345678901234567890"))
  assert.ok(result.output.includes("-9007199254740993"))
  assert.ok(result.output.includes("9007199254740991"))
  assert.deepEqual(result.warnings.map((warning) => warning.path), ["$.n", "$.m", "$.decimal"])
  assert.equal(result.warnings[0].raw, "12345678901234567890")
})

test("isUnsafeNumber follows the safe-integer boundary and significant digits", () => {
  assert.equal(isUnsafeNumber("9007199254740991"), false)
  assert.equal(isUnsafeNumber("-9007199254740991"), false)
  assert.equal(isUnsafeNumber("9007199254740992"), true)
  assert.equal(isUnsafeNumber("-9007199254740992"), true)
  assert.equal(isUnsafeNumber("1e400"), true)
  assert.equal(isUnsafeNumber("0.1"), false)
  assert.equal(isUnsafeNumber("1.234567890123456"), true)
})

test("number spelling is preserved, including exponent forms", () => {
  const text = '{"a":1e3,"b":-0.5E-2}'
  const result = formatJson(text)
  assert.ok(result.output.includes("1e3"))
  assert.ok(result.output.includes("-0.5E-2"))
  assert.deepEqual(JSON.parse(result.output), JSON.parse(text))
})

test("Persian strings and escape spellings are preserved verbatim", () => {
  const text = String.raw`{"fa":"سلام دنیا","esc":"a\nb\t\"c\"","unicode":"\u06A9\u0627\u0631","slash":"a\/b"}`
  const result = formatJson(text)
  assert.ok(result.output.includes("سلام دنیا"))
  assert.ok(result.output.includes(String.raw`"a\nb\t\"c\""`))
  assert.ok(result.output.includes(String.raw`"\u06A9\u0627\u0631"`))
  assert.ok(result.output.includes(String.raw`"a\/b"`))
  assert.deepEqual(JSON.parse(result.output), JSON.parse(text))
})

test("JSONC comments and trailing commas are accepted and removed", () => {
  const text = `{
  // comment
  "a": 1,
  "b": [2, 3,], /* block */
}`
  const result = formatJson(text, { jsonc: true })
  assert.equal(result.output, JSON.stringify(JSON.parse('{"a":1,"b":[2,3]}'), null, 2))
  assert.equal(result.stats.keys, 2)
})

test("JSONC mode does not treat comment markers inside strings as comments", () => {
  const text = '{"url":"http://example.com/a/*b*/","note":"// not a comment"}'
  assert.equal(formatJson(text, { jsonc: true }).output, JSON.stringify(JSON.parse(text), null, 2))
})

test("comments and trailing commas are rejected when JSONC is off", () => {
  assert.throws(() => parseJson('{"a":1,}'), (error) => error.code === "trailing-comma")
  assert.throws(() => parseJson('{// x\n"a":1}'), (error) => error.code === "unexpected-character")
})

test("stats report keys, depth, nodes, and byte sizes", () => {
  const text = '{"a":1,"b":{"c":2},"d":[1,2]}'
  const result = formatJson(text)
  assert.equal(result.stats.keys, 4)
  assert.equal(result.stats.depth, 2)
  assert.equal(result.stats.nodes, 7)
  assert.equal(result.stats.inputBytes, Buffer.byteLength(text, "utf8"))
  assert.equal(result.stats.outputBytes, Buffer.byteLength(result.output, "utf8"))
  assert.equal(formatJson("1").stats.depth, 0)
  assert.equal(formatJson("[]").stats.depth, 1)
})

test("settings storage validates and falls back per field", () => {
  assert.equal(settingsKey, "airgap:json-format:settings:v1")
  const store = {
    value: null,
    getItem(key) {
      assert.equal(key, settingsKey)
      return this.value
    },
    setItem(key, value) {
      assert.equal(key, settingsKey)
      this.value = value
    },
  }

  assert.deepEqual(readSettings(store), defaultSettings)
  const saved = saveSettings(store, { indent: "tab", sortKeys: true, jsonc: true, minify: true })
  assert.deepEqual(saved, { indent: "tab", sortKeys: true, jsonc: true, minify: true })
  assert.deepEqual(readSettings(store), saved)

  store.value = '{"indent":3,"sortKeys":"yes","jsonc":1}'
  assert.deepEqual(readSettings(store), defaultSettings)
  store.value = "not json"
  assert.deepEqual(readSettings(store), defaultSettings)
  assert.deepEqual(normalizeSettings(null), defaultSettings)
})

test("paths use dot notation for identifiers and brackets otherwise", () => {
  assert.equal(pathForKey("$", "users"), "$.users")
  assert.equal(pathForKey("$", "کاربران"), "$.کاربران")
  assert.equal(pathForKey("$", "first name"), '$["first name"]')
  assert.equal(pathForKey("$", "a-b"), '$["a-b"]')
  assert.equal(pathForKey("$", ""), '$[""]')
  assert.equal(pathForIndex("$.users", 2), "$.users[2]")
})

test("a subtree can be serialized on its own", () => {
  const root = parseJson('{"a":[1,2]}')
  assert.equal(serializeNode(root, { indent: 2 }), '{\n  "a": [\n    1,\n    2\n  ]\n}')
  assert.equal(serializeNode(root.entries[0].value, { minify: true }), "[1,2]")
})

test("the sample is valid JSON and demonstrates an unsafe number", () => {
  const result = formatJson(sampleJson)
  assert.equal(result.warnings.length, 1)
  assert.equal(result.warnings[0].path, "$.کاربران[0].امتیاز")
  assert.ok(result.output.includes("12345678901234567890"))
  assert.ok(result.output.includes(String.raw`"C:\\Users\\Ali"`))
  assert.ok(result.output.includes("سلام"))
})
