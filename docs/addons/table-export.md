# Export Table

Turn a `controlMonoTable` into a document with `table.export()`. The report layout is
authored as a **Markdown file** — Handlebars fills it from your data, Jexl
evaluates inline expressions, and the result renders to Markdown (for preview) or
to a real `.xlsx` workbook with styles, formulas and merged cells. Data stays in
TypeScript, presentation stays in the template.

```ts
import { controlMonoTable } from '@mono-lit/helper'
import md from './payroll.md?raw'

const table = controlMonoTable(dataSource, { pageSize: 20 })

const result = await table.export({
  md,
  fileName: 'payroll.xlsx',        // extension picks the renderer + downloads
  data: {
    rows: await table.getData(),   // every matching row, not just the page
    company: 'PT Mono Sejahtera',
  },
  styles: { header: { bg: '#0F172A' } },
})

result.markdown                     // the rendered markdown, for a preview pane
```

The template sees **exactly** what you put in `data` — nothing is injected behind
your back. A report that needs the grid's rows asks for them, visibly, at the
call site.

Working from a remote DataSource? Pass it straight in and skip the fetch —
[From a DataSource](#from-a-datasource):

```ts
data: { program: dataSource.value }   // drained in chunks, filter/search/sort intact
```

The engine is loaded **on first use** via a dynamic import, and its heavy
dependencies are resolved from your app rather than bundled — so importing
`controlMonoTable` costs nothing if you never export, and `@mono-lit/helper` stays
importable on the server.

::: tip Install
Both are **optional peers** — they aren't bundled, so nothing pays for them
unless you export something.

```sh
pnpm add handlebars           # any report
pnpm add handlebars exceljs   # …and .xlsx output
```

`handlebars` is the template engine, so **every** report needs it — Markdown
included. `exceljs` is only reached when an `.xlsx` is actually rendered.
If either is missing, the export throws an error naming the package and the
command rather than failing obscurely.
:::

Going the other way — reading an edited sheet back into the grid — is
[**Import Table**](/addons/table-import).

## Basic

The grid below is paged **3 rows per page**, but the report covers all six rows —
`table.getData()` reads the full result set without disturbing the visible page.

<ClientOnly>
<DemoSingle name="table" id="export-basic" />
</ClientOnly>

## Grouped

`table.buildGroups()` returns the full group tree — every group with all its
rows, not just the group page on screen — using the `group` field you already
configured. Write the header and delimiter row once, then loop: everything lands
in one worksheet table.

<ClientOnly>
<DemoSingle name="table" id="export-grouped" />
</ClientOnly>

## Styled

Named styles, per-row conditional styling, merged cells and column widths.

<ClientOnly>
<DemoSingle name="table" id="export-styled" />
</ClientOnly>

## Rowspan and colspan

The layout auditors ask for and Markdown can't spell: a **two-level header**,
three **nested vertical bands** (year ⊃ half ⊃ quarter), a subtotal row whose
merge starts in the middle of the row because the bands still own the columns to
its left, and a grand total spanning four columns — plus an L-shaped block that
merges across *and* down at once.

Every one of them is a <code v-pre>{{merge}}</code> on the cell where the span
begins; the cells it swallows are written as empty (`| |`), exactly like a
`rowspan` leaves no `<td>` behind. The spans themselves are arithmetic done in
TypeScript — a half owns its six months **plus** its own subtotal row — so the
template stays a layout, not a calculator.

<ClientOnly>
<DemoSingle name="table" id="export-merged" />
</ClientOnly>

## Post-processing the workbook

Markdown can't describe an auto-filter, a colour scale or a second worksheet.
`onWorkbook` hands you the populated ExcelJS workbook **before** anything is
written, so you can add whatever the template can't — and it still works on the
auto-downloading path.

<ClientOnly>
<DemoSingle name="table" id="export-workbook" />
</ClientOnly>

## Template context

The context is **exactly** your `data` object — the grid injects nothing, and no
names are reserved. Anything you put there is addressable at the top level: an
array loops, an object drills in with dots.

```ts
data: {
  rows: await table.getData(),
  company: { legal: { name: 'PT Mono' }, offices: ['JKT', 'SBY'] },
  period: '2026-07',
}
```

```hbs
# Payroll {{period}} — {{company.legal.name}}

{{#each company.offices}}{{this}} {{/each}}
{{#each rows}}| {{Name}} | {{currency Salary}} |
{{/each}}
```

A template that references something you didn't pass simply renders nothing —
it never triggers a fetch.

## Getting the grid's data

The grid is the only thing that knows how to read your **whole** result set: the
visible page is a slice, and the rest lives behind paging you'd otherwise have to
replay by hand. Two methods hand it over, and you pass the result into `data`.

### `table.getData()`

Every row matching the current search, column filters and sort — flattened, in
sort order, regardless of paging.

```ts
const rows = await table.getData()
await table.export({ md, data: { rows } })
```

It leaves the grid alone. A remote source is read straight off its store, so the
bound DataSource's paging is never touched; an array source is read with paging
temporarily off and restored afterwards. When the promise resolves, `items` and
`pageIndex` are exactly what they were.

::: warning Large tables
This is a full read — remote sources fetch in `chunkSize` batches (default 100).
That's the point of an export, but it isn't free. Call it once per report and
reuse the array rather than calling it per section.
:::

### `table.buildGroups(rows?)`

The full group tree, using the group field(s) already configured on
`controlMonoTable` — you don't repeat them. Pass rows you already have, or omit them
and it calls `getData()` itself. Returns `[]` when the grid isn't grouped.

```ts
const rows = await table.getData()          // fetch once…
const groups = await table.buildGroups(rows) // …and reuse

await table.export({ md, data: { rows, groups } })
```

Each node has `key`, `items`, `count`, `level` and `path`:

```hbs
{{#each groups}}
| **{{key}}** ({{count}}) | {{currency (sum items "Total")}} |
{{#each items}}
| {{Product}} | {{currency Total}} |
{{/each}}
{{/each}}
```

To group by something other than the grid's own fields, use the exported helper
directly:

```ts
import { buildGroups } from '@mono-lit/helper'

const byProduct = buildGroups(rows, ['Product'])
```

### Columns and totals

No new API needed — these are already on the controller:

```ts
data: {
  columns: table.columns(),   // registered <mono-table-th> cells
  total: table.totalCount,
}
```

`columns()` reads the registered header cells, so it's empty unless your headers
are `<mono-table-th>` rather than plain `<th>`.

## From a DataSource

You don't have to drain a source yourself. Put a **devextreme DataSource** (or a
bare store) straight into `data` and the engine resolves it to rows before
rendering:

