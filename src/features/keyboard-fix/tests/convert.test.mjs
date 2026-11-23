import { test } from "node:test"
import assert from "node:assert/strict"
import { convert, detectDirection } from "../lib/convert.mjs"
import {
  ZWNJ,
  defaultDirection,
  defaultLayout,
  defaultMode,
  defaultSettings,
  layoutIds,
  layouts,
  mapEnglishKey,
  mapPersianChar,
  normalizeDirection,
  normalizeLayout,
  normalizeMode,
  normalizeSettings,
  readSettings,
  saveSettings,
  settingsKey,
} from "../lib/layouts.mjs"
import { findProtectedRanges } from "../lib/protect.mjs"
import { englishSampleText, persianSampleText } from "../lib/sample.mjs"

function enToFa(text, options = {}) {
  return convert(text, { direction: "en-fa", layout: "standard", ...options })
}

function faToEn(text, options = {}) {
  return convert(text, { direction: "fa-en", layout: "standard", ...options })
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key),
  }
}

test("acceptance: sghl nkdh becomes سلام دنیا", () => {
  assert.equal(enToFa("sghl nkdh").text, "سلام دنیا")
  assert.equal(enToFa("sghl nkdh", { layout: "legacy" }).text, "سلام دنیا")
  assert.equal(enToFa("sghl nkdh").changed, 8)
})

test("fa-en reverses the same words", () => {
  assert.equal(faToEn("سلام دنیا").text, "sghl nkdh")
  assert.equal(faToEn("سلام دنیا", { layout: "legacy" }).text, "sghl nkdh")
  assert.equal(faToEn("سلام دنیا").direction, "fa-en")
})

test("standard and legacy layouts differ where their tables differ", () => {
  assert.equal(enToFa("m").text, "پ")
  assert.equal(enToFa("m", { layout: "legacy" }).text, "ئ")
  assert.equal(enToFa("\\").text, "\\")
  assert.equal(enToFa("\\", { layout: "legacy" }).text, "پ")
  assert.equal(enToFa("S").text, "ئ")
  assert.equal(enToFa("S", { layout: "legacy" }).text, "ُ")
})

test("shifted letters and punctuation follow the standard table", () => {
  const cases = [
    ["SGH", "ئأآ"],
    ["?", "؟"],
    ["&", "،"],
    ['"', "؛"],
    ["L", "«"],
    ["K", "»"],
    ["[", "ج"],
    ["]", "چ"],
    ["{", "}"],
    ["}", "{"],
    ["<", ">"],
    [">", "<"],
    ["$", "﷼"],
    ["@", "٬"],
    ["#", "٫"],
    ["%", "٪"],
    ["^", "×"],
    ["_", "ـ"],
  ]
  for (const [input, expected] of cases) {
    assert.equal(enToFa(input).text, expected, input)
  }
})

test("legacy shifted punctuation follows the old Windows layout", () => {
  const cases = [
    ["T", "،"],
    ["Y", "؛"],
    ["K", "«"],
    ["L", "»"],
    ["?", "؟"],
    ["P", "\\"],
    ["I", "]"],
    ["O", "["],
    ["R", "ر"],
    ["X", "ي"],
  ]
  for (const [input, expected] of cases) {
    assert.equal(enToFa(input, { layout: "legacy" }).text, expected, input)
  }
})

test("Persian guillemets reverse to the layout keys", () => {
  assert.equal(faToEn("«سلام»").text, "LsghlK")
  assert.equal(faToEn("«سلام»", { layout: "legacy" }).text, "KsghlL")
})

test("half-space maps both ways without inventing one from a plain space", () => {
  assert.equal(enToFa("B").text, ZWNJ)
  assert.equal(faToEn(ZWNJ).text, " ")
  // A plain space is a plain space in both directions: pasted text does not
  // carry the Shift+Space key information.
  assert.equal(enToFa("a b").text, "ش ذ")
  assert.equal(faToEn("ش ذ").text, "a b")
})

