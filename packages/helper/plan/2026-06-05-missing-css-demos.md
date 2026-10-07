# Fill in the missing CSS-tab demos

## Context

Every doc demo has a **Vue** and a **CSS** tab (`DemoSingle` pairs `demos/<comp>/vue/<id>.vue`
with `demos/<comp>/css/<id>.vue` via `import.meta.glob` — no `.md` change needed to wire a new
css file). An inventory found **20 demos missing their CSS counterpart** (all are vue-only):

- **table** (9): `basic, colors, external-control, fixed, full, grouped, grouped-budget,
  grouped-static, sorting`
- **select** (5): `datasource, grouped, grouped-large, grouped-static, searchable`
- **tag-input** (6): `checkable, datasource, grouped, grouped-large, grouped-static, searchable`

Per the existing convention (e.g. `select/css/basic.vue` uses real `.mono-select` markup, while
`select/css/custom-keys.vue` is a dashed note-card saying "no plain-HTML counterpart — see the Vue
tab") and the user's choice (**hybrid**): write **real static-HTML** CSS demos for the table (it's
headless CSS — you render your own `<table class="mono-table">`), and **note-card** CSS demos for
the select/tag-input JS-only features.

## Approach

### A. Table → real static `<table class="mono-table">` demos (`demos/table/css/*.vue`)

Plain HTML mirroring each Vue demo's columns/footer, using the existing table CSS classes (read
each `demos/table/vue/<id>.vue` for column/look, and the helper components for the static markup
they render). Reusable static snippets:
- Shell: `<div class="mono-table-scroll"><table class="mono-table"> <thead><tr><th>…</th></tr></thead>
  <tbody><tr><td>…</td></tr></tbody></table></div>` (wrap in `<mono-card bordered full-width>` like
  the Vue demos, or a plain div).
- Footer: `<div class="mono-table-foot"><label class="mono-table-page-size"><span>Rows:</span>
  <select class="mono-table-sel"><option>10</option>…</select></label>
  <span class="mono-table-info">Showing 1–10 of 45</span>
  <div class="mono-table-pg"><button class="mono-table-pgb">‹</button>
  <button class="mono-table-pgb on">1</button><button class="mono-table-pgb">2</button>
  <button class="mono-table-pgb">›</button></div></div>`.
- Search: `<div class="mono-table-search"><input class="mono-table-search-input" placeholder="Search…"></div>`.
- Per file:
  - `basic` — departments (Id/Code/Name) + footer.
  - `colors` — same table with a color class (`mono-table-primary` … show 2–3 variants).
  - `sorting` — `<th>` with `<button class="mono-table-sort-btn" data-dir="asc"><span
    class="mono-table-sort-label">Name</span><span class="mono-table-sort-ind"><svg
    class="mono-table-sort-caret up">…</svg><svg class="mono-table-sort-caret down">…</svg></span></button>`.
  - `fixed` — `mono-table-sticky-left` / `-right` on a header `<th>` + body `<td>`s.
  - `full` — richer styled table: a `mono-table-row-selected` row, `mono-chip`s, an empty/`mono-table-empty`
    note — representative of the Vue "full" demo.
  - `external-control` — a normal styled table with the search box (the "external" bit is behavioral).
  - `grouped` / `grouped-static` — group rows: `<tr class="mono-table-group-row"><td colspan="3"
    class="mono-table-group-cell"><button class="mono-table-group-toggle"><span
    class="mono-table-group-caret">caret-svg</span><span class="mono-table-group-key">Marketing</span>
    <span class="mono-table-group-count">(3)</span></button></td></tr>` then leaf `<tr>`s.
  - `grouped-budget` — grouped rows + a per-group footer row (`mono-table-group-foot`) holding a
    static `.mono-table-pg`, plus a right-aligned subtotal cell.

### B. Select & tag-input → note-card demos (`demos/{select,tag-input}/css/*.vue`)

Copy the exact dashed-card markup from `select/css/custom-keys.vue` / `tag-input/css/custom-keys.vue`,
swapping the `<strong>…</strong>` feature name and the `&lt;mono-select&gt;`/`&lt;mono-tag-input&gt;`
tag. One file per missing id (datasource, grouped, grouped-large, grouped-static, searchable for
select; + checkable for tag-input). Wording: e.g. "`group` + `display-group` live on the
`<mono-select>` custom element — there is no plain-HTML counterpart; see the Vue tab."

## Verification

1. `pnpm --filter @mono-lit/helper dev` → open **Table**, **Select**, **Tag input** pages.
2. Toggle each updated demo's **CSS** tab: table demos show a styled static `<table class="mono-table">`
   (correct headers, footer paging buttons, colors, sticky columns, group rows); select/tag-input
   show the dashed note card. No console errors; the CSS source panel shows the new markup.
3. Spot-check via Playwright that `demos/table/css/basic.vue` renders a `.mono-table` with rows and a
   `.mono-table-pg`, and `demos/select/css/grouped.vue` renders the note card.
4. No code/build changes — pure docs; existing Vue demos and `.md` files are untouched.
