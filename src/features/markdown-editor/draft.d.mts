export const draftKey: "airgap:markdown-editor:draft:v1"
export function readDraft(storage: Pick<Storage, "getItem">): string
export function saveDraft(storage: Pick<Storage, "setItem" | "removeItem">, text: string): void
