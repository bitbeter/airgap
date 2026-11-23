// Demo texts for the keyboard-layout fixer. They deliberately include both
// directions, numbers, a URL, an email, shifted punctuation, and layout-specific
// keys (m and the backslash) so the page controls can be exercised quickly.

export const englishSampleText = [
  "sghl nkdh",
  "hello sghl world",
  "sghl nkdh 123 https://example.com/a?x=1 test@example.com",
  'sghl? nkdh! [test] & "quote"',
  "m \\ sghl",
  "سلام دنیا",
].join("\n")

export const persianSampleText = [
  "سلام دنیا",
  "سلام ش‌شذ دنیا",
  "سلام دنیا ۱۲۳ https://example.com/a?x=1 test@example.com",
  "سلام؟ دنیا! «نقل‌قول» [تست]",
  "پ ئ",
].join("\n")
