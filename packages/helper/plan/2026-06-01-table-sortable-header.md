# Sortable table header — `mono-table-th` + controller sort

## Context

The headless table module already had search / paging / page-size / info
controls and a `monoArraySource` adapter. It lacked **column sorting**. This adds
a `mono-table-th` header-cell element wired to `monoDataGrid`, mimicking a
DevExtreme DataGrid column header: click to sort, with an up/down arrow indicator
rendered at the end of the header text (dimmed when unsorted, the active
direction highlighted). The native `<table>` stays native — `mono-table-th` is
just a `display: table-cell` element dropped into `<thead><tr>` for sortable
columns. Sorting flows through the controller, so it works against a real
devextreme DataSource (demo uses `/DTO_Departmen` → OData `$orderby`) and against
`monoArraySource` (client-side).

## Changes

### Controller — `src/components/table/mono-data-grid.ts`
- `MonoGridSource` gains `sort?: (value?: unknown) => unknown` (devextreme
  `DataSource.sort`). New exported `type SortOrder = 'asc' | 'desc' | null`.
- `MonoTableController` gains `sortField: string | null`, `sortOrder: SortOrder`,
  and `setSort(field, order?)`.
- `setSort`: with no `order`, cycles `asc → desc → null` for the clicked field
  (a fresh field starts at `asc`); an explicit `order` (incl. `null`) sets it.
  Updates `sortField`/`sortOrder`, `notify()`s immediately (snappy indicator),
  then `s.sort?.(order ? [{ selector: field, desc: order === 'desc' }] : null)`,
  resets `pageIndex(0)`, and `load()`s.

### Array source — `src/components/table/array-source.ts`
- Added a `sort` getter/setter that normalises devextreme's argument shapes
  (`[{selector,desc}]` / object / string / null) and a numeric-aware,
  locale-aware stable comparator applied in `applied()` after filter + search.

### New component — `src/components/table/mono-table-th.ts`
- Light-DOM Lit element mirroring `mono-table-search` (subscribe / re-subscribe /
  unsubscribe, `defineHybridPropAliases(this, ['dataGrid', 'noClear'])`).
- Props: `dataGrid` (`attribute:false`), `field`, `caption`, `disabled`,
  `noClear` (`no-clear`). Captures slotted text in `connectedCallback` before the
  first render wipes it; `caption` overrides. Sets host `role="columnheader"` and
  `aria-sort`. Click / Enter / Space cycle the sort (respecting `no-clear`).
  Renders the label + a stacked up/down chevron indicator (`data-dir`).

### Styles — `src/components/table/table.css`
- `.mono-table mono-table-th { display: table-cell }` + the same visual as
  `.mono-table th`. `.mono-table-th-inner` (clickable, hover/focus accent),
  `.mono-table-th-sort` + `.mono-table-th-caret` with `[data-dir=asc|desc]`
  highlighting the active chevron. Added `mono-table-th` to the
  `.mono-table-fixed` truncation selector.

### Wiring
- `index.ts` exports `MonoTableTh` + `SortOrder` + `TableThProps`;
  `table-types.ts` adds `TableThProps`. No `vite.config.ts` / `package.json`
  changes (covered by the existing `ui/table` entry + `@mono-lit/helper` re-export).

### Demo + docs
- `demos/table/vue/sorting.vue` — `/DTO_Departmen`, three `<mono-table-th>`
  headers (`Id` / `Code` / `Nama`) composed with search + footer controls.
- `manifests/table.ts` + `ui/table.md` "Sorting" section.

## Verification
- `pnpm build` (lib) clean; `MonoTableTh` in `dist/ui/table.js` + `dist/index.js`;
  `customElement("mono-table-th")` in the shared chunk `dist/index.js` imports;
  `.mono-table-th*` rules in `dist/ui/index.css`. ✅
- Temp node test (12 assertions): cycle asc→desc→none, explicit order, numeric vs
  locale sort, clear, `sortField`/`sortOrder` tracking, subscribe notifications. ✅
- Docs build renders the sorting page (unrelated `select`/`tag-input` datasource
  blockers temporarily SSR-fixed then reverted).

## Out of scope
- Multi-column (shift-click) sort.
- CSS-only demo flavor (table-cell custom elements need Vue-compiled markup).
