# `group` prop — paginate-friendly grouped select

## Context

We added `display-group` / `group-key` / `group-items` so `mono-select` renders **pre-grouped**
`{ key, items }` data. But putting `group: [...]` on a devextreme DataSource makes devextreme
**turn pagination off** (`paginate` defaults to `false` when `group` is set) — it loads the whole
grouped tree in one request, so `load-more="scroll"` / `"button"` can't page large data.

Fix (user-confirmed): a new boolean **`group`** prop. When `group: true`, you pass a **plain**
DataSource (no `group` in its request, `paginate: true`). The component fetches **flat** rows via
the normal paginated load — scroll/"more" work exactly as today — and **groups the accumulated
rows client-side** using the `display-group` accessors. No `group` is ever sent, so paginate
stays on; `store.load()` isn't needed (the normal `ds.load()` + load-more already pages flat rows).

The existing **pre-grouped path** (no `group` prop, data already nested, `group-key`/`group-items`)
stays for when the data is already `{ key, items }`.

## Design — `src/components/select/mono-select.ts`

- **New prop**: `@property({ attribute: 'group', reflect: true, converter: booleanStringConverter })
  group = false`. **Do NOT** add `'group'` to `defineHybridPropAliases` — an all-lowercase name
  self-aliases and infinitely recurses (see [[project_hybrid_prop_aliases]]); a bare boolean
  attribute needs no alias.
- Grouping is active when `displayGroup.length > 0` (unchanged). Two data paths:
  - `group === true` → build the nested tree **client-side** from the accumulated flat rows.
  - else → treat the data as already nested (current pre-grouped path).
- Helpers (reuse the existing `_isGroupNode` / `_firstLeaf` / `_resolveGroupLabel` / `_groupRows`
  / `_renderOption`):
  - `_groupSortFields()` → the string entries of `displayGroup`.
  - `_buildClientTree(rows)` → nest `rows` by each `displayGroup[level]` accessor (string →
    `row[field]`, function → `fn(row)`) into `{ [groupKey]: keyValue, [groupItems]: children }`,
    bucketing by **first appearance** (a `Map`) so every group is contiguous and **grows in
    place** as more pages load — no reshuffle.
  - `_groupNodes()` → `this.group ? _buildClientTree(this._ds.visibleItems) : this._ds.visibleItems`.
  - `_groupRows()` walks `_groupNodes()` (instead of `_ds.visibleItems` directly).
  - `_leafItems` → `this.group ? [...this._ds.sourceItems]` (flat) else flatten the nested tree.
  - Empty/loading check uses the flat row count when `group`.
- **`willUpdate`**: when `group` is on and `dataSource` / `displayGroup` / `group` changed, set the
  source sort to the string group fields (`this.dataSource?.sort?.(_groupSortFields())`) for clean
  incremental loading (groups arrive together). Best-effort; never sends `group`.

## Types

- `select-types.ts`: add `group?: boolean` to `SelectProps`. (`SelectDisplayGroup` already exists.)

## Demos — `demo/.../demos/select/`

- Rework **`vue/grouped.vue`** → a **plain paginated** DataSource (no `group`):
  `monoCreateFetcher({ baseUrl, url:'/DtoProgramTransfer' }).response({ options:{ key:'Id',
  paginate:true, pageSize:20 } })`, then `<mono-select :data-source.prop="ds" group
  load-more="scroll" :display-group.prop="['BrandNama', (r)=>r.DeptNama]" key-value="Id"
  :display-value.prop="(r)=>r.Program">`. Scrolling the dropdown pages flat rows; client-grouped
  headers (Brand → Dept) grow as you scroll. Keep the distinct label.
- Keep **`vue/grouped-static.vue`** (pre-grouped nested array + custom `group-key`/`group-items`,
  no `group` prop) as the pre-grouped example.
- `ui/select.md`: update the **Grouped options** section — contrast `group: true` (plain source,
  client-grouped, scroll/"more" page the flat rows) vs feeding already-grouped `{ key, items }`.

## Verification

1. `pnpm --filter @mono-lit/helper build` clean (ignore pre-existing `button/index.ts` errors).
2. Playwright (`pnpm --filter @mono-lit/helper dev`, Select page): open the grouped select → Brand/Dept
   headers render over the first flat page; scroll the dropdown → DevTools Network shows additional
   **flat** requests (`$skip`/`$top`, **no** `$apply=groupby`) and more rows/groups append without
   reshuffle; pick a leaf → trigger + `modelValue` update; no console errors. The static
   (pre-grouped) demo still renders.
3. Assert the request URLs never contain `groupby` / `group`.
4. Regression: ungrouped select demos and the pre-grouped static demo unchanged.
