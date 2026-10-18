import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MermaidDiagram } from "./mermaid-diagram"
import "./markdown-preview.css"

export default function MarkdownPreview({ text, title }: { text: string; title: string }) {
  return (
    <section aria-label={`پیش‌نمایش ${title}`} className="markdown-preview min-h-72 overflow-x-auto rounded-md border p-4 text-sm leading-7" dir="auto">
      {!text ? <p className="text-muted-foreground">متنی برای پیش‌نمایش وجود ندارد.</p> : (
        <Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
          pre({ children, node }) {
            const code = node?.children[0]
            if (code?.type === "element" && code.tagName === "code" &&
                Array.isArray(code.properties.className) && code.properties.className.includes("language-mermaid")) {
              const source = code.children.filter((child) => child.type === "text").map((child) => child.value).join("")
              return <MermaidDiagram key={source} source={source} />
            }
            return <pre dir="ltr">{children}</pre>
          },
          img({ alt }) {
            return <span className="text-muted-foreground">[تصویر: {alt || "بدون توضیح"} — بارگیری خارجی غیرفعال است]</span>
          },
          a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          },
        }}>{text}</Markdown>
      )}
    </section>
  )
}
