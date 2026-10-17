import { defineConfig } from "vite"

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
})
