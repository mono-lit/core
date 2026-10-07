import {
  monoDataGrid,
  type MonoTableController,
  type MonoGridSource,
  type MonoDataGridOptions,
  type MonoTableProps,
  type MonoCheckLimits,
} from '../table/mono-data-grid.js'
import { createNotifier } from '../../composables/notifier'
import type { MonoEventProps } from '../../composables/element-props'
import type { DropdownTableEvents } from './dropdown-table-types'

/** One resolved selection (key + display text + the row it came from). */
export interface MonoDropdownItem<T = any> {
  key: unknown
  text: string
  data: T | undefined
}

/**
 * Central props for a dropdown-table, in the same shape as
 * `monoDataGrid({ props })`.
 *
 * Everything except `dropdownTable` targets the PANEL and is forwarded verbatim
 * to the wrapped grid, so `th` / `search` / `paging` behave exactly as they do
 * on a plain table. `dropdownTable` is the extra slot: the closed field itself.
 */
export interface MonoDropdownProps extends MonoTableProps {
  /**
   * Props for the `<mono-dropdown-table>` field element, plus its events as
   * `on<Event>` keys (`onChange`, `onOpen`, `onClose`, …) attached as listeners.
   */
  dropdownTable?: Record<string, unknown> & MonoEventProps<DropdownTableEvents>
}

export interface MonoDataDropdownOptions extends MonoDataGridOptions {
  /** Row key field (default `'Id'`). Also forwarded to the inner grid. */
  keyExpr?: string
  /** Display text — a field name or a `(row) => string`. Defaults to `keyExpr`. */
  displayExpr?: string | ((row: any) => string)
  /** Multi-select (array value) vs single (scalar). */
  multiple?: boolean
  /**
   * Most rows the user can select in multi mode (unset = unlimited). Enforced by
   * the grid's check store, so a row click, the keyboard, `<mono-table-checkbox>`
   * (row and `type="all"`) and `selectAll()` all stop at it — a pick past the cap
   * is rejected and the checkbox un-ticks itself. `setValue()` is not capped.
   * The element's own `max` / `chip.max`, when set, override this.
   */
  max?: number
  /**
   * Fewest rows the user can leave selected (unset = 0). Un-ticking at the floor
   * is rejected; `clear()` keeps the first `min`. Overridden by the element's
   * `min` / `chip.min` when set.
   */
  min?: number
  /** Central element props — the grid slots plus `dropdownTable`. */
  props?: MonoDropdownProps
  /**
   * A ref the dropdown writes a `props()` snapshot into on every change. The
   * DROPDOWN owns this, not the inner grid — the snapshot has to carry
   * `dropdownTable` alongside the grid slots, so a template can drive both the
   * field and its header loop from one object.
   */
  state?: { value: MonoDropdownProps | undefined }
}

/**
 * The dropdown controller — wraps a {@link monoDataGrid} (`.grid`, bind the panel's
 * `mono-table-*` to it) and adds selection, `value`, and key→label display
 * resolution. Mutated in place; read after `subscribe` fires (coalesced).
 */
export interface MonoDropdownController<T = any> {
  /** The inner table controller. Bind `mono-table-*` with `:control-table.prop="dd.table"`
   *  (alias `:data-grid.prop="dd.grid"`). */
  readonly grid: MonoTableController<T>
  /** Alias of {@link grid} — the inner `controlMonoTable`. Preferred in new code. */
  readonly table: MonoTableController<T>
  /**
   * Central element props — the grid's slots plus `dropdownTable` (the field
   * itself). Mirrors `table.props()`; a stable read, mutated in place.
   */
  props(): MonoDropdownProps
  readonly multiple: boolean
  /** Selected value: scalar (single) or array (multi). Setting resolves display. */
  value: unknown
  /** Whether the dropdown panel is open. */
  open: boolean
  /** Assignable sink fired on INTERNAL value changes (toggle/remove/clear), not `setValue`. */
  onValueChange: ((value: unknown) => void) | null

