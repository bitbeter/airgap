import {
  isValidCardNumber,
  isValidIban,
  isValidIpv4,
  isValidIpv6,
  isValidIranLandline,
  isValidIranMobile,
  isValidNationalId,
  toLatinDigits,
} from "./validators.mjs"

const emailPattern = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?![A-Za-z0-9-])/g
const urlPattern = /\b(?:https?:\/\/|ftp:\/\/|www\.)[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/gi
const ipv4Pattern = /(?<![\d۰-۹])(?:[0-9۰-۹]{1,3}\.){3}[0-9۰-۹]{1,3}(?![\d۰-۹])/g
const ipv6Pattern = /(?<![0-9A-Za-z:.])(?=[0-9A-Fa-f:.]*:[0-9A-Fa-f:.]*:)[0-9A-Fa-f:.]+(?![0-9A-Za-z:.])/g
const mobilePattern = /(?<![\d۰-۹])(?:\+[9۹][8۸]|[0۰][0۰][9۹][8۸]|[0۰])[\s-]?[9۹](?:[\s-]?[0-9۰-۹]){9}(?![\d۰-۹])/g
const landlinePattern = /(?<![\d۰-۹])[0۰](?:[\s-]?[0-9۰-۹]){10}(?![\d۰-۹])/g
const nationalIdPattern = /(?<![\d۰-۹])(?:[0-9۰-۹][\s-]?){9}[0-9۰-۹](?![\s-]?[0-9۰-۹])/g
const cardPattern = /(?<![\d۰-۹])(?:[0-9۰-۹][\s-]?){15}[0-9۰-۹](?![\s-]?[0-9۰-۹])/g
const ibanPattern = /(?<![A-Za-z0-9])IR[\s-]?(?:[0-9۰-۹][\s-]?){23}[0-9۰-۹](?![0-9A-Za-z۰-۹])/gi
const openAiKeyPattern = /(?<![A-Za-z0-9_-])sk-[A-Za-z0-9_-]{16,}(?![A-Za-z0-9_-])/g
const githubKeyPattern = /(?<![A-Za-z0-9_])ghp_[A-Za-z0-9]{16,}(?![A-Za-z0-9_])/g
const awsKeyPattern = /(?<![A-Za-z0-9])AKIA[0-9A-Z]{16}(?![A-Za-z0-9])/g
const jwtPattern = /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*(?![A-Za-z0-9_-])/g
const pemKeyPattern = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----/g

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function trimTrailing(value, characters) {
  let end = value.length
  while (end > 0 && characters.includes(value[end - 1])) end -= 1
  return value.slice(0, end)
}

function trimUrl(value) {
  let end = value.length
  const trailing = ".,;:!?)]}'\""
  while (end > 0 && trailing.includes(value[end - 1])) {
    const current = value.slice(0, end)
    if (value[end - 1] === ")" && (current.match(/\(/g)?.length ?? 0) >= (current.match(/\)/g)?.length ?? 0)) break
    end -= 1
  }
  return value.slice(0, end)
}

function collect(text, pattern, type, validate = () => true, adjust = (value) => value) {
  const results = []
  for (const match of text.matchAll(pattern)) {
    const value = adjust(match[0])
    if (!value || !validate(value)) continue
    const start = match.index ?? 0
    results.push({ type, value, start, end: start + value.length })
  }
  return results
}

function isValidEmail(value) {
  const at = value.lastIndexOf("@")
  if (at <= 0 || at === value.length - 1) return false
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false
  if (domain.startsWith("-") || domain.endsWith("-")) return false
  return true
}

function detectEmails(text) {
  return collect(text, emailPattern, "email", isValidEmail)
}

function detectUrls(text) {
  return collect(text, urlPattern, "url", (value) => value.length > 7, trimUrl)
}

function detectIpv4(text) {
  return collect(text, ipv4Pattern, "ip", (value) => isValidIpv4(toLatinDigits(value)))
}

function detectIpv6(text) {
  return collect(text, ipv6Pattern, "ip", (value) => isValidIpv6(value), (value) => trimTrailing(value, "."))
}

function detectPhones(text) {
  return [
    ...collect(text, mobilePattern, "phone", isValidIranMobile),
    ...collect(text, landlinePattern, "phone", isValidIranLandline),
  ]
}

function detectNationalIds(text) {
  return collect(text, nationalIdPattern, "nationalId", isValidNationalId)
}

function detectCards(text) {
  return collect(text, cardPattern, "card", isValidCardNumber)
}

function detectIbans(text) {
  return collect(text, ibanPattern, "iban", isValidIban)
}

function detectApiKeys(text) {
  return [
    ...collect(text, pemKeyPattern, "apiKey"),
    ...collect(text, jwtPattern, "apiKey"),
    ...collect(text, openAiKeyPattern, "apiKey"),
    ...collect(text, githubKeyPattern, "apiKey"),
    ...collect(text, awsKeyPattern, "apiKey"),
  ]
}

function detectTerms(text, terms) {
  const results = []
  const seen = new Set()
  for (const raw of terms) {
    const term = String(raw).trim()
    if (!term) continue
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const prefix = /^[\p{L}\p{N}_]/u.test(term) ? "(?<![\\p{L}\\p{N}_])" : ""
    const suffix = /[\p{L}\p{N}_]$/u.test(term) ? "(?![\\p{L}\\p{N}_])" : ""
    let pattern
    try {
      pattern = new RegExp(`${prefix}${escapeRegExp(term)}${suffix}`, "giu")
    } catch {
      continue
    }
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0
      results.push({ type: "terms", value: match[0], start, end: start + match[0].length })
    }
  }
  return results
}

