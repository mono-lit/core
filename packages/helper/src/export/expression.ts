/**
 * Template source preprocessing — everything that must happen *before*
 * Handlebars sees the template.
 *
 * Two rewrites live here, both driven by the same single-pass scanner so that
 * fenced code blocks and inline code spans are never touched (a template that
 * *documents* `{{= … }}` in a code block must keep it verbatim):
 *
 * 1. `{{= expr }}` → `{{__jexl "expr"}}` — Handlebars has no `{{=` syntax at
 *    all (it's a parse error), so inline expressions are rewritten into a call
 *    to the Jexl helper.
 * 2. Mustaches on a GFM **table row** are wrapped in `{{esc …}}`, so a value
 *    containing a `|` can't split the cell and shift every column after it.
 *    `{{{triple}}}` opts out.
 */

import jexlModule from 'jexl'
import { escapeCellText } from './sentinel'

/** jexl ships a UMD bundle whose `module.exports` is the ready-made instance. */
const jexl: {
  evalSync(expression: string, context?: unknown): unknown
  addTransform(name: string, fn: (...args: any[]) => unknown): void
} = (jexlModule as any)?.default ?? (jexlModule as any)

/** Handlebars sub-expressions/blocks — never wrap these in `{{esc}}`. */
const NON_VALUE_MUSTACHE = /^[#/!>^&]|^\s*else\b/

/**
 * Evaluate one Jexl expression.
 *
 * Jexl is used instead of `eval()` so a template can never reach globals, the
 * DOM, or `fetch` — the worst a malicious template can do is compute a wrong
 * number.
 */
export function evaluateExpression(expression: string, context: unknown): unknown {
  try {
    return jexl.evalSync(expression, context as Record<string, unknown>)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`[mono-export] cannot evaluate {{= ${expression} }} — ${reason}`)
  }
}

/**
 * Normalise JS habits that Jexl's grammar doesn't share. Everyone types `===`;
 * Jexl only knows `==`, and would otherwise throw a bare "Token = unexpected".
 */
function normalizeExpression(expression: string): string {
  return expression.replace(/===/g, '==').replace(/!==/g, '!=')
}

/** Escape a string for embedding in a Handlebars double-quoted literal. */
function toHandlebarsLiteral(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * Find the `}}` that closes a mustache opened at `start`, ignoring any that
 * appear inside a quoted string (`{{= name == "a}}b" }}` is one expression).
 * Returns the index of the `}}`, or `-1` when unterminated.
 */
function findMustacheEnd(src: string, start: number): number {
  let quote: string | null = null
  for (let i = start; i < src.length - 1; i += 1) {
    const ch = src[i]
    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '}' && src[i + 1] === '}') return i
  }
  return -1
}

/** Whether `line` is a GFM table row (`| a | b |`), ignoring indentation. */
function isTableRow(line: string): boolean {
  return /^\s{0,3}\|/.test(line)
}

interface ScanState {
  /** Fence marker currently open (``` or ~~~), else null. */
  fence: string | null
  /** Whether the scanner is inside an inline `code span`. */
  inCode: boolean
}

/**
 * Rewrite a template's mustaches. Single pass, line-aware (for table rows) and
 * code-aware (fenced blocks + inline spans are copied verbatim).
 */
export function preprocessTemplate(src: string, opts: { escapeTableCells?: boolean } = {}): string {
  const escapeCells = opts.escapeTableCells !== false
  const lines = src.split('\n')
  const state: ScanState = { fence: null, inCode: false }
  const out: string[] = []

  for (const line of lines) {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line)
    if (fenceMatch) {
      const marker = fenceMatch[1][0].repeat(3)
      if (state.fence === null) state.fence = marker
      else if (state.fence === marker) state.fence = null
      out.push(line)
      continue
    }
    if (state.fence) {
      out.push(line)
      continue
    }
    out.push(rewriteLine(line, escapeCells && isTableRow(line), state))
  }

  return out.join('\n')
}

