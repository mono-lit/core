# Fixed (sticky) columns + `mono-table-th` → `mono-table-sort` rename

## Context

This adds **frozen columns** (pin a column left/right on horizontal scroll, like
a DevExtreme DataGrid) plus a `fixed` demo with many columns.

It also fixes a real problem: the original `mono-table-th` was a custom element
placed directly in `<tr>`, which is **invalid HTML** (a `<tr>` may only contain
`<td>`/`<th>`) — Vue's compiler warned and it risks SSR foster-parenting. A
custom element can only *be* a `<th>` via a customized built-in (`<th is>`),
which Safari permanently rejects. So the header was restructured: keep a **native
`<th>`** and put a small sort control **inside** it.

## Changes

### `src/components/table/mono-table-sort.ts` (renamed from `mono-table-th.ts`)
- New name `mono-table-sort`; meant to sit **inside** a native `<th>`:
  `<th><mono-table-sort field="Nama">Name</mono-table-sort></th>`.
- Renders a real `<button class="mono-table-sort-btn">` (free keyboard/focus
  a11y) with the label + up/down arrow; reflects the controller's sort state and
  sets `aria-sort` on the parent cell.
- The `fixed` prop is **dropped** — pinning is now a pure CSS class on the `<th>`
  (and tds), see below. Slot-capture pattern retained ([[project_lit_lightdom_slot_capture]]).

### `src/components/table/table.css` — "Fixed / sticky columns" block
- One class for both header and body cells, with a **CSS-only offset variable**
  (default 0 → single pinned column is zero-config):
  `.mono-table th.mono-table-sticky-left, td.mono-table-sticky-left { position: sticky; left: var(--mt-sticky-left, 0) }`
  (mirror `--mt-sticky-right`). For 2+ pinned columns per side, the consumer sets
  the variable on the later column(s) to the combined width of the ones before it
  (with fixed widths). **No JS** — an earlier `monoStickyColumns(ref)` helper was
  removed because it felt too manual.
- Header cells get an opaque background (`color-mix(--mt-primary 7%, white)`,
  matching the gradient) and `z-index: 3`.
- Body cells take the row background (`--mt-surface`, with `--mt-zebra` /
  `--mt-soft` overrides for even / hover / selected) so scrolled content can't
  bleed through; `z-index: 1`.
- Edge shadow (`box-shadow`) on both header and body sticky cells to read as
  frozen. (SUPERSEDED: the blur was later dropped — the edge is now a HAIRLINE
  `box-shadow: 1px 0 0 0 var(--mono-table-border)`, a crisp 1px rule rather than a
  soft shadow. It stays a box-shadow rather than becoming a border for the reason
  this line originally chose one: the table is `border-collapse: collapse`, so a
  border belongs to the table and does not reliably travel with a sticky cell.) Lands in `dist/ui/index.css` via the existing `entries/index.css`
  `@import`. Works because `.mono-table-scroll` (`overflow-x: auto`) is the
  scroll container; modern browsers support sticky cells with
  `border-collapse: collapse`.

### Wiring — `index.ts` / `table-types.ts`
- `index.ts` exports `MonoTableSort` (was `MonoTableTh`); `table-types.ts` renames
  `TableThProps` → `TableSortProps` (no `fixed` prop).

### Demo + docs (kept `sorting`, added `fixed`)
- `demo/vitepress/docs/demos/table/vue/fixed.vue` — static 16-row, 8-column
  employee dataset via `monoArraySource` + `monoDataGrid`; `<mono-card full-width>`
  + search toolbar + wide `<table style="min-width:1100px">` in `.mono-table-scroll`
  + paging footer. First `<th class="mono-table-sticky-left">` (sortable + pinned),
  last `<th class="mono-table-sticky-right">`; matching `<td>`s carry the same
  classes. Sortable columns use `<mono-table-sort>` inside the `<th>`.
- `sorting.vue` updated to `<th><mono-table-sort>`; `manifests/table.ts` + a
  "Fixed columns" section in `ui/table.md`.

## Verification
- `pnpm build` (lib) clean; `.mono-table-sticky-left/right` +
  `.mono-table-sort-btn` rules in `dist/ui/index.css`; `MonoTableSort` exported,
  `mono-table-sort` registered, no stale `mono-table-th` in dist. ✅
- Docs production build (exit 0) — the `<tr>` nesting warning is gone. ✅
- Docs build renders the `fixed` page (unrelated `select`/`tag-input` datasource
  blockers temporarily SSR-fixed then reverted).
- Manual: scroll horizontally — `Name` stays pinned left, `Status` pinned right,
  both with a hairline edge rule and correct zebra/hover backgrounds; sorting still
  works.

## Out of scope
- More than one pinned column per side (cumulative offsets).
- Vertically sticky header row.
