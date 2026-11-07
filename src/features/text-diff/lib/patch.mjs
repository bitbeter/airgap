import { FILE_HEADERS_ONLY, formatPatch, structuredPatch } from "diff"

export const patchContext = 3
export const defaultOldName = "a/original.txt"
export const defaultNewName = "b/new.txt"

// Line-level patch only; returns null when jsdiff exceeds the timeout.
export function createPatch(before, after, timeout) {
  const patch = structuredPatch("", "", before, after, undefined, undefined, { context: patchContext, timeout })
  return patch ?? null
}

// Whitespace or control characters in a name would break the patch header.
export function cleanFileName(name, fallback) {
  const cleaned = name.trim().replace(/[\s\p{Cc}]+/gu, "_")
  return cleaned || fallback
}

export function formatUnifiedPatch(patch, oldName, newName) {
  if (!patch.hunks.length) return ""
  return formatPatch({
    ...patch,
    oldFileName: cleanFileName(oldName, defaultOldName),
    newFileName: cleanFileName(newName, defaultNewName),
    oldHeader: undefined,
    newHeader: undefined,
  }, FILE_HEADERS_ONLY)
}

export function patchFileName(newName) {
  const base = cleanFileName(newName, defaultNewName).split("/").pop().replace(/\.[^.]*$/, "")
  return `${base || "changes"}.patch`
}
