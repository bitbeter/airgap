const persianDigits = "۰۱۲۳۴۵۶۷۸۹"

function fa(value) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)])
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function preview(value, max = 40) {
  const text = String(value ?? "").replace(/\s+/g, " ")
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** Convert a zero-based character offset to 1-based line/column and its line. */
export function lineColumnAt(text, position) {
  const source = typeof text === "string" ? text : ""
  const target = clamp(Number.isFinite(position) ? Math.trunc(position) : 0, 0, source.length)
  let line = 1
  let column = 1
  let lineStart = 0
  let index = 0

  while (index < target) {
    const char = source[index]
    if (char === "\r") {
      if (source[index + 1] === "\n" && index + 1 < target) index++
      line++
      column = 1
      lineStart = index + 1
    } else if (char === "\n") {
      line++
      column = 1
      lineStart = index + 1
    } else {
      column++
    }
    index++
  }

  let lineEnd = lineStart
  while (lineEnd < source.length && source[lineEnd] !== "\n" && source[lineEnd] !== "\r") lineEnd++

  return { line, column, lineStart, lineEnd, lineText: source.slice(lineStart, lineEnd) }
}

/**
 * Turn a JsonSyntaxError (or any object with `code`/`position`) into a Persian
 * message plus the line and column used by the page.
 */
export function locateError(text, error) {
  const source = typeof text === "string" ? text : ""
  const code = error && typeof error.code === "string" ? error.code : "unknown"
  const rawPosition = error && Number.isFinite(error.position) ? error.position : 0
  const position = clamp(Math.trunc(rawPosition), 0, source.length)
  const location = lineColumnAt(source, position)
  const detail = error && typeof error.detail === "object" && error.detail ? error.detail : {}
  const where = `خط ${fa(location.line)}، ستون ${fa(location.column)}`
  let message

  switch (code) {
    case "empty":
      message = "ورودی خالی است؛ یک مقدار JSON معتبر وارد کنید."
      break
    case "unexpected-character":
      message = `نویسهٔ ناشناختهٔ «${preview(detail.char ?? source[position] ?? "?")}» در ${where} پیدا شد.`
      break
    case "invalid-number":
      message = `عدد «${preview(detail.raw ?? "")}» در ${where} معتبر نیست.`
      break
    case "invalid-literal":
      message = `مقدار «${preview(detail.raw ?? "")}» در ${where} معتبر نیست؛ فقط true، false و null مجازند.`
      break
    case "unterminated-string":
      message = `رشتهٔ متنی که در ${where} شروع شده بسته نشده است؛ کوتیشن پایانی (") را اضافه کنید.`
      break
    case "invalid-escape":
      message = `ترکیب فرار (escape) نامعتبر «${preview(detail.raw ?? "")}» در ${where} وجود دارد.`
      break
    case "control-character":
      message = `نویسهٔ کنترلی خام در رشتهٔ متنی، ${where}، مجاز نیست؛ از \\n یا \\uXXXX استفاده کنید.`
      break
    case "unterminated-comment":
      message = `کامنت بلوکی که در ${where} شروع شده بسته نشده است؛ «*/» را اضافه کنید.`
      break
    case "unexpected-end":
      message = `ورودی در ${where} پیش از پایان مقدار تمام شد.`
      break
    case "unexpected-token":
      message = `مقدار «${preview(detail.raw ?? "")}» در ${where} در این مکان مجاز نیست.`
      break
    case "expected-key":
      message = `کلید شیء در ${where} باید رشتهٔ داخل کوتیشن باشد.`
      break
    case "missing-colon":
      message = `بعد از کلید در ${where} باید «:» بیاید.`
      break
    case "missing-comma":
      message = `بین اعضا در ${where} ویرگول جا افتاده است.`
      break
    case "trailing-comma":
      message = `ویرگول انتهایی در ${where} مجاز نیست؛ آن را حذف کنید یا حالت JSONC را روشن کنید.`
      break
    case "trailing-content":
      message = `پس از پایان مقدار، متن اضافه‌ای در ${where} وجود دارد.`
      break
    case "unclosed": {
      const openPosition = Number.isFinite(detail.openPosition)
        ? clamp(Math.trunc(detail.openPosition), 0, source.length)
        : position
      const openLocation = lineColumnAt(source, openPosition)
      const openChar = detail.openChar === "[" ? "[" : "{"
      const closeChar = openChar === "[" ? "]" : "}"
      message = `«${openChar}» که در خط ${fa(openLocation.line)}، ستون ${fa(openLocation.column)} باز شده تا پایان ورودی (${where}) با «${closeChar}» بسته نشده است.`
      break
    }
    default:
      message = `JSON معتبر نیست؛ خطا در ${where}.`
  }

  return {
    code,
    position,
    line: location.line,
    column: location.column,
    lineText: location.lineText,
    message,
  }
}
