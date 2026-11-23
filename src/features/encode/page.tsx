import { Binary, FileCode2, Fingerprint, Hash, KeyRound, Link, ScanText, ShieldCheck } from "lucide-react"
import { ToolTabs, type EncodeTabDefinition } from "./components/tool-tabs"
import { Base64Tab } from "./components/base64-tab"
import { UrlTab } from "./components/url-tab"
import { EntitiesTab } from "./components/entities-tab"
import { JwtTab } from "./components/jwt-tab"
import { HashTab } from "./components/hash-tab"
import { UuidTab } from "./components/uuid-tab"
import { CodepointsTab } from "./components/codepoints-tab"
import { useEncodeSettings } from "./hooks/use-encode-settings"

const tabs: EncodeTabDefinition[] = [
  { id: "base64", label: "Base64", icon: Binary },
  { id: "url", label: "URL", icon: Link },
  { id: "entities", label: "HTML", icon: FileCode2 },
  { id: "jwt", label: "JWT", icon: KeyRound },
  { id: "hash", label: "هش", icon: Hash },
  { id: "uuid", label: "UUID", icon: Fingerprint },
  { id: "codepoints", label: "کدپوینت", icon: ScanText },
]

export function EncodePage() {
  const { tab, storageError, updateTab } = useEncodeSettings()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">کدگذاری و هش</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Base64، URL، HTML entities، JWT، هش SHA، UUID و کدپوینت‌های یونیکد را بدون فرستادن داده به سایت‌های
          آنلاین انجام دهید. همهٔ تبدیل‌ها در مرورگر و روی همین دستگاه انجام می‌شوند.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-200"
      >
        <ShieldCheck className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <p>
          متن، توکن، فایل و هش‌ها ذخیره یا ارسال نمی‌شوند و با ترک صفحه پاک می‌شوند. فقط آخرین زبانهٔ انتخابی در
          کلید <span dir="ltr" className="font-mono">airgap:encode:settings:v1</span> در همین مرورگر می‌ماند.
        </p>
      </div>

      {storageError && (
        <p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">
          {storageError}
        </p>
      )}

      <ToolTabs tabs={tabs} active={tab} onChange={updateTab} />

      <div>
        {tabs.map(({ id, label }) => (
          <div
            key={id}
            role="tabpanel"
            id={`encode-panel-${id}`}
            aria-labelledby={`encode-tab-${id}`}
            aria-label={label}
            hidden={tab !== id}
          >
            {id === "base64" && <Base64Tab />}
            {id === "url" && <UrlTab />}
            {id === "entities" && <EntitiesTab />}
            {id === "jwt" && <JwtTab />}
            {id === "hash" && <HashTab />}
            {id === "uuid" && <UuidTab />}
            {id === "codepoints" && <CodepointsTab />}
          </div>
        ))}
      </div>
    </div>
  )
}
