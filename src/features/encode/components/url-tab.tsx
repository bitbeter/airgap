import { useMemo, useState } from "react"
import { TransformCard } from "./transform-card"
import { SegmentedControl } from "./segmented-control"
import { decodeUrl, encodeUrl } from "../lib/url.mjs"

type Direction = "encode" | "decode"
type Scope = "component" | "full"

const directionOptions = [
  { value: "encode" as const, label: "کدگذاری" },
  { value: "decode" as const, label: "رمزگشایی" },
]

const scopeOptions = [
  { value: "component" as const, label: "کامپوننت" },
  { value: "full" as const, label: "کامل (URL)" },
]

export function UrlTab() {
  const [direction, setDirection] = useState<Direction>("encode")
  const [scope, setScope] = useState<Scope>("component")
  const [input, setInput] = useState("")

  const result = useMemo(
    () =>
      direction === "encode"
        ? encodeUrl(input, { full: scope === "full" })
        : decodeUrl(input, { full: scope === "full" }),
    [direction, input, scope],
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
      title="URL encode و decode"
      description="متن را برای قرار گرفتن در URL کدگذاری کنید یا درصدکدهای یک URL را به متن اصلی برگردانید."
      inputLabel={direction === "encode" ? "متن ورودی" : "URL یا درصدکد ورودی"}
      outputLabel={direction === "encode" ? "خروجی کدگذاری‌شده" : "متن رمزگشایی‌شده"}
      inputValue={input}
      outputValue={output}
      inputPlaceholder={
        direction === "encode"
          ? "سلام دنیا / airgap?x=1&y=2"
          : "%D8%B3%D9%84%D8%A7%D9%85%20%D8%AF%D9%86%DB%8C%D8%A7"
      }
      outputPlaceholder="خروجی اینجا نمایش داده می‌شود."
      error={error}
      inputHint="درصدکدها با UTF-8 محاسبه می‌شوند."
      outputHint={scope === "full" ? "حالت کامل" : "حالت کامپوننت"}
      controls={
        <div className="grid gap-4 sm:grid-cols-2">
          <SegmentedControl label="جهت تبدیل" value={direction} options={directionOptions} onChange={setDirection} />
          <SegmentedControl label="دامنه" value={scope} options={scopeOptions} onChange={setScope} />
        </div>
      }
      onInputChange={setInput}
      onClear={() => setInput("")}
      onSwap={swap}
      notice={
        scope === "full"
          ? "حالت کامل مانند encodeURI/decodeURI عمل می‌کند: نویسه‌های رزروشده مثل / ? & = # در کدگذاری خوانا می‌مانند و در رمزگشایی، درصدکد آن‌ها حفظ می‌شود."
          : "حالت کامپوننت مانند encodeURIComponent/decodeURIComponent عمل می‌کند و همهٔ نویسه‌ها جز حروف، رقم‌ها و - _ . ! ~ * ' ( ) کدگذاری می‌شوند."
      }
    />
  )
}
