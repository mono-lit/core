/**
 * Built-in Handlebars helpers for report templates.
 *
 * Three families:
 *
 * - **Formatting** (`currency`, `number`, `date`, `percent`) — emit pretty
 *   display text *plus* a hidden {@link ValueDirective} carrying the raw value
 *   and an Excel number format. That's what keeps `SUM()` working: Markdown
 *   shows `Rp 1.000.000`, the spreadsheet stores `1000000`.
 * - **Aggregation / logic** (`sum`, `avg`, `count`, `eq`, `gt`, …) — plain
 *   values, so they nest as sub-expressions: `{{currency (sum rows "Salary")}}`.
 * - **Excel-only** (`style`, `rowStyle`, `merge`, `formula`, `image`) — emit a
 *   directive and no visible text, so they vanish from Markdown output.
 */

import { encodeDirective } from './sentinel'
import { escapeForCell } from './expression'
import type { MonoExportFormatOptions, MonoExportHelper } from './types'

/** The trailing object Handlebars appends to every helper call. */
interface HelperOptions {
  hash?: Record<string, unknown>
  fn?: unknown
  data?: unknown
}

/** Drop Handlebars' trailing options object, returning it alongside the args. */
function splitArgs(args: unknown[]): { args: unknown[]; hash: Record<string, unknown> } {
  const last = args[args.length - 1] as HelperOptions | undefined
  const isOptions = !!last && typeof last === 'object' && 'hash' in last
  return {
    args: isOptions ? args.slice(0, -1) : args,
    hash: (isOptions ? last.hash : undefined) ?? {},
  }
}

/** Coerce to a finite number, or `null` when the value isn't numeric. */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Coerce to a Date, or `null`. Accepts a Date, an ISO string, or epoch ms. */
function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number' || typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Pull `field` off each item (or the item itself when no field is given). */
function pluck(list: unknown, field: unknown): unknown[] {
  if (!Array.isArray(list)) return []
  if (typeof field !== 'string' || !field) return list
  return list.map((item) => (item as Record<string, unknown>)?.[field])
}

/** The numeric values of `list[field]`, skipping anything non-numeric. */
function numbersOf(list: unknown, field: unknown): number[] {
  return pluck(list, field)
    .map(toNumber)
    .filter((n): n is number => n !== null)
}

/**
 * Derive an Excel number format from a currency code by asking `Intl` where the
 * symbol goes and how many decimals it uses — so IDR renders `"Rp"#,##0` and
 * EUR-in-German renders `#,##0.00" €"` without a hard-coded lookup table.
 */
function deriveCurrencyFormat(locale: string | undefined, currency: string): string {
  try {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(1)
    const symbol = parts.find((p) => p.type === 'currency')?.value ?? currency
    const fraction = parts.find((p) => p.type === 'fraction')?.value ?? ''
    const digits = fraction.length ? `.${'0'.repeat(fraction.length)}` : ''
    const symbolFirst = parts.findIndex((p) => p.type === 'currency') === 0
    const quoted = `"${symbol}"`
    return symbolFirst ? `${quoted}#,##0${digits}` : `#,##0${digits}${quoted}`
  } catch {
    return '#,##0.00'
  }
}

/**
 * Display text + the raw value/format directive that Excel will pick up. The
 * display text is echoed back into the directive (`t`) so the renderer can tell
 * "this cell *is* the value" from "this value is mentioned mid-sentence".
 */
function formatted(display: string, directive: { n?: number; d?: string; f?: string }): string {
  return display + encodeDirective({ k: 'val', ...directive, t: display })
}

/**
 * Build the built-in helper map for one render. Bound to `formatting` so
 * locale/currency choices apply consistently across every helper.
 */
