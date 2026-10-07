// date-filter-tree.ts
//
// The DATE FILTER's data model: a column's distinct timestamps (what
// `distinctValues()` hands back for any column — value + row count) folded into
// a year → month → day → hour → minute → second tree, and the tri-state
// tick logic over it.
//
// Pure — no DOM, no Lit — so the tree shape, the counts, the tick propagation
// and the range minimisation are asserted in vitest without a browser. The
// element (`mono-table-th-core`) only renders what this builds and hands the
// minimised ranges to `setColumnFilter`, where a `{ from, to }` range is just
// another column-filter value (see `isDateRange` in mono-data-grid).

import type { MonoColumnValue } from './mono-data-grid.js'

/** The levels of the tree, outermost first. */
export type MonoDateLevel = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
export const DATE_LEVELS: readonly MonoDateLevel[] = ['year', 'month', 'day', 'hour', 'minute', 'second']

/**
 * A half-open period, `from` inclusive, `to` exclusive — the value shape a date
 * filter stores on the column (`table.columnFilter(field)` returns these).
 */
export interface MonoDateRange {
  from: Date
  to: Date
}

/** A `{ from, to }` pair of Dates (or ISO strings, which `setColumnFilter` also accepts). */
export function isDateRange(v: unknown): v is MonoDateRange | { from: string; to: string } {
  if (!v || typeof v !== 'object') return false
  const o = v as { from?: unknown; to?: unknown }
  const ok = (x: unknown): boolean => x instanceof Date || typeof x === 'string'
  return ok(o.from) && ok(o.to)
}

export interface DateNode {
  /** Unique within the tree: the parts joined — `2026`, `2026-3`, `2026-3-5-13`… or `blank`. */
  key: string
  level: MonoDateLevel
  /** `[year, month(1-12), day, hour, minute, second]` down to this level. */
  parts: number[]
  label: string
  /** Rows inside this period (summed from the timestamps it contains). */
  count: number
  /** The period, `[from, to)`. `null` on the blanks node. */
  from: Date | null
  to: Date | null
  children: DateNode[]
}

export interface DateTreeOptions {
  /** Deepest level built. Default `'month'`. */
  depth?: MonoDateLevel
  /** Read the parts in UTC instead of local time. Default `false`. */
  utc?: boolean
  /** BCP-47 tag for the month / weekday names. Default: the browser's. */
  locale?: string
}

export const BLANK_KEY = 'blank'

/**
 * A column value as a Date, or `null` for a blank / unparsable one. Accepts a
 * `Date`, a number (epoch ms), an ISO string, and a bare `YYYY-MM-DD` — the
 * last is parsed as a LOCAL date on purpose (`new Date('2026-03-05')` would be
 * UTC midnight and shift a day west of Greenwich).
 */
export function parseDateValue(v: unknown): Date | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v !== 'string') return null
  const s = v.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** `[year, month(1-12), day, hour, minute, second]` of a Date, local or UTC. */
