# Make `monoDataGrid` the all-in-one grouped-table helper

## Context

The grouped demos are too much glue. Each `.vue` hand-writes: a `tree` ref + `subscribe`
mirror, a recursive `displayRows` walk + `isGroupNode` + `rowKey`, and — for the server
case — ~50 lines of `loadGroups`/`loadRows` OData. The user wants **one helper**:
pass the plain `dataSource` + the right props to `monoDataGrid`, and it handles grouping,
server paging, and produces a ready-to-render row list. No `serverGroup` callbacks in the
demo, no separate `monoCreateGroupSource`.

Key enabler: a devextreme `DataSource` exposes `.store()`, and `store.load(loadOptions)`
does everything we need — the cheap group list (`group:[{selector,isExpanded:false}]` +
`groupSummary` + `requireGroupCount` → `$apply=groupby(...aggregate($count, … sum …))`,
verified to work on this backend) and each group's row page (`filter:[[field,'=',key]]` +
`skip`/`take` + `sort` → `$filter`/`$skip`/`$top`). So the controller drives server group
paging itself from the bound dataSource and **@mono-lit/helper stays dependency-free** (it never
imports the fetcher; it only duck-types `store.load`).

The server-group engine already exists (`serverGroups` / `groupRows` / `fetchVisibleRows` /
`renderServer` / `loadGroupsServer` etc.). This change **auto-builds** its two callbacks
from the dataSource, **exposes `displayRows`**, and **slims the demos** — minimal new code.

## Design (keep it minimal)

### 1. `displayRows` on the controller (`mono-data-grid.ts`)
A flat, keyed, ready-to-render list rebuilt in each `sync()`/`renderServer()`/`syncGrouped()`,
stored as `ctrl.displayRows`:

```ts
interface MonoDisplayRow<T> {
  key: string                       // stable v-for key
  kind: 'group' | 'row' | 'footer'
  level: number
  node?: MonoGroupNode<T>           // group / footer
  row?: T                           // row
}
```
- Ungrouped → one `{kind:'row'}` per row.
- Grouped → walk `ctrl.items` honoring `collapsed`; emit `group` headers, `row`s, and a
  `footer` (per-group pager slot) after an innermost group **when per-group paging is on**
  (server mode, or `groupRowPageSize` set, or a registered per-group page).
- Leaf key from `opts.keyExpr` (default `'Id'`) → `r:<path>:<id>`; group/footer keyed by path.
This removes the walk / `isGroupNode` / `rowKey` from every demo (they iterate `displayRows`).

### 2. Auto server-group from the bound dataSource (`store-group-source.ts`, new)
`storeGroupSource(ds, { groupField, select, searchExpr, searchOperation, groupSummary })`
returns a `MonoServerGroupSource` implemented purely via `ds.store().load(...)`:
- `loadGroups(ctx)` → `store.load({ group:[{selector:groupField, isExpanded:false}],
  groupSummary, requireGroupCount:true, filter:searchFilter(ctx.search), sort })` → map each
  group to `{ key, count, aggregates }` (aggregates from `group.summary` aligned to
  `groupSummary` order). Handles array vs `{data}` return shapes.
- `loadRows(key, ctx)` → `store.load({ filter:[[groupField,'=',key] (+ search)], select,
  sort:ctx.sort, skip:ctx.skip, take:ctx.take })` → rows.

In `monoDataGrid`/`bind`: when `group` is a **single** field, no explicit `opts.serverGroup`,
and the bound source has a `store` function, set the controller's `serverGroup` to
`storeGroupSource(source, …)`. Then existing `serverMode()` + `loadGroupsServer()` take over.
Otherwise behavior is unchanged: **array or multi-level remote → client grouping; single
field already only is server**. Add `store?: () => { load(opts): PromiseLike<any> }` to
`MonoGridSource` (duck-typed).

### 3. New options on `MonoDataGridOptions`
- `groupSummary?: Record<string, 'sum'|'avg'|'min'|'max'|'count'>` — per-group aggregates
  (server) → surfaced as `node.meta.aggregates` (e.g. a subtotal).
- `select?: string[]` — fields fetched for group rows (server). Optional.
- `keyExpr?: string` — row key field for `displayRows` keys (default `'Id'`).
- Keep `serverGroup?` as an **advanced override** (rarely needed now).

Exports: `MonoDisplayRow` and the new option types via `table-types.ts` + `index.ts`.
Group-header template markup stays as-is (user's choice). `table.css` unchanged.

## Demos (`demo/.../demos/table/vue/`) — slim to "pass dataSource + props"

`grouped-budget.vue` (server, the showcase) becomes ~:
```ts
const { dataSource } = await monoCreateFetcher({ baseUrl, url:'/DtoProgramTransfer' })
  .response({ options: { key:'Id' } })
const table = monoDataGrid(dataSource, {
  group:['DeptNama'], pageSize:3, groupRowPageSize:5,
  searchExpr:['Program','CoaNama'], select:[…], groupSummary:{ TotalBudget:'sum' },
})
const rows = ref([]); const loading = ref(false)
const off = table.subscribe(() => { rows.value = table.displayRows; loading.value = table.loading })
onMounted(table.load); onBeforeUnmount(() => { off(); table.dispose() })
```
Template: `v-for item in rows` → `group` header (key, count, `node.meta.aggregates.Sum`),
`row` cells, `footer` → `<mono-table-paging-group :data-grid.prop="table" :group.prop="item.node.path"/>`.
No `serverGroup`, no `loadGroups`/`loadRows`, no walk/keys.

`grouped-static.vue` (array → client) and `grouped.vue` (multi-level remote → client) use the
same `displayRows` shape — also drop their walk/keys. Update `ui/table.md`: pass a dataSource
(or array) + props; single-field remote groups page lazily on the server automatically.

## Verification

1. Early node test vs the live endpoint to lock `store.load` shapes:
   `const s = dataSource.store(); await s.load({group:[{selector:'DeptNama',isExpanded:false}],
   groupSummary:[{selector:'TotalBudget',summaryType:'sum'}],requireGroupCount:true})` → expect
   `{data:[{key,count,summary}],groupCount}`; `await s.load({filter:['DeptNama','=','Marketing'],skip:0,take:5})`
   → 5 rows. Adjust mapping to the real shape.
2. `pnpm --filter @mono-lit/helper build` clean (ignore pre-existing `button/index.ts` errors).
3. Node smoke test of the controller with a **mock** `store` (records `load` calls): initial
   `load()` → one group `load`, row `load` only for visible groups at `skip:0,take:5`;
   `setGroupPage` → one `load({skip:5,take:5})`; `displayRows` shape correct; collapsed → no row load.
4. Playwright on `pnpm --filter @mono-lit/helper dev` (Table → Grouping): all three demos render,
   **no "Maximum recursive updates"**, main + per-group paging work; budget Network shows one
   `groupby` + a few `$top=5` (no full load); subtotal shows from `groupSummary`.
5. Regression: ungrouped Basic/Sorting/Full unchanged.