  isSelected(key: unknown): boolean
  /**
   * The selection limits in force — the element's `max` / `min` when it set
   * them, else the controller options'. Read `atMax` / `atMin` from
   * `table.check()` for the live state.
   */
  limits(): MonoCheckLimits
  /**
   * The element pushes its effective `max` / `min` here. `undefined` for a key
   * means "the element has no opinion" and the controller option applies again.
   */
  setLimits(limits: MonoCheckLimits): void
  toggleRow(key: unknown, rowData?: T): void
  removeKey(key: unknown): void
  clear(): void
  /**
   * Select every row the source returns for the CURRENT filter + search — the
   * dropdown's counterpart to the table's `<mono-table-checkbox type="all">`.
   * Drains through `table.getData()` and primes the display cache from the drained
   * rows, so it costs the drain and no resolution requests. Fills only the room
   * `max` leaves.
   * No-op unless `multiple`, and re-entrant calls are ignored while one is running.
   * `clear()` is the inverse.
   *
   * Read {@link selectAllPending} to show a loading state while it runs.
   */
  selectAll(): Promise<void>
  /**
   * Whether a {@link selectAll} drain is in flight — the dropdown's equivalent of
   * the table's `check().pending`. Flips true (with a notify) BEFORE the first
   * request, so a subscriber can render the spinner before the network blocks.
   *
   * Unlike the table, a repeat `selectAll()` re-drains: the table memoises its last
   * drain, but that memo is invalidated against grid internals (row-set version,
   * search terms) this controller does not own, and a stale selection is a worse
   * failure than a redundant fetch.
   */
  readonly selectAllPending: boolean
  /** The selected items (ordered), resolved to `{ key, text, data }`. */
  selectedItems(): Array<MonoDropdownItem<T>>
  /** Joined display text of the current selection. */
  displayText(): string

  /**
   * Replace the selection. Pass `rows` when you already hold the matching row
   * objects (a drain, a paged read) to seed the display cache and skip the
   * `in`-filter round trips `resolveSelected` would otherwise make.
   *
   * Does NOT emit — this is the inbound path the element pushes `modelValue` down.
   * Use {@link selectAll} or {@link toggleRow} for a change that should notify.
   */
  setValue(next: unknown, rows?: readonly T[]): void
  setOpen(next: boolean): void
  /** Fetch + cache display text for any selected keys not yet resolved. */
  resolveSelected(): Promise<void>

  subscribe(cb: () => void): () => void
  bind(source: MonoGridSource<T> | T[] | null): void
  dispose(): void
}

/**
 * `monoDataDropdown` — the composable that owns all the grid-dropdown "magic":
 * selection (single/multi), the bound `value`, and resolving a selected KEY to its
 * display TEXT. The options table is the reused headless {@link monoDataGrid}
 * exposed as `.grid`, so search / sort / paging / header-filter all work by binding
 * the panel's `mono-table-*` helpers to it. Pair with `<mono-dropdown-table>`.
 *
 * Display resolution uses `store.load({ filter })` ONLY — never `byKey` (which
 * caches per key and would hide updated rows) — with an `in`-filter (+ OR-chain
 * fallback) for a remote source, or the array source's `data()` for a local one.
 */
/** Renamed "control" alias of {@link monoDataDropdown} (no breaking change — both work). */
export { monoDataDropdown as controlMonoDataDropdown }

