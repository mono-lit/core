/**
 * Turning spreadsheet text into real values.
 *
 * The number parser is the delicate part. A sheet exported in one locale and
 * opened in another produces `1.234.567,89` or `1,234,567.89` for the same
 * amount, and getting it wrong is silent — you don't get an error, you get a
 * budget off by a factor of a thousand. So separators are *inferred* from the
 * string's own shape rather than assumed, with an explicit override available.
 */

import type { MonoImportNumberFormat, MonoImportValueType } from './types'

/**
 * Normalise a header for lookup: NBSP → space, drop dots/underscores (`No. Dok`
 * and `No_Dok` should both find `No Dok`), collapse whitespace, lowercase.
 */
export function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/[._]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Default normalisation for key comparison — forgiving about spacing and case. */
export function normalizeKeyValue(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Read a display string out of whatever ExcelJS put in a cell. */
export function cellText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  const v = value as Record<string, any>
  // Rich text, hyperlinks and formula cells all wrap their text differently.
  if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text).join('')
  if (v.text != null) return String(v.text)
  if (v.result != null) return String(v.result)
  if (v.hyperlink != null && v.text == null) return String(v.hyperlink)
  return String(value)
}

/**
 * Parse a number written in an unknown locale.
 *
 * `'auto'` infers the separators: with both `.` and `,` present the **rightmost**
 * is the decimal point; with only one, its position decides — exactly three
 * trailing digits (or several occurrences) means thousands grouping, otherwise
 * it's a decimal point. So `1.234` is one thousand two hundred, while `1.23` is
 * one and a bit. Returns `null` when the text isn't a number at all.
 */
export function parseNumber(
  raw: unknown,
  mode: MonoImportNumberFormat = 'auto',
  allowNegative = true,
): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const original = String(raw).replace(/\u00A0/g, ' ').trim()
  if (!original || !/[0-9]/.test(original)) return null

  // Accounting negatives: (1.234) means -1234.
  const parenthesised = /^\(.*\)$/.test(original)
  let s = original.replace(/[()]/g, '')

  const negative = parenthesised || /^-/.test(s)
  s = s.replace(/[^\d.,]/g, '')
  if (!s) return null

  let groupSep: string | null = null
  let decimalSep: string | null = null

  if (mode === 'us') {
    groupSep = ','
    decimalSep = '.'
  } else if (mode === 'eu') {
    groupSep = '.'
    decimalSep = ','
  } else {
    const lastDot = s.lastIndexOf('.')
    const lastComma = s.lastIndexOf(',')

    if (lastDot === -1 && lastComma === -1) {
      // plain digits — nothing to strip
    } else if (lastDot !== -1 && lastComma !== -1) {
      // Both present: the rightmost one is the decimal point.
      if (lastDot > lastComma) {
        decimalSep = '.'
        groupSep = ','
      } else {
        decimalSep = ','
        groupSep = '.'
      }
    } else {
      const only = lastDot !== -1 ? '.' : ','
      const pos = only === '.' ? lastDot : lastComma
      const trailing = s.length - pos - 1
      const occurrences = s.split(only).length - 1

      if (occurrences > 1) {
        groupSep = only // 1.234.567 — can only be grouping
      } else if (trailing === 3) {
        groupSep = only // 1.234 — grouping by convention
      } else {
        decimalSep = only // 1.23 / 1.2345 — a decimal point
      }
    }
  }

  if (groupSep) s = s.split(groupSep).join('')
  if (decimalSep) s = s.replace(decimalSep, '.')

  if (!/^\d+(\.\d+)?$/.test(s)) return null

  const n = Number(s)
  if (!Number.isFinite(n)) return null
  if (negative) {
    if (!allowNegative) return null
    return -n
  }
  return n
}

/** Parse a date from a Date, an ISO-ish string, or a spreadsheet serial number. */
export function parseDate(raw: unknown): Date | null {
  if (raw == null || raw === '') return null
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Excel serial: days since 1899-12-30 (its 1900 leap-year bug included).
    const ms = Math.round((raw - 25569) * 86400 * 1000)
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const text = String(raw).trim()
  if (!text) return null

  // dd/mm/yyyy and dd-mm-yyyy are ambiguous to `Date`, which reads them as US
  // month-first. Handle them explicitly rather than silently swapping day/month.
  const dmy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(text)
  if (dmy) {
    const [, d, m, y] = dmy
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const TRUE_WORDS = new Set(['true', 'yes', 'y', '1', 'ya', 'benar', 'x', '✓'])
const FALSE_WORDS = new Set(['false', 'no', 'n', '0', 'tidak', 'salah', ''])

/** Parse a boolean from the many things a human types into a yes/no column. */
export function parseBoolean(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw
  if (raw == null) return null
  const text = String(raw).trim().toLowerCase()
  if (TRUE_WORDS.has(text)) return true
  if (FALSE_WORDS.has(text)) return false
  return null
}

/**
 * Coerce one cell for a declared column type. `undefined` means "unparseable —
 * skip this cell" so a stray `-` in a number column can't stage `NaN`.
 */
export function coerceValue(
  raw: unknown,
  type: MonoImportValueType | undefined,
  opts: { numberFormat?: MonoImportNumberFormat; allowNegative?: boolean } = {},
): unknown {
  const text = cellText(raw)

  switch (type) {
    case 'number': {
      const n = parseNumber(raw, opts.numberFormat ?? 'auto', opts.allowNegative ?? true)
      return n === null ? undefined : n
    }
    case 'date': {
      const d = parseDate(raw instanceof Date || typeof raw === 'number' ? raw : text)
      return d === null ? undefined : d
    }
    case 'boolean': {
      const b = parseBoolean(text)
      return b === null ? undefined : b
    }
    default:
      return text.trim()
  }
}

/**
 * Whether a staged value would actually change the row. Numbers are compared
 * numerically so a stored `5000` isn't "changed" by a sheet's `"5.000"`, and
 * dates by timestamp so two equal instants don't churn.
 */
export function isSameValue(current: unknown, next: unknown, type?: MonoImportValueType): boolean {
  if (type === 'number') {
    const a = parseNumber(current, 'auto')
    const b = typeof next === 'number' ? next : parseNumber(next, 'auto')
    return a !== null && b !== null && a === b
  }
  if (type === 'date') {
    const a = parseDate(current)
    const b = parseDate(next)
    return !!a && !!b && a.getTime() === b.getTime()
  }
  if (type === 'boolean') return Boolean(current) === Boolean(next)
  if (current == null && (next === '' || next == null)) return true
  return String(current ?? '') === String(next ?? '')
}
