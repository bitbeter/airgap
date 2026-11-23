import { test } from "node:test"
import assert from "node:assert/strict"
import {
  defaultSettings,
  describeCounts,
  isRuleEnabled,
  normalize,
  normalizeSettings,
  readSettings,
  ruleDefinitions,
  saveSettings,
  settingsKey,
} from "../lib/rules.mjs"
import { findProtectedRanges, isProtected } from "../lib/protect.mjs"

const allRules = normalizeSettings({
  ...defaultSettings,
  taMarbuta: true,
  quotes: true,
  kashida: true,
  diacritics: true,
})

function run(text, settings = defaultSettings) {
  return normalize(text, settings)
}

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test("letters unifies Arabic yeh/kaf and the heh with hamza", () => {
  const cases = [
    ["عربي", "عربی"],
    ["كتاب", "کتاب"],
    ["مصطفى", "مصطفی"],
    ["خانۀ من", "خانهٔ من"],
    ["مدرسهٔ", "مدرسهٔ"],
  ]
  for (const [input, expected] of cases) {
    assert.equal(run(input).text, expected)
  }
  assert.equal(run("عربي كتاب").counts.letters, 2)
  assert.equal(run("عربي", { ...defaultSettings, letters: false }).text, "عربي")
})

test("taMarbuta is optional and converts ة to ه", () => {
  assert.equal(run("مدرسة").text, "مدرسة")
  assert.equal(run("مدرسة", { ...defaultSettings, taMarbuta: true }).text, "مدرسه")
  assert.equal(run("مدرسة", { ...defaultSettings, taMarbuta: true }).counts.taMarbuta, 1)
})

test("digits supports Persian, Latin and no conversion", () => {
  assert.equal(run("123 ١٢٣ ۱۲۳").text, "۱۲۳ ۱۲۳ ۱۲۳")
  assert.equal(run("123 ١٢٣ ۱۲۳", { ...defaultSettings, digits: "latin" }).text, "123 123 123")
  assert.equal(run("123 ١٢٣ ۱۲۳", { ...defaultSettings, digits: "none" }).text, "123 ١٢٣ ۱۲۳")
  assert.equal(run("123", { ...defaultSettings, digits: "persian" }).counts.digits, 3)
  assert.equal(isRuleEnabled({ ...defaultSettings, digits: "none" }, "digits"), false)
})

test("digits, punctuation and invisibles stay out of URLs, emails and code", () => {
  const text = [
    "https://example.com/123?x=1",
    "test123@example.com",
    "`code 123`",
    "```",
    "block 123, ?",
    "```",
    "متن 123",
  ].join("\n")
  const result = run(text, allRules)
  assert.match(result.text, /https:\/\/example\.com\/123\?x=1/)
  assert.match(result.text, /test123@example\.com/)
  assert.match(result.text, /`code 123`/)
  assert.match(result.text, /block 123, \?/)
  assert.match(result.text, /متن ۱۲۳/)
})

test("zwnj joins می/نمی prefixes, plurals, comparatives and final-heh suffixes", () => {
  const cases = [
    ["می روم", "می‌روم"],
    ["میروم", "می‌روم"],
    ["نمی روم", "نمی‌روم"],
    ["کتاب ها", "کتاب‌ها"],
    ["کتابها", "کتاب‌ها"],
    ["خانه ها", "خانه‌ها"],
    ["خانهها", "خانه‌ها"],
    ["بچههای خوب", "بچه‌های خوب"],
    ["کتاب های خوب", "کتاب‌های خوب"],
    ["بزرگ تر", "بزرگ‌تر"],
    ["بزرگتر", "بزرگ‌تر"],
    ["کوتاه تر", "کوتاه‌تر"],
    ["کوتاهتر", "کوتاه‌تر"],
    ["خانه ام", "خانه‌ام"],
    ["خانه ای", "خانه‌ای"],
    ["بچه ات", "بچه‌ات"],
  ]
  for (const [input, expected] of cases) {
    assert.equal(run(input).text, expected, input)
  }
})

