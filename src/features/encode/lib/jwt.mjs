import { decodeBase64 } from "./base64.mjs"

const claimLabels = {
  exp: "انقضا",
  iat: "صدور",
  nbf: "شروع اعتبار",
}

const claimOrder = ["exp", "iat", "nbf"]

function createFormatter(locale) {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" })
  } catch {
    return null
  }
}

const jalaliFormatter = createFormatter("fa-IR-u-ca-persian")
const gregorianFormatter = createFormatter("fa-IR-u-ca-gregory")

function safeFormat(formatter, date) {
  if (Number.isNaN(date.getTime())) return "تاریخ نامعتبر"
  if (!formatter) return date.toISOString()
  try {
    return formatter.format(date)
  } catch {
    return date.toISOString()
  }
}

export function formatJalaliDateTime(date) {
  return safeFormat(jalaliFormatter, date)
}

export function formatGregorianDateTime(date) {
  return safeFormat(gregorianFormatter, date)
}

function error(code, message) {
  return { ok: false, code, message }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function numericDate(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeToken(value) {
  let token = String(value ?? "").trim()
  if (/^bearer\s+/i.test(token)) token = token.replace(/^bearer\s+/i, "").trim()
  return token.replace(/\s+/g, "")
}

/** Describe expiry/not-before status without verifying the signature. */
export function describeJwtStatus(payload, now = Date.now()) {
  const exp = numericDate(payload?.exp)
  const nbf = numericDate(payload?.nbf)
  const nowMs = Number.isFinite(now) ? now : Date.now()

  if (exp !== null && nowMs >= exp * 1000) {
    return {
      state: "expired",
      message: `توکن منقضی شده است؛ زمان انقضا ${formatJalaliDateTime(new Date(exp * 1000))} بوده است.`,
    }
  }
  if (nbf !== null && nowMs < nbf * 1000) {
    return {
      state: "not-yet-valid",
      message: `توکن هنوز معتبر نشده است؛ اعتبار از ${formatJalaliDateTime(new Date(nbf * 1000))} آغاز می‌شود.`,
    }
  }
  if (exp !== null) {
    return {
      state: "valid",
      message: `توکن معتبر است؛ زمان انقضا ${formatJalaliDateTime(new Date(exp * 1000))} است.`,
    }
  }
  return {
    state: "no-expiry",
    message: "توکن ادعای exp ندارد؛ تاریخ انقضا قابل تعیین نیست.",
  }
}

/**
 * Decode a JWT header and payload. The signature is shown but never verified.
 * All failures return a Persian message instead of throwing.
 */
export function decodeJwt(value, options = {}) {
  const token = normalizeToken(value)
  if (!token) return error("empty", "توکن JWT خالی است.")

  const parts = token.split(".")
  if (parts.length !== 3) {
    return error(
      "parts",
      `توکن JWT باید سه بخش داشته باشد (header.payload.signature)؛ ${parts.length.toLocaleString("fa-IR")} بخش پیدا شد.`,
    )
  }

  const [headerPart, payloadPart, signaturePart] = parts
  if (!headerPart || !payloadPart) {
    return error("parts", "بخش header یا payload توکن خالی است.")
  }

  const headerDecoded = decodeBase64(headerPart, { urlSafe: true })
  if (!headerDecoded.ok) {
    return error("header-base64", `بخش header قابل رمزگشایی نیست: ${headerDecoded.message}`)
  }
  const payloadDecoded = decodeBase64(payloadPart, { urlSafe: true })
  if (!payloadDecoded.ok) {
    return error("payload-base64", `بخش payload قابل رمزگشایی نیست: ${payloadDecoded.message}`)
  }

  let header
  let payload
  try {
    header = JSON.parse(headerDecoded.text)
  } catch {
    return error("header-json", "بخش header شامل JSON معتبر نیست.")
  }
  try {
    payload = JSON.parse(payloadDecoded.text)
  } catch {
    return error("payload-json", "بخش payload شامل JSON معتبر نیست.")
  }
  if (!isPlainObject(header)) return error("header-json", "بخش header باید یک شیء JSON باشد.")
  if (!isPlainObject(payload)) return error("payload-json", "بخش payload باید یک شیء JSON باشد.")

  const now = Number.isFinite(options?.now) ? options.now : Date.now()
  const times = []
  const invalidTimeClaims = []
  for (const claim of claimOrder) {
    if (!Object.hasOwn(payload, claim)) continue
    const seconds = numericDate(payload[claim])
    if (seconds === null) {
      invalidTimeClaims.push(claim)
      continue
    }
    const date = new Date(seconds * 1000)
    if (Number.isNaN(date.getTime())) {
      invalidTimeClaims.push(claim)
      continue
    }
    times.push({
      claim,
      label: claimLabels[claim],
      seconds,
      iso: date.toISOString(),
      jalali: formatJalaliDateTime(date),
      gregorian: formatGregorianDateTime(date),
    })
  }

  return {
    ok: true,
    token,
    header,
    payload,
    headerJson: JSON.stringify(header, null, 2),
    payloadJson: JSON.stringify(payload, null, 2),
    signature: signaturePart,
    times,
    invalidTimeClaims,
    status: describeJwtStatus(payload, now),
  }
}
