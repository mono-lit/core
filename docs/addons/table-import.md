# Import Table

Read an edited spreadsheet back into the grid with `table.import()`. Each sheet
row is paired with a table row by composite key, the declared columns are parsed
and compared, and the differences land in the grid's **staged changes** — shown
optimistically, reviewable, and written to your data only when you call
`saveChanges()`. Nothing is touched until then, and `discardChanges()` undoes the
whole import.

```ts
const result = await table.import({
  type: 'excel',                                  // or 'copy-paste'
  data: file,                                     // File/Blob/ArrayBuffer · or pasted text

  match: [                                        // how a sheet row finds its table row
    { excel: 'CH.',      field: 'Channel' },
    { excel: 'Brand',    field: 'Brand' },
    { excel: 'Activity', field: 'Activity' },
  ],
  columns: [                                      // what the sheet may write
    { excel: 'JAN', field: 'Jan', type: 'number' },
  ],
})

if (!result.ok) warn(`${result.unmatched} rows didn't match`)
```

The parser is loaded on first use, so importing costs nothing until you do it.

::: tip Install for `.xlsx`
Reading a real workbook uses the optional `exceljs` peer — the same one
[Export Table](/addons/table-export) needs. Pasted text needs nothing.

```sh
pnpm add exceljs
```
:::

## Round trip

Export the grid, edit it in Excel, upload it back. Imported cells are tinted
(blue) separately from hand edits (amber), and stay unsaved until you press Save.

<ClientOnly>
<DemoSingle name="table" id="import-basic" />
</ClientOnly>

## Input

One `data` field carries the payload; `type` says how to read it, and is inferred
when you leave it out — a string is treated as a paste, anything else as a
workbook.

| `type` | `data` | Notes |
|--------|--------|-------|
| `'excel'` | `File \| Blob \| ArrayBuffer \| Uint8Array` | Pick a worksheet with `sheet` (name or index; default: the first). |
| `'copy-paste'` | `string` | Tab / `;` / `,` auto-detected; quoted cells (`"Acme, Inc."`) handled. |

If the table starts below a title block, say where the headers are:

```ts
await table.import({ data: file, headerRow: 3, match, columns })
```

## Matching

`match` declares a composite key. Rather than demanding all of it, **every subset
is tried, strongest first** — so a sheet whose Channel column got cleared still
matches on Brand + Activity, and a column dropped entirely doesn't break the
import.

A subset that resolves to **several** rows is reported as *ambiguous* rather than
guessed at — silently picking the first would corrupt data in a way nobody
notices for weeks.

| Outcome | Meaning | Where it lands |
|---------|---------|----------------|
| hit | Exactly one table row | staged |
| ambiguous | The strongest usable key hit several rows | `ambiguousRows` |
| miss | No row at all | `unmatchedRows` |

Raise `minKeyFields` (default `2`) when a small subset would produce false
matches. Headers are compared leniently — case, spacing, `.` and `_` are ignored,
so `No. Dok`, `NO_DOK` and `no dok` are the same column. Accept other spellings
with `headerAliases`:

```ts
await table.import({
  data, match, columns,
  headerAliases: { JAN: ['Januari', 'Jan-26'] },
  minKeyFields: 3,
})
```

Key comparison is trimmed, whitespace-collapsed and case-insensitive. Override it
per leg with `transform`, or globally with `normalizeKey`:

```ts
match: [
  { excel: 'Ship to', field: 'ShipName', transform: (v) => String(v).replace(/^_/, '') },
]
```

## Columns

`columns` says what may be written and how to read it. **Only cells that differ
are staged**, so re-importing an unchanged sheet is a no-op.

```ts
columns: [
  { excel: 'JAN',   field: 'Jan',    type: 'number' },
  { excel: 'Due',   field: 'DueAt',  type: 'date' },
  { excel: 'Aktif', field: 'Active', type: 'boolean' },
  { excel: 'Note',  field: 'Note' },                    // 'string' (default)
]
```

`transform` post-processes a parsed value; returning `undefined` skips the cell:

```ts
{ excel: 'JAN', field: 'Jan', type: 'number', transform: (v) => Math.trunc(Number(v)) }
```

### Numbers

The same amount is written `1.234.567,89` in one locale and `1,234,567.89` in
another, and guessing wrong is silent. Separators are inferred from each value:
with both `.` and `,` present the **rightmost** is the decimal point; with only
one, exactly three trailing digits means thousands grouping. So `1.234` is one
thousand two hundred, while `1.23` is one and a bit.

Force it when you know the source: `numberFormat: 'us' | 'eu'`. Accounting
negatives (`(1.500)`) are understood; set `allowNegative: false` to reject them.
A cell that isn't a number is left alone rather than staged as `NaN`.

## Excluding rows

Real sheets carry totals, blank separators and locked rows.

| Option | Excludes | Reported in |
|--------|----------|-------------|
| `rowFilter(sheetRow, i)` | Sheet rows — summary/total lines | not counted at all |
| `targetFilter(row)` | Table rows from being matchable | as `unmatched` |
| `readOnly(row, field)` | A specific write; return a string for the reason | `skippedRows` |

```ts
await table.import({
  data, match, columns,
  rowFilter: (r) => String(r['Activity']).toLowerCase() !== 'total:',
  targetFilter: (row) => row._Type === 'Child',
  readOnly: (row) => isHeld(row) && 'Budget is on hold',
})
```

`readOnly` returning a **string** is the useful form: the reason reaches
`result.skippedRows`, so you can tell the user exactly which rows were ignored
and why instead of silently losing them.

## Reviewing before committing

Imported values are ordinary staged changes, so the existing buffer API applies:

```ts
table.pendingCount()        // rows with pending edits
table.changes()             // the patches, for your own bulk request
await table.saveChanges()   // commit
table.discardChanges()      // undo the import
```

Imported cells are also marked separately, so they can be tinted apart from hand
edits:

```ts
table.isCellImported(rowKey, field)   // came from a sheet
table.isRowImported(rowKey)
table.isCellDirty(rowKey, field)      // any pending edit
```

A cell stops counting as imported once it's edited by hand, and all marks clear
on save or discard.

### Validate first

`apply: 'none'` computes everything and stages nothing, handing back
`result.merged` — the target rows with patches applied — so you can check the
outcome and abandon the import if it's wrong:

```ts
const result = await table.import({ data, match, columns, apply: 'none' })