/** Rewrite the mustaches on one non-fenced line. */
function rewriteLine(line: string, wrapCells: boolean, state: ScanState): string {
  let out = ''
  let i = 0

  while (i < line.length) {
    const ch = line[i]

    // Inline code span — copy through untouched.
    if (ch === '`') {
      state.inCode = !state.inCode
      out += ch
      i += 1
      continue
    }
    if (state.inCode || ch !== '{' || line[i + 1] !== '{') {
      out += ch
      i += 1
      continue
    }

    // `{{{raw}}}` — the documented opt-out from cell escaping.
    const isTriple = line[i + 2] === '{'
    const open = isTriple ? i + 3 : i + 2
    const end = findMustacheEnd(line, open)
    if (end === -1) {
      out += line.slice(i)
      break
    }
    const closeLength = isTriple && line[end + 2] === '}' ? 3 : 2
    const inner = line.slice(open, end)
    out += renderMustache(inner, { isTriple, wrapCells })
    i = end + closeLength
  }

  return out
}

/**
 * Split a mustache body into its Handlebars whitespace-control markers and the
 * expression between them, so `{{~ foo ~}}` keeps its `~`s after rewriting.
 */
function splitWhitespaceControl(inner: string): { open: string; body: string; close: string } {
  let body = inner
  let open = ''
  let close = ''
  if (body.startsWith('~')) {
    open = '~'
    body = body.slice(1)
  }
  if (body.endsWith('~')) {
    close = '~'
    body = body.slice(0, -1)
  }
  return { open, body: body.trim(), close }
}

/**
 * Whether `body` is a bare path (`Name.Full`, `[my field]`, `@index`) rather
 * than a helper call (`currency salary`).
 *
 * This distinction decides how the value is handed to `esc`: a path is passed
 * as an **argument** (`{{esc Name.Full}}`), while a helper call must become a
 * **sub-expression** (`{{esc (currency salary)}}`). Getting it backwards breaks
 * at runtime — `(Name.Full)` compiles to a helper invocation, and Handlebars
 * then tries to *call* the string it resolved.
 */
function isBarePath(body: string): boolean {
  // A `[segment with spaces]` literal counts as one token.
  const rest = body.startsWith('[')
    ? body.slice(body.indexOf(']') + 1)
    : body.replace(/^\S+/, '')
  return rest.trim() === ''
}

/** Turn one mustache body into its rewritten `{{…}}` form. */
function renderMustache(
  inner: string,
  { isTriple, wrapCells }: { isTriple: boolean; wrapCells: boolean },
): string {
  const { open, body, close } = splitWhitespaceControl(inner)
  const wrap = (expr: string): string => `{{${open}${expr}${close}}}`

  // 1. Jexl inline expression: `{{= salary + bonus }}`.
  if (body.startsWith('=')) {
    const expression = normalizeExpression(body.slice(1).trim())
    const call = `__jexl ${toHandlebarsLiteral(expression)}`
    return wrap(wrapCells ? `esc (${call})` : call)
  }

  // 2. Raw triple-stache — verbatim, never escaped (the opt-out).
  if (isTriple) return `{{{${inner}}}}`

  // 3. Block helpers, partials, comments, `else` — structure, not a value.
  if (NON_VALUE_MUSTACHE.test(body)) return wrap(body)

  // 4. A plain value on a table row — guard the cell against stray pipes.
  if (wrapCells) return wrap(isBarePath(body) ? `esc ${body}` : `esc (${body})`)

  return wrap(body)
}

/**
 * Escape an interpolated value for a GFM table cell. Registered as the `esc`
 * helper and applied automatically to table-row mustaches by
 * {@link preprocessTemplate}; also callable by hand.
 */
export function escapeForCell(value: unknown): string {
  if (value == null) return ''
  return escapeCellText(String(value))
}
