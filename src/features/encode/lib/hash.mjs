import { bytesToBase64 } from "./base64.mjs"
import { bytesToHex, encodeUtf8, findLoneSurrogate } from "./utf8.mjs"

export const hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]
export const largeFileThreshold = 50 * 1024 * 1024

/**
 * Web Crypto is only exposed in secure contexts. Detect it without throwing so
 * the rest of the page keeps working when hashing is unavailable.
 */
export function detectSubtleCrypto(scope = globalThis) {
  const subtle = scope?.crypto?.subtle
  if (!subtle || typeof subtle.digest !== "function") {
    return {
      available: false,
      reason: "missing",
      message:
        "مرورگر شما Web Crypto (crypto.subtle) را در دسترس قرار نداده است. این API فقط در زمینهٔ امن (HTTPS یا localhost) فعال می‌شود.",
    }
  }
  if (scope?.isSecureContext === false) {
    return {
      available: false,
      reason: "insecure",
      message:
        "این صفحه در زمینهٔ ناامن باز شده است و مرورگر crypto.subtle را غیرفعال کرده است. برای هش، صفحه را از HTTPS یا localhost باز کنید.",
    }
  }
  return { available: true, subtle }
}

function normalizeAlgorithm(algorithm) {
  const name = String(algorithm ?? "")
  if (!hashAlgorithms.includes(name)) {
    throw new Error("الگوریتم هش پشتیبانی نمی‌شود.")
  }
  return name
}

export async function hashBytes(bytes, algorithm, subtle) {
  const name = normalizeAlgorithm(algorithm)
  let digest
  try {
    digest = await subtle.digest(name, bytes)
  } catch {
    throw new Error("محاسبهٔ هش در مرورگر انجام نشد. دوباره تلاش کنید.")
  }
  const output = new Uint8Array(digest)
  return {
    algorithm: name,
    hex: bytesToHex(output),
    base64: bytesToBase64(output),
    bytes: output,
    byteLength: output.length,
  }
}

export async function hashText(text, algorithm, subtle) {
  const source = String(text ?? "")
  const lone = findLoneSurrogate(source)
  if (lone !== -1) {
    throw new Error("متن شامل یک نویسهٔ یونیکد ناقص است و به UTF-8 تبدیل نمی‌شود.")
  }
  return hashBytes(encodeUtf8(source), algorithm, subtle)
}

export async function hashFile(file, algorithm, subtle) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("فایل انتخاب نشده است.")
  }
  let buffer
  try {
    buffer = await file.arrayBuffer()
  } catch {
    throw new Error("خواندن فایل ممکن نشد. دوباره تلاش کنید.")
  }
  return hashBytes(new Uint8Array(buffer), algorithm, subtle)
}

/**
 * Parse a pasted hash. Hex wins when the text is hex-like; otherwise Base64 is
 * accepted with optional padding, whitespace, and URL-safe characters.
 */
export function parseExpectedHash(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return { kind: "empty", normalized: "" }

  const withoutPrefix = raw
    .replace(/^sha(?:-?(?:1|256|384|512))\s*[:=]\s*/i, "")
    .trim()

  const hex = withoutPrefix
    .replace(/^0x/i, "")
    .replace(/[\s:-]/g, "")
    .toLowerCase()
  if (/^[0-9a-f]+$/.test(hex) && hex.length % 2 === 0) {
    return { kind: "hex", normalized: hex }
  }

  const base64 = withoutPrefix
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/=+$/, "")
  if (/^[A-Za-z0-9+/]+$/.test(base64) && base64.length % 4 !== 1) {
    return { kind: "base64", normalized: base64 }
  }

  return { kind: "invalid", normalized: "" }
}

/** Compare an expected hash with a computed result, tolerating common formats. */
export function compareHash(expected, result) {
  const parsed = parseExpectedHash(expected)
  if (parsed.kind === "empty") return { status: "empty", format: "" }
  if (parsed.kind === "invalid") return { status: "invalid", format: "" }

  const actualHex = String(result?.hex ?? "").toLowerCase()
  const actualBase64 = String(result?.base64 ?? "").replace(/=+$/, "")

  if (parsed.kind === "hex" && parsed.normalized === actualHex) {
    return { status: "match", format: "hex" }
  }
  if (parsed.normalized.replace(/=+$/, "") === actualBase64) {
    return { status: "match", format: "base64" }
  }
  return { status: "mismatch", format: parsed.kind }
}
