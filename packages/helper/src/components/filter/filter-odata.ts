import { odataLiteral, toODataSelector, isPath } from '../../search/field-path.js'
import { OPERATOR_ARITY } from './filter-operators.js'
import type {
  MonoFilterExpression,
  MonoFilterGroup,
  MonoFilterGroupOperator,
  MonoFilterNode,
  MonoFilterOperator,
  MonoFilterRule,
} from './filter-types.js'

// ─────────────────────────────────────────────────────────────────────────────
// Conversions between the editable node tree and the two wire representations:
// a devextreme filter expression (array) and an OData `$filter` string.
//
// The array form is canonical — the string serializer and parser both go through
// it, so there is exactly one place that decides operator/precedence semantics.
// ─────────────────────────────────────────────────────────────────────────────

let _id = 0
export function nextId(prefix = 'n'): string {
  _id += 1
  return `${prefix}${_id}`
}

export function emptyGroup(operator: MonoFilterGroupOperator = 'and'): MonoFilterGroup {
  return { kind: 'group', id: nextId('g'), operator, children: [] }
}

/** devextreme's operator token for a builder operator (used in the array form). */
function dxOperator(op: MonoFilterOperator): string {
  switch (op) {
    case 'eq':
      return '='
    case 'ne':
      return '<>'
    case 'gt':
      return '>'
    case 'ge':
      return '>='
    case 'lt':
      return '<'
    case 'le':
      return '<='
    case 'notcontains':
      return 'notcontains'
    default:
      return op
  }
}

/** Inverse of {@link dxOperator}, tolerating both spellings of each token. */
function fromDxOperator(op: string): MonoFilterOperator | null {
  switch (String(op).toLowerCase()) {
    case '=':
    case '==':
    case 'eq':
      return 'eq'
    case '<>':
    case '!=':
    case 'ne':
      return 'ne'
    case '>':
    case 'gt':
      return 'gt'
    case '>=':
    case 'ge':
      return 'ge'
    case '<':
    case 'lt':
      return 'lt'
    case '<=':
    case 'le':
      return 'le'
    case 'contains':
      return 'contains'
    case 'notcontains':
      return 'notcontains'
    case 'startswith':
      return 'startswith'
    case 'endswith':
      return 'endswith'
    case 'between':
      return 'between'
    case 'in':
      return 'in'
    default:
      return null
  }
}

/** Is this array a `[field, op, value]` triple rather than a nested group? */
function isTriple(node: unknown): node is [string, string, unknown] {
  return (
    Array.isArray(node) &&
    node.length === 3 &&
    typeof node[0] === 'string' &&
    typeof node[1] === 'string' &&
    fromDxOperator(node[1]) !== null
  )
}

// ── tree → array ────────────────────────────────────────────────────────────

/** One rule as a devextreme expression; `null` when it can't be expressed yet. */
function ruleToArray(rule: MonoFilterRule): unknown[] | null {
  if (!rule.field) return null
  const arity = OPERATOR_ARITY[rule.operator]

  if (rule.operator === 'isblank') return [rule.field, '=', null]
  if (rule.operator === 'isnotblank') return [rule.field, '<>', null]

  if (arity === 'many') {
    const values = Array.isArray(rule.value) ? rule.value : splitMulti(rule.value)
    if (!values.length) return null
    // `in` has no devextreme token — expand to an OR of equalities, which is what
    // the array form can express and what a store will serialise correctly.
    const parts: unknown[] = []
    values.forEach((v, i) => {
      if (i) parts.push('or')
      parts.push([rule.field, '=', v])
    })
    return values.length === 1 ? (parts[0] as unknown[]) : parts
  }

  if (arity === 2) {
    const [a, b] = Array.isArray(rule.value) ? rule.value : [undefined, undefined]
    if (a === undefined || a === '' || b === undefined || b === '') return null
    return [[rule.field, '>=', a], 'and', [rule.field, '<=', b]]
  }

  if (rule.value === undefined || rule.value === '') return null
  return [rule.field, dxOperator(rule.operator), rule.value]
}

