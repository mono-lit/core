# Headless table helper system (`monoDataGrid` + `mono-table-*` controls)

## Context

A **headless, native-`<table>`-friendly** helper that reproduces only the
*behavior* of a DevExtreme DataGrid (search, paging, page size, loading, info)
while the actual `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<td>` stay native
and fully user-styled. There is **no** `<mono-table>` / `<mono-tr>` /
`<mono-td>` — the markup is the consumer's.

Lit web components can't use Vue scoped slots, so communication goes through a
shared, framework-agnostic **controller object** (`monoDataGrid`). The controller
wraps a devextreme `DataSource`, exposes a simple API + a subscribe/notify
system, and keeps its own snapshot of `items / loading / totalCount / pageIndex /
pageSize / pageCount` in sync from the source's `changed` / `loadingChanged`
events. Four tiny Lit controls take the controller via `:data-grid.prop`,
subscribe to it, and `requestUpdate()` on change — rendering **only** the control
UI, never the table body.

Visual design follows `template/table-no-expand.html` (toolbar search + footer
paging / page-size / info + a native-table stylesheet). The mobile card collapse
(`.mob-cards`) is intentionally **ignored**.

### Decisions

- **Bound property: `dataGrid`** (`:data-grid.prop="table"`, hybrid aliases
  `data-grid` / `datagrid`) — matches the `monoDataGrid` factory name (resolves
  the earlier `data-table` vs `data-grid` wording inconsistency).
- **Closure factory, not a class.** `monoDataGrid` returns a plain object whose
  public fields are mutated in place. This avoids Vue's `reactive(this)` /
  `this`-binding pitfalls and keeps the controller framework-agnostic.
- **Search** uses devextreme `searchValue()`; the consumer supplies which columns
  via a `searchExpr` option on `monoDataGrid(ds, { searchExpr })` (applied to the
  source on each `setSearch`) so search works without pre-configuring the source.
- **Paging** renders a windowed set of numbered `.mono-table-pgb` buttons + Prev /
  Next (matches the template `.pg` / `.pgb`), one-based display over a zero-based
  internal `pageIndex`.
- **Vue reactivity**: the controller stays framework-agnostic; the `<tbody>`
  renders from a **ref mirrored via `subscribe`**
  (`table.subscribe(() => { rows.value = [...table.items] })`), not
  `datasource.items()` directly.
- `totalCount` / `pageCount` / info need `requireTotalCount: true` on the source.
  When the total is unknown (devextreme `totalCount()` returns `-1`), `pageCount`
  falls back to `isLastPage` (`pageIndex+1` on the last page, else `pageIndex+2`).
- **`.prop` is required** because Vue sets unknown bindings on a custom element as
  string *attributes*; an object controller must be assigned as a DOM *property*
  (`.prop`) or it is stringified and lost.

## Files created — `src/components/table/`

### `mono-data-grid.ts` (controller, framework-agnostic)

- `MonoGridSource<T>` — extends the shared `MonoDataSource` (from
  `composables/data-source-controller`) with the extra devextreme methods used
  here, all optional/duck-typed: `reload`, `filter`, `searchValue`,
  `searchOperation`, `searchExpr`, `pageCount`.
- `MonoDataGridOptions` — `{ searchExpr?, searchOperation? }`.
- `MonoTableController<T>` — public state (`items / loading / totalCount /
  pageIndex / pageSize / pageCount`, readonly `dataSource`) + methods
  `load / reload / setPage / setPageSize / setSearch / setFilter / bind /
  subscribe / dispose`.
- `monoDataGrid<T>(ds = null, opts = {})` — closure factory.
  - `notify()` calls every subscriber. `sync()` snapshots the source
    (`items = [...ds.items()]`, `pageSize`, `pageIndex`, `totalCount`, computed
    `pageCount`) then notifies. `syncLoading()` mirrors `isLoading()`.
  - `bind(next)` — **detach-before-attach** (always `detach()` first so handlers
    never double-register), set `dataSource`, attach `changed` /
    `loadingChanged` / `loadError` listeners, then `sync()`. No-op if same ref.
  - `runLoad(fn)` — `try/await/catch` that **swallows canceled errors** (devextreme
    rejects a load superseded by a newer one; matched via `isCanceled()` checking
    `err` / `name` / `message` / `__id` === `'canceled'`).
  - `load` / `reload` call `paginate(true)` then the source. `setPage` →
    `pageIndex(i)` + load. `setPageSize` → `pageSize(n)` + `pageIndex(0)` + load.
    `setSearch` → `searchOperation` + `searchExpr` (if opt set) + `searchValue(v||null)`
    + `pageIndex(0)` + load. `setFilter` → `filter(f)` + `pageIndex(0)` + load.
  - `subscribe(cb)` adds to a `Set`, returns an unsubscribe fn. `dispose()`
    detaches + clears subscribers.

### Lit controls (light-DOM, hybrid props, mirror the `mono-select` scaffold)

