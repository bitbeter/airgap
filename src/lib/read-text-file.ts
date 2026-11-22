import { checkTextFile, decodeTextBytes, MAX_TEXT_FILE_BYTES, type TextEncoding } from "./text-file.mjs"

export type ReadTextFileResult =
  | { ok: true; name: string; text: string; encoding: TextEncoding; hadBom: boolean }
  | { ok: false; name: string; error: string }

const maxMegabytes = MAX_TEXT_FILE_BYTES / (1024 * 1024)

/** Read a local text file in the browser. No network request is made. */
export async function readTextFile(file: File): Promise<ReadTextFileResult> {
  const check = checkTextFile(file)
  if (!check.ok) {
    return {
      ok: false,
      name: file.name,
      error: check.reason === "size"
        ? `حجم فایل «${file.name}» بیش از ${maxMegabytes.toLocaleString("fa-IR")} مگابایت است.`
        : `نوع فایل «${file.name}» پشتیبانی نمی‌شود. فایل متنی مانند txt، md، json یا csv انتخاب کنید.`,
    }
  }
  try {
    const decoded = decodeTextBytes(new Uint8Array(await file.arrayBuffer()))
    return { ok: true, name: file.name, ...decoded }
  } catch {
    return { ok: false, name: file.name, error: `خواندن فایل «${file.name}» ممکن نشد. دوباره تلاش کنید.` }
  }
}

/** Persian sentence describing a successful read, including encoding and BOM. */
export function describeReadResult(result: ReadTextFileResult, destination?: string): string {
  if (!result.ok) return result.error
  const encoding = result.encoding === "windows-1256" ? "Windows-1256" : "UTF-8"
  const bom = result.hadBom ? "؛ BOM حذف شد" : ""
  const target = destination ? ` و در ${destination} قرار گرفت` : ""
  return `فایل «${result.name}» با کدگذاری ${encoding} خوانده شد${bom}${target}.`
}
