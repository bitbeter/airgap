import { test } from "node:test"
import assert from "node:assert/strict"
import { encodeBase64 } from "../lib/base64.mjs"
import { decodeJwt, describeJwtStatus, formatJalaliDateTime } from "../lib/jwt.mjs"

const sampleToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

function makeToken(header, payload, signature = "signature") {
  const encode = (value) => encodeBase64(JSON.stringify(value), { urlSafe: true }).output
  return `${encode(header)}.${encode(payload)}.${signature}`
}

test("decodes the jwt.io sample header and payload", () => {
  const result = decodeJwt(sampleToken, { now: 1516239022000 })
  assert.equal(result.ok, true)
  assert.deepEqual(result.header, { alg: "HS256", typ: "JWT" })
  assert.deepEqual(result.payload, {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
  })
  assert.equal(result.signature, "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
  assert.match(result.headerJson, /\n  "alg": "HS256"/)
  assert.match(result.payloadJson, /\n  "name": "John Doe"/)
})

test("decodes a Persian payload with UTF-8 Base64URL", () => {
  const token = makeToken(
    { alg: "HS256", typ: "JWT" },
    { name: "محمد رضایی", city: "تهران", role: "مدیر" },
  )
  const result = decodeJwt(token)
  assert.equal(result.ok, true)
  assert.equal(result.payload.name, "محمد رضایی")
  assert.equal(result.payload.city, "تهران")
})

test("accepts a Bearer prefix and surrounding whitespace", () => {
  const result = decodeJwt(`  Bearer ${sampleToken}  `, { now: 1516239022000 })
  assert.equal(result.ok, true)
  assert.equal(result.payload.sub, "1234567890")
})

test("accepts tokens wrapped across lines", () => {
  const wrapped = `${sampleToken.slice(0, 20)}\n${sampleToken.slice(20, 60)}\r\n${sampleToken.slice(60)}`
  const result = decodeJwt(wrapped, { now: 1516239022000 })
  assert.equal(result.ok, true)
  assert.equal(result.payload.sub, "1234567890")
})

test("reports exp, iat, and nbf with Jalali and Gregorian dates", () => {
  const token = makeToken(
    { alg: "HS256" },
    { exp: 1700000000, iat: 1600000000, nbf: 1650000000 },
  )
  const result = decodeJwt(token, { now: 1660000000000 })
  assert.equal(result.ok, true)
  assert.deepEqual(result.times.map((time) => time.claim), ["exp", "iat", "nbf"])
  for (const time of result.times) {
    assert.ok(time.jalali.length > 0)
    assert.ok(time.gregorian.length > 0)
    assert.equal(time.iso, new Date(time.seconds * 1000).toISOString())
  }
  assert.equal(result.times[0].iso, "2023-11-14T22:13:20.000Z")
})

test("expiry status covers valid, expired, not-yet-valid, and no-expiry", () => {
  const now = 1700000000000
  assert.equal(describeJwtStatus({ exp: 1700000001 }, now).state, "valid")
  assert.equal(describeJwtStatus({ exp: 1699999999 }, now).state, "expired")
  assert.equal(describeJwtStatus({ nbf: 1700000001 }, now).state, "not-yet-valid")
  assert.equal(describeJwtStatus({}, now).state, "no-expiry")
  assert.equal(describeJwtStatus({ exp: 1700000000 }, now).state, "expired")
})

test("status messages are Persian and include a formatted date", () => {
  const status = describeJwtStatus({ exp: 1700000000 }, 1600000000000)
  assert.equal(status.state, "valid")
  assert.match(status.message, /معتبر/)
  assert.match(status.message, /[۰-۹0-9]/)
})

test("invalid time claims are reported separately", () => {
  const token = makeToken({ alg: "HS256" }, { exp: "soon", iat: 1516239022 })
  const result = decodeJwt(token)
  assert.equal(result.ok, true)
  assert.deepEqual(result.invalidTimeClaims, ["exp"])
  assert.deepEqual(result.times.map((time) => time.claim), ["iat"])
})

test("malformed tokens return Persian errors instead of throwing", () => {
  const validHeader = encodeBase64(JSON.stringify({ alg: "HS256" }), { urlSafe: true }).output
  const cases = [
    ["", "empty"],
    ["one.two", "parts"],
    ["one.two.three.four", "parts"],
    [".payload.signature", "parts"],
    ["not-base64!.payload.signature", "header-base64"],
    [`${validHeader}.bad!.sig`, "payload-base64"],
    [`${encodeBase64("not json", { urlSafe: true }).output}.${encodeBase64("{}", { urlSafe: true }).output}.sig`, "header-json"],
    [makeToken({ alg: "HS256" }, [1, 2, 3]), "payload-json"],
    [`${encodeBase64("[1]", { urlSafe: true }).output}.${encodeBase64("{}", { urlSafe: true }).output}.sig`, "header-json"],
  ]
  for (const [token, code] of cases) {
    const result = decodeJwt(token)
    assert.equal(result.ok, false, token)
    assert.equal(result.code, code, token)
    assert.ok(result.message.length > 0)
  }
})

test("empty signatures are accepted because the signature is not verified", () => {
  const token = makeToken({ alg: "none" }, { sub: "x" }, "")
  const result = decodeJwt(token)
  assert.equal(result.ok, true)
  assert.equal(result.signature, "")
})

test("Jalali formatting falls back safely for invalid dates", () => {
  assert.ok(formatJalaliDateTime(new Date(1516239022000)).length > 0)
  assert.equal(formatJalaliDateTime(new Date(Number.NaN)), "تاریخ نامعتبر")
})
