import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { cleanFileName, createPatch, formatUnifiedPatch, patchFileName } from "../lib/patch.mjs"

const lines = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`)
const fixtures = [
  { name: "insertion", before: "first\nlast\n", after: "first\ninserted\nlast\n" },
  { name: "deletion", before: "first\nremoved\nlast\n", after: "first\nlast\n" },
  { name: "single line replacement", before: "a\n", after: "b\n" },
  { name: "whitespace", before: "start\n  hello\tworld\nend\n", after: "start\n hello  world \nend\n" },
  { name: "CRLF", before: "first\r\nlast\r\n", after: "first\nlast\n" },
  { name: "missing final newline", before: "first\nlast", after: "first\nlast\n" },
  { name: "added missing final newline on both sides", before: "first", after: "second" },
  { name: "empty original", before: "", after: "سلام\nدنیا\n" },
  { name: "Persian with ZWNJ", before: "می‌خواهم\nبروم\n", after: "می خواهم\nبروم\nامروز\n" },
  { name: "separate hunks", before: lines.join("\n") + "\n", after: lines.map((line, index) => index === 1 || index === 17 ? `${line} changed` : line).join("\n") + "\n" },
]

const gitEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" }

function workspace(context) {
  const directory = mkdtempSync(join(tmpdir(), "airgap-patch-test-"))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}

// Git adds diff/index headers, omits a hunk count of 1, and appends an optional
// section heading after the hunk range; the remaining patch must be identical.
function normalizeGitPatch(patch) {
  return patch.split("\n")
    .filter((line) => !line.startsWith("diff --git ") && !line.startsWith("index "))
    .map((line) => line.replace(/^@@ -(\d+)(,\d+)? \+(\d+)(,\d+)? @@.*$/, (_, oldStart, oldCount, newStart, newCount) => `@@ -${oldStart}${oldCount ?? ",1"} +${newStart}${newCount ?? ",1"} @@`))
    .join("\n")
}

for (const fixture of fixtures) {
  test(`matches git diff output: ${fixture.name}`, (context) => {
    const directory = workspace(context)
    writeFileSync(join(directory, "before.txt"), fixture.before)
    writeFileSync(join(directory, "after.txt"), fixture.after)
    const git = spawnSync("git", [
      "diff", "--no-index", "--no-ext-diff", "--no-textconv", "--no-color", "--text",
      "--diff-algorithm=myers", "--no-indent-heuristic", "--unified=3", "--", "before.txt", "after.txt",
    ], { cwd: directory, encoding: "utf8", env: gitEnv })
    assert.ifError(git.error)
    assert.equal(git.status, 1, git.stderr)
    const patch = formatUnifiedPatch(createPatch(fixture.before, fixture.after, 4000), "a/before.txt", "b/after.txt")
    assert.equal(patch, normalizeGitPatch(git.stdout))
  })

  test(`git apply reproduces the new text: ${fixture.name}`, (context) => {
    const directory = workspace(context)
    writeFileSync(join(directory, "file.txt"), fixture.before)
    writeFileSync(join(directory, "change.patch"), formatUnifiedPatch(createPatch(fixture.before, fixture.after, 4000), "a/file.txt", "b/file.txt"))
    for (const args of [["apply", "--check", "change.patch"], ["apply", "change.patch"]]) {
      const git = spawnSync("git", args, { cwd: directory, encoding: "utf8", env: gitEnv })
      assert.ifError(git.error)
      assert.equal(git.status, 0, git.stderr)
    }
    assert.equal(readFileSync(join(directory, "file.txt"), "utf8"), fixture.after)
  })
}

test("identical texts produce an empty patch", () => {
  assert.equal(formatUnifiedPatch(createPatch("same\n", "same\n", 4000), "a/x", "b/x"), "")
  assert.equal(formatUnifiedPatch(createPatch("", "", 4000), "a/x", "b/x"), "")
})

test("uses default names and removes characters that break headers", () => {
  const patch = formatUnifiedPatch(createPatch("a\n", "b\n", 4000), "  ", "b/my new\tfile.txt\n")
  assert.match(patch, /^--- a\/original\.txt\n\+\+\+ b\/my_new_file\.txt_?\n/)
  assert.equal(cleanFileName(" a/گزارش.md ", "x"), "a/گزارش.md")
  assert.equal(cleanFileName("", "fallback"), "fallback")
})

test("download name follows the new file name", () => {
  assert.equal(patchFileName("b/new.txt"), "new.patch")
  assert.equal(patchFileName("b/docs/گزارش نهایی.md"), "گزارش_نهایی.patch")
  assert.equal(patchFileName("b/.env"), "changes.patch")
  assert.equal(patchFileName(""), "new.patch")
})
