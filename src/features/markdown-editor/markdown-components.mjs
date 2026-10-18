import { createElement } from "react"

// Let the browser apply Unicode first-strong detection to each text block.
// A single auto direction on the preview would make later blocks inherit it.
const autoBlocks = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "th", "td"]

export const markdownComponents = Object.fromEntries(autoBlocks.map((tag) => [
  tag,
  function AutoDirection({ node: _node, ...props }) {
    return createElement(tag, { ...props, dir: "auto" })
  },
]))

markdownComponents.pre = function CodeBlock({ children }) {
  return createElement("pre", { dir: "ltr" }, children)
}

markdownComponents.code = function Code({ node: _node, ...props }) {
  return createElement("code", { ...props, dir: "ltr" })
}

markdownComponents.img = function ImagePlaceholder({ alt }) {
  return createElement("span", { dir: "rtl", className: "text-muted-foreground" },
    "[تصویر: ", createElement("bdi", null, alt || "بدون توضیح"), " — بارگیری خارجی غیرفعال است]")
}

markdownComponents.a = function Link({ href, children }) {
  return createElement("a", { href, target: "_blank", rel: "noopener noreferrer" }, children)
}
