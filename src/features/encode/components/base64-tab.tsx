import { useMemo, useState } from "react"
import { TransformCard } from "./transform-card"
import { SegmentedControl } from "./segmented-control"
import { decodeBase64, encodeBase64 } from "../lib/base64.mjs"

type Direction = "encode" | "decode"
type Variant = "standard" | "url"

const directionOptions = [
  { value: "encode" as const, label: "کدگذاری" },
  { value: "decode" as const, label: "رمزگشایی" },
]

const variantOptions = [
  { value: "standard" as const, label: "Base64" },
  { value: "url" as const, label: "Base64URL" },
]

export function Base64Tab() {
  const [direction, setDirection] = useState<Direction>("encode")
  const [variant, setVariant] = useState<Variant>("standard")
  const [input, setInput] = useState("")

  const result = useMemo(
    () =>
      direction === "encode"
        ? encodeBase64(input, { urlSafe: variant === "url" })
        : decodeBase64(input, { urlSafe: variant === "url" }),
    [direction, input, variant],
  )

  const output = result.ok ? ("output" in result ? result.output : result.text) : ""
  const error = result.ok ? null : { message: result.message, position: result.position }

  function swap() {
    if (!output) return
    setInput(output)
    setDirection(direction === "encode" ? "decode" : "encode")
  }

  return (
    <TransformCard
      title="Base64 و Base64URL"
      description="متن را به Base64 تبدیل کنید یا Base64 را به متن UTF-8 برگردانید. فارسی و ایموجی به‌درستی پشتیبانی می‌شوند."
      inputLabel={direction === "encode" ? "متن ورودی" : "Base64 ورودی"}
      outputLabel={direction === "encode" ? "خروجی Base64" : "متن رمزگشایی‌شده"}
      inputValue={input}
      outputValue={output}
      inputPlaceholder={
        direction === "encode"
          ? "سلام دنیا 😀"
          : variant === "url"
            ? "2LPZhNin2YUg2K/Ys9mG24w"
            : "2LPZhNin2YUg2K/Ys9mG24w="
      }
      outputPlaceholder="خروجی اینجا نمایش داده می‌شود."
      error={error}
      inputHint="متن به UTF-8 تبدیل می‌شود."
      outputHint={direction === "encode" ? "قابل کپی" : "UTF-8"}
      controls={
        <div className="grid gap-4 sm:grid-cols-2">
          <SegmentedControl label="جهت تبدیل" value={direction} options={directionOptions} onChange={setDirection} />
          <SegmentedControl label="قالب" value={variant} options={variantOptions} onChange={setVariant} />
        </div>
      }
      onInputChange={setInput}
      onClear={() => setInput("")}
      onSwap={swap}
      notice={
        variant === "url"
          ? "Base64URL از «-» و «_» استفاده می‌کند و پدینگ ندارد. هنگام رمزگشایی، هر دو قالب پذیرفته می‌شود."
          : "در رمزگشایی، فاصله و خط جدید نادیده گرفته می‌شوند و پدینگ اختیاری است."
      }
    />
  )
}
