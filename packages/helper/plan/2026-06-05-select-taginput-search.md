# Searchable `mono-select` + `mono-tag-input`

## Context

The user wants to **type a search and have the dropdown show exactly the matching results** in
both components. Today: `mono-tag-input` has an input that filters the **loaded** items
client-side (so with pagination/scroll it misses matches on unloaded pages); `mono-select` has
**no search input at all** (button trigger, shows every loaded option).

Confirmed behavior: when a **DataSource** is bound, typing should **query the server** (debounced
— the table's `setSearch` pattern: `searchExpr`/`searchOperation`/`searchValue` + `pageIndex(0)` +
`load()`), so the dropdown reflects the **full** matching result set and scroll pages the filtered
results. A static `items` array filters **client-side**. Fields are named by a **`search-value`**
prop (string | string[]); when omitted, fall back to the `display-value` field (if a string) /
`key-value`. The client filter also tests display + value text so it always works. Coexists with
the grouping feature (search-filtered rows are grouped client-side).

Reference: `monoDataGrid.setSearch` in `src/components/table/mono-data-grid.ts`; the
`ds.filter(...) + ds.load()` pattern in `demos/select/vue/datasource.vue`; devextreme
`searchExpr`/`searchOperation`/`searchValue` exist on the bound DataSource (`fetching.d.ts`).

## Shared design (both components)

New props (camelCase + kebab/lower via `defineHybridPropAliases`):
- **`searchValue` / `search-value`**: `string | string[]` — field(s) to search. Attribute
  `search-value="Nama"` (comma-split) or `:search-value.prop="['Nama','Code']"`.
- **`searchOperation` / `search-operation`**: string, default `'contains'`.
- **`searchDebounce` / `search-debounce`**: number, default `300` (ms).
- **`searchPlaceholder` / `search-placeholder`**: string, default `'Search…'`.

Shared helpers:
- `_searchFields(): string[]` — normalize `searchValue` (string→`[field]` or comma-split; array
  as-is); fallback to `displayValue` (when string) then `keyValue`.
- `_serverSearch(): boolean` — `!!this.dataSource` (a bound source can be queried; arrays → client).
- `_applySearch(query)` (debounced via a stored timer): if `_serverSearch()` →
  `ds.searchOperation?.(this.searchOperation || 'contains')`, `ds.searchExpr?.(this._searchFields())`,
  `ds.searchValue?.(query || null)`, `ds.pageIndex?.(0)`, `await ds.load()` (the
  `DataSourceController` restarts accumulation from page 0 on the resulting `changed`); else just
  `requestUpdate()` (client filter recomputes).
- `_searchMatches(item)`: in **server** mode return `true` (the server already filtered); in
  **client** mode test the query against `_resolveItemDisplay` + value (+ description for tag-input).

## `mono-select.ts`

- Add `searchable` boolean prop (`attribute:'searchable'`, NOT aliased — lowercase self-alias).
  When `searchable` and `_open`, render a search `<input class="mono-select-search-input">` at the
  **top of `.mono-select-dropdown-body`** (before `_renderItems()`); `@input` → debounced
  `_applySearch`; focus it when the dropdown opens (in `updated()` when `_open` turns true).
- Add `@state _query=''`. New `_filteredItems` getter: flat path filters `_visibleItems` by
  `_searchMatches`; grouped path — port tag-input's **search-filtered `_groupRows`** (filter leaves
  by `_searchMatches`, assign no index needed — select has no keyboard active-index, so just drop
  non-matching leaves + empty groups). `_renderItems`/`_groupRows` use it. Empty state when no
  matches.
- On close (`_close`) and after selecting: reset `_query=''`; if `_serverSearch()`, clear the
  query on the source (`searchValue(null)` + `pageIndex(0)` + `load()`) so reopening is unfiltered.

## `mono-tag-input.ts`

- It already has the input (`_inputValue`) + client `_filteredItems`. Wire **server search**: in
  `_handleInput`, when `_serverSearch()`, debounce `_applySearch(this._inputValue)`. Make
  `_searchMatches` short-circuit `true` in server mode so the loaded (already-filtered) rows aren't
  double-filtered. No `searchable` prop (the input is always present). Reset/clear the source query
  when the input is cleared or the dropdown closes.

## Types / CSS / demos

- `select-types.ts` / `tag-input-types.ts`: add `searchValue` (+`search-value`/`searchvalue`),
  `searchOperation`, `searchDebounce`, `searchPlaceholder` to the Props; `searchable` on
  `SelectProps`.
- `select.css`: `.mono-select-search` wrapper + `.mono-select-search-input` (reuse trigger/input
  tokens; a bottom border, sticky at top of the body). tag-input input already styled.
- Demos: `demos/select/vue/searchable.vue` — `searchable` + DataSource + `search-value="Nama"` →
  server `$filter` while typing, scroll pages filtered results; `demos/tag-input/vue/searchable.vue`
  — DataSource + `search-value` → server search while adding tags. Add **Search** sections to
  `ui/select.md` and `ui/tag-input.md`.

## Verification

1. `pnpm --filter @mono-lit/helper build` clean (ignore pre-existing `button/index.ts` errors).
2. Playwright (`pnpm --filter @mono-lit/helper dev`): **Select** → open searchable demo → search box
   focused; type → DevTools Network shows an OData request with `$filter=…contains…` (debounced),
   dropdown shows matching rows; scroll pages the filtered set; pick one → value set, query reset;
   clearing the box reloads unfiltered. **Tag input** → type → server `$filter` request, dropdown
   shows matches, click adds tags. Static (array) demos filter client-side with no request. No
   console errors.
3. Assert the search request URL contains the query (`contains`/`$filter`) and resets `$skip` to 0.
4. Regression: ungrouped + grouped demos unchanged; search coexists with `group`.
