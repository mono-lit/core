/**
 * `grouped` — sticky group BANDS over a flat, ordered row list.
 *
 * Unlike `group` (a tree: `displayRows` with group headers, per-group pagers, no
 * virtual scroll) a band is a single header row placed in front of the first row
 * of each run of equal keys. The rows themselves stay a flat list, so every flat
 * feature keeps working — virtual / infinity scroll, paging, search, summaries.
 *
 * Pure and dependency-free: the controller (`mono-data-grid.ts`) owns the rows,
 * the injector (`table-bands.ts`) owns the DOM; this module only does the maths.
 *
 * Coordinates:
 * - **row** — an index into `visible` (the ordered rows minus those under a
 *   collapsed band). `band.at` is the row the band is drawn in front of.
 * - **slot** — one per drawn thing, band or row, in display order. A virtual
 *   scroller measures in slots (each one `rowHeight` tall).
 */

import { getFieldValue, isPath } from '../../search/field-path'

/** Band look — the same four variants as `mono-button`. */
export type MonoGroupedVariant = 'solid' | 'outline' | 'tonal' | 'text'

/** One band level. A bare string is `{ field }` with every default. */
export interface MonoGroupedFieldConfig<T = any> {
  /** The key: consecutive rows with an equal value at this field (and every outer one) form one band. Paths (`Brand/Name`) work. */
  field: string
  /** The band's label, from the band's FIRST row. Default: the field's value. */
  custom?: (row: T) => string
  /** Show the band's row count `(n)`. Default `true`. */
  count?: boolean
  /** `'solid' | 'outline' | 'tonal' | 'text'` — or per band, from its first row. Default `'tonal'`. */
  variant?: MonoGroupedVariant | ((row: T) => MonoGroupedVariant)
  /** A theme token (`primary`, `danger`, `success`, …) or any CSS colour — or per band. Default `'primary'`. */
  color?: string | ((row: T) => string)
  /** Nesting position, lower = outer. Unset → the field's position in `fields`. */
  order?: number
  /** Whether a click folds this level's bands. Default: the table-level `collapsible`. */
  collapsible?: boolean
  /** Whether this level's bands START open. Default: the table-level `open` (`true`). Ignored when not collapsible. */
  open?: boolean
  /** `false` = an accordion: opening one of this level's bands closes its open siblings (same parent). Default: the table-level `stayOpen` (`true`). */
  stayOpen?: boolean
}

export type MonoGroupedField<T = any> = string | MonoGroupedFieldConfig<T>

/** The `grouped` config — `<mono-table-th :grouped.prop>` / `monoDataGrid(data, { grouped })`. */
export interface MonoGrouped<T = any> {
  /** Band levels, outermost first (`['Brand', 'Code']`), or ordered by each entry's `order`. */
  fields: Array<MonoGroupedField<T>>
  /**
   * Rows per request while the grid reads EVERY matching row (bands need the whole
   * set to know their boundaries and counts). The first request also asks for the
   * total count, which says how many more chunks to fetch. Default `100`.
   */
  chunk?: number
  /** Whether bands fold on click. Default `true`; a field entry can override it. */
  collapsible?: boolean
  /** Whether every band STARTS open. Default `true`; a field entry can override it. */
  open?: boolean
  /** `false` = opening a band closes its open siblings (same level, same parent) — an accordion. Default `true`; a field entry can override it. */
  stayOpen?: boolean
}

/** A band level with every default resolved. */
export interface MonoGroupedLevel<T = any> {
  field: string
  level: number
  custom?: (row: T) => string
  count: boolean
  variant: MonoGroupedVariant | ((row: T) => MonoGroupedVariant)
  color: string | ((row: T) => string)
  collapsible: boolean
  /** The level's initial state — `false` = its bands start folded. */
  open: boolean
  /** `false` = opening a band closes its open siblings. */
  stayOpen: boolean
}

export interface MonoGroupedResolved<T = any> {
  fields: Array<MonoGroupedLevel<T>>
  chunk: number
  collapsible: boolean
  open: boolean
  stayOpen: boolean
}

/**
 * A band's fold state for {@link buildGrouped}: a set of COLLAPSED paths (on top of
 * each level's `open` default), or a function deciding per band.
 */
export type MonoGroupedFoldState = ReadonlySet<string> | ((path: string, field: MonoGroupedLevel<any>) => boolean)

