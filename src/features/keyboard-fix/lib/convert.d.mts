import type { DirectionSetting, LayoutId, ModeSetting } from "./layouts.mjs"

export type ConvertDirection = DirectionSetting
export type ConvertMode = ModeSetting
export type DetectedDirection = "en-fa" | "fa-en"

export interface ConvertOptions {
  direction?: ConvertDirection
  layout?: LayoutId
  mode?: ConvertMode
}

export interface ConvertResult {
  text: string
  direction: DetectedDirection | null
  changed: number
  protectedCount: number
}

export function detectDirection(text: string): DetectedDirection | null
export function convert(text: string, options?: ConvertOptions): ConvertResult
