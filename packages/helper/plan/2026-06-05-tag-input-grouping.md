# Grouped options for `mono-tag-input` (port of select grouping)

## Context

`mono-select` gained grouped options: `display-group` (per-level accessors), `group-key` /
`group-items` (for pre-grouped `{ key, items }` data), `group` (group a **plain, paginated**
source client-side so scroll/"more" keep working), and `group-sticky` (pin headers). The user
wants the **same feature** on `mono-tag-input`, which is structurally near-identical (same
`DataSourceController`, `_resolveItemValue`/`_resolveItemDisplay`, `_normalizeItems`,
`load-more`, light-DOM dropdown). Reference implementation: `src/components/select/mono-select.ts`
(helpers `_isGroupNode` / `_firstLeaf` / `_resolveGroupLabel` / `_groupSortFields` / `_groupKeyOf`
/ `_buildClientTree` / `_groupNodes` / `_groupRows` / `_leafItems`) + `select.css`
`.mono-select-group[.sticky]`.

**Three tag-input-specific differences** to handle (select lacks these):
- It has **search** — `_filteredItems` filters `_visibleItems` by the typed query.
- It has **keyboard nav** — `_activeIndex` indexes the option list.
- It's **multi-select** — selected options stay in the list (`.selected` / checkbox), toggled by
  `_toggleValue`; they are never hidden.

## Design — `src/components/tag-input/mono-tag-input.ts`

- **Props** (mirror select): `displayGroup: TagInputDisplayGroup = []` (`attribute:false`);
  `groupKey='key'` / `groupItems='items'` (string attrs `group-key`/`group-items`);
  `group=false` (`attribute:'group'`, `booleanStringConverter`); `groupSticky=false`
  (`attribute:'group-sticky'`, `booleanStringConverter`). Add `displayGroup`,`groupKey`,
  `groupItems`,`groupSticky` to `defineHybridPropAliases` — **NOT** `group` (all-lowercase →
  self-alias recursion, see [[project_hybrid_prop_aliases]]).
- **Copy these select helpers verbatim** (rename `SelectItem`→`TagInputItem`): `_grouped`
  (`displayGroup.length>0`), `_isGroupNode`, `_firstLeaf`, `_resolveGroupLabel`,
  `_groupSortFields`, `_groupKeyOf`, `_buildClientTree`, `_leafItems`.
- **Search + grouping coexist.** Make `_filteredItems` the flat, **search-filtered leaf rows in
  display order** (so `_activeIndex` stays aligned with what's rendered):
  - Add `_searchMatches(item)` = the current display/value/description query test.
  - `_groupRows()` returns ordered rows `{kind:'group',level,label,key}` |
    `{kind:'item',item,index}` where `index` is a running counter over emitted items:
    - `group===true`: leaves = `_allLeaves()` (the flat `_visibleItems`) filtered by
      `_searchMatches`; tree = `_buildClientTree(leaves)`; walk it.
    - else (pre-grouped): walk the nested `_visibleItems`, emitting only leaves that pass
      `_searchMatches` and dropping groups with no surviving leaves.
  - `_filteredItems` = the `item`s from `_groupRows()` in order (ungrouped → keep current flat
    filter). `_activeIndex` indexes this list, so arrow keys traverse visible leaves and headers
    are skipped naturally.
- **Chip labels / value lookup**: where `_normalizedItems` resolves a chip's label by value
  (`_getItemByValue`), use `_leafItems` when grouped (flatten the tree) so selected values still
  resolve.
- **Render** (`_renderItems`): when `_grouped`, map `_groupRows()` → group header
  `<div class="mono-tag-input-group${sticky?' sticky':''}" data-level=…>` and, for items, the
  existing option `<button>` (extract `_renderOption(item, index)` from the current map body so
  active/selected/checkbox/description markup is reused). Else keep the flat path. Empty/loading
  unchanged (use leaf count when grouped). Selected options stay visible (tag-input behavior).
- **`willUpdate`**: when `group` on and `dataSource`/`displayGroup`/`group` changed, set
  `this.dataSource?.sort?.(_groupSortFields())` (string levels) for clean incremental loading.
  Never sends `group` → paginate stays on.

## Types / CSS / exports

- `tag-input-types.ts`: `export type TagInputDisplayGroup = Array<string | ((item: TagInputItem)
  => string)>`; add `displayGroup`/`groupKey`/`groupItems`/`group`/`groupSticky` to
  `TagInputProps` (with kebab+lower variants); optional `group` on `TagInputCssClass`.
  `index.ts`: export `TagInputDisplayGroup`.
- `tag-input.css`: add `.mono-tag-input-group` (muted/bold/small, non-interactive, indent by
  `data-level` via `--ms-group-level`-style step) and `.mono-tag-input-group.sticky`
  (`position:sticky; top: calc(level*≈1.6rem); z-index` descending; opaque
  `--tag-input-surface`/`#fff` background) — model on select's rules.

## Demos — `demo/.../demos/tag-input/vue/` + `ui/tag-input.md`

Mirror the select grouped demos:
- `grouped.vue` — plain paginated DataSource (`DtoProgramTransfer`, **no** `group`, `pageSize:20`)
  + `group` + `group-sticky` + `load-more="scroll"` +
  `:display-group.prop="['BrandNama', (r)=>r.DeptNama]"`, `key-value="Id"`, function
  `display-value`. Multi-select tags; scroll pages flat rows; Brand→Dept headers grow.
- `grouped-large.vue` — 1,200 static rows via `map` (team→role), `:items.prop`, `group`,
  `group-sticky`, `load-more="scroll"`, `page-size="60"`.
- `grouped-static.vue` — pre-grouped nested array with custom `group-key`/`group-items`
  (e.g. `k`/`rows`), no `group` prop.
- `ui/tag-input.md`: add a **Grouped options** section explaining the two modes + `group-sticky`,
  with the three `<DemoSingle name="tag-input" id="…"/>` blocks. (CSS-tab demos optional, like
  `datasource`.)

## Verification

1. `pnpm --filter @mono-lit/helper build` clean (ignore pre-existing `button/index.ts` errors);
   `mono-tag-input` still ships in `ui/tag-input`.
2. Playwright (`pnpm --filter @mono-lit/helper dev`, Tag input page): open the grouped tag-input →
   Brand/Dept headers render with `position: sticky`; scroll → Network shows flat `$skip`/`$top`
   requests (**no** `$apply=groupby`), groups grow; **click options to add multiple tags**
   (selected rows stay visible/marked); **type to filter** → only matching leaves + their group
   headers remain; keyboard ↑/↓ traverses visible leaves. No console errors. Static + large demos
   render; large one reveals chunks on scroll.
3. Assert grouped requests never contain `groupby`/`group`.
4. Regression: ungrouped tag-input demos (basic/custom-keys/datasource/checkable) unchanged.
