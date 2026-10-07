/**
 * Path field expressions.
 *
 * Any field a component addresses — a `mono-table-th` `field`, a `searchExpr` /
 * `search-value` entry on the grid, select, tag-input or dropdown-table — may be
 * a **path** into nested / collection data instead of a flat top-level key:
 *
 * - `"Job.Name"`       — nested property (dot path)
 * - `"User.[1].Id"`    — array index
 * - `"User.[*].Name"`  — wildcard (all elements of a collection)
 *
 * Client (array) sources resolve these against plain JS objects; remote OData
 * sources translate them to navigation (`Job.Name` → `Job/Name`) and, for a
 * wildcard search/filter, a lambda (`User.[*].Name` + `'x'` + `contains` →
 * `User/any(d: contains(d/Name,'x'))`).
 *
 * `.` and `[` are RESERVED — a literal top-level key containing them is not
 * addressable here. Brackets must be their own dot-segment (`User.[1].Id`, not
 * `User[1].Id`). Every consumer gates on {@link isPath} first and falls through
 * to plain `row[field]` when it returns false, so plain fields are unchanged.
 */

export type FieldSegment =
  | { kind: 'key'; name: string }
  | { kind: 'index'; index: number }
  | { kind: 'wildcard' }

export interface ParsedFieldPath {
  segments: FieldSegment[]
  hasWildcard: boolean
  raw: string
}

/** Whether `field` is a path expression (contains `.` or `[`) vs a plain key. */
export function isPath(field: string): boolean {
  return typeof field === 'string' && /[.[]/.test(field)
}

const parseCache = new Map<string, ParsedFieldPath>()

/** Parse a path field into ordered segments (cached). Plain keys → one `key` segment. */
export function parseFieldPath(field: string): ParsedFieldPath {
  const cached = parseCache.get(field)
  if (cached) return cached
  const segments: FieldSegment[] = []
  let hasWildcard = false
  for (const token of field.split('.')) {
    if (token === '') continue // tolerate stray/double dots
    if (token === '[*]') {
      segments.push({ kind: 'wildcard' })
      hasWildcard = true
    } else {
      const m = /^\[(\d+)\]$/.exec(token)
      if (m) segments.push({ kind: 'index', index: Number(m[1]) })
      else segments.push({ kind: 'key', name: token })
    }
  }
  const parsed: ParsedFieldPath = { segments, hasWildcard, raw: field }
  parseCache.set(field, parsed)
  return parsed
}

/**
 * Resolve a path field against a row. Returns a **scalar** when the path has no
 * wildcard, or a flattened **array** of matches when it does (`User.[*].Name` →
 * `string[]`). Missing links yield `undefined` (scalar) / are skipped (wildcard).
 */
export function getFieldValue(row: unknown, field: string): unknown {
  const { segments, hasWildcard } = parseFieldPath(field)
  let current: unknown[] = [row]
  for (const seg of segments) {
    const next: unknown[] = []
    for (const v of current) {
      if (v == null) continue
      if (seg.kind === 'key') {
        next.push((v as Record<string, unknown>)[seg.name])
      } else if (seg.kind === 'index') {
        if (Array.isArray(v)) next.push(v[seg.index])
      } else {
        // wildcard: fan out over array elements
        if (Array.isArray(v)) for (const el of v) next.push(el)
      }
    }
    current = next
  }
  if (hasWildcard) return current.filter((v) => v !== undefined)
  return current[0]
}

/**
 * Write `value` into `obj` at a dot/index path, creating intermediate `{}`/`[]`
 * as needed. Wildcard paths are ambiguous to write — a `console.warn` + no-op.
 */
export function setFieldValue(obj: Record<string, unknown>, field: string, value: unknown): void {
  const { segments, hasWildcard } = parseFieldPath(field)
  if (hasWildcard) {
    console.warn(`[@mono-lit/helper] setFieldValue: cannot write a wildcard path "${field}" — skipped.`)
    return
  }
  if (!segments.length) return
  let cursor: Record<string, unknown> | unknown[] = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    const nextSeg = segments[i + 1]
    const wantArray = nextSeg.kind === 'index'
    const at = seg.kind === 'index' ? seg.index : (seg as { name: string }).name
    let child = (cursor as Record<string | number, unknown>)[at as never]
    if (child == null || typeof child !== 'object') {
      child = wantArray ? [] : {}
      ;(cursor as Record<string | number, unknown>)[at as never] = child
    }
    cursor = child as Record<string, unknown> | unknown[]
  }
  const last = segments[segments.length - 1]
  const at = last.kind === 'index' ? last.index : (last as { name: string }).name
  ;(cursor as Record<string | number, unknown>)[at as never] = value
}