test("zwnj does not break exception words or non-joining stems", () => {
  const unchanged = [
    "میز",
    "میهن",
    "ترانه",
    "هایکو",
    "ترین",
    "میخ",
    "میدان",
    "میوه",
    "میزها",
    "بهتر",
    "کمتر",
    "بیشترین",
    "دختر",
    "دفتر",
    "کامپیوتر",
    "کبوتر",
    "زیباتر",
    "بالاتر",
    "کتاب ام",
    "کتابهای خوب",
    "خانهای بزرگ",
  ]
  for (const input of unchanged) {
    assert.equal(run(input).text, input, input)
  }
  // Short exception words must not block real verbs.
  assert.equal(run("میزنم").text, "می‌زنم")
  assert.equal(run("میخوام").text, "می‌خوام")
  assert.equal(run("میروم").text, "می‌روم")
})

test("spacing collapses runs, trims line ends and fixes punctuation spacing", () => {
  assert.equal(run("متن  با   فاصله").text, "متن با فاصله")
  assert.equal(run("خط اول   \nخط دوم").text, "خط اول\nخط دوم")
  assert.equal(run("سلام ،دنیا").text, "سلام، دنیا")
  assert.equal(run("سلام,دنیا").text, "سلام، دنیا")
  assert.equal(run("سلام .دنیا").text, "سلام. دنیا")
  assert.equal(run("سلام.hello").text, "سلام. hello")
  assert.equal(run("hello,world").text, "hello,world")
  assert.equal(run("3,000", { ...defaultSettings, digits: "none" }).text, "3,000")
  assert.equal(run("3,000").text, "۳,۰۰۰")
  assert.equal(run("e.g.").text, "e.g.")
})

test("punctuation converts Latin marks only in a Persian context", () => {
  assert.equal(run("سلام, دنیا").text, "سلام، دنیا")
  assert.equal(run("سلام; دنیا").text, "سلام؛ دنیا")
  assert.equal(run("سلام? دنیا").text, "سلام؟ دنیا")
  assert.equal(run("Hello, world?").text, "Hello, world?")
  assert.equal(run("3,000", { ...defaultSettings, digits: "none" }).text, "3,000")
  assert.equal(run("سلام, دنیا").counts.punctuation, 1)
})

test("quotes are optional and only converted around Persian text", () => {
  assert.equal(run('"سلام"').text, '"سلام"')
  assert.equal(run('"سلام"', { ...defaultSettings, quotes: true }).text, "«سلام»")
  assert.equal(run('"hello"', { ...defaultSettings, quotes: true }).text, '"hello"')
})

test("kashida and diacritics are optional and keep the hamza of هٔ", () => {
  assert.equal(run("کتـــاب").text, "کتـــاب")
  assert.equal(run("کتـــاب", { ...defaultSettings, kashida: true }).text, "کتاب")
  assert.equal(run("كَتَبَ").text, "کَتَبَ")
  assert.equal(run("كَتَبَ", { ...defaultSettings, diacritics: true }).text, "کتب")
  assert.equal(run("هٔ", { ...defaultSettings, diacritics: true }).text, "هٔ")
})

test("invisible characters are removed or converted while ZWNJ is kept", () => {
  assert.equal(run("متن\u200dنامرئی").text, "متننامرئی")
  assert.equal(run("متن\u200e\u200f").text, "متن")
  assert.equal(run("متن\u00a0دوم").text, "متن دوم")
  assert.equal(run("می\u200cروم").text, "می‌روم")
  assert.equal(run("متن\u200dنامرئی").counts.invisible, 1)
})

