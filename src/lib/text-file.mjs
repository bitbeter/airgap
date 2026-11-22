export const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024

export const acceptedTextExtensions = [
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".csv",
  ".log",
  ".yaml",
  ".yml",
  ".xml",
  ".html",
]

export const ACCEPTED_FILE_TYPES = [...acceptedTextExtensions, "text/*"].join(",")

export function hasAcceptedTextExtension(name) {
  const lowerName = String(name ?? "").toLowerCase()
  return acceptedTextExtensions.some((extension) => lowerName.endsWith(extension))
}

export function isAcceptedTextFile(file) {
  return hasAcceptedTextExtension(file?.name) || String(file?.type ?? "").toLowerCase().startsWith("text/")
}

export function checkTextFile(file, maxBytes = MAX_TEXT_FILE_BYTES) {
  if (!isAcceptedTextFile(file)) return { ok: false, reason: "type" }
  if (typeof file?.size === "number" && file.size > maxBytes) return { ok: false, reason: "size" }
  return { ok: true }
}

/**
 * Decode file bytes as UTF-8, falling back to windows-1256 for legacy Persian
 * files. A UTF-8 BOM is removed and reported; line endings are left untouched.
 */
export function decodeTextBytes(bytes) {
  const hadBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
  const body = hadBom ? bytes.subarray(3) : bytes
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(body), encoding: "utf-8", hadBom }
  } catch {
    return { text: new TextDecoder("windows-1256").decode(body), encoding: "windows-1256", hadBom }
  }
}
