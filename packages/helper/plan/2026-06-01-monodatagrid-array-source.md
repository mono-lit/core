# monoDataGrid auto-wraps a plain array

**Date:** 2026-06-01
**Area:** `src/components/table`

## Problem

Driving a table from an in-memory array required two calls with duplicated
options — the caller created a `monoArraySource` and passed it to `monoDataGrid`,
repeating `searchExpr` on both:

```ts
const source = monoArraySource<Row>(data, { pageSize: 8, searchExpr: ['id', 'name', 'email'] })
const table  = monoDataGrid<Row>(source, { searchExpr: ['id', 'name', 'email'] })
```

## Change

`monoDataGrid` now accepts a **plain array** as its first argument. When it
detects one it wraps it internally with `monoArraySource`, so the above becomes:

```ts
const table = monoDataGrid<Row>(data, { pageSize: 8, searchExpr: ['id', 'name', 'email'] })
```

This is **additive** — `monoArraySource` is still exported and the explicit
two-step usage still works, for cases that need direct control of the source.

### API

- `monoDataGrid<T>(ds, opts)` — `ds` is now `MonoGridSource<T> | T[] | null`.
- `MonoDataGridOptions` gains `pageSize?: number`, forwarded to `monoArraySource`
  when wrapping an array (`searchExpr` is already shared and forwarded too).
- New controller method **`setData(next: T[]): Promise<void>`** — replaces the
  backing rows for array-backed tables (delegates to the array source's
  `setData`; a no-op for a remote DataSource). Lets array tables swap data without
  holding the source reference.

### Implementation notes

- The array→source wrap happens inside `bind()`, so both the constructor
  (`monoDataGrid(arr, …)`) and a later `table.bind(arr)` work.
- `monoArraySource` (`array-source.ts`) is reused verbatim; `array-source.ts` only
  imports the **type** `MonoGridSource` from `mono-data-grid.ts`, so the new value
  import (`mono-data-grid` → `array-source`) introduces no runtime cycle.

## Files

- `src/components/table/mono-data-grid.ts` — signature widened, `pageSize` option,
  array-wrap in `bind`, `setData` added (+ on `MonoTableController`).
- `demo/vitepress/docs/demos/table/vue/full.vue` — uses the array form; `setData`
  via `table.setData`.
- `demo/vitepress/docs/demos/table/vue/fixed.vue` — uses the array form.
- `demo/vitepress/docs/ui/table.md`, `demo/vitepress/docs/repo/datasource.md` —
  prose updated to document the array shorthand.

## Verification

1. `pnpm build` in `@mono-lit/helper` (regenerates `dist` + `.d.ts`).
2. `pnpm build` in `demo/vitepress`; on `ui/table`, the Full example (paging,
   search, filters, approve/remove via `setData`) and Fixed columns demos work.
3. Old two-step `monoDataGrid(monoArraySource(...))` still type-checks and runs.
