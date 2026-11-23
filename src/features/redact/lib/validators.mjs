const landlineAreaCodes = new Set([
  "21", "22", "23", "24", "25", "26", "27", "28",
  "31", "34", "35", "38",
  "41", "44", "45", "46", "47", "48", "49",
  "51", "52", "53", "54", "55", "56", "57", "58", "59",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "72", "73", "74", "75", "76", "77", "78", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
])

/** Convert Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin digits. */
export function toLatinDigits(value) {
  return String(value).replace(/[۰-۹٠-٩]/g, (character) => {
    const code = character.charCodeAt(0)
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0)
    return String(code - 0x0660)
  })
}

/** Keep only Latin digits after converting Persian and Arabic-Indic digits. */
export function digitsOnly(value) {
  return toLatinDigits(value).replace(/\D/g, "")
}

/**
 * Normalize an Iranian phone number to the national `0…` form.
 * `+98…` and `0098…` prefixes become `0…`; separators are removed.
 */
export function normalizeIranPhone(value) {
  let digits = digitsOnly(value)
  if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`
  else if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`
  return digits
}

/** Iranian national ID: ten digits with the official check-digit algorithm. */
export function isValidNationalId(value) {
  const digits = digitsOnly(value)
  if (!/^\d{10}$/.test(digits)) return false
  // All-identical numbers pass the arithmetic check but are not issued IDs.
  if (/^(\d)\1{9}$/.test(digits)) return false
  let sum = 0
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index)
  }
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? remainder : 11 - remainder
  return Number(digits[9]) === checkDigit
}

/** Luhn checksum used by payment cards. */
export function isValidLuhn(value) {
  const digits = digitsOnly(value)
  if (digits.length < 12) return false
  let sum = 0
  let double = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

/** A 16-digit Iranian payment card number with a valid Luhn checksum. */
export function isValidCardNumber(value) {
  return digitsOnly(value).length === 16 && isValidLuhn(value)
}

/** Iranian IBAN: `IR` plus 24 digits, validated with mod-97. */
export function isValidIban(value) {
  const compact = toLatinDigits(String(value)).replace(/[\s-]/g, "").toUpperCase()
  if (!/^IR\d{24}$/.test(compact)) return false
  const rearranged = compact.slice(4) + compact.slice(0, 4)
  let remainder = 0
  for (const character of rearranged) {
    const chunk = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character
    for (const digit of chunk) remainder = (remainder * 10 + Number(digit)) % 97
  }
  return remainder === 1
}

export function isValidIpv4(value) {
  const parts = String(value).split(".")
  if (parts.length !== 4) return false
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

export function isValidIpv6(value) {
  let address = String(value).trim()
  if (!address || address.includes(" ") || address.includes("/")) return false

  // An embedded IPv4 tail occupies the last two 16-bit groups.
  if (address.includes(".")) {
    const lastColon = address.lastIndexOf(":")
    if (lastColon < 0) return false
    const ipv4 = address.slice(lastColon + 1)
    if (!isValidIpv4(ipv4)) return false
    address = `${address.slice(0, lastColon)}:0:0`
  }

  const firstDoubleColon = address.indexOf("::")
  if (firstDoubleColon !== -1 && address.indexOf("::", firstDoubleColon + 2) !== -1) return false
  const hasDoubleColon = firstDoubleColon !== -1

  let groups
  if (hasDoubleColon) {
    const left = address.slice(0, firstDoubleColon)
    const right = address.slice(firstDoubleColon + 2)
    const leftGroups = left === "" ? [] : left.split(":")
    const rightGroups = right === "" ? [] : right.split(":")
    groups = [...leftGroups, ...rightGroups]
    // `::` must stand for at least one omitted group.
    if (groups.length >= 8) return false
  } else {
    groups = address.split(":")
    if (groups.length !== 8) return false
  }

  return groups.every((group) => /^[0-9A-Fa-f]{1,4}$/.test(group))
}

/** Iranian mobile numbers: `09…`, `+989…`, or `00989…`. */
export function isValidIranMobile(value) {
  return /^09\d{9}$/.test(normalizeIranPhone(value))
}

/** Iranian fixed-line numbers: trunk `0`, a known area code, and eight digits. */
export function isValidIranLandline(value) {
  const digits = normalizeIranPhone(value)
  if (!/^0\d{10}$/.test(digits)) return false
  return landlineAreaCodes.has(digits.slice(1, 3)) && !digits.startsWith("09")
}
