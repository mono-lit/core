import { getFieldValue } from './field-path.js'

/**
 * Compile a devextreme filter expression (the array form `monoFilterBuilder`
 * emits via `changed({ type: 'array' })`) into a client-side row predicate, so a
 * built filter can narrow an array-backed grid the same way a remote store would
 * narrow from a `$filter`. Remote devextreme stores read the array directly; this
 * is the client-side mirror for sources that only accept a `(row) => boolean`.
 *
 * The grammar handled is exactly the subset `treeToArray` produces: `[field, op,
 * value]` triples, `'and'` / `'or'` joined groups, `['!', expr]` negation, with
 * `between` / `in` / blank checks already expanded to those primitives.
 */
export function compileFilterPredicate(
  expr: unknown,
): ((row: any) => boolean) | null {
  if (!Array.isArray(expr) || expr.length === 0) return null
  const fn = build(expr)
  return (row: any) => !!fn(row)
}

/** AND-combine two optional devextreme filter expressions (either may be null). */
export function andFilters(a: unknown, b: unknown): unknown {
  if (a == null && b == null) return null
  if (a == null) return b
  if (b == null) return a
  return [a, 'and', b]
}

/** A client-side row filter, as `monoArraySource.filter()` stores it. */
export type RowPredicate = (row: any, index: number) => boolean

/**
 * AND-combine optional row predicates — the array-source twin of `andFilters`.
 *
 * Returns the lone member UNWRAPPED when only one is present, so a caller that
 * compares the result by reference (the grid's compose memo) sees the same
 * function back and does not treat "nothing changed" as a change.
 */
export function andPredicates(...fns: Array<RowPredicate | null | undefined>): RowPredicate | null {
  const kept = fns.filter((f): f is RowPredicate => typeof f === 'function')
  if (!kept.length) return null
  if (kept.length === 1) return kept[0]
  return (row, index) => kept.every((f) => f(row, index))
}

/**
 * Join expressions with `and` / `or`, dropping nulls and returning a lone member
 * unwrapped — devextreme's filter arrays interleave the join token between
 * members (`[a, 'or', b, 'or', c]`) rather than nesting pairs.
 */
export function joinFilters(parts: unknown[], join: 'and' | 'or'): unknown {
  const kept = parts.filter((p) => p != null)
  if (!kept.length) return null
  if (kept.length === 1) return kept[0]
  const out: unknown[] = []
  kept.forEach((p, i) => {
    if (i) out.push(join)
    out.push(p)
  })
  return out
}

// The symbol tokens `treeToArray` emits, PLUS the OData keywords. A `searchExpr`
// `custom` builder writes its clause for an OData endpoint, so `[field,'eq',0]` is
// the natural thing to return — and without the keywords here `isTriple` would
// reject it, `build()` would treat the triple as a group and the predicate would
// match EVERY row on an array source instead of filtering.
const CMP = new Set([
  '=',
  '<>',
  '>',
  '>=',
  '<',
  '<=',
  '==',
  '!=',
  'eq',
  'ne',
  'gt',
  'ge',
  'lt',
  'le',
])
const STR = new Set(['contains', 'notcontains', 'startswith', 'endswith'])

/** A triple is `[field, op, value]`; a group starts with an array member. */
function isTriple(node: unknown): node is [string, string, unknown] {
  return (
    Array.isArray(node) &&
    node.length === 3 &&
    typeof node[0] === 'string' &&
    typeof node[1] === 'string' &&
    (CMP.has(node[1]) || STR.has(String(node[1]).toLowerCase()))
  )
}

function build(expr: unknown): (row: any) => boolean {
  if (!Array.isArray(expr) || expr.length === 0) return () => true

  // `['!', inner]` — negation.
  if (expr.length === 2 && (expr[0] === '!' || expr[0] === 'not')) {
    const inner = build(expr[1])
    return (row) => !inner(row)
  }

  if (isTriple(expr)) {
    const [field, op, value] = expr
    return (row) => match(getFieldValue(row, field), op, value)
  }

  // Group: members separated by 'and' / 'or' tokens. Split into segments so the
  // joiner between each pair is known.
  const members: unknown[] = []
  const joins: ('and' | 'or')[] = []
  for (const part of expr) {
    const t = typeof part === 'string' ? part.toLowerCase() : ''
    if (t === 'and' || t === '&' || t === 'or' || t === '|') {
      joins.push(t === 'or' || t === '|' ? 'or' : 'and')
      continue
    }
    members.push(part)
  }
  const fns = members.map((m) => build(m))
  if (!fns.length) return () => true
  return (row) => {
    let acc = fns[0](row)
    for (let i = 0; i < joins.length; i += 1) {
      const next = fns[i + 1](row)
      acc = joins[i] === 'or' ? acc || next : acc && next
    }
    return acc
  }
}

/** Coerce two values for ordered comparison: numbers when both parse, else strings. */
function pair(a: unknown, b: unknown): [number, number] | [string, string] {
  const na = Number(a)
  const nb = Number(b)
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return [na, nb]
  return [String(a ?? ''), String(b ?? '')]
}

/** OData keyword → the symbol token the switch below is written against. */
const OP_ALIAS: Record<string, string> = {
  eq: '=',
  ne: '<>',
  gt: '>',
  ge: '>=',
  lt: '<',
  le: '<=',
}

function match(raw: unknown, op: string, value: unknown): boolean {
  const lower = op.toLowerCase()
  const token = OP_ALIAS[lower] ?? lower
  // Blank checks — `[field, '=', null]` / `[field, '<>', null]`.
  if (value === null || value === undefined) {
    const blank = raw === null || raw === undefined || raw === ''
    return token === '=' || token === '==' ? blank : !blank
  }
  const raws = String(raw ?? '')
  const vals = String(value ?? '')
  switch (token) {
    case '=':
    case '==': {
      const [a, b] = pair(raw, value)
      return a === b
    }
    case '<>':
    case '!=': {
      const [a, b] = pair(raw, value)
      return a !== b
    }
    case '>':
    case '>=':
    case '<':
    case '<=': {
      const [a, b] = pair(raw, value)
      // Mixed types only compare as strings sensibly when both are non-numeric.
      if (typeof a === 'string' && typeof b === 'string') {
        // fall back to string comparison
      }
      switch (token) {
        case '>':
          return a > b
        case '>=':
          return a >= b
        case '<':
          return a < b
        default:
          return a <= b
      }
    }
    case 'contains':
      return raws.toLowerCase().includes(vals.toLowerCase())
    case 'notcontains':
      return !raws.toLowerCase().includes(vals.toLowerCase())
    case 'startswith':
      return raws.toLowerCase().startsWith(vals.toLowerCase())
    case 'endswith':
      return raws.toLowerCase().endsWith(vals.toLowerCase())
    default:
      return false
  }
}
