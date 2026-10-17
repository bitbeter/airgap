import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url))

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "tests") return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:tsx?|mjs)$/.test(entry.name) ? [path] : []
  })
}

test("features and shared modules respect their import boundaries", () => {
  for (const file of sourceFiles(sourceRoot)) {
    const owner = relative(sourceRoot, file).split("/")
    const source = readFileSync(file, "utf8")
    const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g)
    for (const [, specifier] of imports) {
      const target = specifier.startsWith("@/") ? resolve(sourceRoot, specifier.slice(2))
        : specifier.startsWith(".") ? resolve(dirname(file), specifier) : null
      if (!target) continue
      const dependency = relative(sourceRoot, target).split("/")
      const message = `${relative(sourceRoot, file)} must not import ${specifier}`
      if (owner[0] === "features") {
        assert.notEqual(dependency[0], "app", message)
        if (dependency[0] === "features") assert.equal(dependency[1], owner[1], message)
      }
      if (owner[0] === "components" || owner[0] === "lib") {
        assert.ok(!["features", "app"].includes(dependency[0]), message)
      }
      if (owner[0] === "app" && dependency[0] === "features") {
        assert.ok(dependency.length === 2 || (dependency.length === 3 && /^index(?:\.ts)?$/.test(dependency[2])), message)
      }
    }
  }
})
