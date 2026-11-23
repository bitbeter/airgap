import { lazy } from "react"
import { Binary, Braces, CalendarDays, FileDiff, FilePenLine, Keyboard, ShieldCheck, SpellCheck } from "lucide-react"
import type { Feature } from "./feature"

export const features: Feature[] = [
  {
    path: "/text-diff",
    title: "مقایسهٔ متن",
    icon: FileDiff,
    Page: lazy(() => import("@/features/text-diff")),
  },
  {
    path: "/markdown-editor",
    title: "ویرایشگر Markdown",
    icon: FilePenLine,
    Page: lazy(() => import("@/features/markdown-editor")),
  },
  {
    path: "/persian-text",
    title: "ویرایش متن فارسی",
    icon: SpellCheck,
    Page: lazy(() => import("@/features/persian-text")),
  },
  {
    path: "/keyboard-fix",
    title: "اصلاح چیدمان صفحه‌کلید",
    icon: Keyboard,
    Page: lazy(() => import("@/features/keyboard-fix")),
  },
  {
    path: "/redact",
    title: "پنهان‌سازی اطلاعات حساس",
    icon: ShieldCheck,
    Page: lazy(() => import("@/features/redact")),
  },
  {
    path: "/json-format",
    title: "قالب‌بندی JSON",
    icon: Braces,
    Page: lazy(() => import("@/features/json-format")),
  },
  {
    path: "/date-convert",
    title: "تبدیل تاریخ",
    icon: CalendarDays,
    Page: lazy(() => import("@/features/date-convert")),
  },
  {
    path: "/encode",
    title: "کدگذاری و هش",
    icon: Binary,
    Page: lazy(() => import("@/features/encode")),
  },
]

export const defaultPath = "/text-diff"