export function monoDataDropdown<T = any>(
  source: MonoGridSource<T> | T[] | null = null,
  opts: MonoDataDropdownOptions = {},
): MonoDropdownController<T> {
  const keyExpr = opts.keyExpr ?? 'Id'
  const displayExpr = opts.displayExpr
  const multiple = !!opts.multiple

  // The grid gets everything EXCEPT `state`. Its own snapshot would only carry
  // the grid slots, and it writes on its own notify — so letting it own the ref
  // would clobber `dropdownTable` on every change. The dropdown writes the
  // combined snapshot instead (see `propsSnapshot` below).
  const { state: _stateRef, max: _optMax, min: _optMin, ...gridOpts } = opts
  const grid = monoDataGrid<T>(source, gridOpts)

  // --- selection limits ------------------------------------------------------
  // They live in the grid's CHECK STORE, not here: that is the one place every
  // add and remove goes through — a row click, the keyboard, a
  // `<mono-table-checkbox>` bound to `dd.table` (which never sees this
  // controller) and the select-all drain. The element's own `max` / `min` win
  // over the options for as long as it sets them.
  const optionLimits: MonoCheckLimits = { max: opts.max, min: opts.min }
  let elementLimits: MonoCheckLimits = {}
  function effectiveLimits(): MonoCheckLimits {
    return {
      max: elementLimits.max ?? optionLimits.max,
      min: elementLimits.min ?? optionLimits.min,
    }
  }
  function applyLimits(): void {
    const { max, min } = effectiveLimits()
    // `null` lifts a limit the store still holds from an earlier push.
    grid.check().configure({ max: max ?? null, min: min ?? null })
  }
  function setLimits(next: MonoCheckLimits): void {
    if (next.max === elementLimits.max && next.min === elementLimits.min) return
    elementLimits = { max: next.max, min: next.min }
    applyLimits()
    notify()
  }
  if (multiple) applyLimits()

  /** The field element's own props — the one slot the inner grid knows nothing about. */
  const dropdownTableProps: Record<string, unknown> = { ...(opts.props?.dropdownTable ?? {}) }

  /** Merged element props: the grid's slots plus this dropdown's field slot. */
  function props(): MonoDropdownProps {
    return { ...grid.props(), dropdownTable: dropdownTableProps }
  }

  function propsSnapshot(): MonoDropdownProps {
    const g = grid.props()
    return {
      ...g,
      th: (g.th ?? []).map((c) => ({ ...c })),
      dropdownTable: { ...dropdownTableProps },
    }
  }

  const notifier = createNotifier({
    onFlush: () => {
      if (opts.state) opts.state.value = propsSnapshot()
    },
  })
  const notify = notifier.notify

  // --- selection state -------------------------------------------------------
  let _value: unknown = multiple ? [] : null
  const cache = new Map<string, MonoDropdownItem<T>>()

  const keyStr = (k: unknown): string => String(k)

  /** Coerce a key to the source's key type (number vs string), inferred from a row. */
  function normKey(k: unknown): unknown {
    if (k == null || k === '') return k
    const sample = (grid.items[0] as Record<string, unknown> | undefined)?.[keyExpr]
    if (typeof sample === 'number' && !Number.isNaN(Number(k))) return Number(k)
    return k
  }

  function displayOf(row: T | undefined): string {
    if (row == null) return ''
    if (typeof displayExpr === 'function') return String(displayExpr(row) ?? '')
    if (typeof displayExpr === 'string' && displayExpr) {
      return String((row as Record<string, unknown>)[displayExpr] ?? '')
    }
    return String((row as Record<string, unknown>)[keyExpr] ?? '')
  }

  function keysOf(v: unknown): unknown[] {
    if (multiple) return Array.isArray(v) ? v : v == null ? [] : [v]
    return v == null ? [] : [v]
  }

  function cacheRow(key: unknown, data: T | undefined): void {
    const nk = normKey(key)
    cache.set(keyStr(nk), { key: nk, text: displayOf(data), data })
  }

  /** Find a currently-loaded row by key (so a clicked row caches its display text). */
  function findRow(key: unknown): T | undefined {
    const ks = keyStr(normKey(key))
    return (grid.items as Array<Record<string, unknown>>).find(
      (r) => keyStr(normKey(r?.[keyExpr])) === ks,
    ) as T | undefined
  }

  function emitChange(): void {
    ctrl.onValueChange?.(multiple ? checkedKeys() : _value)
  }

  /**
   * MULTI-SELECT IS THE GRID'S `check()` STORE — there is not a second one.
   *
   * The dropdown used to keep its own `_value` array beside the grid's selection,
   * which is why `<mono-table-checkbox>` could bind to `dd.table` and tick without
   * the chips ever moving: it drove the other store. Delegating means every
   * `mono-table-*` helper works in the panel the same way, and drain / `pending` /
   * per-page / the drain memo come from the grid instead of being reimplemented.
   *
   * `_value` stays the SINGLE-select store only, and remains the shape consumers
   * bind (`modelValue`): for multi it is derived from the check store on read.
   */
  const check = () => grid.check()

  /**
   * A row for `check()` to key by. It stores rows, but a selection can name a key
   * whose row is not loaded (a preset `modelValue`, or a key resolved later), so
   * fall back to a stub carrying just the key — `rowKeyOf` only reads `keyExpr`.
   */
  function rowFor(key: unknown, rowData?: T): T {
    const nk = normKey(key)
    return (rowData ?? findRow(nk) ?? cache.get(keyStr(nk))?.data ?? { [keyExpr]: nk }) as T
  }

  /** What is selected right now, whichever store owns it. */
  function currentKeys(): unknown[] {
    return multiple ? checkedKeys() : keysOf(_value)
  }

  /** The multi-select value, derived from the check store (insertion order). */
  function checkedKeys(): unknown[] {
    return check()
      .rows()
      .map((row) => normKey((row as Record<string, unknown>)?.[keyExpr]))
  }

  function isSelected(key: unknown): boolean {
    if (multiple) return check().isChecked(keyStr(normKey(key)))
    const ks = keyStr(normKey(key))
    return keysOf(_value).some((k) => keyStr(normKey(k)) === ks)
  }

  function toggleRow(key: unknown, rowData?: T): void {
    const nk = normKey(key)
    const data = rowData ?? findRow(nk)
    if (data !== undefined) cacheRow(nk, data)
    if (multiple) {
      const on = check().isChecked(keyStr(nk))
      // `max` / `min` are the store's to enforce (see `applyLimits`): a rejected
      // flip leaves it unchanged and still notifies, which is exactly the
      // repaint that reverts the row.
      check().toggle(rowFor(nk, data), !on)
    } else {
      _value = nk
      setOpen(false)
    }
    emitChange()
    notify()
  }

  function removeKey(key: unknown): void {
    const nk = normKey(key)
    if (multiple) check().toggle(rowFor(nk), false)
    else _value = null
    emitChange()
    notify()
  }

  function clear(): void {
    if (multiple) check().clear()
    else _value = null
    emitChange()
    notify()
  }

  /**
   * Rows this controller already holds, indexed by key — the check store first
   * (it keeps whole row objects, not just keys), then the loaded page.
   *
   * Built lazily and ONLY when a key actually missed the cache: after a drain
   * `check().rows()` can hold thousands of rows, and it allocates a fresh array
   * on every call, so touching it per render would be a real cost for nothing.
   */
  function heldRows(): Map<string, T> {
    const index = new Map<string, T>()
    const add = (row: unknown): void => {
      const key = (row as Record<string, unknown>)?.[keyExpr]
      if (key === undefined || key === null) return
      const ks = keyStr(normKey(key))
      if (!index.has(ks)) index.set(ks, row as T)
    }
    // Page rows go in FIRST and win: a drain may have been narrowed by a
    // `$select`, so the displayed row is the more complete of the two.
    for (const row of grid.items as unknown[]) add(row)
    if (multiple) for (const row of check().rows()) add(row)
    return index
  }

  /**
   * Selected keys, labelled.
   *
   * A cache miss falls back to the rows already in memory before degrading to
   * `String(key)`. Without that, selecting through the GRID — which is what
   * `<mono-table-checkbox>` does, since it calls `check.selectAll()` directly
   * rather than `dd.selectAll()` — showed every chip as its own key: only
   * `selectAll()` primes the cache, and the grid subscription just notifies.
   * The row was in `check().rows()` the whole time.
   */
  function selectedItems(): Array<MonoDropdownItem<T>> {
    const keys = currentKeys()
    let held: Map<string, T> | undefined

    return keys.map((k) => {
      const nk = normKey(k)
      const ks = keyStr(nk)

      const hit = cache.get(ks)
      if (hit) return hit

      held ??= heldRows()
      const row = held.get(ks)
      if (row === undefined) return { key: nk, text: String(nk), data: undefined }

      // Cache it, so the next render is a straight hit and this index is built
      // once per selection change rather than once per render.
      cacheRow(nk, row)
      return cache.get(ks) ?? { key: nk, text: displayOf(row), data: row }
    })
  }

  function displayText(): string {
    return selectedItems()
      .map((i) => i.text)
      .join(', ')
  }

  /**
   * Seed the display cache from rows you already hold, so `resolveSelected` has
   * nothing left to fetch. The point of `setValue`'s `rows` argument and of
   * {@link selectAll}: without it, setting N keys costs N/50 `in` requests to
   * re-read text that was already in hand.
   */
  function primeCache(rows: readonly T[] | undefined): void {
    if (!rows?.length) return
    for (const row of rows) cacheRow((row as Record<string, unknown>)?.[keyExpr], row)
  }

  function setValue(next: unknown, rows?: readonly T[]): void {
    // Cache BEFORE the value lands: `resolveSelected` reads the cache to decide
    // what is missing, so priming afterwards would still fire the requests.
    primeCache(rows)
    if (multiple) {
      // `replace`, not N x `toggle` — one notify instead of one per key, which is
      // the whole difference when a consumer assigns 830 of them.
      check().replace(keysOf(next).map((k) => rowFor(k)))
    } else {
      _value = next
    }
    void resolveSelected()
    notify()
  }

  /**
   * Select every row the source can return — the dropdown's answer to the table's
   * `<mono-table-checkbox type="all" mode="all">`.
   *
   * `table.getData()` does the draining (chunked `store.load`, paging left alone)
   * and honours the live filter + search, so "search, then select all" selects the
   * matches and nothing else. The drained rows prime the cache, so this costs the
   * drain and NO display-resolution requests.
   *
   * Emits like `toggleRow` rather than going through `setValue`: `setValue` is the
   * inbound path (the element pushes `modelValue` down it) and deliberately does
   * not emit, so a silent bulk change would leave the element's `modelValue` stale
   * and the next push would overwrite the selection with it.
   */
  async function selectAll(): Promise<void> {
    if (!multiple) return // single-select has nothing to select "all" of
    // The grid owns the drain, its `pending` flag and the drain memo that makes
    // "select all -> untick one -> select all again" free. This is a delegate, not
    // a reimplementation.
    await check().selectAll()
    // Cache display text from what the drain already fetched, so the chips do not
    // trigger a second round of `in`-filter lookups for rows we now hold.
    primeCache(check().rows())
    emitChange()
    notify()
  }

  function setOpen(next: boolean): void {
    if (ctrl.open === next) return
    ctrl.open = next
    notify()
  }

  // --- display resolution (store.load only; array fallback) ------------------
  function hasStore(): boolean {
    const s = grid.dataSource as MonoGridSource<T> | null
    return typeof s?.store === 'function' && !!s.store()
  }
  function storeRows(res: unknown): any[] {
    return Array.isArray(res) ? res : ((res as { data?: any[] })?.data ?? [])
  }
  function chunk<X>(arr: X[], size: number): X[][] {
    const out: X[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }
  const selectFields = (): string[] | undefined =>
    typeof displayExpr === 'string' && displayExpr ? [keyExpr, displayExpr] : undefined

  async function resolveSelected(): Promise<void> {
    const missing = currentKeys().filter((k) => !cache.has(keyStr(normKey(k))))
    if (!missing.length) return
    const s = grid.dataSource as MonoGridSource<T> | null

    if (hasStore()) {
      const store = s!.store!()!
      let rows: any[] = []
      try {
        // `in` filter (chunked to keep URLs sane). load() — NOT byKey — so a later
        // data change is always reflected.
        const loaded = await Promise.all(
          chunk(missing, 50).map((part) =>
            store.load({ filter: [keyExpr, 'in', part], select: selectFields() }),
          ),
        )
        rows = loaded.flatMap(storeRows)
      } catch {
        // OR-chain fallback for backends without `in`.
        const orFilter = (arr: unknown[]): unknown =>
          arr
            .map((v) => [keyExpr, '=', v] as unknown)
            .reduce((a: unknown, b) => (a ? [a, 'or', b] : b), null)
        const loaded = await Promise.all(
          chunk(missing, 15).map((part) =>
            store.load({ filter: orFilter(part), select: selectFields() }),
          ),
        )
        rows = loaded.flatMap(storeRows)
      }
      for (const row of rows) cacheRow(row?.[keyExpr], row)
    } else if (typeof s?.data === 'function') {
      const all = s.data() as Array<Record<string, unknown>>
      const byKey = new Map(all.map((r) => [keyStr(r?.[keyExpr]), r]))
      for (const k of missing) {
        const row = byKey.get(keyStr(normKey(k)))
        if (row) cacheRow(k, row as T)
      }
    }
    notify()
  }

  // --- lifecycle -------------------------------------------------------------
  const offGrid = grid.subscribe(() => notify())

  const ctrl: MonoDropdownController<T> = {
    grid,
    /** Alias of {@link grid} — the inner `controlMonoTable`. Preferred in new
     *  code (`dd.table.load()` / `:control-table.prop="dd.table"`); `grid` stays. */
    table: grid,
    props,
    multiple,
    open: false,
    onValueChange: null,
    get value(): unknown {
      // Multi reads THROUGH to the check store, so a <mono-table-checkbox> bound to
      // `dd.table` moves this value like any other selection would.
      return multiple ? checkedKeys() : _value
    },
    get selectAllPending(): boolean {
      return multiple ? check().pending : false
    },
    set value(next: unknown) {
      setValue(next)
    },
    isSelected,
    limits: effectiveLimits,
    setLimits,
    toggleRow,
    removeKey,
    clear,
    selectAll,
    selectedItems,
    displayText,
    setValue,
    setOpen,
    resolveSelected,
    subscribe: notifier.subscribe,
    bind(next: MonoGridSource<T> | T[] | null): void {
      grid.bind(next)
      cache.clear()
      void resolveSelected()
      notify()
    },
    dispose(): void {
      offGrid()
      notifier.clear()
      grid.dispose()
    },
  }

  return ctrl
}
