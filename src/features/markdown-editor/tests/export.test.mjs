import { test } from "node:test"
import assert from "node:assert/strict"
import { buildHtmlDocument, escapeHtml, exportCss } from "../lib/export-html.mjs"
import { documentFileName, documentTitle, sanitizeFileName } from "../lib/filename.mjs"
import { renderExportBody, renderExportDocument } from "../lib/render-export.mjs"

const svg = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E"
const fail = async () => { throw new Error("render failed") }

function assertSelfContained(html) {
  assert.doesNotMatch(html, /<script/i)
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, "no inline event handlers")
  assert.doesNotMatch(html, /\b(?:src|srcset|poster|data|action|formaction)\s*=\s*["']?\s*(?:https?:)?\/\//i, "no external resource attributes")
  assert.doesNotMatch(html, /url\(\s*["']?(?:https?:)?\/\//i, "no external CSS resources")
  assert.doesNotMatch(html, /@import/i)
  assert.doesNotMatch(html, /<(?:iframe|object|embed|link|base|meta http-equiv="refresh")/i)
}

const hostile = [
  "# Title <script>alert(1)</script>",
  "<script src=\"https://evil.example/x.js\"></script>",
  "<img src=\"https://evil.example/a.png\" onerror=\"alert(1)\">",
  "<style>@import url(https://evil.example/a.css)</style>",
  "![tracker](https://evil.example/pixel.png)",
  "[js](javascript:alert(1)) [data](data:text/html,<script>alert(1)</script>)",
  "<iframe src=\"https://evil.example\"></iframe>",
  "```mermaid\ngraph TD\n  A-->B\n```",
].join("\n\n")

test("exported document has no scripts or external resources", async () => {
  const { html } = await renderExportDocument(hostile, async () => svg)
  assertSelfContained(html)
  assert.match(html, /^<!doctype html>\n<html lang="fa" dir="rtl">/)
  assert.match(html, /<meta charset="utf-8">/)
  assert.match(html, /Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"/)
  assert.doesNotMatch(html, /href="javascript:/)
  assert.match(html, /\[تصویر: <bdi>tracker<\/bdi>/)
})

test("export CSS uses only system fonts and no external resources", () => {
  assertSelfContained(`<style>${exportCss}</style>`)
  assert.match(exportCss, /font-family: system-ui/)
  assert.match(exportCss, /@media print/)
})

test("each block keeps independent dir=auto detection like the preview", async () => {
  const body = await renderExportBody("# عنوان\n\nEnglish paragraph.\n\n- مورد\n- item\n\n> نقل قول\n\n`code`", fail)
  assert.match(body, /<h1 dir="auto">عنوان<\/h1>/)
  assert.match(body, /<p dir="auto">English paragraph\.<\/p>/)
  assert.match(body, /<li dir="auto">مورد<\/li>/)
  assert.match(body, /<li dir="auto">item<\/li>/)
  assert.match(body, /<blockquote dir="auto">/)
  assert.match(body, /<code dir="ltr">code<\/code>/)
})

test("GFM tables, task lists, and strikethrough are exported", async () => {
  const body = await renderExportBody("| فارسی | English |\n| :--- | ---: |\n| سلام | Hello |\n\n- [x] انجام شد\n\n~~حذف~~", fail)
  assert.match(body, /<table>/)
  assert.match(body, /<th style="text-align:left" dir="auto">فارسی<\/th>/)
  assert.match(body, /<td style="text-align:right" dir="auto">Hello<\/td>/)
  assert.match(body, /<li class="task-list-item" dir="auto"><input type="checkbox" disabled="" checked=""\/>/)
  assert.match(body, /<del>حذف<\/del>/)
})

test("special characters are escaped in content, code, attributes, and title", async () => {
  const markdown = '# A & B <C> "D"\n\nمتن 5 < 6 && 7 > 3\n\n```\n<div class="x">&amp;</div>\n```\n\n[l](https://example.com/?a=1&b="2")'
  const { html, body } = await renderExportDocument(markdown, fail)
  assert.match(html, /<title>A &amp; B &lt;C&gt; &quot;D&quot;<\/title>/)
  assert.match(body, /5 &lt; 6 &amp;&amp; 7 &gt; 3/)
  assert.match(body, /&lt;div class=&quot;x&quot;&gt;&amp;amp;&lt;\/div&gt;/)
  assert.match(body, /href="https:\/\/example\.com\/\?a=1&amp;b=%222%22"/)
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;")
  assert.match(buildHtmlDocument({ title: "</title><script>", body: "" }), /<title>&lt;\/title&gt;&lt;script&gt;<\/title>/)
})

test("links open safely in a new tab", async () => {
  const body = await renderExportBody("[پیوند](https://example.com) و <https://example.org>", fail)
  for (const link of body.match(/<a [^>]*>/g)) {
    assert.match(link, /target="_blank"/)
    assert.match(link, /rel="noopener noreferrer"/)
  }
})

test("rendered Mermaid diagrams are inlined as SVG data URIs", async () => {
  const seen = []
  const body = await renderExportBody("```mermaid\ngraph TD\n  A-->B\n```\n\n```mermaid\ngraph TD\n  A-->B\n```", async (source) => {
    seen.push(source)
    return svg
  })
  assert.deepEqual(seen, ["graph TD\n  A-->B"], "identical diagrams render once")
  assert.match(body, /<figure aria-label="نمودار Mermaid"><img src="data:image\/svg\+xml;charset=utf-8,/)
  assert.doesNotMatch(body, /در حال رسم|<details/)
})

test("failed or non-SVG diagram renders fall back to the source as a code block", async () => {
  for (const renderer of [fail, async () => "https://evil.example/diagram.svg", async () => "javascript:alert(1)"]) {
    const body = await renderExportBody("```mermaid\ngraph TD\n  A-->B<x>\n```", renderer)
    assert.match(body, /<pre dir="ltr"><code dir="ltr">graph TD\n  A--&gt;B&lt;x&gt;<\/code><\/pre>/)
    assert.doesNotMatch(body, /<img/)
  }
})

test("file name comes from the first heading, sanitized", () => {
  assert.equal(documentFileName("مقدمه\n\n# گزارش **نهایی** ۱۴۰۵\n\n## بعدی", "md"), "گزارش نهایی ۱۴۰۵.md")
  assert.equal(documentFileName("# نیم‌فاصله‌ها حفظ می‌شوند", "html"), "نیم‌فاصله‌ها حفظ می‌شوند.html")
  assert.equal(documentTitle("عنوان setext\n===\n\n# دوم"), "عنوان setext")
  assert.equal(documentTitle("```\n# داخل کد\n```\n\n## بیرون"), "بیرون")
  assert.equal(documentTitle("# [پیوند](https://x.y) و `کد` #"), "پیوند و کد")
  assert.equal(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j'), "a b c d e f g h i j")
  assert.equal(sanitizeFileName("‮gnp.exe"), "gnp.exe")
  assert.equal(sanitizeFileName("..نام.."), "نام")
  assert.equal(Array.from(sanitizeFileName("ب".repeat(200))).length, 80)
})

test("missing or empty headings fall back to document", () => {
  assert.equal(documentFileName("", "md"), "document.md")
  assert.equal(documentFileName("فقط یک پاراگراف", "html"), "document.html")
  assert.equal(documentFileName("#\n\n#   \n", "md"), "document.md")
  assert.equal(documentFileName("# ///", "md"), "document.md")
  assert.equal(documentFileName("# CON", "md"), "document.md")
  assert.equal(documentFileName("#hashtag", "md"), "document.md")
})
