import { useMemo, useState } from "react"
import { TransformCard } from "./transform-card"
import { SegmentedControl } from "./segmented-control"
import { decodeEntities, encodeEntities } from "../lib/entities.mjs"

type Direction = "encode" | "decode"

const directionOptions = [
  { value: "encode" as const, label: "کدگذاری" },
  { value: "decode" as const, label: "رمزگشایی" },
]

export function EntitiesTab() {
  const [direction, setDirection] = useState<Direction>("encode")
  const [input, setInput] = useState("")

  const result = useMemo(
    () => (direction === "encode" ? encodeEntities(input) : decodeEntities(input)),
    [direction, input],
  )

  const output = result.ok ? result.output : ""
  const error = result.ok ? null : { message: result.message, position: result.position }

  function swap() {
    if (!output) return
    setInput(output)
    setDirection(direction === "encode" ? "decode" : "encode")
  }

  return (
    <TransformCard
      title="HTML entities"
      description="نویسه‌های ویژهٔ HTML را به entity تبدیل کنید یا entityهای نام‌دار و عددی را به متن برگردانید."
      inputLabel={direction === "encode" ? "متن ورودی" : "متن دارای entity"}
      outputLabel={direction === "encode" ? "خروجی entity" : "متن رمزگشایی‌شده"}
      inputValue={input}
      outputValue={output}
      inputPlaceholder={direction === "encode" ? `<p class="note">سلام & خداحافظ</p>` : "&lt;p&gt;سلام &amp; خداحافظ&lt;/p&gt;"}
      outputPlaceholder="خروجی اینجا نمایش داده می‌شود."
      error={error}
      inputHint={'پنج نویسهٔ & < > " \' کدگذاری می‌شوند.'}
      outputHint={direction === "encode" ? "قابل استفاده در HTML" : "entityهای ناشناخته دست‌نخورده می‌مانند"}
      controls={
        <SegmentedControl label="جهت تبدیل" value={direction} options={directionOptions} onChange={setDirection} />
      }
      onInputChange={setInput}
      onClear={() => setInput("")}
      onSwap={swap}
      notice="در رمزگشایی، entityهای نام‌دار رایج و کدهای عددی ده‌دهی و هگزادسیمال پشتیبانی می‌شوند. entityهای ناشناخته بدون تغییر می‌مانند."
    />
  )
}