if (result.merged.some((r) => r.Jan < 0)) {
  if (!(await confirm('Some values are negative. Import anyway?'))) return
}

result.apply()   // stage it now
```

## Result

| Member | Description |
|--------|-------------|
| `ok` | Every considered sheet row matched exactly one table row. |
| `total` / `matched` / `unmatched` / `ambiguous` | Row counts (`total` is after `rowFilter`). |
| `changed` | Matched rows that actually differed. |
| `skipped` | Cells refused by `targetFilter` / `readOnly`. |
| `headers` | Headers found in the sheet. |
| `missingHeaders` | Declared in `match`/`columns` but absent — the rest still imports. |
| `changes` | `{ rowKey, key, row, patch }` per changed row. |
| `unmatchedRows` / `ambiguousRows` / `skippedRows` | The rejects, each with its sheet row and a reason. |
| `merged` | Target rows with patches applied — for validation. |
| `apply()` | Stage now (used with `apply: 'none'`). |

## Options

| Option | Type | Description |
|--------|------|-------------|
| `data` | `File \| Blob \| ArrayBuffer \| Uint8Array \| string` | The sheet, or text pasted from one. |
| `type` | `'excel' \| 'copy-paste'` | Inferred from `data` when omitted. |
| `sheet` | `string \| number` | Worksheet name or index (`excel` only). |
| `headerRow` | `number` | 1-based header row (default `1`). |
| `delimiter` | `string` | Paste only; auto-detected otherwise. |
| `match` | `Array<{ excel, field, transform? }>` | **Required.** Composite key. |
| `columns` | `Array<{ excel, field, type?, transform? }>` | **Required.** What may be written. |
| `headerAliases` | `Record<string, string[]>` | Alternate header spellings. |
| `minKeyFields` | `number` | Smallest usable key subset (default `2`). |
| `normalizeKey` | `(v) => string` | Override key normalisation. |
| `target` | `T[]` | Rows to match against (default: `table.getData()` — every row). |
| `rowFilter` | `(sheetRow, i) => boolean` | Skip sheet rows. |
| `targetFilter` | `(row) => boolean` | Restrict matchable table rows. |
| `readOnly` | `(row, field) => boolean \| string` | Veto a write, with a reason. |
| `apply` | `'stage' \| 'none'` | Default `'stage'`. |
| `numberFormat` | `'auto' \| 'us' \| 'eu'` | Default `'auto'`. |
| `allowNegative` | `boolean` | Default `true`. |
| `chunkSize` / `yieldMs` | `number` | Batching so a big paste can't freeze the page (`300` / `0`). |
| `onProgress` | `(done, total) => void` | |
| `debug` | `boolean` | Log the matching decisions. |

## Without a grid

The engine is available on its own for a non-table import — you supply the
bridge that says how rows are keyed and where changes go:

```ts
import { importTable } from '@mono-lit/helper/import'
```

`table.import()` is this, wired to the grid's staged buffer.