/** One band as the controller publishes it (`table.grouped`). */
export interface MonoGroupedItem<T = any> {
  /** Stable identity across rebuilds — the encoded keys, outer to inner. Collapse state is keyed by it. */
  path: string
  /** Nesting depth, 0 = outermost. */
  level: number
  field: string
  /** The raw key value. */
  key: unknown
  label: string
  /** Rows under the band (collapsed ones included — it is what the band stands for). */
  count: number
  showCount: boolean
  /** The band's first row (what `custom` / a function `variant` / `color` read). */
  row: T
  variant: MonoGroupedVariant
  color: string
  collapsible: boolean
  collapsed: boolean
  /** Row coordinate: drawn in front of `visible[at]` (`at === visible.length` → after the last row). */
  at: number
  /** Slot coordinate. */
  slot: number
}

export interface MonoGroupedLayout<T = any> {
  grouped: Array<MonoGroupedItem<T>>
  /** The rows still shown — everything not under a collapsed band. */
  visible: T[]
  /** `visible.length + grouped.length`. */
  slotCount: number
}

/** What a row window `[rowStart, rowEnd)` draws. */
export interface MonoGroupedWindow<T = any> {
  /** Window offset (index into the window's rows) → bands drawn in front of that row, outer first. Offset `rowEnd - rowStart` = after the last row. */
  before: Map<number, Array<MonoGroupedItem<T>>>
  /** Bands whose own row lies above the window but whose rows continue into it — re-drawn at the top so they stay pinned. Outer first. */
  leads: Array<MonoGroupedItem<T>>
  /** Slots above the window that are not drawn (rows + bands, leads excluded). */
  slotsAbove: number
  /** Slots below the window that are not drawn. */
  slotsBelow: number
}

const VARIANTS: readonly MonoGroupedVariant[] = ['solid', 'outline', 'tonal', 'text']

/** Resolve a config; `null` when there is nothing to band by. */
export function normalizeGrouped<T = any>(cfg: MonoGrouped<T> | null | undefined): MonoGroupedResolved<T> | null {
  if (!cfg || typeof cfg !== 'object' || !Array.isArray(cfg.fields)) return null
  const collapsible = cfg.collapsible !== false
  const open = cfg.open !== false
  const stayOpen = cfg.stayOpen !== false
  const entries = cfg.fields
    .map((f, i) => ({ f: typeof f === 'string' ? ({ field: f } as MonoGroupedFieldConfig<T>) : f, i }))
    .filter((e) => !!e.f && typeof e.f.field === 'string' && e.f.field.length > 0)
  if (!entries.length) return null
  // Stable: `order` first (unset sorts as its array position), ties by position.
  entries.sort((a, b) => {
    const oa = typeof a.f.order === 'number' ? a.f.order : a.i
    const ob = typeof b.f.order === 'number' ? b.f.order : b.i
    return oa - ob || a.i - b.i
  })
  const seen = new Set<string>()
  const fields: Array<MonoGroupedLevel<T>> = []
  for (const { f } of entries) {
    if (seen.has(f.field)) continue // a field twice would only ever make one-row bands
    seen.add(f.field)
    fields.push({
      field: f.field,
      level: fields.length,
      custom: typeof f.custom === 'function' ? f.custom : undefined,
      count: f.count !== false,
      variant: f.variant ?? 'tonal',
      color: f.color ?? 'primary',
      collapsible: typeof f.collapsible === 'boolean' ? f.collapsible : collapsible,
      open: typeof f.open === 'boolean' ? f.open : open,
      stayOpen: typeof f.stayOpen === 'boolean' ? f.stayOpen : stayOpen,
    })
  }
  const chunk = Math.max(1, Math.floor(Number(cfg.chunk) || 100))
  return { fields, chunk, collapsible, open, stayOpen }
}

/**
 * A config's identity for "did it change?". Functions count by presence only: a
 * template's inline `:grouped.prop="{ … custom: (r) => … }"` is a NEW object with
 * new closures on every render, and must not re-band (or re-render) each time.
 */
export function groupedSignature(cfg: MonoGrouped<any> | null | undefined): string {
  if (!cfg || typeof cfg !== 'object' || !Array.isArray(cfg.fields)) return ''
  const fn = (v: unknown) => (typeof v === 'function' ? 'ƒ' : (v ?? null))
  return JSON.stringify({
    c: cfg.chunk ?? null,
    k: cfg.collapsible ?? null,
    p: cfg.open ?? null,
    s: cfg.stayOpen ?? null,
    f: cfg.fields.map((f) =>
      typeof f === 'string'
        ? f
        : f && {
            field: f.field,
            o: f.order ?? null,
            n: f.count ?? null,
            v: fn(f.variant),
            c: fn(f.color),
            x: typeof f.custom === 'function',
            k: f.collapsible ?? null,
            p: f.open ?? null,
            s: f.stayOpen ?? null,
          },
    ),
  })
}

