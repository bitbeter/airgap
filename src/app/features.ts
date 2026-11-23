import { lazy } from "react"
import { Binary, Braces, CalendarDays, FileDiff, FilePenLine, Keyboard, ShieldCheck, SpellCheck } from "lucide-react"
import type { Feature } from "./feature"

export const features: Feature[] = [
  {
    path: "/text-diff",
    title: "مقایسهٔ متن",
    description: "مقایسهٔ دو متن به‌صورت کنار‌هم و دیدن تفاوت‌ها خط‌به‌خط.",
    keywords: ["diff", "تفاوت", "مقایسه", "متن", "patch", "پچ", "side by side"],
    icon: FileDiff,
    Page: lazy(() => import("@/features/text-diff")),
  },
  {
    path: "/markdown-editor",
    title: "ویرایشگر Markdown",
    description: "نوشتن Markdown با پیش‌نمایش زنده، نوار ابزار و نمودار Mermaid.",
    keywords: ["markdown", "md", "ویرایشگر", "پیش‌نمایش", "mermaid", "نوشتن", "editor"],
    icon: FilePenLine,
    Page: lazy(() => import("@/features/markdown-editor")),
  },
  {
    path: "/persian-text",
    title: "ویرایش متن فارسی",
    description: "یکدست‌سازی و ویرایش متن فارسی؛ نیم‌فاصله، رقم، املا و فاصله‌ها.",
    keywords: ["فارسی", "persian", "نیم‌فاصله", "ویرایش", "normalize", "یکدست‌سازی", "املا"],
    icon: SpellCheck,
    Page: lazy(() => import("@/features/persian-text")),
  },
  {
    path: "/keyboard-fix",
    title: "اصلاح چیدمان صفحه‌کلید",
    description: "اصلاح متنی که با چیدمان اشتباه صفحه‌کلید تایپ شده است.",
    keywords: ["keyboard", "صفحه‌کلید", "چیدمان", "layout", "تایپ", "فینگلیش", "keyboard layout"],
    icon: Keyboard,
    Page: lazy(() => import("@/features/keyboard-fix")),
  },
  {
    path: "/redact",
    title: "پنهان‌سازی اطلاعات حساس",
    description: "پنهان‌سازی ایمیل، شماره، کارت، توکن و اطلاعات حساس پیش از اشتراک‌گذاری.",
    keywords: ["redact", "privacy", "حساس", "ایمیل", "شماره", "کارت", "توکن", "api key", "اطلاعات"],
    icon: ShieldCheck,
    Page: lazy(() => import("@/features/redact")),
  },
  {
    path: "/json-format",
    title: "قالب‌بندی JSON",
    description: "قالب‌بندی، کوچک‌سازی و اعتبارسنجی JSON همراه با نمایش درختی.",
    keywords: ["json", "قالب‌بندی", "format", "minify", "اعتبارسنجی", "validate", "درخت", "tree"],
    icon: Braces,
    Page: lazy(() => import("@/features/json-format")),
  },
  {
    path: "/date-convert",
    title: "تبدیل تاریخ",
    description: "تبدیل تاریخ شمسی، میلادی و قمری و محاسبهٔ فاصلهٔ روزها.",
    keywords: ["تاریخ", "date", "شمسی", "جلالی", "میلادی", "قمری", "تبدیل", "تقویم", "calendar"],
    icon: CalendarDays,
    Page: lazy(() => import("@/features/date-convert")),
  },
  {
    path: "/encode",
    title: "کدگذاری و هش",
    description: "کدگذاری و رمزگشایی Base64، URL، JWT و محاسبهٔ هش SHA.",
    keywords: ["encode", "decode", "base64", "hash", "هش", "کدگذاری", "رمزگشایی", "jwt", "uuid", "url"],
    icon: Binary,
    Page: lazy(() => import("@/features/encode")),
  },
]

export const defaultPath = "/text-diff"
