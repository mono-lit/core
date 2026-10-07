/**
 * Sentinel directives — how presentation survives the trip through Markdown.
 *
 * Markdown has nowhere to hang "make this cell bold", "merge it across 4
 * columns", or "this text reads `Rp 1.000.000` but Excel must store the number
 * `1000000`". So the report helpers don't emit styling: they emit an invisible
 * token next to their display text.
 *
 * The token is wrapped in two Unicode **private-use area** codepoints, which
 * means:
 * - remark parses it as ordinary text, so GFM table structure is untouched;
 * - it can never collide with real content (no keyboard produces U+E000);
 * - the Markdown renderer strips it, leaving the human-readable text;
 * - the Excel renderer extracts it and applies the real formatting.
 *
 * The payload is JSON, **base64-encoded**. That is not paranoia: raw JSON does
 * not survive the trip. Markdown unescapes backslash-escaped ASCII punctuation,
 * so a number format like `"$"#,##0.00` — which JSON writes as `\"$\"#,##0.00`
 * — comes back out of remark with the backslashes stripped, and `JSON.parse`
 * then fails. Base64's alphabet (`A-Z a-z 0-9 + / =`) holds nothing Markdown
 * rewrites, so the payload arrives byte-identical.
 */

/** U+E000 — opens a directive token. */
const OPEN = '\uE000'
/** U+E001 — closes a directive token. */
const CLOSE = '\uE001'

/** Matches one complete token, capturing its base64 payload. */
const TOKEN_RE = /\uE000([^\uE000\uE001]*)\uE001/g

/** UTF-8 safe base64 encode (`btoa` is byte-oriented, so encode to bytes first). */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  if (typeof btoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
  }
  return (globalThis as any).Buffer.from(bytes).toString('base64')
}

/** Inverse of {@link toBase64}. */
function fromBase64(payload: string): string {
  if (typeof atob === 'function') {
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }
  return (globalThis as any).Buffer.from(payload, 'base64').toString('utf8')
}

/** Apply a named style to the cell (or block) the token sits in. */
export interface StyleDirective {
  k: 'style'
  /** Named style, resolved against the merged style map. */
  v: string
}

/** Apply a named style to the entire row the token sits in. */
export interface RowStyleDirective {
  k: 'rowStyle'
  v: string
}

/** Merge the token's cell across `cols` columns / `rows` rows. */
export interface MergeDirective {
  k: 'merge'
  cols?: number
  rows?: number
}

/**
 * Write an Excel formula into the token's cell. Placeholders are resolved at
 * write time (the template can't know its own row number) — see
 * `resolveFormula` in `excel/nodes.ts`.
 */
export interface FormulaDirective {
  k: 'formula'
  v: string
}

/** Anchor an image at the token's cell. `v` is a data URL / base64 / http URL. */
export interface ImageDirective {
  k: 'image'
  v: string
  width?: number
  height?: number
}

/**
 * Carry the *raw* value behind formatted display text, so Excel gets a real
 * number/date (summable, sortable, pivotable) while Markdown keeps the pretty
 * string. `f` is an Excel number format.
 */
export interface ValueDirective {
  k: 'val'
  /** Raw numeric value. */
  n?: number
  /** Raw date as an ISO string (JSON has no Date). */
  d?: string
  /** Excel number format, e.g. `#,##0.00` or `yyyy-mm-dd`. */
  f?: string
  /**
   * The display text this value was emitted with. The renderer swaps in the raw
   * value only when it matches the cell's *entire* text — otherwise a sentence
   * like "Rate {{percent 0.155}} this quarter" would collapse to the bare
   * number `0.155`, losing the prose around it.
   */
  t?: string
}

export type MonoExportDirective =
  | StyleDirective
  | RowStyleDirective
  | MergeDirective
  | FormulaDirective
  | ImageDirective
  | ValueDirective

/** Wrap a directive in its sentinel token, ready to be emitted by a helper. */
export function encodeDirective(directive: MonoExportDirective): string {
  return OPEN + toBase64(JSON.stringify(directive)) + CLOSE
}

/** Whether a string contains at least one directive token. */
export function hasDirectives(text: string): boolean {
  return text.includes(OPEN)
}

/**
 * Split `text` into its visible text and the directives embedded in it.
 * Malformed payloads are dropped rather than thrown — a broken token should
 * never take down a whole report.
 */
export function extractDirectives(text: string): {
  text: string
  directives: MonoExportDirective[]
} {
  if (!hasDirectives(text)) return { text, directives: [] }
  const directives: MonoExportDirective[] = []
  const stripped = text.replace(TOKEN_RE, (_match, payload: string) => {
    try {
      const parsed = JSON.parse(fromBase64(payload)) as MonoExportDirective
      if (parsed && typeof parsed === 'object' && 'k' in parsed) directives.push(parsed)
    } catch {
      // ignore an unparseable token
    }
    return ''
  })
  return { text: stripped, directives }
}

/** Remove every directive token, leaving only the display text (Markdown output). */
export function stripDirectives(text: string): string {
  return hasDirectives(text) ? text.replace(TOKEN_RE, '') : text
}

/**
 * Markdown-active punctuation that must be escaped inside an interpolated value.
 * A bare `|` splits a table cell and shifts every column after it; `*`/`_`
 * silently turn a product name like `*special*` into italics and eat the
 * asterisks. CommonMark unescapes any backslashed ASCII punctuation, so remark
 * hands the original characters back.
 */
const CELL_ESCAPE_RE = /[\\`*_[\]<>~|]/g

/**
 * Escape a value for safe interpolation into a GFM **table cell**. Directive
 * tokens are skipped — they are base64 and must arrive byte-identical.
 */
export function escapeCellText(text: string): string {
  const escape = (chunk: string): string =>
    chunk.replace(CELL_ESCAPE_RE, (c) => `\\${c}`).replace(/\r?\n/g, '<br>')

  if (!hasDirectives(text)) return escape(text)

  let out = ''
  let index = 0
  TOKEN_RE.lastIndex = 0
  for (let m = TOKEN_RE.exec(text); m; m = TOKEN_RE.exec(text)) {
    out += escape(text.slice(index, m.index)) + m[0]
    index = m.index + m[0].length
  }
  return out + escape(text.slice(index))
}
