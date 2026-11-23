import { JsonSyntaxError, tokenize } from "./tokenize.mjs"

const maxSafeInteger = BigInt(Number.MAX_SAFE_INTEGER)
const minSafeInteger = BigInt(Number.MIN_SAFE_INTEGER)
const identifierPattern = /^[\p{L}_$][\p{L}\p{N}_$]*$/u

export const settingsKey = "airgap:json-format:settings:v1"

export const defaultSettings = Object.freeze({
  indent: 2,
  sortKeys: false,
  jsonc: false,
  minify: false,
})

/** Keep only known, valid settings; malformed values fall back per field. */
export function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {}
  return {
    indent: source.indent === 4 || source.indent === "tab" ? source.indent : 2,
    sortKeys: source.sortKeys === true,
    jsonc: source.jsonc === true,
    minify: source.minify === true,
  }
}

export function readSettings(storage) {
  const raw = storage.getItem(settingsKey)
  if (!raw) return { ...defaultSettings }
  try {
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(storage, settings) {
  const normalized = normalizeSettings(settings)
  storage.setItem(settingsKey, JSON.stringify(normalized))
  return normalized
}

/**
 * A number is unsafe when reading it with `Number` would silently lose
 * precision. The formatter never uses the parsed value, so the original token
 * text survives in the output.
 */
export function isUnsafeNumber(raw) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return true
  if (/^-?\d+$/.test(raw)) {
    try {
      const integer = BigInt(raw)
      return integer > maxSafeInteger || integer < minSafeInteger
    } catch {
      return true
    }
  }
  const digits = raw
    .replace(/^[+-]/, "")
    .replace(/[eE].*$/, "")
    .replace(".", "")
    .replace(/^0+/, "")
  return digits.length > 15
}

function peek(state) {
  return state.tokens[state.index]
}

function advance(state) {
  return state.tokens[state.index++]
}

function unclosed(state, open) {
  return new JsonSyntaxError("unclosed", state.text.length, {
    openPosition: open.start,
    openChar: open.type,
  })
}

function parseValue(state) {
  const token = peek(state)
  if (!token) throw new JsonSyntaxError("unexpected-end", state.text.length)
  switch (token.type) {
    case "{":
      return parseObject(state)
    case "[":
      return parseArray(state)
    case "string":
      state.index++
      return { type: "string", raw: token.raw, value: token.value, start: token.start }
    case "number":
      state.index++
      return {
        type: "number",
        raw: token.raw,
        value: token.value,
        unsafe: isUnsafeNumber(token.raw),
        start: token.start,
      }
    case "literal":
      state.index++
      if (token.value === "null") return { type: "null", raw: token.raw, start: token.start }
      return {
        type: "boolean",
        raw: token.raw,
        value: token.value === "true",
        start: token.start,
      }
    default:
      throw new JsonSyntaxError("unexpected-token", token.start, { raw: token.raw })
  }
}

function parseObject(state) {
  const open = advance(state)
  const entries = []
  if (peek(state)?.type === "}") {
    advance(state)
    return { type: "object", entries, start: open.start }
  }

  while (true) {
    const keyToken = peek(state)
    if (!keyToken) throw unclosed(state, open)
    if (keyToken.type !== "string") {
      throw new JsonSyntaxError("expected-key", keyToken.start, { raw: keyToken.raw })
    }
    advance(state)

    const colon = peek(state)
    if (!colon) throw unclosed(state, open)
    if (colon.type !== ":") {
      throw new JsonSyntaxError("missing-colon", colon.start, { raw: colon.raw })
    }
    advance(state)

    if (!peek(state)) throw unclosed(state, open)
    const value = parseValue(state)
    entries.push({ key: keyToken.value, keyRaw: keyToken.raw, value })

    const separator = peek(state)
    if (!separator) throw unclosed(state, open)
    if (separator.type === ",") {
      const comma = advance(state)
      const after = peek(state)
      if (!after) throw unclosed(state, open)
      if (after.type === "}") {
        if (!state.jsonc) throw new JsonSyntaxError("trailing-comma", comma.start, { close: "}" })
        advance(state)
        return { type: "object", entries, start: open.start }
      }
      continue
    }
    if (separator.type === "}") {
      advance(state)
      return { type: "object", entries, start: open.start }
    }
    throw new JsonSyntaxError("missing-comma", separator.start, { raw: separator.raw })
  }
}

function parseArray(state) {
  const open = advance(state)
  const items = []
  if (peek(state)?.type === "]") {
    advance(state)
    return { type: "array", items, start: open.start }
  }

  while (true) {
    if (!peek(state)) throw unclosed(state, open)
    items.push(parseValue(state))

    const separator = peek(state)
    if (!separator) throw unclosed(state, open)
    if (separator.type === ",") {
      const comma = advance(state)
      const after = peek(state)
      if (!after) throw unclosed(state, open)
      if (after.type === "]") {
        if (!state.jsonc) throw new JsonSyntaxError("trailing-comma", comma.start, { close: "]" })
        advance(state)
        return { type: "array", items, start: open.start }
      }
      continue
    }
    if (separator.type === "]") {
      advance(state)
      return { type: "array", items, start: open.start }
    }
    throw new JsonSyntaxError("missing-comma", separator.start, { raw: separator.raw })
  }
}

/** Parse JSON (or JSONC when requested) into a lossless syntax tree. */
export function parseJson(text, options = {}) {
  const source = typeof text === "string" ? text : ""
  const jsonc = options?.jsonc === true
  const tokens = tokenize(source, { jsonc })
  if (tokens.length === 0) throw new JsonSyntaxError("empty", 0)
  const state = { text: source, tokens, index: 0, jsonc }
  const root = parseValue(state)
  const extra = peek(state)
  if (extra) throw new JsonSyntaxError("trailing-content", extra.start, { raw: extra.raw })
  return root
}

function indentText(indent, level) {
  const unit = indent === "tab" ? "\t" : " ".repeat(indent === 4 ? 4 : 2)
  return unit.repeat(level)
}

function serializeValue(node, options, level) {
  switch (node.type) {
    case "string":
    case "number":
      return node.raw
    case "boolean":
      return node.value ? "true" : "false"
    case "null":
      return "null"
    case "object": {
      const entries = options.sortKeys
        ? [...node.entries].sort((left, right) =>
            left.key < right.key ? -1 : left.key > right.key ? 1 : 0,
          )
        : node.entries
      if (entries.length === 0) return "{}"
      if (options.minify) {
        return `{${entries
          .map((entry) => `${entry.keyRaw}:${serializeValue(entry.value, options, 0)}`)
          .join(",")}}`
      }
      const inner = entries
        .map(
          (entry) =>
            `${indentText(options.indent, level + 1)}${entry.keyRaw}: ${serializeValue(entry.value, options, level + 1)}`,
        )
        .join(",\n")
      return `{\n${inner}\n${indentText(options.indent, level)}}`
    }
    case "array": {
      if (node.items.length === 0) return "[]"
      if (options.minify) {
        return `[${node.items.map((item) => serializeValue(item, options, 0)).join(",")}]`
      }
      const inner = node.items
        .map((item) => `${indentText(options.indent, level + 1)}${serializeValue(item, options, level + 1)}`)
        .join(",\n")
      return `[\n${inner}\n${indentText(options.indent, level)}]`
    }
    default:
      return ""
  }
}

/** Serialize a syntax tree, preserving the original string and number tokens. */
export function serializeNode(node, options = {}) {
  const indent = options?.indent === 4 || options?.indent === "tab" ? options.indent : 2
  return serializeValue(
    node,
    { indent, sortKeys: options?.sortKeys === true, minify: options?.minify === true },
    0,
  )
}

export function collectStats(root) {
  let keys = 0
  let nodes = 0
  let depth = 0

  function walk(node, containerDepth) {
    nodes++
    if (node.type === "object") {
      const nextDepth = containerDepth + 1
      depth = Math.max(depth, nextDepth)
      keys += node.entries.length
      for (const entry of node.entries) walk(entry.value, nextDepth)
    } else if (node.type === "array") {
      const nextDepth = containerDepth + 1
      depth = Math.max(depth, nextDepth)
      for (const item of node.items) walk(item, nextDepth)
    }
  }

  walk(root, 0)
  return { keys, depth, nodes }
}

export function pathForKey(parent, key) {
  return identifierPattern.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`
}

export function pathForIndex(parent, index) {
  return `${parent}[${index}]`
}

export function collectUnsafeNumbers(root) {
  const warnings = []

  function walk(node, path) {
    if (node.type === "number") {
      if (node.unsafe) warnings.push({ raw: node.raw, path, start: node.start })
      return
    }
    if (node.type === "object") {
      for (const entry of node.entries) walk(entry.value, pathForKey(path, entry.key))
    } else if (node.type === "array") {
      node.items.forEach((item, index) => walk(item, pathForIndex(path, index)))
    }
  }

  walk(root, "$")
  return warnings
}

function byteLength(text) {
  return typeof TextEncoder === "function" ? new TextEncoder().encode(text).length : text.length
}

/**
 * Parse, validate, and serialize JSON. The returned tree and warnings are
 * derived from the same lossless tokens, so large numbers are never rounded.
 */
export function formatJson(text, options = {}) {
  const settings = normalizeSettings(options)
  const source = typeof text === "string" ? text : ""
  const root = parseJson(source, { jsonc: settings.jsonc })
  const output = serializeNode(root, settings)
  const base = collectStats(root)
  return {
    output,
    root,
    stats: {
      ...base,
      inputBytes: byteLength(source),
      outputBytes: byteLength(output),
    },
    warnings: collectUnsafeNumbers(root),
  }
}
