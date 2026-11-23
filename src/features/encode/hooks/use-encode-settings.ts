import { useState } from "react"
import {
  defaultSettings,
  readSettings,
  saveSettings,
  type EncodeSettings,
  type EncodeTab,
} from "../lib/settings.mjs"

export function useEncodeSettings() {
  const [state, setState] = useState<{ settings: EncodeSettings; storageError: string }>(() => {
    try {
      return { settings: readSettings(window.localStorage), storageError: "" }
    } catch {
      return {
        settings: { ...defaultSettings },
        storageError: "دسترسی به تنظیمات ذخیره‌شده ممکن نیست؛ زبانهٔ پیش‌فرض استفاده می‌شود.",
      }
    }
  })

  function updateTab(tab: EncodeTab) {
    let storageError = ""
    try {
      saveSettings(window.localStorage, { tab })
    } catch {
      storageError = "زبانه اعمال شد، اما در مرورگر ذخیره نشد؛ فضای ذخیره‌سازی پر یا غیرفعال است."
    }
    setState({ settings: { tab }, storageError })
  }

  return { tab: state.settings.tab, storageError: state.storageError, updateTab }
}
