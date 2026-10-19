import type { OtpGroups, OtpType } from './otp-types.js'

/**
 * Pure helpers behind `mono-otp`. The value is always a CONTIGUOUS prefix of the boxes — box i
 * holds `value[i]` — so every edit is a string operation and the boxes are just its characters.
 */

export const OTP_DEFAULT_LENGTH = 6

/** One character cleaned for `type`; `''` when it is not accepted. */
export function sanitizeOtpChar(ch: string, type: OtpType = 'numeric'): string {
  if (!ch) return ''
  if (type === 'numeric') return /^[0-9]$/.test(ch) ? ch : ''
  if (type === 'alphanumeric') return /^[A-Za-z0-9]$/.test(ch) ? ch.toUpperCase() : ''
  return /^\S$/u.test(ch) ? ch : ''
}

/** A whole string cleaned for `type` — rejected characters are dropped, not kept as holes. */
export function sanitizeOtpText(text: unknown, type: OtpType = 'numeric'): string {
  if (text == null) return ''
  let out = ''
  for (const ch of Array.from(String(text))) out += sanitizeOtpChar(ch, type)
  return out
}

/** `length` from a prop or attribute: a whole number ≥ 1, else the default. */
export function resolveOtpLength(length: unknown): number {
  const n = Math.floor(Number(length))
  return Number.isFinite(n) && n >= 1 ? n : OTP_DEFAULT_LENGTH
}

/** The model for `length` boxes: cleaned and cut to fit. */
export function normaliseOtpValue(value: unknown, length: number, type: OtpType = 'numeric'): string {
  return Array.from(sanitizeOtpText(value, type)).slice(0, length).join('')
}

/**
 * Group sizes → the box indexes a separator goes BEFORE. `3` repeats (6 boxes → 3-3, 8 → 3-3-2);
 * a list is taken as given and any boxes past it form one last group.
 */
export function parseOtpGroups(groups: OtpGroups | null | undefined, length: number): number[] {
  if (groups == null || groups === '') return []
  let sizes: number[]
  if (typeof groups === 'number') sizes = [groups]
  else if (Array.isArray(groups)) sizes = groups.map(Number)
  else sizes = String(groups).replace(/[[\]\s]/g, '').split(/[,\-|]/).filter(Boolean).map(Number)
  sizes = sizes.filter((n) => Number.isFinite(n) && n >= 1).map(Math.floor)
  if (!sizes.length) return []

  const repeat = sizes.length === 1
  const breaks: number[] = []
  let at = 0
  for (let k = 0; ; k++) {
    const size = repeat ? sizes[0] : sizes[k]
    if (size == null) break
    at += size
    if (at >= length) break
    breaks.push(at)
  }
  return breaks
}

export interface OtpEdit {
  value: string
  /** The box to focus next. */
  caret: number
}

/**
 * Put `text` at box `index`. One character replaces that box; several (a paste, an SMS
 * autofill) overwrite from `index` onwards. Rejected characters are dropped first, so pasting
 * `"123-456"` into a numeric field fills six boxes.
 */
export function spliceOtpValue(value: string, index: number, text: string, length: number, type: OtpType = 'numeric'): OtpEdit {
  const chars = Array.from(value)
  const clean = Array.from(sanitizeOtpText(text, type))
  if (!clean.length) return { value, caret: clampCaret(index, chars.length, length) }
  const at = Math.min(Math.max(0, index), chars.length)
  let next: string[]
  if (clean.length === 1) {
    next = chars.slice()
    next[at] = clean[0]
  } else {
    next = chars.slice(0, at).concat(clean)
  }
  next = next.slice(0, length)
  return { value: next.join(''), caret: clampCaret(at + clean.length, next.length, length) }
}

/** Remove the character in box `index`; the boxes after it move left. */
export function removeOtpChar(value: string, index: number, length: number): OtpEdit {
  const chars = Array.from(value)
  if (index < 0 || index >= chars.length) return { value, caret: clampCaret(index, chars.length, length) }
  chars.splice(index, 1)
  return { value: chars.join(''), caret: clampCaret(index, chars.length, length) }
}

/**
 * Backspace in box `index`: clear it when it holds a character, otherwise step back and clear
 * the one before.
 */
export function backspaceOtp(value: string, index: number, length: number): OtpEdit {
  const filled = Array.from(value).length
  if (index < filled) return removeOtpChar(value, index, length)
  if (filled === 0) return { value, caret: 0 }
  return removeOtpChar(value, filled - 1, length)
}

/** The furthest box that can take focus: the first empty one, or the last box when full. */
export function clampCaret(index: number, filled: number, length: number): number {
  return Math.max(0, Math.min(index, filled, length - 1))
}