export function createHelpers(
  formatting: MonoExportFormatOptions = {},
): Record<string, MonoExportHelper> {
  const locale = formatting.locale
  const currencyCode = formatting.currency ?? 'USD'
  const currencyFormat = formatting.currencyFormat ?? deriveCurrencyFormat(locale, currencyCode)
  const numberFormat = formatting.numberFormat ?? '#,##0'
  const dateFormat = formatting.dateFormat ?? 'yyyy-mm-dd'
  const percentFormat = formatting.percentFormat ?? '0.00%'

  return {
    // --- Formatting ---------------------------------------------------------

    /** `{{currency salary}}` → `$1,234.00` in Markdown, `1234` + format in Excel. */
    currency(...raw: unknown[]) {
      const { args, hash } = splitArgs(raw)
      const n = toNumber(args[0])
      if (n === null) return ''
      const code = (hash.code as string) ?? currencyCode
      const display = new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(n)
      const fmt =
        (hash.fmt as string) ??
        (code === currencyCode ? currencyFormat : deriveCurrencyFormat(locale, code))
      return formatted(display, { n, f: fmt })
    },

    /** `{{number qty}}` / `{{number rate decimals=2}}`. */
    number(...raw: unknown[]) {
      const { args, hash } = splitArgs(raw)
      const n = toNumber(args[0])
      if (n === null) return ''
      const decimals = toNumber(hash.decimals)
      const display = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals ?? undefined,
        maximumFractionDigits: decimals ?? undefined,
      }).format(n)
      const fmt =
        (hash.fmt as string) ??
        (decimals ? `#,##0.${'0'.repeat(decimals)}` : numberFormat)
      return formatted(display, { n, f: fmt })
    },

    /** `{{date createdAt}}` — Markdown gets the locale date, Excel a real Date. */
    date(...raw: unknown[]) {
      const { args, hash } = splitArgs(raw)
      const d = toDate(args[0])
      if (!d) return ''
      const display = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d)
      return formatted(display, { d: d.toISOString(), f: (hash.fmt as string) ?? dateFormat })
    },

    /** `{{percent 0.155}}` → `15.50%`; Excel stores the fraction with a % format. */
    percent(...raw: unknown[]) {
      const { args, hash } = splitArgs(raw)
      const n = toNumber(args[0])
      if (n === null) return ''
      const display = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2,
      }).format(n)
      return formatted(display, { n, f: (hash.fmt as string) ?? percentFormat })
    },

    // --- Aggregation --------------------------------------------------------

    /** `{{sum employees "salary"}}` — or `{{sum numbers}}` for a bare array. */
    sum: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      return numbersOf(args[0], args[1]).reduce((total, n) => total + n, 0)
    },

    avg: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const values = numbersOf(args[0], args[1])
      return values.length ? values.reduce((t, n) => t + n, 0) / values.length : 0
    },

    /** `{{count employees}}` — length, or how many have a truthy `field`. */
    count: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const list = args[0]
      if (!Array.isArray(list)) return 0
      return typeof args[1] === 'string'
        ? pluck(list, args[1]).filter((v) => v != null && v !== '').length
        : list.length
    },

    max: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const values = numbersOf(args[0], args[1])
      return values.length ? Math.max(...values) : 0
    },

    min: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const values = numbersOf(args[0], args[1])
      return values.length ? Math.min(...values) : 0
    },

    // --- Logic (usable as `{{#if (gt salary 1000)}}`) ------------------------

    eq: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      return args[0] === args[1]
    },
    ne: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      return args[0] !== args[1]
    },
    gt: (...raw: unknown[]) => compare(raw, (a, b) => a > b),
    gte: (...raw: unknown[]) => compare(raw, (a, b) => a >= b),
    lt: (...raw: unknown[]) => compare(raw, (a, b) => a < b),
    lte: (...raw: unknown[]) => compare(raw, (a, b) => a <= b),
    and: (...raw: unknown[]) => splitArgs(raw).args.every(Boolean),
    or: (...raw: unknown[]) => splitArgs(raw).args.some(Boolean),
    not: (...raw: unknown[]) => !splitArgs(raw).args[0],

    /** `{{default value "-"}}` — fall back when null / undefined / empty. */
    default: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const value = args[0]
      return value == null || value === '' ? args[1] ?? '' : value
    },

    /**
     * Escape a value for a GFM table cell. Applied automatically to mustaches on
     * table rows by the preprocessor; call it by hand elsewhere if needed.
     */
    esc: (...raw: unknown[]) => escapeForCell(splitArgs(raw).args[0]),

    // --- Excel-only directives (invisible in Markdown output) ----------------

    /** `{{style "header"}}` — apply a named style to this cell. */
    style: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const name = args[0]
      return typeof name === 'string' && name ? encodeDirective({ k: 'style', v: name }) : ''
    },

    /** `{{rowStyle "groupHeader"}}` — apply a named style to the whole row. */
    rowStyle: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const name = args[0]
      return typeof name === 'string' && name ? encodeDirective({ k: 'rowStyle', v: name }) : ''
    },

    /** `{{merge cols=4}}` — merge this cell across columns and/or rows. */
    merge: (...raw: unknown[]) => {
      const { hash } = splitArgs(raw)
      const cols = toNumber(hash.cols)
      const rows = toNumber(hash.rows)
      if (!cols && !rows) return ''
      return encodeDirective({
        k: 'merge',
        ...(cols ? { cols: Math.max(1, Math.floor(cols)) } : {}),
        ...(rows ? { rows: Math.max(1, Math.floor(rows)) } : {}),
      })
    },

    /**
     * `{{formula "SUM(C{row}:D{row})"}}` — an Excel formula for this cell.
     * `{row}`, `{firstRow}`, `{lastRow}` and `{col:Field}` are resolved when the
     * cell is written, since a template can't know its own row number.
     */
    formula: (...raw: unknown[]) => {
      const { args } = splitArgs(raw)
      const expr = args[0]
      return typeof expr === 'string' && expr ? encodeDirective({ k: 'formula', v: expr }) : ''
    },

    /** `{{image logo width=120 height=40}}` — anchor an image at this cell. */
    image: (...raw: unknown[]) => {
      const { args, hash } = splitArgs(raw)
      const src = args[0]
      if (typeof src !== 'string' || !src) return ''
      const width = toNumber(hash.width)
      const height = toNumber(hash.height)
      return encodeDirective({
        k: 'image',
        v: src,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      })
    },
  }
}

/** Numeric-aware comparison shared by `gt` / `gte` / `lt` / `lte`. */
function compare(raw: unknown[], test: (a: any, b: any) => boolean): boolean {
  const { args } = splitArgs(raw)
  const a = toNumber(args[0])
  const b = toNumber(args[1])
  if (a !== null && b !== null) return test(a, b)
  return test(args[0] as any, args[1] as any)
}
