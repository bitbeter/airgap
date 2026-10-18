import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig(({ command, mode }) => ({
  base: "./",
  plugins: command === "build" && mode !== "web" ? [viteSingleFile()] : [],
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
}))