test("digits, whitespace, and line endings are preserved", () => {
  assert.equal(enToFa("123 ۱۲۳ ٠١٢").text, "123 ۱۲۳ ٠١٢")
  assert.equal(faToEn("123 ۱۲۳ ٠١٢").text, "123 ۱۲۳ ٠١٢")
  assert.equal(enToFa("sghl\r\nnkdh\tdone").text, "سلام\r\nدنیا\tیخدث")
  assert.equal(faToEn("سلام\r\nدنیا").text, "sghl\r\nnkdh")
})

test("URLs and emails are protected in both directions", () => {
  const input = "see https://example.com/a?x=1 and test@example.com now"
  const result = enToFa(input)
  assert.equal(result.text, "سثث https://example.com/a?x=1 شدی test@example.com دخص")
  assert.equal(result.protectedCount, 2)
  assert.equal(faToEn("سلام https://example.com دنیا").text, "sghl https://example.com nkdh")
  assert.deepEqual(findProtectedRanges("https://example.com."), [{ start: 0, end: 19, kind: "url" }])
})

test("auto direction uses the dominant script and ignores protected links", () => {
  assert.equal(detectDirection("sghl nkdh"), "en-fa")
  assert.equal(detectDirection("سلام دنیا"), "fa-en")
  assert.equal(detectDirection("https://example.com سلام"), "fa-en")
  assert.equal(detectDirection("123 !!!"), null)
  assert.equal(detectDirection("aش"), null)
  assert.deepEqual(convert("sghl nkdh"), { text: "سلام دنیا", direction: "en-fa", changed: 8, protectedCount: 0 })
  assert.deepEqual(convert("123 !!!"), { text: "123 !!!", direction: null, changed: 0, protectedCount: 0 })
})

test("wrong-only mode leaves valid words and converts suspicious ones", () => {
  assert.equal(enToFa("hello sghl world", { mode: "wrong-only" }).text, "hello سلام world")
  assert.equal(enToFa("asd", { mode: "wrong-only" }).text, "شسی")
  assert.equal(enToFa("hello world", { mode: "wrong-only" }).text, "hello world")
  assert.equal(faToEn("سلام ش‌شذ دنیا", { mode: "wrong-only" }).text, "سلام a ab دنیا")
  assert.equal(faToEn("سلام مدرسه دنیا", { mode: "wrong-only" }).text, "سلام مدرسه دنیا")
})

test("wrong-only mode still protects URLs and emails", () => {
  const result = enToFa("hello https://example.com sghl", { mode: "wrong-only" })
  assert.equal(result.text, "hello https://example.com سلام")
  assert.equal(result.protectedCount, 1)
})

test("ASCII punctuation in already-English text is not reverse-mapped", () => {
  assert.equal(faToEn(")").text, ")")
  assert.equal(faToEn("[").text, "[")
  assert.equal(faToEn(">").text, ">")
  assert.equal(faToEn("a (b) [c]").text, "a (b) [c]")
})

test("every layout entry round-trips at the character level", () => {
  for (const layoutId of layoutIds) {
    const layout = layouts[layoutId]
    for (const [shift, table] of [[false, layout.base], [true, layout.shift]]) {
      for (const [key, persian] of Object.entries(table)) {
        if (key === " ") continue
        assert.equal(mapEnglishKey(key, layoutId), persian, `${layoutId} ${shift ? "shift+" : ""}${key}`)
        const reverse = mapPersianChar(persian, layoutId)
        assert.ok(reverse, `${layoutId} reverse ${persian}`)
        assert.equal(mapEnglishKey(reverse.key, layoutId), persian, `${layoutId} round-trip ${persian}`)
      }
    }
  }
})

