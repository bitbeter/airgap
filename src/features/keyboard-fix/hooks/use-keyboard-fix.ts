import { useMemo, useState } from "react"
import { convert } from "../lib/convert.mjs"
import {
  defaultSettings,
  normalizeSettings,
  readSettings,
  saveSettings,
  type DirectionSetting,
  type KeyboardFixSettings,
  type LayoutId,
  type ModeSetting,
} from "../lib/layouts.mjs"

export type Direction = DirectionSetting
export type Mode = ModeSetting

function initialSettings(): { settings: KeyboardFixSettings; error: string } {
  try {
    return { settings: readSettings(window.localStorage), error: "" }
  } catch {
    return {
      settings: { ...defaultSettings },
      error: "دسترسی به تنظیمات ذخیره‌شده ممکن نیست؛ تنظیمات پیش‌فرض استفاده می‌شوند.",
    }
  }
}

export function useKeyboardFix() {
  const [input, setInput] = useState("")
  const [settingsState, setSettingsState] = useState(initialSettings)
  const { direction, layout, mode } = settingsState.settings

  const result = useMemo(
    () => convert(input, { direction, layout, mode }),
    [input, direction, layout, mode],
  )

  function updateSettings(patch: Partial<KeyboardFixSettings>) {
    const next = normalizeSettings({ ...settingsState.settings, ...patch })
    let error = ""
    try {
      saveSettings(window.localStorage, next)
    } catch {
      error = "تنظیمات اعمال شدند، اما در مرورگر ذخیره نشدند؛ فضای ذخیره‌سازی پر یا غیرفعال است."
    }
    setSettingsState({ settings: next, error })
  }

  function updateInput(text: string) {
    setInput(text)
  }

  function updateDirection(next: Direction) {
    updateSettings({ direction: next })
  }

  function updateMode(next: Mode) {
    updateSettings({ mode: next })
  }

  function updateLayout(next: LayoutId) {
    updateSettings({ layout: next })
  }

  function swap() {
    if (!result.text) return
    setInput(result.text)
    if (direction === "en-fa") updateSettings({ direction: "fa-en" })
    else if (direction === "fa-en") updateSettings({ direction: "en-fa" })
  }

  function clear() {
    setInput("")
  }

  return {
    input,
    direction,
    mode,
    layout,
    storageError: settingsState.error,
    result,
    updateInput,
    updateDirection,
    updateMode,
    updateLayout,
    swap,
    clear,
  }
}
