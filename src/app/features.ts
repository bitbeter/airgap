import { lazy } from "react"
import { FileDiff } from "lucide-react"
import type { Feature } from "./feature"

export const features: Feature[] = [
  {
    path: "/text-diff",
    title: "مقایسهٔ متن",
    icon: FileDiff,
    Page: lazy(() => import("@/features/text-diff")),
  },
]

export const defaultPath = "/text-diff"