/**
 * Project a row down to the given key paths, **rebuilding the nested shape**.
 *
 * This is what `<mono-table-checkbox>`'s `key-value` produces, so a selection can
 * be handed to an API in the shape the API expects rather than as flat values:
 *
 * ```ts
 * projectFields(row, ['Id'])                            // { Id: 8 }
 * projectFields(row, ['Company.Name'])                  // { Company: { Name: 'Hey' } }
 * projectFields(row, ['Transaction.[*].Id'])            // { Transaction: [{ Id: 4 }] }
 * projectFields(row, ['Company.Name', 'Transaction.[*].Id'])
 * //                → { Company: { Name: 'Hey' }, Transaction: [{ Id: 4 }] }
 * ```
 *
 * Separate from {@link setFieldValue}, which deliberately refuses wildcard paths
 * (there is no single place to write to). Here a wildcard is not ambiguous at all:
 * it MAPS over the source array, emitting one projected element per entry — so the
 * result mirrors the source's own cardinality. Several paths merge into one object,
 * and an empty key list means "the row itself".
 */
export function projectFields(row: unknown, keys: string[]): unknown {
  if (!keys.length) return row

  const out: Record<string, unknown> = {}
  for (const key of keys) {
    const { segments } = parseFieldPath(key)
    if (segments.length) assign(out, row, segments)
  }
  return out
}

/**
 * Copy the value `source` holds at `segments` into `target`, creating only the
 * containers the path needs. Recursive rather than iterative because a wildcard
 * forks into N independent sub-writes.
 */
function assign(target: Record<string, unknown>, source: unknown, segments: FieldSegment[]): void {
  const [seg, ...rest] = segments
  // Only a KEY can start a projection — a leading `[*]`/`[0]` would mean the row
  // itself is a collection, which `projectFields` has no shape to write into.
  if (source == null || seg.kind !== 'key') return

  const name = seg.name
  const value = (source as Record<string, unknown>)[name]

  if (!rest.length) {
    target[name] = value
    return
  }

  // A collection segment NEXT means this key holds an array: keep the source's
  // cardinality and project the remaining segments into one object per element.
  // Reuses the array a previous key path already started, so
  // `['Items.[*].Id', 'Items.[*].Qty']` merges into ONE list of `{ Id, Qty }`.
  if (rest[0].kind === 'wildcard' || rest[0].kind === 'index') {
    if (!Array.isArray(value)) return
    const tail = rest.slice(1)
    const list = Array.isArray(target[name])
      ? (target[name] as Record<string, unknown>[])
      : ([] as Record<string, unknown>[])
    target[name] = list

    const indices =
      rest[0].kind === 'index' ? [rest[0].index] : value.map((_, i) => i)
    for (const i of indices) {
      if (i < 0 || i >= value.length) continue
      list[i] ??= {}
      if (tail.length) assign(list[i], value[i], tail)
    }
    return
  }

  // Plain nesting — merge into whatever this key already projected.
  const child = (target[name] as Record<string, unknown>) ?? {}
  target[name] = child
  assign(child, value, rest)
}