export function datePartsOf(d: Date, utc = false): number[] {
  return utc
    ? [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    : [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]
}

/** The Date at the START of the period the parts describe (missing parts = their minimum). */
function dateFromParts(parts: number[], utc: boolean): Date {
  const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = parts
  return utc ? new Date(Date.UTC(y, mo - 1, d, h, mi, s)) : new Date(y, mo - 1, d, h, mi, s)
}

/** The period `[from, to)` of a node at `level` with these parts. */
export function periodOf(parts: number[], level: MonoDateLevel, utc = false): MonoDateRange {
  const i = DATE_LEVELS.indexOf(level)
  const own = parts.slice(0, i + 1)
  const next = [...own]
  next[i] += 1 // the next period starts one unit later; Date normalises overflow (month 13 → next year)
  return { from: dateFromParts(own, utc), to: dateFromParts(next, utc) }
}

function labelFor(parts: number[], level: MonoDateLevel, utc: boolean, locale?: string): string {
  const d = dateFromParts(parts, utc)
  const tz = utc ? { timeZone: 'UTC' as const } : {}
  const two = (n: number): string => String(n).padStart(2, '0')
  switch (level) {
    case 'year':
      return String(parts[0])
    case 'month':
      return new Intl.DateTimeFormat(locale, { month: 'long', ...tz }).format(d)
    case 'day':
      return `${two(parts[2])} (${new Intl.DateTimeFormat(locale, { weekday: 'short', ...tz }).format(d)})`
    case 'hour':
      return `${two(parts[3])}:00`
    case 'minute':
      return `${two(parts[3])}:${two(parts[4])}`
    case 'second':
      return `${two(parts[3])}:${two(parts[4])}:${two(parts[5])}`
  }
}

/**
 * Fold distinct timestamps into the tree. Only periods that occur are built,
 * counts are summed up the branches, siblings are in chronological order, and
 * a blank value becomes one `(Blanks)` node at the top (never expandable).
 */
export function buildDateTree(values: readonly MonoColumnValue[], options: DateTreeOptions = {}): DateNode[] {
  const depth = DATE_LEVELS.indexOf(options.depth ?? 'month')
  const utc = options.utc ?? false
  const locale = options.locale

  const roots = new Map<number, DateNode>()
  let blanks = 0
  for (const v of values) {
    const d = parseDateValue(v.value)
    const count = Number(v.count) || 0
    if (!d) {
      blanks += count
      continue
    }
    const parts = datePartsOf(d, utc)
    let siblings = roots
    let node: DateNode | undefined
    for (let i = 0; i <= depth; i++) {
      const level = DATE_LEVELS[i]
      const own = parts.slice(0, i + 1)
      let n = siblings.get(parts[i])
      if (!n) {
        const { from, to } = periodOf(own, level, utc)
        n = { key: own.join('-'), level, parts: own, label: labelFor(own, level, utc, locale), count: 0, from, to, children: [] }
        siblings.set(parts[i], n)
      }
      n.count += count
      node = n
      // Children live in a Map while building, replaced by the sorted array below.
      siblings = childMap(n)
    }
    void node
  }

  const finish = (map: Map<number, DateNode>): DateNode[] =>
    [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, n]) => {
        n.children = finish(childMap(n))
        childMaps.delete(n)
        return n
      })
  const out = finish(roots)
  if (blanks > 0) {
    out.unshift({ key: BLANK_KEY, level: 'year', parts: [], label: '(Blanks)', count: blanks, from: null, to: null, children: [] })
  }
  return out
}

// The per-node child index used only while building (a Map keyed by the next part).
const childMaps = new WeakMap<DateNode, Map<number, DateNode>>()
function childMap(n: DateNode): Map<number, DateNode> {
  let m = childMaps.get(n)
  if (!m) {
    m = new Map()
    childMaps.set(n, m)
  }
  return m
}

/* ------------------------------ tri-state ------------------------------- */

export type CheckState = 'on' | 'off' | 'mixed'

/**
 * A node's tick state from the set of ticked keys. A key in the set means the
 * WHOLE node is ticked (so every descendant is on too); otherwise the children
 * decide — all on → on, none → off, some (or a partly-ticked child) → mixed.
 *
 * Pass `roots` to have a ticked ANCESTOR count (the node is then on) — the
 * renderer walks top-down and passes `inheritedOn` instead, which is the same
 * answer without a path lookup per row.
 */
export function checkState(
  node: DateNode,
  checked: ReadonlySet<string>,
  roots?: readonly DateNode[],
  inheritedOn = false,
): CheckState {
  if (inheritedOn || checked.has(node.key)) return 'on'
  if (roots && pathTo(node.key, roots).slice(0, -1).some((a) => checked.has(a.key))) return 'on'
  if (!node.children.length) return 'off'
  let on = 0
  let mixed = false
  for (const c of node.children) {
    const s = checkState(c, checked)
    if (s === 'on') on++
    else if (s === 'mixed') mixed = true
  }
  if (on === node.children.length) return 'on'
  return on > 0 || mixed ? 'mixed' : 'off'
}

