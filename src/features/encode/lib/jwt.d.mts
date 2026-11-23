export interface JwtTimeClaim {
  claim: "exp" | "iat" | "nbf"
  label: string
  seconds: number
  iso: string
  jalali: string
  gregorian: string
}

export type JwtStatusState = "valid" | "expired" | "not-yet-valid" | "no-expiry"

export interface JwtStatus {
  state: JwtStatusState
  message: string
}

export interface JwtError {
  ok: false
  code: string
  message: string
}

export interface JwtResult {
  ok: true
  token: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
  headerJson: string
  payloadJson: string
  signature: string
  times: JwtTimeClaim[]
  invalidTimeClaims: string[]
  status: JwtStatus
}

export function formatJalaliDateTime(date: Date): string
export function formatGregorianDateTime(date: Date): string
export function describeJwtStatus(payload: Record<string, unknown>, now?: number): JwtStatus
export function decodeJwt(value: string, options?: { now?: number }): JwtResult | JwtError