/**
 * Merge a staged `patch` (keys may be path fields) into a **clone** of `row`.
 * Path keys nest via {@link setFieldValue}; plain keys are set directly. The
 * original row is never mutated. Used by the client (array/optimistic) save path.
 */
export function mergePatch<T>(row: T, patch: Record<string, unknown>): T {
  const clone =
    typeof structuredClone === 'function'
      ? structuredClone(row)
      : (JSON.parse(JSON.stringify(row)) as T)
  for (const [field, value] of Object.entries(patch)) {
    if (isPath(field)) setFieldValue(clone as Record<string, unknown>, field, value)
    else (clone as Record<string, unknown>)[field] = value
  }
  return clone
}

/**
 * OData selector for `$orderby` / `$select` / nav column filters — dotted path
 * with `.` → `/` (`Job.Name` → `Job/Name`). Returns `null` when the path has any
 * index/wildcard segment (not expressible as a plain selector); the caller warns
 * and skips.
 */
export function toODataSelector(field: string): string | null {
  const { segments } = parseFieldPath(field)
  const parts: string[] = []
  for (const seg of segments) {
    if (seg.kind !== 'key') return null
    parts.push(seg.name)
  }
  return parts.join('/')
}

/** A devextreme filter clause: a `[selector, op, value]` triple or a wrapped raw lambda `[string]`. */
export type ODataClause = [selector: string, op: string, value: unknown] | [raw: string]

/**
 * Quote/serialize a value as an OData literal (numbers/bools bare, strings quoted
 * with `''` escaping). Exported so `mono-filter-builder` shares one set of quoting
 * rules instead of restating them.
 */
export function odataLiteral(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return `'${String(value ?? '').replace(/'/g, "''")}'`
}

/** Map a devextreme operator token to its OData comparison keyword. */
export function odataComparison(op: string): string | null {
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

/**
 * Build a devextreme filter clause for a (possibly path) field.
 *
 * - plain / dotted-nav → a `[selector, op, value]` triple (`['Job/Name','contains','x']`),
 *   which devextreme serializes to a nav filter.
 * - wildcard → a single wrapped raw lambda clause
 *   (`["User/any(d: contains(d/Name,'x'))"]`) — the raw-string passthrough devextreme
 *   filter arrays honor. Slots into OR/AND groups as one group member.
 *
 * Returns `null` when the field can't be expressed (a second wildcard, or an
 * index segment mixed into a remote path); the caller warns + skips.
 */
export function toODataClause(field: string, op: string, value: unknown): ODataClause | null {
  if (!isPath(field)) return [field, op, value]
  const { segments, hasWildcard } = parseFieldPath(field)
  if (!hasWildcard) {
    const selector = toODataSelector(field)
    return selector ? [selector, op, value] : null
  }

  // Split at the FIRST wildcard: collection nav (before) + inner property (key segs after).
  const wildAt = segments.findIndex((s) => s.kind === 'wildcard')
  const before = segments.slice(0, wildAt)
  const after = segments.slice(wildAt + 1)
  if (before.some((s) => s.kind !== 'key') || after.some((s) => s.kind !== 'key')) {
    console.warn(`[@mono-lit/helper] toODataClause: unsupported path "${field}" (index or 2nd wildcard).`)
    return null
  }
  const coll = (before as { name: string }[]).map((s) => s.name).join('/')
  const inner = 'd/' + (after as { name: string }[]).map((s) => s.name).join('/')
  const lit = odataLiteral(value)
  let body: string
  if (op === 'contains' || op === 'startswith' || op === 'endswith') {
    body = `${op}(${inner},${lit})`
  } else {
    const cmp = odataComparison(op)
    if (!cmp) {
      console.warn(`[@mono-lit/helper] toODataClause: unsupported operator "${op}" for wildcard "${field}".`)
      return null
    }
    body = `${inner} ${cmp} ${lit}`
  }
  return [`${coll}/any(d: ${body})`]
}
