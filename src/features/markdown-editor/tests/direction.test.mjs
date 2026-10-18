import { test } from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { markdownComponents } from "../markdown-components.mjs"

function render(text) {
  return renderToStaticMarkup(createElement(Markdown, {
    remarkPlugins: [remarkGfm], skipHtml: true, components: markdownComponents,
  }, text))
}

test("mixed Persian and English blocks each get independent native direction detection", () => {
  const html = render("# عنوان فارسی\n\nEnglish paragraph.\n\n۱۲۳ — متن فارسی\n\n## English heading\n\n- مورد فارسی\n- English item\n\n> نقل قول فارسی")
  assert.match(html, /<h1 dir="auto">عنوان فارسی<\/h1>/)
  assert.match(html, /<p dir="auto">English paragraph\.<\/p>/)
  assert.match(html, /<p dir="auto">۱۲۳ — متن فارسی<\/p>/)
  assert.match(html, /<h2 dir="auto">English heading<\/h2>/)
  assert.match(html, /<li dir="auto">مورد فارسی<\/li>/)
  assert.match(html, /<li dir="auto">English item<\/li>/)
  assert.match(html, /<blockquote dir="auto">/)
})

test("GFM table cells detect direction without losing explicit alignment", () => {
  const html = render("| فارسی | English |\n| :--- | ---: |\n| سلام | Hello |")
  assert.match(html, /<th style="text-align:left" dir="auto">فارسی<\/th>/)
  assert.match(html, /<td style="text-align:right" dir="auto">Hello<\/td>/)
})

test("inline and fenced code keep LTR and language metadata", () => {
  const html = render('متن `foo(bar)` فارسی\n\n```js\nconst title = "سلام";\n```')
  assert.match(html, /<code dir="ltr">foo\(bar\)<\/code>/)
  assert.match(html, /<pre dir="ltr"><code class="language-js" dir="ltr">/)
})

test("direction handling preserves task lists and prevents external image loading", () => {
  const html = render('- [x] انجام شد\n\n![English caption](https://example.com/image.png)\n\n<script>alert(1)</script>\n\n[لینک](javascript:alert)')
  assert.match(html, /<li class="task-list-item" dir="auto">/)
  assert.match(html, /type="checkbox"/)
  assert.match(html, /<bdi>English caption<\/bdi>/)
  assert.doesNotMatch(html, /<img|<script|href="javascript:/)
})