/** Split a comma-separated multi-value entry, trimming and dropping blanks. */
export function splitMulti(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.filter((v) => v !== '' && v !== null && v !== undefined)
  if (value === null || value === undefined || value === '') return []
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** The node tree as a devextreme filter expression, or `null` when empty. */
export function treeToArray(node: MonoFilterNode): MonoFilterExpression {
  if (node.kind === 'rule') return ruleToArray(node)

  const parts = node.children
    .map((c) => treeToArray(c))
    .filter((p): p is unknown[] => Array.isArray(p) && p.length > 0)
  if (!parts.length) return null

  const join = node.operator === 'or' || node.operator === 'notOr' ? 'or' : 'and'
  let out: unknown[]
  if (parts.length === 1) {
    out = parts[0]
  } else {
    out = []
    parts.forEach((p, i) => {
      if (i) out.push(join)
      out.push(p)
    })
  }
  const negated = node.operator === 'notAnd' || node.operator === 'notOr'
  return negated ? ['!', out] : out
}

// ── array → tree ────────────────────────────────────────────────────────────

/** Wrap a parsed node so the root is always a group the UI can add rules to. */
export function asRootGroup(node: MonoFilterNode | null): MonoFilterGroup {
  if (!node) return emptyGroup()
  if (node.kind === 'group') return node
  const g = emptyGroup()
  g.children.push(node)
  return g
}

/** devextreme expression → node tree. Returns `null` for an empty/unusable input. */
export function arrayToTree(filter: unknown): MonoFilterNode | null {
  if (!Array.isArray(filter) || filter.length === 0) return null

  // ['!', expr] — negation wraps a group.
  if (filter.length === 2 && (filter[0] === '!' || filter[0] === 'not')) {
    const inner = arrayToTree(filter[1])
    if (!inner) return null
    const g = inner.kind === 'group' ? inner : asRootGroup(inner)
    g.operator = g.operator === 'or' ? 'notOr' : 'notAnd'
    return g
  }

  if (isTriple(filter)) {
    const [field, rawOp, value] = filter
    const op = fromDxOperator(rawOp) as MonoFilterOperator
    // `= null` / `<> null` round-trip back to the blank checks.
    if (value === null) {
      return { kind: 'rule', id: nextId('r'), field, operator: op === 'ne' ? 'isnotblank' : 'isblank', value: null }
    }
    return { kind: 'rule', id: nextId('r'), field, operator: op, value }
  }

  // A group: members separated by 'and' / 'or' string tokens.
  const members: unknown[] = []
  let join: 'and' | 'or' = 'and'
  for (const part of filter) {
    if (typeof part === 'string' && (part === 'and' || part === 'or' || part === '&' || part === '|')) {
      join = part === 'or' || part === '|' ? 'or' : 'and'
      continue
    }
    members.push(part)
  }
  const children = members
    .map((m) => arrayToTree(m))
    .filter((n): n is MonoFilterNode => n !== null)
  if (!children.length) return null
  if (children.length === 1) return children[0]

  const g = emptyGroup(join)
  g.children = children
  return g
}

// ── tree/array → OData string ───────────────────────────────────────────────

/** OData keyword for a comparison token. */
function odataKeyword(op: string): string | null {
  switch (op) {
    case '=':
    case 'eq':
      return 'eq'
    case '<>':
    case '!=':
    case 'ne':
      return 'ne'
    case '>':
    case 'gt':
      return 'gt'
    case '>=':
    case 'ge':
      return 'ge'
    case '<':
    case 'lt':
      return 'lt'
    case '<=':
    case 'le':
      return 'le'
    default:
      return null
  }
}

/** `Job.Name` → `Job/Name`; a plain field passes through. */
function selector(field: string): string {
  if (!isPath(field)) return field
  return toODataSelector(field) ?? field
}

/** Serialize a value, treating an explicit `null` as the OData `null` keyword. */
function literal(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (value instanceof Date) return value.toISOString()
  return odataLiteral(value)
}

/**
 * A devextreme filter expression → an OData `$filter` string. Nested groups get
 * parentheses; `contains`/`startswith`/`endswith` become function calls.
 */
export function arrayToODataString(filter: unknown): string {
  if (!Array.isArray(filter) || filter.length === 0) return ''

  // A raw clause: devextreme accepts a one-element array holding an OData
  // string (it compiles it as `<raw> eq true`), and consumers scope sources with
  // exactly that (`filter: [dxFilterToString(...)]`). As a group it would read
  // as a joiner that is neither `and` nor `or` and be DROPPED — the scope would
  // vanish from every `$apply` built from this string. Parenthesised so its own
  // precedence holds inside a larger expression.
  if (filter.length === 1 && typeof filter[0] === 'string') {
    const raw = filter[0].trim()
    return raw ? `(${raw})` : ''
  }

  if (filter.length === 2 && (filter[0] === '!' || filter[0] === 'not')) {
    const inner = arrayToODataString(filter[1])
    return inner ? `not (${inner})` : ''
  }

  if (isTriple(filter)) {
    const [field, rawOp, value] = filter
    const sel = selector(field)
    const kw = odataKeyword(rawOp)
    if (kw) return `${sel} ${kw} ${literal(value)}`
    switch (String(rawOp).toLowerCase()) {
      case 'contains':
        return `contains(${sel},${literal(value)})`
      case 'notcontains':
        return `not contains(${sel},${literal(value)})`
      case 'startswith':
        return `startswith(${sel},${literal(value)})`
      case 'endswith':
        return `endswith(${sel},${literal(value)})`
      default:
        return ''
    }
  }

  // Group — join members, parenthesising any nested group so precedence holds.
  const out: string[] = []
  for (const part of filter) {
    if (typeof part === 'string') {
      const t = part.toLowerCase()
      if (t === 'and' || t === '&') out.push('and')
      else if (t === 'or' || t === '|') out.push('or')
      continue
    }
    const s = arrayToODataString(part)
    if (!s) continue
    // A raw clause comes back already parenthesised (see above); wrapping it
    // again is valid OData but reads as a mistake.
    const rawClause = Array.isArray(part) && part.length === 1 && typeof part[0] === 'string'
    const nested = Array.isArray(part) && !isTriple(part) && !rawClause
    out.push(nested && !/^not \(/.test(s) ? `(${s})` : s)
  }
  // Drop a dangling leading/trailing joiner left by a skipped member.
  while (out.length && (out[0] === 'and' || out[0] === 'or')) out.shift()
  while (out.length && (out[out.length - 1] === 'and' || out[out.length - 1] === 'or')) out.pop()
  return out.join(' ')
}

// ── OData string → array ────────────────────────────────────────────────────

/**
 * Parse the subset of OData `$filter` the builder itself emits: parentheses,
 * `and` / `or` / `not`, the six comparisons, `contains` / `startswith` /
 * `endswith`, `in (…)`, `null`, and quoted / numeric / boolean literals.
 *
 * Anything outside that subset throws, and the caller (`monoFilterBuilder`) warns
 * once and falls back to an empty tree — a wrong filter is worse than none.
 */
export function odataStringToArray(input: string): unknown[] | null {
  const src = String(input ?? '').trim()
  if (!src) return null

  let i = 0
  const ws = (): void => {
    while (i < src.length && /\s/.test(src[i])) i += 1
  }
  const eof = (): boolean => {
    ws()
    return i >= src.length
  }
  const peekWord = (): string => {
    ws()
    const m = /^[A-Za-z_][A-Za-z0-9_.\/]*/.exec(src.slice(i))
    return m ? m[0] : ''
  }
  const takeWord = (): string => {
    const w = peekWord()
    i += w.length
    return w
  }
  const expect = (ch: string): void => {
    ws()
    if (src[i] !== ch) throw new Error(`expected "${ch}" at ${i}`)
    i += 1
  }

  const parseLiteral = (): unknown => {
    ws()
    const ch = src[i]
    if (ch === "'") {
      i += 1
      let out = ''
      while (i < src.length) {
        if (src[i] === "'") {
          if (src[i + 1] === "'") {
            out += "'"
            i += 2
            continue
          }
          i += 1
          return out
        }
        out += src[i]
        i += 1
      }
      throw new Error('unterminated string')
    }
    const m = /^-?\d+(\.\d+)?/.exec(src.slice(i))
    if (m) {
      i += m[0].length
      return Number(m[0])
    }
    const w = takeWord()
    if (w === 'null') return null
    if (w === 'true') return true
    if (w === 'false') return false
    if (w) return w // a bare token (e.g. an unquoted date) — pass through
    throw new Error(`expected a literal at ${i}`)
  }

  const parseComparison = (): unknown[] => {
    ws()
    const w = peekWord().toLowerCase()

    // function form: contains(Field,'x')
    if (w === 'contains' || w === 'startswith' || w === 'endswith') {
      const fn = takeWord().toLowerCase()
      expect('(')
      const field = takeWord()
      expect(',')
      const value = parseLiteral()
      expect(')')
      return [field.replace(/\//g, '.'), fn, value]
    }

    // field <op> literal  |  field in ('a','b')
    const field = takeWord()
    if (!field) throw new Error(`expected a field at ${i}`)
    const op = takeWord().toLowerCase()
    if (op === 'in') {
      expect('(')
      const values: unknown[] = []
      for (;;) {
        values.push(parseLiteral())
        ws()
        if (src[i] === ',') {
          i += 1
          continue
        }
        break
      }
      expect(')')
      if (!values.length) throw new Error('empty in()')
      const parts: unknown[] = []
      values.forEach((v, n) => {
        if (n) parts.push('or')
        parts.push([field.replace(/\//g, '.'), '=', v])
      })
      return values.length === 1 ? (parts[0] as unknown[]) : parts
    }
    const kw = odataKeyword(op)
    if (!kw) throw new Error(`unsupported operator "${op}" at ${i}`)
    const value = parseLiteral()
    return [field.replace(/\//g, '.'), kw, value]
  }

  const parseOr = (): unknown[] => {
    let left = parseAnd()
    for (;;) {
      ws()
      if (peekWord().toLowerCase() !== 'or') break
      takeWord()
      const right = parseAnd()
      left = [left, 'or', right]
    }
    return left
  }

  const parseAnd = (): unknown[] => {
    let left = parseUnary()
    for (;;) {
      ws()
      if (peekWord().toLowerCase() !== 'and') break
      takeWord()
      const right = parseUnary()
      left = [left, 'and', right]
    }
    return left
  }

  const parseUnary = (): unknown[] => {
    ws()
    if (peekWord().toLowerCase() === 'not') {
      const save = i
      takeWord()
      ws()
      // `not contains(...)` is the negated-contains form, not a negated group.
      if (peekWord().toLowerCase() === 'contains') {
        const c = parseComparison()
        return [c[0], 'notcontains', c[2]]
      }
      if (src[i] === '(') {
        expect('(')
        const inner = parseOr()
        expect(')')
        return ['!', inner]
      }
      i = save // a field literally named "not…" — fall through
    }
    ws()
    if (src[i] === '(') {
      expect('(')
      const inner = parseOr()
      expect(')')
      return inner
    }
    return parseComparison()
  }

  const result = parseOr()
  if (!eof()) throw new Error(`unexpected input at ${i}: "${src.slice(i, i + 24)}"`)
  return result
}

/** Flatten same-operator nesting so `[[a,'and',b],'and',c]` reads as one group. */
export function flattenTree(node: MonoFilterNode): MonoFilterNode {
  if (node.kind === 'rule') return node
  const children: MonoFilterNode[] = []
  for (const raw of node.children) {
    const child = flattenTree(raw)
    if (child.kind === 'group' && child.operator === node.operator && child.children.length) {
      children.push(...child.children)
    } else {
      children.push(child)
    }
  }
  return { ...node, children }
}
