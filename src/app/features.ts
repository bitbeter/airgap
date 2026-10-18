import { lazy } from "react"
import { FileDiff, FilePenLine } from "lucide-react"
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
]

export const defaultPath = "/text-diff"