test("normalize is idempotent with default and all rules", () => {
  const samples = [
    "عربي كتاب مدرسة",
    "می روم و نمی روم",
    "میروم و نمیروم",
    "کتاب ها و خانه ها و میز ها",
    "کتابها و خانهها و میزها",
    "بچههای خوب",
    "کتابهای خوب",
    "خانهای بزرگ",
    "بزرگ تر و کوتاه تر و بهتر",
    "بزرگتر و کوتاهتر و بهتر",
    "زیبا تر و بالاتر",
    "خانه ام و کتاب ام",
    "سلام ,دنیا ?",
    "سلام,دنیا?",
    "متن  با   فاصله",
    "https://example.com/سلام?x=1 و test@example.com",
    "```\nسلام,دنیا?\n```",
    "میخ و میز و میهن و ترانه و هایکو",
    "ترین",
    "بهترین و کمترین و بیشترین",
    "دختر و دفتر و کامپیوتر و کبوتر",
    "خانۀ من",
    'كتاب‌هاي من, "سلام"',
    "١٢٣ ۱۲۳ 123",
    "كتـــاب كَتَبَ",
    "متن\u200dنامرئی\u200e و\u00a0متن",
    "می‌روم",
    "کتاب‌ها",
    "بزرگ‌تر",
    "خانه‌ام",
    "«سلام»",
  ]
  for (const settings of [defaultSettings, allRules]) {
    for (const sample of samples) {
      const once = normalize(sample, settings).text
      const twice = normalize(once, settings).text
      assert.equal(twice, once, sample)
    }
  }
})

test("protected ranges cover URLs, emails, fenced code and inline code", () => {
  const text = [
    "قبل https://example.com/a?b=1. بعد",
    "test@example.com",
    "```js",
    "const x = 1",
    "```",
    "و `inline` و",
    "~~~",
    "tilde",
    "~~~",
  ].join("\n")
  const ranges = findProtectedRanges(text)
  const urlStart = text.indexOf("https://")
  assert.equal(isProtected(urlStart, ranges), true)
  assert.equal(isProtected(text.indexOf("test@example.com"), ranges), true)
  assert.equal(isProtected(text.indexOf("const x"), ranges), true)
  assert.equal(isProtected(text.indexOf("inline"), ranges), true)
  assert.equal(isProtected(text.indexOf("tilde"), ranges), true)
  // The sentence period after the URL is not part of the URL range.
  assert.equal(isProtected(text.indexOf(". بعد"), ranges), false)
})

test("a URL with trailing punctuation keeps the punctuation outside its range", () => {
  const text = "به https://example.com/test. ادامه"
  const ranges = findProtectedRanges(text)
  const url = ranges.find((range) => range.kind === "url")
  assert.ok(url)
  assert.equal(text.slice(url.start, url.end), "https://example.com/test")
})

test("CRLF input keeps protected code and trims trailing spaces", () => {
  const text = "```\r\nعربي 123\r\n```\r\nمتن  \r\n"
  assert.equal(run(text, allRules).text, "```\r\nعربي 123\r\n```\r\nمتن\r\n")
})

test("protectCode can be turned off", () => {
  const text = "`123`"
  assert.equal(run(text, { ...defaultSettings, protectCode: false }).text, "`۱۲۳`")
  assert.equal(run(text, { ...defaultSettings, protectCode: true }).text, "`123`")
})

test("settings use a versioned key and recover from malformed values", () => {
  assert.equal(settingsKey, "airgap:persian-text:settings:v1")
  const storage = memoryStorage()
  assert.deepEqual(readSettings(storage), { ...defaultSettings })
  saveSettings(storage, { ...defaultSettings, letters: false, digits: "latin", protectCode: false })
  assert.deepEqual(readSettings(storage), {
    ...defaultSettings,
    letters: false,
    digits: "latin",
    protectCode: false,
  })
  storage.setItem(settingsKey, "{bad json")
  assert.deepEqual(readSettings(storage), { ...defaultSettings })
  assert.deepEqual(normalizeSettings({ digits: "roman", letters: "yes" }), {
    ...defaultSettings,
    letters: false,
  })
  assert.equal(normalizeSettings({ protectCode: false }).protectCode, false)
})

test("describeCounts summarizes nonzero rules in definition order", () => {
  assert.equal(describeCounts({}), "تغییری لازم نیست.")
  assert.equal(
    describeCounts({ letters: 5, zwnj: 4, spacing: 3 }),
    "۱۲ تغییر: ۵ ی/ک، ۴ نیم‌فاصله، ۳ فاصله",
  )
  assert.equal(ruleDefinitions.length, 10)
})