Each: `@property({ attribute: false }) dataGrid?: MonoTableController`;
`connectedCallback` subscribes
(`this._off = this.dataGrid?.subscribe(() => this.requestUpdate())`); `willUpdate`
re-subscribes when `dataGrid` changes; `disconnectedCallback` unsubscribes.
`createRenderRoot()` returns `this`; CSS via `?raw` + `unsafeCSS`;
`defineHybridPropAliases` for aliases.

- **`mono-table-search.ts`** — `.mono-table-search` wrapper, search SVG icon,
  `.mono-table-search-input[type=search]`. Props `placeholder` (`'Search…'`),
  `disabled` (boolean), `debounce` (number, default `300`), `noIcon`
  (`no-icon`). Debounced `dataGrid.setSearch(value)`; disabled while loading.
- **`mono-table-paging.ts`** — `.mono-table-pg` with Prev `‹`, windowed numbered
  `.mono-table-pgb` (`.on` for `pageIndex+1`), Next `›`. Props `siblings`
  (number, default `1`), `simple` (boolean → Prev/Next only). `_pages()` builds
  the window with `'gap'` markers (`.mono-table-pg-el`). Click → `setPage`;
  disabled at ends and while loading.
- **`mono-table-page-size.ts`** — `<label class="mono-table-page-size">` +
  optional span + `<select class="mono-table-sel">`. Props `sizes`
  (`[10,20,50,100]`, parses array or comma string), `label`. Change →
  `setPageSize`.
- **`mono-table-info.ts`** — `<span class="mono-table-info">`. Prop `template`
  (`'Showing {from}–{to} of {total}'`, tokens `{from} {to} {total} {page}
  {pages}`). `from = pageIndex*pageSize+1`, `to = from + shown - 1`.

### `table.css`

Ported from `template/table-no-expand.html`, theme-tokenized via local `--mt-*`
vars mapped to `--theme-*` (with literal fallbacks) on the control / table
classes. Control styling: search input + icon, paging buttons (`.mono-table-pgb`,
`.on`, `:disabled`, `.mono-table-pg-el`), select (`.mono-table-sel`), info
(`.mono-table-info`). **Native-table opt-in classes** the consumer applies to
their own markup: `.mono-table-card`, `.mono-table-scroll`, `.mono-table`
(thead gradient, `th`, `td`, `tbody tr:hover`, `.mono-table-row-selected`),
`.mono-table-foot`, `.mono-table-badge` (+ `success / danger / warning / info`),
`.mono-table-empty`. No `.mob-cards` / responsive collapse.

### `table-types.ts` + `index.ts`

`table-types.ts` re-exports the controller types + `TableSearchProps`,
`TablePagingProps`, `TablePageSizeProps`, `TableInfoProps`. `index.ts` exports
`monoDataGrid`, the four component classes, and all types.

## Build wiring

- `vite.config.ts` — added `'ui/table': r('./src/components/table/index.ts')`.
- `package.json` — added the `./ui/table` sub-export pair.
- `src/entries/index.ts` — added `export * from '../components/table/index'`.
- `src/entries/index.css` — added `@import '../components/table/table.css';` so
  the rules land in the aggregated `dist/ui/index.css` (consumers already import
  it). **This is the actual aggregation mechanism** — the per-component `?raw`
  import only feeds the element's embedded `static styles`; the global stylesheet
  is built from this `@import` list.

## Verification

1. **Build** — `pnpm build` clean; `dist/ui/table.js` + `.d.ts` emitted;
   `.mono-table*` rules present in `dist/ui/index.css` (46 matches). ✅
2. **Controller unit tests** (temp `node` script with a faithful devextreme-style
   mock source, removed after) — 28 assertions covering: sync on bind/load;
   `setPage` / `setPageSize` (resets to page 0) / `setSearch` (filters + resets) /
   `setFilter`; `subscribe` / unsubscribe / `dispose`; **external `ds.filter() +
   ds.load()` propagating via the `changed` event**; **canceled load errors
   swallowed**; **no duplicate handlers** on re-bind / swap; **unknown-total
   `pageCount` fallback to `isLastPage`**. All pass. ✅
   - Caught + fixed a `sync()` bug: when total was unknown it set
     `totalCount = items.length`, which made the `totalCount > 0` branch win and
     left the `isLastPage` fallback dead. Now tracks `hasTotal` explicitly.
3. **Demo + visual** (pending) — vitepress page rendering a native `<table>` from
   `table.items` with the four controls, verified in dev + production build.

## Demo + docs (pending)

- `demo/vitepress/docs/demos/table/vue/basic.vue` — dynamic-import devextreme +
  `monoOdataFetch` inside `onMounted` (SSR-safe, `<ClientOnly>`),
  `requireTotalCount: true`, `monoDataGrid(null, { searchExpr: ['Nama'] })`,
  `table.bind(ds)`, mirror `rows` via `subscribe`, native `.mono-table*` table,
  the four controls bound with `:data-grid.prop`. Explains why `.prop`.
- New `docs/ui/table.md` page + sidebar entry in `.vitepress/config.ts`.

## Out of scope

- No `<mono-table>` / `<mono-tr>` / `<mono-td>` — table stays native.
- No sorting / selection / bulk controls yet (future `mono-table-*` controls).
- Mobile card collapse from the template.