/** A row's raw key at `field` (path-aware, like `grouping.ts`). */
export function bandKeyOf(row: unknown, field: string): unknown {
  return isPath(field) ? getFieldValue(row, field) : (row as Record<string, unknown> | null)?.[field]
}

/** The string a key compares by — `null` / `undefined` / `''` are one "blank" band. */
function keyString(key: unknown): string {
  if (key == null || key === '') return ''
  if (key instanceof Date) return `d:${key.getTime()}`
  if (typeof key === 'object') {
    try {
      return `j:${JSON.stringify(key)}`
    } catch {
      return String(key)
    }
  }
  return `${typeof key === 'number' ? 'n' : typeof key === 'boolean' ? 'b' : 's'}:${String(key)}`
}

function defaultLabel(key: unknown): string {
  if (key == null || key === '') return '(blank)'
  if (key instanceof Date) return key.toLocaleDateString()
  return String(key)
}

function resolveVariant<T>(v: MonoGroupedLevel<T>['variant'], row: T): MonoGroupedVariant {
  let out: unknown = v
  if (typeof v === 'function') {
    try {
      out = v(row)
    } catch {
      out = 'tonal'
    }
  }
  return VARIANTS.includes(out as MonoGroupedVariant) ? (out as MonoGroupedVariant) : 'tonal'
}

function resolveColor<T>(c: MonoGroupedLevel<T>['color'], row: T): string {
  if (typeof c !== 'function') return c || 'primary'
  try {
    return c(row) || 'primary'
  } catch {
    return 'primary'
  }
}

function resolveLabel<T>(f: MonoGroupedLevel<T>, row: T, key: unknown): string {
  if (!f.custom) return defaultLabel(key)
  try {
    const out = f.custom(row)
    return out == null ? '' : String(out)
  } catch (err) {
    console.warn(`[mono-table] grouped: custom() for "${f.field}" threw —`, err)
    return defaultLabel(key)
  }
}

/**
 * Walk the ORDERED rows once and cut them into bands.
 *
 * A band opens at level L whenever the key at L — or at any outer level — differs
 * from the previous row's. The caller must keep each band contiguous (the band
 * fields lead the sort); a key that reappears later simply opens a second band.
 */
export function buildGrouped<T = any>(
  rows: ReadonlyArray<T>,
  fields: ReadonlyArray<MonoGroupedLevel<T>>,
  collapsed: MonoGroupedFoldState = new Set(),
): MonoGroupedLayout<T> {
  // A Set lists paths folded BY HAND on top of each level's `open` default.
  const isFolded =
    typeof collapsed === 'function'
      ? collapsed
      : (path: string, f: MonoGroupedLevel<T>) => !f.open || collapsed.has(path)
  const bands: Array<MonoGroupedItem<T>> = []
  const visible: T[] = []
  const depth = fields.length
  if (!depth) return { grouped: bands, visible: [...rows], slotCount: rows.length }

  /** The band open at each level for the current run. */
  const open: Array<MonoGroupedItem<T> | null> = new Array(depth).fill(null)
  /** Whether the band at each level is drawn (no collapsed ancestor). */
  const drawn: boolean[] = new Array(depth).fill(false)
  /** Level of the outermost collapsed open band, or -1. */
  let foldedAt = -1
  let prev: string[] | null = null

  for (const row of rows) {
    const keys = fields.map((f) => bandKeyOf(row, f.field))
    const strs = keys.map(keyString)
    let d = 0
    if (prev) {
      while (d < depth && strs[d] === prev[d]) d++
    }
    if (d < depth) {
      // Levels d..depth-1 open new bands. A fold below d closes with them.
      if (foldedAt >= d) foldedAt = -1
      for (let lvl = d; lvl < depth; lvl++) {
        const f = fields[lvl]!
        const parent = lvl > 0 ? open[lvl - 1]!.path : ''
        const seg = encodeURIComponent(strs[lvl]!)
        const path = parent ? `${parent}/${seg}` : seg
        const isDrawn = foldedAt < 0
        // A level that cannot fold never starts folded either (it could never be opened).
        const isCollapsed = f.collapsible && isFolded(path, f)
        const band: MonoGroupedItem<T> = {
          path,
          level: lvl,
          field: f.field,
          key: keys[lvl],
          label: resolveLabel(f, row, keys[lvl]),
          count: 0,
          showCount: f.count,
          row,
          variant: resolveVariant(f.variant, row),
          color: resolveColor(f.color, row),
          collapsible: f.collapsible,
          collapsed: isCollapsed,
          at: visible.length,
          slot: 0,
        }
        open[lvl] = band
        drawn[lvl] = isDrawn
        if (isDrawn) {
          band.slot = visible.length + bands.length
          bands.push(band)
        }
        if (isDrawn && isCollapsed && foldedAt < 0) foldedAt = lvl
      }
    }
    for (let lvl = 0; lvl < depth; lvl++) open[lvl]!.count++
    if (foldedAt < 0) visible.push(row)
    prev = strs
  }
  return { grouped: bands, visible, slotCount: visible.length + bands.length }
}