```ts
await table.export({
  md,
  fileName: 'program-transfer.xlsx',
  data: { program: dataSourceProgramTransfer.value },   // ← not an array
})
```

```hbs
{{#each program}}
| {{OrderID}} | {{ShipName}} | {{currency Freight}} |
{{/each}}
```

<ClientOnly>
<DemoSingle name="table" id="export-datasource" />
</ClientOnly>

### What gets honoured

The source is read through its own store, so the query it already carries comes
along: its **filter**, its **sort**, and — importantly — its active **search**.
Type something into `<mono-table-search>` and the export narrows with it.

The grid is never disturbed: its page, page index and scroll position are the
same after the export as before.

### Chunking

A remote source can't report its size up front, so the read walks in fixed
chunks until one comes back short — **100 rows per request** by default. The
1073-row table above takes 11 requests. Change it with `chunkSize`:

```ts
await table.export({ md, data: { program: dataSource }, chunkSize: 500 })
```

### Two details

**Top level only.** Values are resolved at the top level of `data`. A source
nested deeper (`data: { report: { rows: ds } }`) is left alone — resolve it
yourself with `await table.getData()` and pass the array.

**Keep the source raw.** Use `shallowRef`, not `ref` — a deep reactive proxy
around a DataSource can break devextreme's internals. A `ref` that slips through
is unwrapped rather than silently rendering nothing, but raw is the right habit:

```ts
const dataSource = shallowRef<any>(null)
// …
data: { program: dataSource.value }
```

### Server-grouped sources

A single `group` field plus a remote DataSource puts the grid into server-group
mode — group keys and counts come from one groupby query, and rows load per
group as they're shown. `getData()` and `buildGroups()` still return everything:

<ClientOnly>
<DemoSingle name="table" id="export-datasource-grouped" />
</ClientOnly>

