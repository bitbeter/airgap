import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { parsePatch } from "diff"
import { compareTexts } from "../lib/compare.mjs"

const optionNames = ["trimLines", "ignoreWhitespace", "ignoreCrLf", "ignoreCase", "normalizePersian", "ignoreBlankLines"]
const allOff = Object.fromEntries(optionNames.map((name) => [name, false]))

function changedLines(result, side) {
  return result.rows.filter((row) => row.kind !== "same" && row[side]).map((row) => row[side].number)
}

function gitChangedLines(before, after, flags) {
  const directory = mkdtempSync(join(tmpdir(), "airgap-ignore-test-"))
  try {
    writeFileSync(join(directory, "before.txt"), before)
    writeFileSync(join(directory, "after.txt"), after)
    const git = spawnSync("git", [
      "diff", "--no-index", "--no-ext-diff", "--no-textconv", "--no-color", "--text",
      "--diff-algorithm=myers", "--no-indent-heuristic", "--unified=0", ...flags, "--", "before.txt", "after.txt",
    ], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
    })
    assert.ifError(git.error)
    assert.ok(git.status === 0 || git.status === 1, git.stderr)
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
    return expected
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test("all options off is byte-for-byte the previous comparison", () => {
  const fixtures = [
    ["", ""],
    ["a\nb", "a\nb"],
    ["start\nconst alpha = 1;\nend", "start\nconst alpha = 2;\nend"],
    ["a\r\nb", "a\nb\n"],
    ["Hello\nWorld", "hello\nworld"],
    ["يك ۱۲٣", "یک 123"],
    ["a\n\nb", "a\nb"],
  ]
  for (const [before, after] of fixtures) {
    assert.deepEqual(compareTexts(before, after, {}), compareTexts(before, after))
    assert.deepEqual(compareTexts(before, after, allOff), compareTexts(before, after))
  }
})

test("trimLines ignores only leading and trailing whitespace", () => {
  const result = compareTexts("  hello  \n\tworld\t\n", "hello\nworld\n", { trimLines: true })
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.ok(result.rows.every((row) => row.kind === "same" && row.ignored))
  assert.deepEqual(result.rows.map((row) => row.before.text), ["  hello  ", "\tworld\t"])
  assert.equal(compareTexts("a  b", "a b", { trimLines: true }).modified, 1)
})

test("ignoreWhitespace ignores all whitespace and CRLF like git diff -w", () => {
  const result = compareTexts("a b\tc\n", "abc\n", { ignoreWhitespace: true })
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.equal(result.rows[0].ignored, true)
  assert.equal(compareTexts("a b", "a\tb", { ignoreWhitespace: true }).modified, 0)
  assert.equal(compareTexts("a\r\nb\r\n", "a\nb\n", { ignoreWhitespace: true }).modified, 0)
  assert.equal(compareTexts("a", "a\n", { ignoreWhitespace: true }).modified, 1)
})

test("ignoreCrLf keeps a missing final newline visible", () => {
  const result = compareTexts("a\r\nb\r\n", "a\nb\n", { ignoreCrLf: true })
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.ok(result.rows.every((row) => row.ignored))
  assert.equal(compareTexts("a", "a\n", { ignoreCrLf: true }).modified, 1)
})

test("ignoreCase folds ASCII letters only", () => {
  const result = compareTexts("Hello WORLD\n", "hello world\n", { ignoreCase: true })
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.equal(result.rows[0].ignored, true)
  assert.equal(compareTexts("Ä", "ä", { ignoreCase: true }).modified, 1)
})

test("normalizePersian equates Arabic/Persian letters and all three digit sets", () => {
  const result = compareTexts("يك ۱۲٣\n", "یک 123\n", { normalizePersian: true })
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.equal(result.rows[0].ignored, true)
  assert.equal(compareTexts("١٢٣", "123", { normalizePersian: true }).modified, 0)
  assert.equal(compareTexts("ة", "ه", { normalizePersian: true }).modified, 1)
})

test("ignoreBlankLines hides blank-only rows but not blank-to-content replacements", () => {
  const removed = compareTexts("a\n\nb", "a\nb", { ignoreBlankLines: true })
  assert.equal(removed.added + removed.removed + removed.modified, 0)
  const blankRow = removed.rows.find((row) => row.before?.text === "" && row.after === null)
  assert.equal(blankRow.kind, "same")
  assert.equal(blankRow.ignored, true)

  const added = compareTexts("a\nb", "a\n\nb", { ignoreBlankLines: true })
  assert.equal(added.added + added.removed + added.modified, 0)

  assert.equal(compareTexts("a\n \nb", "a\nb", { ignoreBlankLines: true }).modified, 0)

  const content = compareTexts("a\n\nb", "a\nx\nb", { ignoreBlankLines: true })
  assert.equal(content.modified, 1)
  assert.equal(content.rows[1].kind, "modified")
  assert.equal(content.rows[1].before.text, "")
  assert.equal(content.rows[1].after.text, "x")
})

test("combined options apply together", () => {
  const result = compareTexts("  Hello ي ۱۲٣ WORLD  \n", "hello ی 123 world\n", {
    trimLines: true,
    ignoreCase: true,
    normalizePersian: true,
  })
  assert.equal(result.added + result.removed + result.modified, 0)
  assert.equal(result.rows[0].ignored, true)
  assert.equal(result.rows[0].before.text, "  Hello ي ۱۲٣ WORLD  ")
  assert.equal(result.rows[0].after.text, "hello ی 123 world")
})

test("case folding survives Persian normalization in inline highlights", () => {
  const result = compareTexts("Hello ي world", "hello ی there", { ignoreCase: true, normalizePersian: true })
  assert.equal(result.modified, 1)
  const row = result.rows[0]
  assert.equal(row.before.segments.map((segment) => segment.text).join(""), "Hello ي world")
  assert.equal(row.after.segments.map((segment) => segment.text).join(""), "hello ی there")
  const unchangedBefore = row.before.segments.filter((segment) => !segment.changed).map((segment) => segment.text).join("")
  assert.ok(unchangedBefore.includes("Hello ي"))
  assert.ok(!row.before.segments.some((segment) => segment.changed && segment.text === "H"))
  assert.ok(!row.after.segments.some((segment) => segment.changed && segment.text === "h"))
})

test("inline highlights keep the original text and skip ignored differences", () => {
  const result = compareTexts("Hello World", "hello  there", { ignoreCase: true })
  assert.equal(result.modified, 1)
  const row = result.rows[0]
  assert.equal(row.before.segments.map((segment) => segment.text).join(""), "Hello World")
  assert.equal(row.after.segments.map((segment) => segment.text).join(""), "hello  there")
  const unchangedBefore = row.before.segments.filter((segment) => !segment.changed).map((segment) => segment.text).join("")
  assert.ok(unchangedBefore.includes("Hello"))
  assert.ok(!row.before.segments.some((segment) => segment.changed && segment.text === "H"))
})

test("both sides reconstruct exactly under every option combination", () => {
  const pairs = [
    ["a\na\nb\n", "a\nb\na\n"],
    ["سلام\nخداحافظ", "سلام!\n\nخداحافظ\n"],
    ["a\r\n\r\nb", "a\nb\n"],
    ["<script>alert(1)</script>", "<script>alert(2)</script>"],
    ["", "\n"],
    ["  Hello World  \n", "hello  world\n"],
    ["يك ۱۲٣\nك", "یک 123\nک"],
    ["a\n\n\nb", "a\n \nb\n"],
    ["", "a\n\nb"],
    ["a\n\nb", ""],
    ["x", "y"],
    ["a\r\nb", "a\nb\n"],
  ]
  for (const [before, after] of pairs) {
    for (let mask = 0; mask < 2 ** optionNames.length; mask++) {
      const options = Object.fromEntries(optionNames.map((name, index) => [name, Boolean(mask & (1 << index))]))
      const result = compareTexts(before, after, options)
      for (const [side, original] of [["before", before], ["after", after]]) {
        const lines = result.rows.map((row) => row[side]).filter(Boolean)
        assert.equal(
          lines.map((line) => line.segments.map((segment) => segment.text).join("") + line.ending).join(""),
          original,
          `reconstruction failed for ${side} with ${JSON.stringify(options)}`,
        )
        assert.deepEqual(lines.map((line) => line.number), lines.map((_, index) => index + 1))
      }
    }
  }
})

// git diff --no-index does not accept -i, so case folding is covered by the
// independent unit test above. The other options have direct Git equivalents.
const gitFixtures = [
  { name: "all whitespace", before: "start\n  hello\tworld\nend\n", after: "start\n hello  world \nend\n", flags: ["-w"], options: { ignoreWhitespace: true } },
  { name: "whitespace with content change", before: "start\n  hello\tworld\nend\n", after: "start\n hello  there \nend\n", flags: ["-w"], options: { ignoreWhitespace: true } },
  { name: "CRLF", before: "a\r\nb\r\n", after: "a\nb\n", flags: ["--ignore-cr-at-eol"], options: { ignoreCrLf: true } },
  { name: "CRLF with content change", before: "a\r\nb\r\n", after: "a\nc\n", flags: ["--ignore-cr-at-eol"], options: { ignoreCrLf: true } },
  { name: "blank removal", before: "a\n\nb\n", after: "a\nb\n", flags: ["--ignore-blank-lines"], options: { ignoreBlankLines: true } },
  { name: "blank addition", before: "a\nb\n", after: "a\n\n\nb\n", flags: ["--ignore-blank-lines"], options: { ignoreBlankLines: true } },
  { name: "blank with content change", before: "a\n\nb\n", after: "a\nx\nb\n", flags: ["--ignore-blank-lines"], options: { ignoreBlankLines: true } },
]

for (const fixture of gitFixtures) {
  test(`matches Git changed line numbers: ${fixture.name}`, () => {
    const expected = gitChangedLines(fixture.before, fixture.after, fixture.flags)
    const result = compareTexts(fixture.before, fixture.after, fixture.options)
    assert.deepEqual({ before: changedLines(result, "before"), after: changedLines(result, "after") }, expected)
  })
}
