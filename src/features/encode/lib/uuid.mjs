function formatBytes(bytes) {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Generate an RFC 4122 version 4 UUID locally. */
export function generateUuidV4(scope = globalThis) {
  const crypto = scope?.crypto
  if (typeof crypto?.randomUUID === "function") {
    try {
      return { ok: true, uuid: crypto.randomUUID() }
    } catch {
      // Fall through to getRandomValues when randomUUID is present but blocked.
    }
  }
  if (typeof crypto?.getRandomValues === "function") {
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(16))
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      return { ok: true, uuid: formatBytes(bytes) }
    } catch {
      // Fall through to the error below.
    }
  }
  return {
    ok: false,
    message: "مرورگر شما تولید UUID تصادفی امن را در دسترس قرار نداده است. صفحه را از HTTPS یا localhost باز کنید.",
  }
}

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuidV4(value) {
  return uuidV4Pattern.test(String(value ?? ""))
}
