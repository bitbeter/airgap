import { test } from "node:test"
import assert from "node:assert/strict"
import { parseJson } from "../lib/format.mjs"
import { lineColumnAt, locateError } from "../lib/locate-error.mjs"

function errorFor(text, options) {
  try {
    parseJson(text, options)
  } catch (error) {
    return locateError(text, error)
  }
  assert.fail("expected the input to be rejected")
}

test("lineColumnAt counts lines and columns with LF and CRLF", () => {
  assert.deepEqual(
    { line: 1, column: 1, lineText: "abc" },
    (({ line, column, lineText }) => ({ line, column, lineText }))(lineColumnAt("abc", 0)),
  )
  assert.deepEqual(
    (({ line, column, lineText }) => ({ line, column, lineText }))(lineColumnAt("a\nb", 3)),
    { line: 2, column: 2, lineText: "b" },
  )
  assert.deepEqual(
    (({ line, column, lineText }) => ({ line, column, lineText }))(lineColumnAt("a\r\nb", 4)),
    { line: 2, column: 2, lineText: "b" },
  )
  assert.deepEqual(
    (({ line, column, lineText }) => ({ line, column, lineText }))(lineColumnAt("a\n", 2)),
    { line: 2, column: 1, lineText: "" },
  )
})

test("a trailing comma reports the comma position", () => {
  const text = '{\n  "a": 1,\n}'
  const error = errorFor(text)
  assert.equal(error.code, "trailing-comma")
  assert.equal(error.line, 2)
  assert.equal(error.column, 9)
  assert.equal(error.lineText, '  "a": 1,')
  assert.match(error.message, /خط ۲، ستون ۹/)
})

test("a missing closing quote reports the opening quote", () => {
  const text = '{"name": "Ali}'
  const error = errorFor(text)
  assert.equal(error.code, "unterminated-string")
  assert.equal(error.position, 9)
  assert.equal(error.line, 1)
  assert.equal(error.column, 10)
  assert.match(error.message, /بسته نشده/)
})

test("an unclosed bracket reports EOF and the opening position", () => {
  const text = '{\n  "a": [1, 2\n'
  const error = errorFor(text)
  assert.equal(error.code, "unclosed")
  assert.equal(error.line, 3)
  assert.equal(error.column, 1)
  assert.match(error.message, /خط ۲، ستون ۸/)
  assert.match(error.message, /\[/)
})

test("an extra comma is reported at the second comma", () => {
  const error = errorFor("[1,,2]")
  assert.equal(error.code, "unexpected-token")
  assert.equal(error.line, 1)
  assert.equal(error.column, 4)
})

test("a missing colon is reported at the value", () => {
  const error = errorFor('{"a" 1}')
  assert.equal(error.code, "missing-colon")
  assert.equal(error.line, 1)
  assert.equal(error.column, 6)
})

test("a missing comma is reported at the next member", () => {
  const error = errorFor('{"a":1 "b":2}')
  assert.equal(error.code, "missing-comma")
  assert.equal(error.line, 1)
  assert.equal(error.column, 8)
})

test("invalid literals and numbers are explained", () => {
  const literal = errorFor('{"a": undefined}')
  assert.equal(literal.code, "invalid-literal")
  assert.equal(literal.column, 7)
  assert.match(literal.message, /true، false و null/)

  const number = errorFor('{"a": 01}')
  assert.equal(number.code, "invalid-number")
  assert.equal(number.column, 7)

  const plus = errorFor('{"a": +1}')
  assert.equal(plus.code, "invalid-number")
  assert.equal(plus.column, 7)
})

test("unknown characters and trailing content are located", () => {
  const character = errorFor('{"a": @}')
  assert.equal(character.code, "unexpected-character")
  assert.equal(character.column, 7)
  assert.match(character.message, /@/)

  const trailing = errorFor("{} []")
  assert.equal(trailing.code, "trailing-content")
  assert.equal(trailing.column, 4)
})

test("an empty input has a clear message", () => {
  const error = errorFor("")
  assert.equal(error.code, "empty")
  assert.equal(error.line, 1)
  assert.equal(error.column, 1)
  assert.match(error.message, /خالی/)
})

test("CRLF input reports the same line and column", () => {
  const text = '{\r\n  "a": 1,\r\n}'
  const error = errorFor(text)
  assert.equal(error.code, "trailing-comma")
  assert.equal(error.line, 2)
  assert.equal(error.column, 9)
  assert.equal(error.lineText, '  "a": 1,')
})

test("unterminated block comments are located in JSONC mode", () => {
  const text = '{\n  /* comment\n  "a": 1\n}'
  const error = errorFor(text, { jsonc: true })
  assert.equal(error.code, "unterminated-comment")
  assert.equal(error.line, 2)
  assert.equal(error.column, 3)
  assert.match(error.message, /\*\//)
})
