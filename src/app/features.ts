import { lazy } from "react"
import { FileDiff, FilePenLine, Keyboard, ShieldCheck, SpellCheck } from "lucide-react"
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
]

export const defaultPath = "/text-diff"
