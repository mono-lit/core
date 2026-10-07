# Table: staged inline edits + manual Save to a DataSource

_2026-07-16_

## Goal

Let inline table edits persist to a **DataSource** (not just a local array),
using a **staged/batch** model: edits buffer in the controller and are shown
optimistically; a **manual Save** flushes them (no request per keystroke).

## Background

`monoDataGrid` is headless and read-only by design — `MonoGridSource.store?()`
was narrowed to `{ load }`, and the inline-edit `commitCell` funnels to a
consumer `onCellChange` that can only `setData` an array (no-op for a remote
DataSource). See `2026-07-16-table-editable-and-th.md`.

## Feature (`mono-data-grid.ts`)

Add a pending buffer `Map<rowKey, patch>` and, on `MonoTableController`:
`stageCell`, `cellValue(rowKey, field, fallback)`, `isCellDirty`, `isRowDirty`,
`pendingCount`, `hasChanges`, `changes()` (`[{rowKey, key, patch, row}]`),
`discardChanges`, and `saveChanges()`. `saveChanges` flushes each staged row:
1. bound DataSource store with `update` → `store.update(key, patch)` per row +
   `reload()`;
2. array source with per-row `update` → `source.update(key, patch)` per row;
3. else `setData` merge of the current page.
On error the buffer is kept (retryable). The immediate `commitCell`/`onCellChange`
path is unchanged and still used by the array `editable` demo.

Type work: new `MonoGridStore` (required `load`; optional `update`/`insert`/
`remove`/`byKey`/`key`) as the `store?()` return; `monoArraySource` gains a
`keyExpr` option + a per-row `update(key, values)`; `bind()` passes `opts.keyExpr`
when wrapping a plain array. New types exported from `table-types.ts` / `index*.ts`
(`MonoGridStore`, `MonoStagedChange`).

## Demo (`demos/table/vue/editable-datasource.vue`)

Binds the writable mono **IndexedDB mock**, activated in-page:
`initMono({ mockIndexedDB: { schema: { 'tbl-mock': { people: { fields, seed } } } } })`
(runtime state — no VitePress plugin needed), then
`monoCreateFetcher({ url: '/tbl-mock/people' }).response(...)`. Header uses
`mono-table-th` with `:editable.prop`; body cells stage via `stageCell` and show
`cellValue`; a toolbar Save button calls `saveChanges()` (→ `store.update` PATCH
→ IndexedDB) and Discard calls `discardChanges()`. Real round-trip that survives
a page refresh. (The public remote OData endpoint is read-only, hence the mock.)

## Verification

Package build (main + shadow) + docs build pass. In the demo: edit → staged
(dirty), no request; Save → PATCH → IndexedDB → reload shows values; refresh
persists; Discard reverts. The array `editable` demo still works.