test("the legacy layout has one ambiguous key pair but no lost characters", () => {
  assert.deepEqual(mapPersianChar("ر", "legacy"), { key: "v", shift: false })
  assert.equal(mapEnglishKey("R", "legacy"), "ر")
  assert.equal(mapEnglishKey("v", "legacy"), "ر")
})

test("settings defaults are stable", () => {
  assert.equal(defaultLayout, "standard")
  assert.equal(defaultDirection, "auto")
  assert.equal(defaultMode, "all")
  assert.deepEqual(defaultSettings, { layout: "standard", direction: "auto", mode: "all" })
})

test("settings persist layout, direction, and mode together", () => {
  const storage = memoryStorage()
  assert.deepEqual(readSettings(storage), { ...defaultSettings })
  saveSettings(storage, { layout: "legacy", direction: "fa-en", mode: "wrong-only" })
  assert.equal(
    storage.value(settingsKey),
    JSON.stringify({ layout: "legacy", direction: "fa-en", mode: "wrong-only" }),
  )
  assert.deepEqual(readSettings(storage), { layout: "legacy", direction: "fa-en", mode: "wrong-only" })
})

test("settings normalize unknown and partial values", () => {
  assert.equal(normalizeLayout("nope"), "standard")
  assert.equal(normalizeLayout("legacy"), "legacy")
  assert.equal(normalizeDirection("nope"), "auto")
  assert.equal(normalizeDirection("fa-en"), "fa-en")
  assert.equal(normalizeMode("nope"), "all")
  assert.equal(normalizeMode("wrong-only"), "wrong-only")
  assert.deepEqual(normalizeSettings(null), { ...defaultSettings })
  assert.deepEqual(
    normalizeSettings({ layout: "legacy", direction: "en-fa", mode: "wrong-only", extra: true }),
    { layout: "legacy", direction: "en-fa", mode: "wrong-only" },
  )
})

test("malformed or unavailable settings storage falls back to the defaults", () => {
  assert.deepEqual(readSettings(memoryStorage({ [settingsKey]: "not json" })), { ...defaultSettings })
  assert.deepEqual(
    readSettings(memoryStorage({ [settingsKey]: JSON.stringify({ layout: "unknown", direction: "nope", mode: "nope" }) })),
    { ...defaultSettings },
  )
  assert.deepEqual(
    readSettings(memoryStorage({ [settingsKey]: JSON.stringify({ layout: "legacy" }) })),
    { layout: "legacy", direction: "auto", mode: "all" },
  )
  const broken = {
    getItem() { throw new Error("blocked") },
    setItem() { throw new Error("blocked") },
  }
  assert.deepEqual(readSettings(broken), { ...defaultSettings })
  assert.throws(() => saveSettings(broken, { layout: "legacy", direction: "auto", mode: "all" }))
})

test("the demo samples exercise both directions and protected content", () => {
  assert.equal(detectDirection(englishSampleText), "en-fa")
  assert.equal(detectDirection(persianSampleText), "fa-en")
  const english = convert(englishSampleText, { direction: "en-fa" })
  assert.match(english.text, /123/)
  assert.match(english.text, /https:\/\/example\.com\/a\?x=1/)
  assert.match(english.text, /test@example\.com/)
  const persian = convert(persianSampleText, { direction: "fa-en" })
  assert.match(persian.text, /۱۲۳/)
  assert.match(persian.text, /https:\/\/example\.com\/a\?x=1/)
  assert.match(persian.text, /test@example\.com/)
  assert.ok(persian.protectedCount >= 2)
  assert.match(persian.text, /L/)
  assert.match(persian.text, /K/)
})

test("invalid options fall back to safe defaults", () => {
  assert.equal(convert("sghl", { direction: "nope", layout: "nope", mode: "nope" }).text, "سلام")
  assert.equal(convert("sghl", { direction: "en-fa", layout: "nope" }).text, "سلام")
  assert.equal(convert("", { direction: "en-fa" }).text, "")
  assert.equal(convert("", { direction: "en-fa" }).direction, "en-fa")
})