/** Index of the first band whose `key(band) >= value` (bands are ascending in both coordinates). */
function lowerBound<T>(bands: ReadonlyArray<MonoGroupedItem<T>>, value: number, key: (b: MonoGroupedItem<T>) => number): number {
  let lo = 0
  let hi = bands.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (key(bands[mid]!) < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** Number of visible rows in front of `slot` — the row a slot window starts at. */
export function slotToRow<T>(layout: MonoGroupedLayout<T>, slot: number): number {
  const s = Math.max(0, Math.min(Math.floor(slot), layout.slotCount))
  const bandsBefore = lowerBound(layout.grouped, s, (b) => b.slot)
  return Math.max(0, Math.min(layout.visible.length, s - bandsBefore))
}

/** The slot of visible row `row`. */
export function rowToSlot<T>(layout: MonoGroupedLayout<T>, row: number): number {
  const r = Math.max(0, Math.min(Math.floor(row), layout.visible.length))
  // Every band drawn in front of row r (at <= r) precedes it.
  const bandsBefore = lowerBound(layout.grouped, r + 1, (b) => b.at)
  return r + bandsBefore
}

/**
 * The bands a row window draws, and the slots it leaves to the spacers.
 *
 * The heights always add up: `slotsAbove + leads + drawn bands + rows + slotsBelow
 * === slotCount`, so a band entering or leaving the window never makes the content
 * jump.
 */
export function groupedWindow<T>(layout: MonoGroupedLayout<T>, rowStart: number, rowEnd: number): MonoGroupedWindow<T> {
  const { grouped: bands, visible } = layout
  const end = Math.max(0, Math.min(Math.floor(rowEnd), visible.length))
  const start = Math.max(0, Math.min(Math.floor(rowStart), end))
  const tail = end === visible.length // the last row is in: bands after it are drawn too

  const before = new Map<number, Array<MonoGroupedItem<T>>>()
  const firstIn = lowerBound(bands, start, (b) => b.at)
  let i = firstIn
  for (; i < bands.length; i++) {
    const b = bands[i]!
    if (b.at > end || (b.at === end && !tail)) break
    const off = b.at - start
    const list = before.get(off)
    if (list) list.push(b)
    else before.set(off, [b])
  }
  const bandsBelow = bands.length - i

  // The chain of bands the window's first row sits under: replay every band at or
  // before it, each one replacing its level and dropping the deeper ones.
  const leads: Array<MonoGroupedItem<T>> = []
  if (start > 0 && end > start) {
    const chain: Array<MonoGroupedItem<T> | undefined> = []
    for (let j = 0; j < firstIn; j++) {
      const b = bands[j]!
      chain[b.level] = b
      chain.length = b.level + 1
    }
    for (const b of chain) if (b && b.at < start) leads.push(b)
    // A band starting exactly at `start` is already drawn in the window — the chain
    // beneath it is stale (that band replaced its level).
    const atStart = before.get(0)
    if (atStart?.length) {
      const minLevel = Math.min(...atStart.map((b) => b.level))
      while (leads.length && leads[leads.length - 1]!.level >= minLevel) leads.pop()
    }
  }

  const slotsAbove = start + firstIn - leads.length
  const slotsBelow = visible.length - end + bandsBelow
  return { before, leads, slotsAbove, slotsBelow }
}

/** Every collapsible band path — for collapse-all. */
export function collapsiblePaths<T>(rows: ReadonlyArray<T>, fields: ReadonlyArray<MonoGroupedLevel<T>>): string[] {
  // Built with nothing folded (not even by an `open: false` default), so nested paths are enumerated too.
  return buildGrouped(rows, fields, () => false).grouped.filter((b) => b.collapsible).map((b) => b.path)
}