/**
 * Tick or untick a node: the node's own key goes in (and every descendant key
 * comes out — the node covers them) or the node and every descendant come out.
 * Ticking a child of a fully-ticked parent first expands the parent's tick to its
 * siblings, so unticking one day of a ticked month leaves the other days ticked.
 */
export function setChecked(node: DateNode, on: boolean, checked: ReadonlySet<string>, roots: readonly DateNode[]): Set<string> {
  const next = new Set(checked)
  // Push a ticked ancestor down to its children so this node can be toggled alone.
  const path = pathTo(node.key, roots)
  for (let i = 0; i < path.length - 1; i++) {
    const anc = path[i]
    if (next.has(anc.key)) {
      next.delete(anc.key)
      for (const c of anc.children) next.add(c.key)
    }
  }
  const strip = (n: DateNode): void => {
    next.delete(n.key)
    n.children.forEach(strip)
  }
  strip(node)
  if (on) next.add(node.key)
  // Collapse: a parent whose children are now all ticked becomes ticked itself.
  for (let i = path.length - 2; i >= 0; i--) {
    const anc = path[i]
    if (anc.children.length && anc.children.every((c) => next.has(c.key))) {
      anc.children.forEach((c) => next.delete(c.key))
      next.add(anc.key)
    }
  }
  return next
}

function pathTo(key: string, roots: readonly DateNode[]): DateNode[] {
  const walk = (nodes: readonly DateNode[], trail: DateNode[]): DateNode[] | null => {
    for (const n of nodes) {
      if (n.key === key) return [...trail, n]
      const found = walk(n.children, [...trail, n])
      if (found) return found
    }
    return null
  }
  return walk(roots, []) ?? []
}

/** Tick everything (every root) or nothing. */
export function setAllChecked(roots: readonly DateNode[], on: boolean): Set<string> {
  return on ? new Set(roots.map((r) => r.key)) : new Set()
}

/**
 * The ticked periods as filter values — one `{ from, to }` per fully-ticked node,
 * walking down only where a node is partly ticked. `(Blanks)` ticked adds a
 * `null` value (the column filter's "is blank"), matching what the plain header
 * filter sends for a blank.
 */
export function minimize(roots: readonly DateNode[], checked: ReadonlySet<string>): Array<MonoDateRange | null> {
  const out: Array<MonoDateRange | null> = []
  const walk = (n: DateNode): void => {
    if (checked.has(n.key)) {
      out.push(n.from && n.to ? { from: n.from, to: n.to } : null)
      return
    }
    n.children.forEach(walk)
  }
  roots.forEach(walk)
  return out
}

/**
 * The tick set that reproduces an applied filter (`table.columnFilter(field)`):
 * a node is ticked when one of the ranges covers its whole period; a blank value
 * ticks `(Blanks)`. A range that only partly covers a node ticks the children it
 * covers instead.
 */
export function seedFromRanges(roots: readonly DateNode[], values: readonly unknown[]): Set<string> {
  const ranges: MonoDateRange[] = []
  let blank = false
  for (const v of values) {
    if (v == null || v === '') blank = true
    else if (isDateRange(v)) {
      const from = v.from instanceof Date ? v.from : new Date(v.from)
      const to = v.to instanceof Date ? v.to : new Date(v.to)
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) ranges.push({ from, to })
    }
  }
  const out = new Set<string>()
  const covers = (n: DateNode): boolean =>
    !!n.from && !!n.to && ranges.some((r) => r.from.getTime() <= n.from!.getTime() && r.to.getTime() >= n.to!.getTime())
  const walk = (n: DateNode): void => {
    if (n.key === BLANK_KEY) {
      if (blank) out.add(n.key)
      return
    }
    if (covers(n)) {
      out.add(n.key)
      return
    }
    n.children.forEach(walk)
  }
  roots.forEach(walk)
  return out
}

/** Whether a Date falls in `[from, to)`. */
export function inRange(d: Date, r: MonoDateRange): boolean {
  const t = d.getTime()
  return t >= r.from.getTime() && t < r.to.getTime()
}
