const escapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => escapes[character])
}

// Mirrors preview.css with fixed colors: the file has no access to the app's theme.
// Mermaid diagrams are rendered with the dark theme, so they keep a dark backing on paper.
export const exportCss = `
:root { color-scheme: dark; --bg: #0a0a0a; --fg: #fafafa; --muted: #262626; --muted-fg: #a3a3a3; --border: #303030; }
* { box-sizing: border-box; }
html { background: var(--bg); color: var(--fg); }
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; font-size: 16px; line-height: 1.9; }
main { max-width: 52rem; margin: 0 auto; padding: 2rem 1rem; overflow-wrap: anywhere; text-align: start; }
[dir="auto"] { text-align: start; }
main > :first-child { margin-top: 0; }
h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-block: 1.25em .5em; line-height: 1.5; }
h1 { font-size: 1.75em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
p, ul, ol, blockquote { margin-block: .75em; }
ul, ol { padding-inline: 1.5em; }
ul { list-style: disc; } ol { list-style: decimal; }
li.task-list-item { list-style: none; }
input[type="checkbox"] { margin-inline-end: .5em; }
blockquote { margin-inline: 0; border-inline-start: 3px solid var(--border); padding-inline-start: 1em; color: var(--muted-fg); }
a { color: inherit; text-decoration: underline; text-underline-offset: 3px; unicode-bidi: isolate; }
pre { overflow-x: auto; white-space: pre; text-align: left; padding: .75em; margin-block: 1em; border-radius: .5rem; background: var(--muted); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .9em; unicode-bidi: isolate; }
:not(pre) > code { background: var(--muted); padding: .15em .3em; border-radius: .25em; }
table { border-collapse: collapse; margin-block: 1em; width: 100%; }
th, td { border: 1px solid var(--border); padding: .4em .75em; }
th { background: var(--muted); }
hr { margin-block: 1.5em; border: 0; border-top: 1px solid var(--border); }
figure { margin: 1em 0; overflow-x: auto; border: 1px solid var(--border); border-radius: .5rem; padding: .75em; background: #0a0a0a; color: #fafafa; }
figure img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
.text-muted-foreground, .diagram-error { color: var(--muted-fg); }
@media print {
  :root { color-scheme: light; --bg: #fff; --fg: #111; --muted: #f1f1f1; --muted-fg: #555; --border: #bbb; }
  main { max-width: none; padding: 0; }
  pre, figure, tr, img { break-inside: avoid; }
  figure { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`

// A complete standalone document: no scripts, and a policy that blocks any
// external request, so the file behaves the same offline.
export function buildHtmlDocument({ title, body, css = exportCss }) {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<meta name="generator" content="Airgap">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
<main dir="rtl">
${body}
</main>
</body>
</html>
`
}
