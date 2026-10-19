export const draftKey = "airgap:markdown-editor:draft:v1"

export function readDraft(storage) {
  return storage.getItem(draftKey) ?? ""
}

export function saveDraft(storage, text) {
  if (text === "") storage.removeItem(draftKey)
  else storage.setItem(draftKey, text)
}