## Template syntax

### Loops and conditions

Standard Handlebars, including `@index` / `@first` / `@last`:

```hbs
{{#each rows}}
| {{@index}} | {{Name}} | {{Salary}} |
{{/each}}

{{#if Paid}}Settled{{else}}Outstanding{{/if}}
{{#unless Active}}Archived{{/unless}}
```

### Inline expressions

<code v-pre>{{= … }}</code> evaluates a
[Jexl](https://github.com/TomFrost/Jexl) expression — no `eval()`, so a template
can never reach globals, the DOM or the network.

```hbs
{{= Salary + Bonus }}
{{= Qty * Price }}
{{= Amount > 1000000 ? "large" : "standard" }}
```

Jexl's grammar is not quite JavaScript, but `===` and `!==` are rewritten to
`==` / `!=` for you.

### Escaping

Values interpolated into a table row are escaped automatically, so a name like
`Alice | Smith` or a product called `*special*` can't break the table or turn
italic. Use a triple-stache to opt out and inject raw Markdown:

```hbs
| {{Name}} |          <!-- escaped -->
| {{{RawMarkdown}}} | <!-- verbatim -->
```

## Helpers

### Formatting

These emit readable text **and** the raw value, so Markdown shows
`Rp 1.000.000` while the spreadsheet stores `1000000` — summable, sortable, and
usable in a formula.

```hbs
{{currency Salary}}              {{currency Salary code="USD"}}
{{number Qty}}                   {{number Rate decimals=2}}
{{date JoinedAt}}
{{percent 0.155}}
```

Set the locale and currency once via the `formatting` option:

```ts
await table.export({
  md,
  formatting: { locale: 'id-ID', currency: 'IDR', dateFormat: 'dd mmm yyyy' },
})
```

::: warning Prose vs. cell
A formatting helper only becomes a real number when it is the cell's **entire**
content. <code v-pre>Rate {{percent 0.155}} this quarter</code> stays text — as
it should.
:::

### Aggregation

```hbs
{{sum rows "Salary"}}    {{avg rows "Salary"}}
{{max rows "Salary"}}    {{min rows "Salary"}}
{{count rows}}
```

They return plain numbers, so they nest:

```hbs
{{currency (sum rows "Salary")}}
```

### Logic

`eq` · `ne` · `gt` · `gte` · `lt` · `lte` · `and` · `or` · `not` · `default`

```hbs
{{#if (gt Salary 1000)}}Senior{{/if}}
{{default Nickname "—"}}
```

### Your own

```ts
await table.export({
  md,
  helpers: { add: (a: number, b: number) => a + b },
  partials: { footer: '_Generated automatically._' },
})
```

```hbs
{{add Salary Bonus}}
{{> footer}}
```

## Named styles

Templates reference styles by name; what a name *means* is configured in
TypeScript. That keeps templates renderer-independent — the same report can grow
a PDF or HTML renderer later without being rewritten.

```hbs
| {{style "header"}}Employee | {{style "currency"}}{{currency Salary}} |
| {{rowStyle "total"}}**Total** | {{currency (sum rows "Salary")}} |
```

<code v-pre>{{style}}</code> paints the cell it sits in;
<code v-pre>{{rowStyle}}</code> paints the whole row.

Built-ins: `title`, `h1`–`h6`, `header`, `groupHeader`, `total`, `currency`,
`number`, `date`, `note`, `danger`, `success`, `muted`.

Override per key — everything you don't name is kept:

```ts
styles: {
  header: { bg: '#0F172A', color: '#FFFFFF' },
  danger: { color: '#991B1B', bg: '#FEE2E2', align: 'center' },
}
```

A style accepts `bold`, `italic`, `underline`, `size`, `font`, `color`, `bg`,
`align`, `valign`, `border` (`'all' | 'bottom' | 'top' | 'outline' | 'none'`),
`borderColor`, `numFmt`, `wrap`, `indent` and `height`.

## Excel-only directives

These render nothing in Markdown and take effect only in the workbook.

### Formulas

A template can't know which row it will land on, so formulas use placeholders
that are resolved as each cell is written:

```hbs
{{formula "SUM({col:Salary}{row}:{col:Bonus}{row})"}}
{{formula "SUM(E{firstRow}:E{prevRow})"}}
```

| Placeholder | Resolves to |
|-------------|-------------|
| `{row}` | The row being written. |
| `{prevRow}` | The row above it. |
| `{firstRow}` / `{lastRow}` | The current table's first / last body row. |
| `{col:Caption}` | The column letter of that header caption. |

::: warning Totals inside the table
`{lastRow}` counts **every** body row — including a total row written as part of
the same Markdown table. Sum `{firstRow}:{prevRow}` there, or Excel reports a
circular reference.
:::

### Merged cells

<code v-pre>{{merge}}</code> spans the cell it sits in: `cols` to the right
(colspan), `rows` downwards (rowspan), or both at once for a rectangle.

```hbs
| {{merge cols=3}}**Grand total** | | | {{currency (sum rows "Amount")}} |
| {{merge rows=3}}Q1 | Jan | 48,200 |
| | Feb | 51,600 |
| | Mar | 55,100 |
| {{merge cols=2 rows=3}}QC seal | | Shift | Inspector |
```

Four rules cover everything:

- **Leave the swallowed cells in place.** A merge only *covers* cells; the pipes
  that hold them still have to be written, empty. The header row fixes how many
  columns the table has, so a body row that drops a `|` shifts every column
  after it.
- **The span count is yours to compute.** A vertical band that has to cover its
  own subtotal row is `rows=7`, not `rows=6` — work it out in TypeScript and
  pass it in: <code v-pre>{{merge rows=halfSpan}}</code>.
- **The header row merges too**, which is how a two-level header is written:
  <code v-pre>{{merge cols=2}}</code> groups the columns on the header row, and
  the level beneath it is an ordinary body row wearing
  <code v-pre>{{rowStyle "header"}}</code>.
- **Overlaps are skipped, not fatal.** Excel refuses two merges over the same
  cell, so a collision is dropped with a console warning and the rest of the
  report still renders. Nested bands never collide as long as an inner span
  stays inside its outer one.

Vertically merged cells look wrong with the default top alignment — give them a
style with `valign: 'middle'`.

Headings and paragraphs already span the full sheet width — don't add
<code v-pre>{{merge}}</code> to those.

See [Rowspan and colspan](#rowspan-and-colspan) for all of it in
one report.

### Images

```hbs
{{image company.logo width=120 height=40}}
```

Accepts a data URL, a bare base64 string, or an `http(s)` URL (fetched at render
time). A logo that fails to load warns and is skipped rather than failing the
report.

### Links

A Markdown link becomes a real hyperlink in the worksheet:

```md
| [{{name}}]({{url}}) | {{email}} |
```

A number keeps its type — it is written through Excel's own `HYPERLINK()` so it
still sums and still formats. A formula cell is left alone: there is no way to
add a link without replacing the formula.

### Detail sheets

`detail` gives every row of the master sheet its own worksheet, reached from a
link. This is the master-and-lines shape: a document list where each document
number opens the lines behind it.

The master template links with `sheet:<key>` — the document's **key**, never a
sheet name. Names are sanitised for Excel and de-duplicated against the workbook
at write time, so the final name is only known once every sheet exists. In `.md`
output the same line is an ordinary Markdown link, so one template serves both.

```ts
await table.export({
  md: `
| Doc | Vendor | Total |
| --- | ------ | ----- |
{{#each rows}}
| [{{no}}](sheet:{{no}}) | {{vendor}} | {{currency total}} |
{{/each}}
`,
  data: { rows: await table.getData() },
  sheetName: 'Top-ups',
  fileName: 'top-ups.xlsx',
  detail: {
    key: 'no',
    field: 'items',
    md: `
| SKU | Qty |
| --- | --- |
{{#each rows}}
| {{sku}} | {{qty}} |
{{/each}}
`,
  },
})
```

The detail template's context is `{ row, rows }` — the master row, and that
document's rows.

#### Lines already on the row

`field` is the no-I/O case: the list endpoint embedded its own lines, so the
export costs exactly what a single-sheet one costs.

<ClientOnly>
<DemoSingle name="table" id="export-detail-nested" />
</ClientOnly>

#### Where the rows come from

`field` reads an array already nested on the master row. When the list endpoint
does not embed its lines, `load` fetches them instead.

**`load` is batched.** It is handed a chunk of master rows and their keys, and
returns the rows for all of them in one array — so a backend that can filter on
a set of keys serves a whole chunk per request:

```ts
const { filterOrIn } = useMonoUtility()

detail: {
  key: 'OrderID',
  md: detailTemplate,
  load: ({ keys, key }) => api.lines({ filter: filterOrIn(key, keys) }),
  loadChunk: 100,   // master keys per request (default)
  concurrency: 4,   // chunks in flight at once (default)
}
```

[`filterOrIn`](../repo/useful-utils) builds the key filter, so `load` never
hand-rolls an `or` chain. Its third argument returns the compact `Field in (…)`
instead — useful when you render the filter yourself with `dxFilterToString`,
but **not** something a DevExtreme store accepts: `store().load()` throws
`E4003 — Unknown filter operation is used: in`, and passing the rendered string
back in as `filter` does not help either — DevExtreme appends ` eq true` to it.
See [Useful Utils](../repo/useful-utils) for the full matrix.

A 1000-row master therefore costs **10 requests, not 1000**. Lower `loadChunk`
when the backend caps how many values a filter may carry, or when the generated
URL would outgrow its limit; `concurrency` then decides how many of those chunks
are in flight together.

The response comes back flat, so the exporter buckets it by **`groupBy`** to
work out which rows belong to which document. That defaults to `key`, which is
right whenever both sides name the foreign key the same way — pass a field name
or a function when they differ. Rows matching no master key are ignored.

A rejection is contained: every document in that chunk is left without a sheet
and without a link, and the rest of the workbook is still produced.

For an endpoint that genuinely only serves one document at a time, set
`loadChunk: 1` and read `data[0]`:

```ts
load: ({ data }) => api.lines(data[0].OrderID)
```

Nothing is fetched until the export runs. The demo below lists 100 Northwind
orders — whose `/Orders` feed carries no line items at all — and fetches their
269 line rows in **4 requests**, producing 101 worksheets.

It also shows why `loadChunk` exists rather than being a constant. The keys go
out as an `or` chain, so 100 of them make a 3138-character URL and that service
answers **404** — IIS refusing a query string past ~2048. Measured against the
live endpoint, 60 keys still return 200 and 75 do not, so the demo uses 25. The
ceiling is the backend's, not the exporter's — a backend that takes `in (…)`
would fit far more keys per request.

<ClientOnly>
<DemoSingle name="table" id="export-detail-sheets" />
</ClientOnly>

#### What did not get a sheet

A document with no rows gets no sheet — an empty worksheet behind a link is
worse than no link — and its master cell is left as plain text rather than a
link pointing nowhere. Both cases are reported:

```ts
const result = await table.export({ /* … */ })

result.sheets   // ['Top-ups', 'Detail TU 2026 001', …]
result.skipped  // [{ key: 'TU/2026/003', reason: 'empty' }]
                // reason is 'empty' or 'failed'; 'failed' carries `error`
```

#### Sheet names

Derived from `key`, or from `sheetName(row)`. Either way the result is made
legal before use, because Excel refuses to open a file otherwise: at most 31
characters, none of `* ? : \ / [ ]`, never empty, no leading or trailing
apostrophe, and unique. A document number like `TU/2026/001` breaks three of
those at once, so it becomes `TU 2026 001`.

Note that spaces and hyphens are **kept** — stripping them would turn `TP-001`
into `TP 001` and the tab would no longer match what the master sheet shows.

## Output

The extension of `fileName` picks the renderer and triggers a download:

```ts
await table.export({ md, fileName: 'payroll.xlsx' })   // Excel, downloads
await table.export({ md, fileName: 'payroll.md' })     // Markdown, downloads
await table.export({ md })                             // nothing written
```

Suppress the download with `download: false`, or force the renderer with
`format: 'xlsx' | 'md'`.

The returned object always carries the rendered Markdown, and can produce the
other formats on demand:

| Member | Description |
|--------|-------------|
| `markdown` | Rendered Markdown, directives stripped — ready for a preview pane. |
| `format` | The resolved format, or `null`. |
| `fileName` | The resolved file name, or `null`. |
| `toBlob(format?)` | Render to a `Blob`. |
| `toBuffer(format?)` | Render to an `ArrayBuffer` — for uploading instead of downloading. |
| `workbook()` | The populated ExcelJS workbook, for last-mile tweaks. |
| `download(fileName?)` | Trigger a browser download. |

```ts
// Upload instead of downloading
const result = await table.export({ md, format: 'xlsx' })
await fetch('/api/reports', { method: 'POST', body: await result.toBlob() })
```

## Reaching ExcelJS

`result.workbook()` and the `onWorkbook` option both hand you the real
`ExcelJS.Workbook` — the full API: extra worksheets, `autoFilter`, conditional
formatting, cell notes, sheet protection, print setup, data validation.

The workbook is built once and memoised, so anything you change is present in
whatever `download()` / `toBlob()` / `toBuffer()` write afterwards.

### `onWorkbook` — preferred

Runs after the template renders but **before** any bytes are produced, so it
applies even when `fileName` triggers an automatic download. It fires exactly
once, however many times the workbook is requested.

```ts
await table.export({
  md,
  fileName: 'inventory.xlsx',
  data: { rows },
  onWorkbook: (wb) => {
    const ws = wb.getWorksheet('Sheet1')
    ws.autoFilter = 'A2:D2'
    ws.getCell('A1').note = 'Generated from the live grid'
    ws.pageSetup.orientation = 'landscape'

    const raw = wb.addWorksheet('Raw data')
    raw.columns = [{ header: 'SKU', key: 'Sku', width: 14 }]
    raw.addRows(rows)
  },
})
```

It may be `async` — the write waits for it.

### `result.workbook()` — imperative

Useful when the decision to tweak comes later, or you want the workbook for
something other than downloading.

```ts
// Note: no `fileName`, so nothing is written yet
const result = await table.export({ md, format: 'xlsx', data: { rows } })

const wb = await result.workbook()
wb.getWorksheet('Sheet1').getCell('A1').note = 'Draft'

await result.download('inventory.xlsx')
```

::: warning `fileName` writes immediately
`table.export({ md, fileName: 'x.xlsx' })` has already downloaded by the time it
returns, so `workbook()` mutations afterwards land in nothing. Either drop
`fileName` and pass it to `download()` instead, add `download: false`, or use
`onWorkbook`.
:::

### Row numbers

The hook receives a finished sheet, so you need to know where the table landed.
Each Markdown block is one row, in order — a `# Heading` is row 1, the table
header row 2, the body from row 3. With `n` rows:

```ts
const firstRow = 3
const lastRow = 2 + rows.length
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `md` | `string` | The Markdown template source. |
| `data` | `object` | The **entire** template context. A DataSource at the top level is drained to its rows. |
| `chunkSize` | `number` | Rows per request when draining a DataSource (default `100`). |
| `fileName` | `string` | Output name; its extension selects the renderer. |
| `format` | `'md' \| 'xlsx'` | Force the renderer. |
| `download` | `boolean` | Auto-download when `fileName` is set (default `true`). |
| `styles` | `Record<string, MonoExportStyle>` | Named-style overrides. |
| `columns` | `Array<{ width?, numFmt? }>` | Per-column overrides, left to right. |
| `sheetName` | `string` | Worksheet name (default `'Sheet1'`). |
| `detail` | `MonoExportDetail` | A sheet per master row, linked from it. See [Detail sheets](#detail-sheets). |
| `freezeRows` | `number` | Freeze the first N rows in Excel. |
| `onWorkbook` | `(wb) => void \| Promise<void>` | Post-process the ExcelJS workbook before it's written. |
| `formatting` | `MonoExportFormatOptions` | Locale, currency and number/date formats. |
| `helpers` | `Record<string, Function>` | Extra Handlebars helpers. |
| `partials` | `Record<string, string>` | Partials available as <code v-pre>{{> name}}</code>. |

## Without a grid

The engine stands alone — useful for a report that isn't backed by a table:

```ts
import { exportTable } from '@mono-lit/helper/export'

const report = await exportTable({
  md,
  data: { employees, company },
  fileName: 'payroll.xlsx',
})
```

`table.export()` is a thin wrapper over exactly this — same options, same result
object. It exists so the engine is discoverable from the controller and loaded
lazily; the grid contributes data only through `getData()` / `buildGroups()`,
which you call yourself.