export const detectorDefinitions = [
  {
    id: "email",
    label: "ایمیل",
    description: "نشانی‌های ایمیل",
    placeholder: "EMAIL",
    priority: 60,
    defaultEnabled: true,
    detect: detectEmails,
  },
  {
    id: "url",
    label: "نشانی اینترنتی",
    description: "http/https، ftp و www",
    placeholder: "URL",
    priority: 50,
    defaultEnabled: true,
    detect: detectUrls,
  },
  {
    id: "ip",
    label: "نشانی IP",
    description: "IPv4 و IPv6",
    placeholder: "IP",
    priority: 15,
    defaultEnabled: true,
    detect: (text) => [...detectIpv4(text), ...detectIpv6(text)],
  },
  {
    id: "phone",
    label: "شمارهٔ تلفن",
    description: "موبایل و تلفن ثابت ایران",
    placeholder: "PHONE",
    priority: 20,
    defaultEnabled: true,
    detect: detectPhones,
  },
  {
    id: "nationalId",
    label: "کد ملی",
    description: "۱۰ رقم با اعتبارسنجی رقم کنترل",
    placeholder: "NATIONAL_ID",
    priority: 30,
    defaultEnabled: true,
    detect: detectNationalIds,
  },
  {
    id: "card",
    label: "شمارهٔ کارت",
    description: "۱۶ رقم با الگوریتم Luhn",
    placeholder: "CARD",
    priority: 40,
    defaultEnabled: true,
    detect: detectCards,
  },
  {
    id: "iban",
    label: "شبا",
    description: "IR + ۲۴ رقم با اعتبارسنجی mod-97",
    placeholder: "IBAN",
    priority: 70,
    defaultEnabled: true,
    detect: detectIbans,
  },
  {
    id: "apiKey",
    label: "کلید/توکن",
    description: "sk-، ghp_، AKIA، JWT و کلید خصوصی PEM",
    placeholder: "API_KEY",
    priority: 80,
    defaultEnabled: true,
    detect: detectApiKeys,
  },
  {
    id: "terms",
    label: "واژه‌های دلخواه",
    description: "نام شخص، شرکت یا پروژه",
    placeholder: "NAME",
    priority: 10,
    defaultEnabled: true,
    detect: () => [],
  },
]

export const placeholderByType = Object.fromEntries(detectorDefinitions.map((definition) => [definition.id, definition.placeholder]))

const priorityByType = Object.fromEntries(detectorDefinitions.map((definition) => [definition.id, definition.priority]))

export const defaultSettings = Object.fromEntries(detectorDefinitions.map((definition) => [definition.id, definition.defaultEnabled]))

export function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {}
  const normalized = {}
  for (const definition of detectorDefinitions) {
    normalized[definition.id] = typeof source[definition.id] === "boolean" ? source[definition.id] : definition.defaultEnabled
  }
  return normalized
}

function resolveOverlaps(candidates) {
  // Longer matches win first, so an email inside a URL is covered by the URL.
  // For equal lengths, the more precise detector wins.
  const sorted = [...candidates].sort((left, right) => {
    const lengthDifference = (right.end - right.start) - (left.end - left.start)
    if (lengthDifference !== 0) return lengthDifference
    const priorityDifference = (priorityByType[right.type] ?? 0) - (priorityByType[left.type] ?? 0)
    if (priorityDifference !== 0) return priorityDifference
    return left.start - right.start
  })
  const accepted = []
  for (const candidate of sorted) {
    if (accepted.some((existing) => candidate.start < existing.end && candidate.end > existing.start)) continue
    accepted.push(candidate)
  }
  return accepted.sort((left, right) => left.start - right.start)
}

export function detect(text, options = {}) {
  const source = typeof text === "string" ? text : ""
  const settings = normalizeSettings(options?.settings)
  const terms = Array.isArray(options?.terms) ? options.terms : []
  const candidates = []

  for (const definition of detectorDefinitions) {
    if (!settings[definition.id]) continue
    if (definition.id === "terms") candidates.push(...detectTerms(source, terms))
    else candidates.push(...definition.detect(source))
  }

  const accepted = resolveOverlaps(candidates)
  const counters = Object.create(null)
  const byValue = new Map()
  const findings = []
  const findingByPlaceholder = new Map()
  const occurrences = []

  for (const candidate of accepted) {
    const valueKey = `${candidate.type}\u0000${candidate.value}`
    let placeholder = byValue.get(valueKey)
    if (!placeholder) {
      const base = placeholderByType[candidate.type]
      counters[base] = (counters[base] ?? 0) + 1
      placeholder = `[${base}_${counters[base]}]`
      byValue.set(valueKey, placeholder)
      const finding = {
        id: placeholder,
        type: candidate.type,
        value: candidate.value,
        placeholder,
        start: candidate.start,
        end: candidate.end,
        count: 0,
      }
      findings.push(finding)
      findingByPlaceholder.set(placeholder, finding)
    }
    findingByPlaceholder.get(placeholder).count += 1
    occurrences.push({ ...candidate, placeholder })
  }

  return { findings, occurrences }
}
