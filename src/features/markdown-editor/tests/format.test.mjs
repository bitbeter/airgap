import { test } from "node:test"
import assert from "node:assert/strict"
import { changedRange, continueList, formatActions, formatText, indentList } from "../format.mjs"

// "‸" marks the caret and "‹…›" a selection, on both input and expected output.
function parse(marked) {
  const caret = marked.indexOf("‸")
  if (caret !== -1) return { text: marked.replace("‸", ""), start: caret, end: caret }
  const start = marked.indexOf("‹")
  const end = marked.indexOf("›") - 1
  return { text: marked.replace("‹", "").replace("›", ""), start, end }
}

function mark(result) {
  if (!result) return null
  const { text, selectionStart: start, selectionEnd: end } = result
  if (start === end) return text.slice(0, start) + "‸" + text.slice(start)
  return text.slice(0, start) + "‹" + text.slice(start, end) + "›" + text.slice(end)
}

const format = (marked, action) => { const { text, start, end } = parse(marked); return mark(formatText(text, start, end, action)) }
const enter = (marked) => { const { text, start, end } = parse(marked); return mark(continueList(text, start, end)) }
const tab = (marked, outdent = false) => { const { text, start, end } = parse(marked); return mark(indentList(text, start, end, outdent)) }

test("inline markers wrap a selection and toggle off", () => {
  assert.equal(format("سلام ‹دنیا›", "bold"), "سلام ‹**دنیا**›")
  assert.equal(format("سلام ‹**دنیا**›", "bold"), "سلام ‹دنیا›")
  assert.equal(format("سلام **‹دنیا›**", "bold"), "سلام ‹دنیا›")
  assert.equal(format("a ‹word› b", "italic"), "a ‹_word_› b")
  assert.equal(format("‹old›", "strikethrough"), "‹~~old~~›")
  assert.equal(format("run ‹npm test›", "code"), "run ‹`npm test`›")
})

test("inline markers insert a pair at the caret and remove an empty pair", () => {
  assert.equal(format("متن ‸", "bold"), "متن **‸**")
  assert.equal(format("متن **‸**", "bold"), "متن ‸")
  assert.equal(format("‸", "code"), "`‸`")
})

test("inline markers keep surrounding spaces outside and wrap each line", () => {
  assert.equal(format("a‹ word ›b", "bold"), "a‹ **word** ›b")
  assert.equal(format("‹first\n\nsecond›", "italic"), "‹_first_\n\n_second_›")
  assert.equal(format("‹_first_\n_second_›", "italic"), "‹first\nsecond›")
  assert.equal(format("‹**a**\nb›", "bold"), "‹**a**\n**b**›")
  assert.equal(format("x‹  ›y", "bold"), "x  **‸**y")
})

test("links use the selection as label or URL", () => {
  assert.equal(format("‸", "link"), "[‹متن پیوند›](https://)")
  assert.equal(format("see ‹docs›", "link"), "see [docs](‹https://›)")
  assert.equal(format("‹https://example.com/a›", "link"), "[‸](https://example.com/a)")
})

test("headings replace other levels and toggle off", () => {
  assert.equal(format("عنوان‸", "heading1"), "# عنوان‸")
  assert.equal(format("## عنوان‸", "heading1"), "# عنوان‸")
  assert.equal(format("## ‸عنوان", "heading2"), "‸عنوان")
  assert.equal(format("‸", "heading3"), "### ‸")
  assert.equal(format("before\nti‸tle\nafter", "heading2"), "before\n## ti‸tle\nafter")
})

test("list prefixes apply to every selected line and convert between kinds", () => {
  assert.equal(format("‹a\nb\n\nc›", "bullet"), "‹- a\n- b\n\n- c›")
  assert.equal(format("‹- a\n- b›", "bullet"), "‹a\nb›")
  assert.equal(format("‹- a\n- b›", "ordered"), "‹1. a\n2. b›")
  assert.equal(format("‹a\n  b\n  c\nd›", "ordered"), "‹1. a\n  1. b\n  2. c\n2. d›")
  assert.equal(format("‹- a\n1. b›", "task"), "‹- [ ] a\n- [ ] b›")
  assert.equal(format("- [x] done‸", "bullet"), "- done‸")
  assert.equal(format("  - nested‸", "task"), "  - [ ] nested‸")
  assert.equal(format("‸", "bullet"), "- ‸")
  // A selection ending at a line start does not include that line.
  assert.equal(format("‹a\n›b", "quote"), "‹> a›\nb")
  assert.equal(format("‹> a\n> b›", "quote"), "‹a\nb›")
})

