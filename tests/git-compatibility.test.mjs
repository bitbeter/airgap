import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { parsePatch } from "diff"
import { compareTexts } from "../src/lib/compare.mjs"

const fixtures = [
  { name: "insertion", before: "first\nlast\n", after: "first\ninserted\nlast\n" },
  { name: "deletion", before: "first\nremoved\nlast\n", after: "first\nlast\n" },
  { name: "inline replacements and inserted heading", before: "start\nconst alpha = 1;\nconst beta = 2;\nend", after: "start\nheading\nconst alpha = 3;\nconst beta = 4;\nend" },
  { name: "whitespace", before: "start\n  hello\tworld\nend\n", after: "start\n hello  world \nend\n" },
  { name: "CRLF", before: "first\r\nlast\r\n", after: "first\nlast\n" },
  { name: "missing final newline", before: "first\nlast", after: "first\nlast\n" },
  { name: "empty original", before: "", after: "سلام\nدنیا\n" },
]

for (const fixture of fixtures) {
  test(`matches Git Myers changed line numbers: ${fixture.name}`, (context) => {
    const directory = mkdtempSync(join(tmpdir(), "airgap-git-test-"))
    context.after(() => rmSync(directory, { recursive: true, force: true }))
    const beforePath = join(directory, "before.txt")
    const afterPath = join(directory, "after.txt")
    writeFileSync(beforePath, fixture.before)
    writeFileSync(afterPath, fixture.after)
    const git = spawnSync("git", [
      "diff", "--no-index", "--no-ext-diff", "--no-textconv", "--no-color", "--text",
      "--diff-algorithm=myers", "--no-indent-heuristic", "--unified=0", "--", beforePath, afterPath,
    ], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
    })
    assert.ifError(git.error)
    assert.equal(git.status, 1, git.stderr)
    const expected = { before: [], after: [] }
    for (const patch of parsePatch(git.stdout)) {
      for (const hunk of patch.hunks) {
        let oldLine = hunk.oldStart
        let newLine = hunk.newStart
        for (const line of hunk.lines) {
          if (line.startsWith("-")) expected.before.push(oldLine++)
          else if (line.startsWith("+")) expected.after.push(newLine++)
          else if (line.startsWith(" ")) { oldLine++; newLine++ }
        }
      }
    }
    const result = compareTexts(fixture.before, fixture.after)
    for (const side of ["before", "after"]) {
      assert.deepEqual(result.rows.filter((row) => row.kind !== "same" && row[side]).map((row) => row[side].number), expected[side])
    }
  })
}
