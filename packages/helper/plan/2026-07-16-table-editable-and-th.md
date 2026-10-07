# Table: `mono-table-th` unified header cell + inline row editing

_2026-07-16_

## Goal

Add a single declarative column-header element, **`mono-table-th`**, that folds
the existing sort control plus a new inline-edit config into one place, and a
controller-backed **row-editing** capability. Keep the existing
`mono-table-sort` element unchanged (it's in production use).

## Background

The table is headless: `monoDataGrid()` is a controller closure; the consumer
authors the native `<table>` and drops `mono-table-*` helper elements into it,
all bound with `:data-grid.prop` and subscribing to the controller. There was no
column model and no edit state. See `2026-05-31-table-helper-system.md`,
`2026-06-01-table-sortable-header.md`, `2026-06-07-table-sort-dual-chevron.md`.

## Public API

`mono-table-th` (place inside a native `<th>`):

| prop | binding | meaning |
|---|---|---|
| `field` | attr | column data key |
| `caption` | attr | header text (falls back to slotted text) |
| `sort` | `.prop` | `{ order?: 'asc'\|'desc'; noClear?: boolean; disabled?: boolean }` — presence (with `field`) makes it sortable; `order` seeds the initial sort once |
| `editable` | `.prop` | `{ type: 'string'\|'number'\|'boolean'; editor: 'input-text'\|'input-number'\|'checkbox'\|'switch' }` — presence marks the column editable |

Editor ↔ type pairing (built-in editors): `input-text`↔string, `input-number`↔
number, `checkbox`/`switch`↔boolean. A future step adds a custom-editor slot so a
consumer can supply their own editor element per cell.

New controller surface on `MonoTableController` (`mono-data-grid.ts`):
`registerColumn` / `unregisterColumn` / `columns()` / `editableColumns()`;
`editingKey`; `beginEditRow` / `cancelEdit` / `isEditingRow` / `isEditingCell`;
`commitCell(rowKey, field, value)` → funnels to the assignable `onCellChange`
sink; `editorKeydown(event, rowKey, field)` for Tab/Enter/Esc navigation.

## Editing model (chosen: header-config-only)

The body stays consumer-authored native HTML. `mono-table-th` registers the
column config; the controller owns edit state + column order. The consumer writes
the per-cell `v-if` editor swap. Rationale: matches the "you author the table"
architecture; the framework never renders `<td>`s. (A companion `mono-table-td`
that auto-renders the editor from `editable` is a deliberate future step.)

- **Trigger**: double-click a row → `beginEditRow`. Single click stays free.
- **Scope**: the whole row's editable cells become editors at once.
- **Tab**: native Tab moves within the row (non-editable cells aren't focusable);
  at a row boundary `editorKeydown` intercepts, `beginEditRow`s the next/previous
  row, and focuses its first/last editor via a `data-row-key` + `data-edit-cell`
  DOM query scoped to the event target's `<table>`. Enter/Esc leave edit mode.
- **Commit**: editors call `commitCell`; the consumer's `onCellChange` updates its
  own full array + `setData` (correct for paged sources, unlike mutating the
  current page slice).

## Files

- `table-sort-utils.ts` (new): `nextOrder` / `ariaSort` / `sortTitle` — pure
  helpers extracted from `mono-table-sort-core.ts` (behavior-preserving) and
  shared with the new header core.
- `mono-table-th-core.ts` / `mono-table-th.ts` (light, `mono-table-th`) /
  `mono-table-th.shadow.ts` (`mono-shadow-table-th`) — mirror the
  `mono-table-sort` trio; reuse the `.mono-table-sort-*` dual-chevron markup so
  existing CSS styles it.
- `mono-data-grid.ts`: column registry + edit-state methods + `MonoColumn*` /
  `MonoCellChange` types.
- `table-types.ts`: `TableThProps` / `TableThSort` / `TableEditable`.
- `index.ts` / `index.shadow.ts`: export element + types.
- `src/vite/shadow-manifest.ts`: add `mono-shadow-table-th` to `table`.
- `table.css`: `.mono-table-row-editing` + inline-editor cell padding.
- Demo: `demo/vitepress/docs/demos/table/vue/editable.vue` + manifest entry +
  `docs/ui/table.md` "Editable rows" section.

## Verification

Package build (main + shadow) passes; docs build passes; in the demo, double-click
edits a row, Tab walks cells/rows, edits persist via `setData`, and the sort
chevrons behave exactly like `mono-table-sort`. The existing Sorting demo (still
using `mono-table-sort`) is unchanged.
