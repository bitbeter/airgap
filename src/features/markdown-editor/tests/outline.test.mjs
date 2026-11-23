import { test } from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { extractOutline } from "../lib/outline.mjs"
import { markdownComponents, markdownComponentsWithSourceLines } from "../markdown-components.mjs"

function render(text, components) {
  return renderToStaticMarkup(createElement(Markdown, {
    remarkPlugins: [remarkGfm], skipHtml: true, components,
  }, text))
}

const document = [
  "# عنوان یک",
  "",
  "مقدمه",
  "",
  "## بخش دوم ##",
  "",
  "### زیربخش",
  "",
  "#### سطح چهار",
  "",
  "```",
  "# داخل کد",
  "```",
  "",
  "تیتر ستکس",
  "==========",
  "",
  "زیرتیتر ستکس",
  "---",
  "",
  "#",
  "",
  "پاراگراف",
  "",
  "---",
].join("\n")

test("extracts H1–H3 with source lines and skips H4, code, empty, and rules", () => {
  assert.deepEqual(extractOutline(document), [
    { level: 1, text: "عنوان یک", line: 1 },
    { level: 2, text: "بخش دوم", line: 5 },
    { level: 3, text: "زیربخش", line: 7 },
    { level: 1, text: "تیتر ستکس", line: 15 },
    { level: 2, text: "زیرتیتر ستکس", line: 18 },
  ])
})

test("supports Setext headings and ignores a rule after a blank line", () => {
  const text = ["تیتر اصلی", "===", "", "زیرتیتر", "---", "", "متن", "", "---"].join("\n")
  assert.deepEqual(extractOutline(text), [
    { level: 1, text: "تیتر اصلی", line: 1 },
    { level: 2, text: "زیرتیتر", line: 4 },
  ])
})

test("a multi-line Setext heading starts at its first text line", () => {
  const text = ["خط اول تیتر", "خط دوم تیتر", "===", "", "پاراگراف"].join("\n")
  assert.deepEqual(extractOutline(text), [
    { level: 1, text: "خط اول تیتر خط دوم تیتر", line: 1 },
  ])
  const html = render(text, markdownComponentsWithSourceLines)
  assert.match(html, /<h1 dir="auto" data-source-line="1">/)
})

test("ignores heading markers inside backtick and tilde fences", () => {
  const text = ["```md", "# not a heading", "## also not", "```", "", "~~~", "# not either", "~~~", "# yes"].join("\n")
  assert.deepEqual(extractOutline(text), [{ level: 1, text: "yes", line: 9 }])
})

test("ignores indented code and headings without a space after #", () => {
  const text = ["    # indented code", "#Heading", "# yes"].join("\n")
  assert.deepEqual(extractOutline(text), [{ level: 1, text: "yes", line: 3 }])
})

test("keeps Persian headings and strips inline Markdown from labels", () => {
  const text = [
    "## **پررنگ** و `کد` و [پیوند](https://example.com)",
    "",
    "### عنوان فارسی با نیم‌فاصله",
    "",
    "## عنوان با ###",
  ].join("\n")
  assert.deepEqual(extractOutline(text), [
    { level: 2, text: "پررنگ و کد و پیوند", line: 1 },
    { level: 3, text: "عنوان فارسی با نیم‌فاصله", line: 3 },
    { level: 2, text: "عنوان با", line: 5 },
  ])
})

test("maxLevel can include deeper headings", () => {
  const text = ["# یک", "#### چهار", "##### پنج"].join("\n")
  assert.deepEqual(extractOutline(text, 6), [
    { level: 1, text: "یک", line: 1 },
    { level: 4, text: "چهار", line: 2 },
    { level: 5, text: "پنج", line: 3 },
  ])
})

test("renders data-source-line only for the preview component set", () => {
  const text = ["# عنوان", "", "پاراگراف", "", "## دوم"].join("\n")
  const withLines = render(text, markdownComponentsWithSourceLines)
  assert.match(withLines, /<h1 dir="auto" data-source-line="1">/)
  assert.match(withLines, /<p dir="auto" data-source-line="3">/)
  assert.match(withLines, /<h2 dir="auto" data-source-line="5">/)
  assert.doesNotMatch(render(text, markdownComponents), /data-source-line/)
})
