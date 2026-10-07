# Repo docs: "DataSource" page (OData via `monoCreateFetcher`)

## Context

`repo/data-fetching.md` documents the `fetching` config + the plain fetch
functions (`monoFetch` / `monoFetchOdata`). It didn't cover the **DataSource**
object — the live, paginated/filterable handle to a remote OData endpoint that
the UI components bind to. Added a focused page for it, built around
`monoCreateFetcher`.

## What was added

### `demo/vitepress/docs/repo/datasource.md` (new)
Pure-markdown page (prose + fenced code, matching the other `repo/` pages — no
live components), four sections:
1. **What is a DataSource** — a reactive, load-on-demand handle to a remote OData
   store (paging / filtering / sorting + a `changed` event); bind it to a
   component instead of fetching into an array.
2. **Create one with `monoCreateFetcher`** — top-level import;
   `monoCreateFetcher({ baseUrl, url }).response({ options: { select, paginate, pageSize } })`
   → `{ dataSource }`. Notes `baseUrl` vs `configBaseUrl` (links data-fetching),
   the `options` fields, and that `key` defaults to `Id`.
3. **Example: `mono-select` + `/DTO_Departmen`** — full SFC binding
   `:data-source.prop` with `key-value` / `display-value` / `load-more="scroll"`,
   reading selection from `@mno-change`, plus the external `ds.filter() +
   ds.load()` snippet and a "why `.prop`" tip.
4. **Components that accept a DataSource** — `mono-select`, `mono-tag-input`
   (`:immediate.prop`), and `mono-table` (via `monoDataGrid` + `:data-grid.prop`),
   each with a minimal binding and a link to its `/ui/*` page.

### `demo/vitepress/docs/.vitepress/config.ts`
Added `{ text: 'DataSource', link: '/repo/datasource' }` to the **Mono-Repo**
sidebar group, after `Data Fetching`.

## Sources referenced
- `@mono-lit/utility/pkg/wrapper-fetching.ts` — `monoCreateFetcher` (= the core
  `createFetcher`); `use-fetch-helper.ts:1590` `.response()` (defaults
  `type:'datasource'`, locks `key:'Id'`).
- `demos/select|tag-input/vue/datasource.vue`, `mono-select.ts` props
  (`data-source` / `key-value` / `display-value` / `load-more` / `immediate`);
  `/ui/table` for the `monoDataGrid` binding.

## Verification
- The page is static markdown (no `<mono-*>` rendering / script imports), so it
  renders in `vitepress build` / `dev` and adds nothing to the pre-existing SSR
  prerender break caused by the top-level-import live demos (unrelated).
- Sidebar shows **DataSource** under Mono-Repo; snippets match the real API.