test("blocks are inserted on their own lines with blank lines where needed", () => {
  assert.equal(format("paragraph‸", "rule"), "paragraph\n\n---‸")
  assert.equal(format("one\n‸\ntwo", "rule"), "one\n\n---‸\n\ntwo")
  assert.equal(format("‸", "codeBlock"), "```\n‸\n```")
  assert.equal(format("text‸", "codeBlock"), "text\n```\n‸\n```")
  assert.equal(format("‹a = 1\nb = 2›", "codeBlock"), "```‸\na = 1\nb = 2\n```")
  assert.equal(format("‸", "table"), "| ‹ستون ۱› | ستون ۲ | ستون ۳ |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |")
  assert.equal(format("‸", "mermaid"), "```mermaid\nflowchart LR\n  A[‹شروع›] --> B[پایان]\n```")
  assert.equal(format("‹intro›\nnext", "rule"), "intro\n\n---‸\n\nnext")
})

test("every action returns a result for empty text", () => {
  for (const action of formatActions) assert.ok(formatText("", 0, 0, action), action)
  assert.throws(() => formatText("", 0, 0, "unknown"))
})

test("Enter continues lists and ends them on an empty item", () => {
  assert.equal(enter("- آیتم‸"), "- آیتم\n- ‸")
  assert.equal(enter("  * a‸"), "  * a\n  * ‸")
  assert.equal(enter("9. nine‸"), "9. nine\n10. ‸")
  assert.equal(enter("1) a‸"), "1) a\n2) ‸")
  assert.equal(enter("- [x] done‸"), "- [x] done\n- [ ] ‸")
  assert.equal(enter("- split‸ here"), "- split\n- ‸ here")
  assert.equal(enter("- a\n- ‸"), "- a\n\n‸")
  assert.equal(enter("- a\n- ‸\nnext"), "- a\n\n‸\nnext")
  assert.equal(enter("- [ ] ‸"), "‸")
  assert.equal(enter("- a\n\n- ‸"), "- a\n\n‸")
})

test("Enter keeps the browser default outside list items", () => {
  assert.equal(enter("plain‸"), null)
  assert.equal(enter("‸- a"), null)
  assert.equal(enter("-‸ a"), null)
  assert.equal(enter("‹- a›"), null)
  assert.equal(enter("```\n- code‸\n```"), null)
  assert.equal(enter("---‸"), null)
})

test("Tab nests list items under the previous sibling", () => {
  assert.equal(tab("- a\n- b‸"), "- a\n  - b‸")
  assert.equal(tab("1. a\n2. b‸"), "1. a\n   2. b‸")
  assert.equal(tab("- [ ] a\n- [ ] b‸"), "- a\n  - b‸".replace("- a", "- [ ] a").replace("- b", "- [ ] b"))
  assert.equal(tab("- a\n  - x\n- b‸"), "- a\n  - x\n  - b‸")
  assert.equal(tab("- a\n‹- b\n- c›"), "- a\n‹  - b\n  - c›")
})

test("Shift+Tab moves list items to the parent level", () => {
  assert.equal(tab("- a\n  - b‸", true), "- a\n- b‸")
  assert.equal(tab("1. a\n   1. b\n      - c‸", true), "1. a\n   1. b\n   - c‸")
  assert.equal(tab("  - orphan‸", true), "- orphan‸")
})

test("Tab keeps the browser default when nothing can change", () => {
  assert.equal(tab("plain‸"), null)
  assert.equal(tab("- first‸"), null)
  assert.equal(tab("- top‸", true), null)
  assert.equal(tab("‹- a\nplain›"), null)
  assert.equal(tab("paragraph\n- a‸"), null)
})

test("changed range is the minimal replacement", () => {
  assert.deepEqual(changedRange("a word b", "a **word** b"), { start: 2, end: 6, insert: "**word**" })
  assert.deepEqual(changedRange("abc", "abc"), { start: 3, end: 3, insert: "" })
  assert.deepEqual(changedRange("- a", "a"), { start: 0, end: 2, insert: "" })
  for (const [previous, next] of [["x - a y", "x a y"], ["", "new"], ["aaa", "aaaa"]]) {
    const { start, end, insert } = changedRange(previous, next)
    assert.equal(previous.slice(0, start) + insert + previous.slice(end), next)
  }
})
