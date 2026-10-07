# Table

A headless, native-`<table>` helper. `controlMonoTable` wraps a DataSource or a plain array and small controls (`<mono-table-search>`, `<mono-table-paging>`, `<mono-table-sort>`, …) drive it — bind each with `:control-table`. Declare every control's props in the controller's `props` block and each element needs only `:control-table.prop="table"`; `props.th` holds one entry per column, which you loop yourself from a `state` ref. Grid-as-a-document lives in [**Export Table**](/addons/table-export).

## Control

<ClientOnly>
<DemoSingle name="table" id="control" />
</ClientOnly>

`field` is the identity every element matches on, which is why `<mono-table-th>`, `<mono-table-sort field>` and `<mono-table-summary field>` need nothing else. Pushing to `table.props().th` adds a column at runtime.

::: tip Setting props on the elements still works
Writing props directly on a `mono-table-*` element is still supported, as are the `columns` and `summary` options. Where both declare the same key, the **controller wins**.
:::

### Events from the controller

A slot's props also take that element's **events**, as `on<Event>` keys. They are attached as listeners to **every** element of that slot bound to the grid — so `props.detail.onToggle` hears every row's chevron, and `event.detail.rowKey` says which — instead of a template `@toggle` repeated per row:

```ts
const table = controlMonoTable(rows, {
  props: {
    detail: {
      icon: 'i-mdi-plus',
      onToggle: (event) => track(event.detail.rowKey, event.detail.open),
    },
    error: { dismissible: true, onReload: () => audit('retry') },
  },
})
```

The typed slots are `detail`, `checkbox`, `error` and `empty` (from `TableDetailEvents`, `TableCheckboxEvents`, …); the handler gets the same event a template listener would, in both builds. Handlers are attached once per element however often the grid re-applies its props, and a template listener on the same element still fires beside them. This is separate from the controller's own options that happen to start with `on` — `onError` is the *behaviour* on a failed load (`'clear-list'` / `'keep-list'`), not a listener.

## Basic

Native table with search, page size, info and paging on one controller.

<ClientOnly>
<DemoSingle name="table" id="basic" />
</ClientOnly>

## External control

Filtering the DataSource directly still updates the table via its `changed` event — and a
filter you set that way is **sticky**: the grid adopts it as its base, and its own search,
header column filters, sort, paging and scroll paging all go out AND-ed on top of it.
Clearing the search box brings back the scoped set, not the whole table. See
[DataSource options](#datasource-options) for the reactive form.

<ClientOnly>
<DemoSingle name="table" id="external-control" />
</ClientOnly>

## Colors

A `mono-color="…"` attribute on the table (or on its scroll wrapper) recolours the whole table; `primary` is the default and needs no attribute.

<ClientOnly>
<DemoSingle name="table" id="colors" />
</ClientOnly>

## Search

`<mono-table-search>` renders [`mono-input`](./input)'s markup, so it takes the same appearance props — size, color, variant, width, validation, etc. (see Types) — and matches an input beside it in a toolbar. `clearable` resets the grid immediately, skipping the debounce.

<ClientOnly>
<DemoSingle name="table" id="search" />
</ClientOnly>

### Naming the searched fields

**You don't have to.** With no `searchValue`, a grid searches `'*'` — every top-level field — so search works out of the box. Set it to narrow that down.

`searchValue` names the columns a term matches. It takes an array **or a comma-separated string** — a comma can't appear in a path or a pattern, so the two forms are equivalent:

```ts
controlMonoTable(rows, { searchValue: ['Company.Name', 'Transaction.[*].Price', '*.[*].*'] })
controlMonoTable(rows, { searchValue: 'Company.Name,Transaction.[*].Price,*.[*].*' })
```

It's the same name [`mono-select`](./select) and [`mono-tag-input`](./tag-input) use, so an expression is portable between all of them. The same option works on `controlMonoDataDropdown`, which forwards its options to the grid it wraps.

You can also declare it next to the search box instead of in the options — as an attribute, a `.prop` binding, or centrally through `props.search`:

```vue
<mono-table-search :control-table.prop="table" search-value="Company.Name,*.[*].*" />
```
```ts
controlMonoTable(rows, { props: { search: { searchValue: ['Company.Name', '*.[*].*'] } } })
```

An element-level value **replaces** the controller option rather than merging with it, so a search box can deliberately narrow what the grid searches. `table.setSearchValue(…)` does the same from code, and `table.searchValue()` reads back the resolved list — note that returns the *fields*; the typed query text is `table.searchTerms`.

::: tip `searchExpr` is the same thing
The grid originally called this `searchExpr`, and that spelling still works everywhere — as the option (plus the kebab forms `search-value` / `search-expr`), and as `table.searchExpr()` / `table.setSearchExpr()`. Passing more than one spelling of the option merges them, de-duplicated by field. New code should use `searchValue`.
:::

#### What the default does, exactly

`'*'` is a **mono-side** notion: it is expanded against the rows the grid holds into a list of real column names *before* anything is sent, so no `*` ever reaches an OData URL.

That expansion is type-aware. On an in-memory source every leaf is kept, so typing `2` can match a numeric `Id`. On a **remote** source only **string** columns are emitted — `contains(Price,'x')` is not valid OData and would reject the whole request — and the shape is read from the rows already loaded, so a field absent from that sample isn't covered. Give such a column an explicit entry or a [`{ field, custom }`](#wildcards-and-custom-search-clauses) builder.

The default also steps aside when it shouldn't apply: if the **DataSource itself** declares a `searchExpr`, the grid leaves the search to it and `table.searchValue()` returns `undefined`. `searchValue: []` suppresses the default without filtering anything away — to offer no search at all, simply don't render a `<mono-table-search>`.

<DemoSingle name="table" id="search-fields" />

### Search contexts

`suggestion` pins the term to one column (rows auto-detected from `<mono-table-th>`); `multi-context` stacks picks as removable chips — OR within a column, AND across columns. Too many chips collapse into a **See All** trigger (`max-chips`, `more-label`). Keyboard: `Tab` toggles input/list, `↑`/`↓` move, `Enter` applies, `Esc` closes.

<ClientOnly>
<DemoSingle name="table" id="search-context" />
</ClientOnly>

### Filter builder

Slot a `<mono-filter-builder slot="filter-builder">` into the search — a chevron reveals it and its **Apply** drives the grid. Let the grid own the controller: `controlMonoTable({ filterBuilder })` exposes `table.filterBuilder` to bind (the field list is derived from the `<mono-table-th>` columns). With `multi-context`, Apply renders one removable **Filter** chip (`filter-label`); without it, the grid just filters. The chevron, suggestion list and chips panel are mutually exclusive; each closes on `Esc` / outside-click.

`filterBuilder` takes every [`controlMonoFilterBuilder`](./filter) option, `props` included — so the builder's own props are declared in the same block and read back off the grid-owned controller:

```ts
const table = controlMonoTable<Row>(null, {
  filterBuilder: {
    fields: [{ field: 'Code', caption: 'Code' }],
    props: { size: 'sm', width: '100%', maxHeight: 260 },
  },
})

table.filterBuilder?.props()                  // { size: 'sm', width: '100%', maxHeight: 260 }
table.filterBuilder?.setProps({ size: 'lg' }) // the slotted element re-applies
```

<ClientOnly>
<DemoSingle name="table" id="search-filter" />
</ClientOnly>

### Wildcards and custom search clauses

`'*'` searches every field without listing them. Patterns read literally, segment by segment — `'*.*'` is an object expand, `'*.[*].*'` an array one.

```ts
searchValue: ['*', '*.[*].*']   // or the comma string '*,*.[*].*'
```

An entry can instead build its own clause, for a column `contains` can't search — a boolean, or a code the user never types. An explicitly named field always wins over a pattern, in either order.

```ts
searchValue: [
  '*',
  { field: 'Active', custom: ({ field, value }) => `${field} eq ${value}` },
  { field: 'Month',  custom: ({ field, value }) => [field, '=', MONTHS.indexOf(value)] },
]
```

The custom runs for every term — return `null` to opt the column out of one. A filter array works on remote *and* array sources; a raw OData string is remote-only; a `(row) => boolean` is array-only. A wildcard only emits clauses for **string** columns on a remote source (`contains(Price,'x')` is invalid OData), so give a non-text column an explicit entry. Neither is honoured in server-group mode.

<ClientOnly>
<DemoSingle name="table" id="search-custom" />
</ClientOnly>

## Column alignment

`align` on a column — `'left' | 'center' | 'right'` — sets the **header cell's** alignment. Declare it in `props.th` (or as `align="right"` on the element); it lands on the parent `<th>` the same way `width` and `height` do.

```ts
props: {
  th: [
    { field: 'Nama',  caption: 'Name' },
    { field: 'Total', caption: 'Total', align: 'right' },
  ],
}
```

The **body** cells are your markup, so the grid cannot align them for you — but the column entry is the one place the intent is written, so read it back in your own row loop and the two sides cannot drift:

```html
<td v-for="col in columns" :key="col.field" :style="{ textAlign: col.align }">…</td>
```

That drift is what this exists for: a money column whose figures were right-aligned in the body kept a left-aligned caption above them, because the two were written in different places.

## Sorting

Give a column `sort: true` in `props.th` (or a bare `sort` attribute on `<mono-table-th>`) and an arrow appears beside its caption. Pass an object instead — `{ order, index, noClear, showIcon, disabled }` — only when you need to tune it; an empty `{}` is accepted and means the same as `true`, but write `true`. The gesture decides how many keys you get:

- **Click the arrow** — **single-key**. It cycles asc → desc → none and that column becomes the *entire* sort, so clicking one collapses a multi-key sort back down — *unless* you started combining from the menu: from then on, until nothing is sorted any more, the arrows append too. Start with a click and clicks stay single.
- **Right-click the header** — opens the column menu; its `Sort ›` row cascades into Ascending / Descending / Clear / **Clear all sorting**. Picking a direction here **appends**, so Id then Name sorts by both (`$orderby=Id desc,Name asc`) and a `<sup>` marks each column's precedence. This is the only way to build a multi-key sort from the UI.

`showIcon: false` moves the single-sort trigger from the arrow onto the caption (right-click still reaches the menu); `order` seeds the direction — several columns may each seed one and they combine; `index` pins precedence; `noClear` cycles asc ↔ desc only and drops the submenu's per-column Clear row. Driving it from code, `table.setSort(field, order)` replaces and `table.setSort(field, order, { multi: true })` appends. The standalone `<mono-table-sort field>` renders the control outside a `<mono-table-th>` and behaves identically.

<ClientOnly>
<DemoSingle name="table" id="sorting" />
</ClientOnly>

## Editable rows

Mark a column `editable: true` in `props.th` and author the editor in its `<td>` — the `<tr>` only needs `:data-row-key`. `editableTrigger` picks the gesture (`'click'` default, `'double-click'` to leave single clicks free); it's a controller option, and clicks on an editor or button never open the row, so per-row Edit/Delete keep working. The caret lands in the cell you clicked (falling back to the first editable one); `Tab` walks from there, rolling into the next row.

### Marking columns that want input

Nothing in a header says which columns accept input, so a grid with a mix of editable and read-only columns looks uniform until you click one. `required` draws a red `*` after the caption — the same marker `mono-input` and the other form controls draw for their own `required`, so one marker means one thing across the library:

```js
const columns = [
  { field: 'Nama', caption: 'Nama' },                              // read-only
  { field: 'Nilai', caption: 'Nilai', editable: true, required: true },
]
```

```html
<mono-table-th :control-table.prop="table" field="Nilai" required>Nilai</mono-table-th>
```

It is **presentation only** — `editable` is what opens an editor, and this enforces nothing. They are separate so a column can be wired editable without advertising it, and so the marker can sit on a column whose editing you drive yourself.

The `*` is rendered *inside* the caption group, not among the header's other controls, so it stays glued to the text — a narrow column that wraps its funnel or sort arrow onto another line never leaves the marker stranded from its caption.

### Seamless editors

A `<td>` that contains a mono form control is auto-flattened into the cell — no border, radius, background or height of its own, so the text doesn't shift when editing starts (the focused cell gets a 2px accent underline). The field also inherits the cell's `text-align`, so a right-aligned money column stays right-aligned once the editor opens — in the light builds; a shadow editor cannot be reached by page CSS and still sits left. Nothing to switch on; re-assert the `--theme-*` / `--mono-input-*` vars on a cell to keep its boxed look. The **Manager** column is a `<mono-dropdown-table>` in the cell — render it with `v-if`, since one shared dropdown reflects one row at a time.

<ClientOnly>
<DemoSingle name="table" id="editable" />
</ClientOnly>

## Keyboard navigation

Tap `Tab` for the next column; **hold `Tab` + arrow** to move one cell — `←`/`→` in the row, `↑`/`↓` to the same column of the next row. Arrows never wrap. `Enter` opens the focused editor, `Esc` closes a popup then leaves edit mode. `editorNavKeys: 'native'` opts out for the browser's own Tab order; `table.moveEditor(dir)` drives a move from your own buttons.

<ClientOnly>
<DemoSingle name="table" id="keyboard-nav" />
</ClientOnly>

## Editing a DataSource

Staged edits against a bound DataSource — Save flushes them with `store.update` (OData `PATCH`), not per keystroke.

<ClientOnly>
<DemoSingle name="table" id="editable-datasource" />
</ClientOnly>

## Row-level CRUD (`form()`)

`table.form().add/edit/delete().apply()` stages whole rows and commits them without a full reload; `showForm: true` drops an editable row into the grid to fill in place.

This grid uses `editableTrigger: 'double-click'` so single clicks stay free for the row's own Edit / Delete buttons — though the trigger ignores clicks on controls either way, and a `showForm` add-row renders its editors with no trigger at all.

<ClientOnly>
<DemoSingle name="table" id="form-crud" />
</ClientOnly>

The same UX bound to a DataSource — `apply()` reflects the change in the loaded page optimistically, no reload.

<ClientOnly>
<DemoSingle name="table" id="form-crud-datasource" />
</ClientOnly>

## Loading overlay

Put `<mono-table-loading>` in the table's `<caption>` — it shows a spinner over the rows during any query and holds the grid's height so it can't collapse mid-fetch.

```html
<div mono-table-scroll>
  <table mono-table>
    <caption><mono-table-loading :control-table.prop="table" /></caption>

    <thead>…</thead>
    <tbody>…rows…</tbody>
  </table>
</div>
```

The caption is a host, not a label: its only child is out of flow, so the box is **0px** high and nothing shifts. Dropping the element straight into `<tbody>` works too — it wraps itself, see below — but `<tbody>`'s content model is `<tr>` and nothing else, so Vue's compiler warns about the nesting before any of that runs. The caption is the one table section that takes a custom element without complaint.

<ClientOnly>
<DemoSingle name="table" id="loading" />
</ClientOnly>

### Where it puts itself

That one line is the whole contract, but two things happen under it that are worth knowing when you are reading the DOM.

**Outside a caption, it wraps itself in a row.** `<table>`'s content model permits only `caption` / `colgroup` / `thead` / `tbody` / `tfoot`, and a row section permits only `<tr>` — so a bare custom element in either is invalid. The HTML parser *foster-parents* it out of the table entirely, at which point it is no longer positioned by the table and covers nothing. So when the element finds itself in a table or a row section it builds a zero-height `<tr mono-loading-row><td colspan>` around itself on connect, and dropping it into `<tbody>` works. A `<caption>` or a `<td>` you wrote yourself is left exactly as written.

Both hosts lay out identically — same overlay box, same measured header offset, same spinner position — so the choice is only about that compiler warning.

**It covers the `<table>`, not the scroll wrapper.** That distinction is the difference between an overlay that works and one that only looks like it does. The overlay is `position: absolute; inset: 0`, so it covers its nearest positioned ancestor — and an absolutely positioned descendant of a **scroll container scrolls with the content**. Anchor it to the wrapper and it is pinned to the scroll origin at the scrollport's size: scroll a wide table sideways and the dim slides away, leaving live rows showing through beside it. Anchored to the table, the dim *is* the content, so every column and row stays covered at any scroll offset.

**The spinner is pinned to the visible area, not to the table's centre.** The centre of a wide or long table is far outside the scrollport, and a spinner you have to scroll to find reads as no spinner at all — so it is `position: sticky` and sits a constant distance below the header at every scroll offset:

- **Vertically**, `top: calc(var(--mono-table-loading-head) + var(--mono-table-loading-gap))`. `--mono-table-loading-head` is written by the element itself: on `mono-sticky-head` it measures the `<thead>` (so a two-row banded header or a caption that wraps at a narrow width is cleared exactly, not approximately), and it is `0` for a header that scrolls away.
- **Horizontally**, inside a `[mono-table-scroll]` it centres on the *scrollport* — the region becomes an inline-size container and the offset is `50cqw`. Without a scroll wrapper the flex centring already puts it in the middle of the table, which there is the same place.

Only `top` is set on the vertical axis. A second inset on the same axis gives `sticky` two edges to satisfy and it slides between them as you scroll.

**It holds the height on a block box, never on the `<table>`.** A source that clears its rows mid-query would otherwise collapse the grid to a strip and bounce the page, so the element freezes a `min-height` for the duration — on the `[mono-table-scroll]` wrapper, or failing that on the table's own parent. Not on the table: CSS table layout does not treat a height as reserved space, it **distributes** the surplus over the rows. Freeze a full table's height, let its rows clear, and every one of those pixels lands on the only row left — the header — which stretches into a band hundreds of pixels tall with its captions floating in the middle. If the table has no block ancestor to hold the space, the hold is skipped instead; a grid that briefly goes short is a smaller problem than a deformed one. The dim itself is stretched to the scroll region's height for the same reason — a table that is currently just a header would otherwise dim a strip and leave bare white under it. Stretching the overlay costs nothing: it is out of flow, so it changes what is covered and nothing about the layout.

### Driving it yourself

The element reads the bound controller's `loading`, which covers sort / search / page / reload.

**`loading` — manual control.** Bind it and the overlay follows *your* flag instead of the controller's:

```vue
<!-- shown while isBusy, hidden otherwise — whatever the controller is doing -->
<mono-table-loading :control-table.prop="table" :loading="isBusy" />

<!-- no controller at all -->
<mono-table-loading :loading="saving" />
```

| `loading` | Overlay |
|---|---|
| not set / `null` / `undefined` (default) | automatic — while the controller is fetching |
| `true` (`loading`, `loading="true"`) | shown, the controller ignored |
| `false` (`loading="false"`) | hidden, the controller ignored |

Binding `undefined` or `null` hands it back to the controller. `min-duration`, the height hold and the header measurement apply to the manual flag exactly as to the controller's.

**`data-loading` — add to the controller.** When you want the controller's own loading *and* yours — a filter that fires several requests, a flag held across a save — set the attribute instead, and the two sources are OR-ed together:

```vue
<mono-table-loading :control-table.prop="table" :data-loading="isBusy || null" />
```

`|| null` **removes** the attribute: the CSS keys on a bare `[data-loading]`, so a literal `false` would still match. An attribute you set gets the same height hold and header measurement the controller path gets.

`data-loading` is **yours** — the element reads it and never writes it. Its own state goes on a separate `data-mono-loading`, and the stylesheet shows the overlay for either. That separation is not tidiness: one attribute shared by both sources would need the element to tell its own writes from yours, and it cannot — a `MutationObserver` reports asynchronously, so an "I am writing" flag is already back to false by the time the callback runs. The element would read its own write as yours, latch on, and never hide again.

<ClientOnly>
<DemoSingle name="table" id="loading-scroll" />
</ClientOnly>

Two knobs if you want it elsewhere. `--mono-table-loading-gap` (default `1.25rem`) moves the spinner up or down without touching the measured header offset; `[mono-loading-row] [mono-loading-spinner]` takes any `top` / `left` you like if you want to place it by hand.

**Its stacking tier is `--mono-table-loading-z`, default `10`.** The overlay has to paint over pinned columns and a frozen header, which are the highest tiers this sheet uses (3). It sits at 10 rather than 4 so an app that lifts its own header — a common enough thing to do — cannot tie or beat the dim by accident and leave a sticky column showing through it. If your own ladder ever has to go past 10, raise the variable rather than out-bidding it.

## Error bar

A failed request used to be invisible — the grid just looked empty.
`<mono-table-error>` reads the same controller and shows the error's own message
in a red row directly under the header.

```html
<tbody>
  <tr><td colspan="3"><mono-table-error :control-table.prop="table" behaviour="clear-list" :reload="true" /></td></tr>
  <tr v-for="…">…</tr>
</tbody>
```

Write the row: `<tbody>` only takes `<tr>`, so anything else there is invalid
HTML — Vue's compiler warns, and a server-rendered page foster-parents the
element out of the table before hydration. The element adopts the row you give
it — the row class its padding reset keys on, the zebra-skip marker, and a
`colspan` kept in step with your columns are all stamped on — so the two tags
are the whole contract. (Dropped bare into `<tbody>` from script it still wraps
itself; that is a client-only fallback, not the form to write.)

It catches **any** failed controller operation —
load, reload, search, sort, paging, the scroll and chunked paths, server-side
grouping and the select-all drain — whether the store rejected with an `Error`, a
string or an HTTP payload. Nothing is swallowed: a caller that awaits
`table.load()` still gets its rejection, and the caught one is on `table.error`
(`message`, `status`, `detail`, `raw`, `source`) for your own logging.

**A status gets a sentence, not a phrase.** A store's error carries the HTTP
status — devextreme puts it on `httpStatus`, fetch and axios on `status` /
`response.status`, ofetch on `statusCode` — and the bar reads the preset for it
rather than the transport's word: `403` shows *You do not have permission to view
this data.*, not *Forbidden* (and not *Error*, which is all a 403 over HTTP/2 used
to say — the statusText there is blank). Anything the **server** wrote beyond the
status — an OData error body, a JSON `message` — follows the headline as a muted
detail (`Something went wrong on the server. Please try again later. — Object
reference not set…`); a bare reason phrase is never shown as one. A failure with
no status at all (`Error('Boom')`, a string) shows its own text, as before.

| status | headline |
| --- | --- |
| `network` (0, `Failed to fetch`) | Could not reach the server. Check your connection and try again. |
| 400 | The server rejected the request. |
| 401 | Your session has expired. Please sign in again. |
| 403 | You do not have permission to view this data. |
| 404 | The requested data could not be found. |
| 408 / 504 | The server took too long to respond. Please try again. |
| 409 | The request conflicts with the current state of the data. |
| 422 | The server could not process the request. |
| 429 | Too many requests. Please wait a moment and try again. |
| 500 | Something went wrong on the server. Please try again later. |
| 502 / 503 | The server is temporarily unavailable. Please try again later. |
| `default` | Request failed |

Change the wording once for the whole app with `setErrorMessages()`, or per grid
with `errorMessages` — both take only the keys that differ, merged over the
defaults (`DEFAULT_ERROR_MESSAGES`), and the per-grid map wins:

```ts
import { setErrorMessages, controlMonoTable } from '@mono-lit/helper'

setErrorMessages({
  401: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
  403: 'Anda tidak memiliki akses ke data ini.',
  500: 'Terjadi kesalahan pada server. Coba lagi nanti.',
  network: 'Tidak dapat terhubung ke server.',
})

const table = controlMonoTable(null, {
  errorMessages: { 404: 'Budget period not found.' },
})
```

**It stays in view.** The bar is exactly the visible width of its
`[mono-table-scroll]` and pinned to the visible left edge, so on a table wider
than its box — one with a pinned action column, say — the text and the ✕ / ↻ are
where you are looking rather than at the table's far ends. Under
`mono-sticky-head` it is pinned under the header too (the header's height
is measured, so a banded two-row header works); without a frozen header it
scrolls with the rows, as any row does.

A failure **clears the rows** (`behaviour="clear-list"`, the default): a source
keeps its last successful page after a rejected load, so without this a filter
the backend refused would leave the previous filter's rows under the bar.
`behaviour="keep-list"` leaves them; the setting is written to the controller
(`onError` option, `table.setErrorBehaviour()`). A failed select-all never clears.

The **↻** re-runs the failed query (`table.reload()`) and the bar stays until that
succeeds; `:reload="false"` drops it, `reload-label` renames it, `reload` fires.

`message` shows your own text and wins while set. `:dismissible="false"` drops
the `×`, `close-label` renames it, and dismissing emits `close` — it hides
**that element only**, so the next failure brings it back. `<mono-table-empty>`
stands down while an error is set, because "No Data found" is the wrong thing to
say about a request that failed.

<ClientOnly>
<DemoSingle name="table" id="error" />
</ClientOnly>

## Empty state

`<mono-table-empty>` is the loading overlay's pair, placed the same way and reading the same controller — one covers the grid while a query runs, the other covers it when the query came back with nothing.

That is the whole of it: with no props it shows a default icon, title and subtitle, and a button that reloads the grid. `icon` (an iconify class **or** an emoji), `title`, `subtitle`, `reload` / `reload-label` and `height` / `min-height` / `max-height` override the defaults; `''` drops a part; `slot="body"` replaces all of them with your own markup. It appears only once the controller has actually loaded, so a fresh table never flashes "no data" — and with no `control-table` bound at all it always shows, so you can drive it yourself with `v-if`.

The demo below uses every one of those; open its source to see them.

<ClientOnly>
<DemoSingle name="table" id="empty" />
</ClientOnly>

## Row selection

Put a `type="all"` checkbox in a `<th>` and a `type="single"` one per row — the `<th>` can't render the `<td>` ones, since you loop the rows yourself.

```vue
<th><mono-table-checkbox type="all" :control-table.prop="table" key-value="Id" /></th>
<td><mono-table-checkbox :control-table.prop="table" :item.prop="row" /></td>
```

`table.check().getAll()` → `[{ Id: 8 }, { Id: 12 }]`. With `mode="all"` (default) the select-all drains the source in `chunk` (100) row requests and selects everything the active search matches, not just the page; `mode="per-page"` selects the loaded page with no request. Every checkbox on the grid is disabled while a drain runs, and the select-all spins. `key-value` is path-aware and keeps the shape (`'Transaction.[*].Id'` → `{ Transaction: [{ Id }] }`); omit it for whole rows. The selection survives paging, sorting and searching — `check().clear()` empties it. Size, color and the rest come from `mono-checkbox`.

<ClientOnly>
<DemoSingle name="table" id="checkbox" />
</ClientOnly>

## Row detail

Put `<mono-table-detail>` in a `<td>`; whatever you slot into it renders as a full-width row below that row while open. Anything works inside — interpolation, `v-if`, a nested grid, nested details.

```vue
<mono-table-detail :control-table.prop="table" :stay-open="row.KeepOpen" @toggle="onToggle">
  Notes: {{ row.Note }}
</mono-table-detail>
```

Opening a row closes the one that was open. `stay-open` exempts a row from that *and* from `collapseAll()` — set it on every row if you want several panels open at once. Bulk control: `table.detail().expandAll() / collapseAll() / collapseOthers() / openCount() / getAll()`. Shared defaults go in `props: { detail }`; `open` is per-row state and is ignored there.

<ClientOnly>
<DemoSingle name="table" id="detail" />
</ClientOnly>

## Header filter

`headerFilter: true` on a column gives it a distinct-values panel — funnel icon and a right-click `Header Filter ›` row.

- **Funnel** = single column (replaces). **Right-click → Header Filter** = combine. Once a combination was started from the menu, the funnels combine too until nothing is filtered. **Clear all columns (N)** shows only when other columns are filtered.
- Icon: outline = nothing applied, filled = filtered. `showIcon: false` keeps the right-click path.
- Object form: `enable`, `title`, `showIcon`, `dataSourceOptions` (devextreme load options; `take` caps the list).
- Request: `GET <store url>?$apply=filter(<scope>)/groupby((field),aggregate($count as count))` — put in the url (`urlOverride`), never `customQueryParams`. Scope = base filter (see [DataSource options](#datasource-options)) + the other columns' filters + search; never the column's own. A 4xx/501 or plain entities → `$select=<field>` scan deduped client-side, remembered for the controller's lifetime (Northwind below). `serverApply: false` never tries.
- A custom `distinctValues` resolver receives the scope as `ctx.applyWithFilter` (`filter(<base>)/groupby(…)`) and `ctx.odataFilter`.

::: tip One menu per header
Right-click is bound on every header cell that is sortable or filterable, and both features share the one menu (separated). A column with neither keeps the browser's own context menu.
:::

<ClientOnly>
<DemoSingle name="table" id="header-filter" />
</ClientOnly>

### Date filter

The header filter for a date / datetime column: the same funnel, menu row (`Date Filter`), footer, cascade and gestures, but the panel is a **tree** — year → month → day → hour → minute → second, only the periods in the data, with counts. One or the other per column (`dateFilter` wins and warns).

- Object form: `headerFilter`'s options plus `depth` (`'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'`, default `'month'`; `'day'` for a date-only column, `'second'` for the full drill-down), `utc` (default local) and `locale`.
- One request per open — the header filter's `distinctValues` request, every distinct timestamp in scope; the tree is built client-side. `dataSourceOptions: { take }` caps it; `depth` only shallows the tree.
- Leave `utc` off on a DevExtreme source: its ODataStore reads `…T00:00:00Z` as *local* midnight and writes a local-midnight Date back as `…T00:00:00Z`, so the local tree already matches the server's days. `utc: true` is for array sources holding true instants.

<ClientOnly>
<DemoSingle name="table" id="date-filter" />
</ClientOnly>

<ClientOnly>
<DemoSingle name="table" id="date-filter-remote" />
</ClientOnly>

## DataSource options

Every query the grid runs — a search, a header filter, a sort, a page, a scroll page — is
composed on top of a **base** it does not own. The base has three sources, all AND-ed:

| Layer | Set by | Notes |
| --- | --- | --- |
| `dataSourceOptions.filter` / `odataOptions.$filter` | the options below | read fresh at every query |
| whatever the source holds | `ds.filter(…)` on the DataSource itself | adopted whenever it is not what the grid last wrote |
| `table.setFilter(…)` | the slotted filter builder | one layer; `null` clears only it |

then the header column filters, then the search. This is what makes a scope you set on a
DataSource survive a search — the grid used to rebuild `source.filter()` from its own
layers alone, so the first keystroke wrote over the scope and clearing the box "restored"
nothing.

`dataSourceOptions` takes the devextreme `DataSource` knobs and keeps them under every
request: `filter`, `select`, `expand`, `sort`, `customQueryParams`, `paginate`,
`pageSize`, `requireTotalCount`, `searchExpr` / `searchOperation`. It accepts a value, a
**getter**, or a `{ value }` box — a Vue `ref` / `computed` — and is read at query time, so
a getter over reactive state always contributes the *current* value:

```ts
const table = controlMonoTable(null, {
  keyExpr: 'OrderID',
  dataSourceOptions: computed(() => ({
    filter: country.value ? ['ShipCountry', '=', country.value] : null,
    select: ['OrderID', 'ShipName', 'ShipCity'],
  })),
})
// a state change is not a query — ask for one:
watch(country, () => table.refresh())
```

`refresh()` re-reads the options and the source's own filter and loads, going back to
page 0 only when something changed; `reload()` always restarts and drops the store cache.
`setDataSourceOptions(next)` / `setOdataOptions(next)` replace the option and refresh;
`resolvedDataSourceOptions()` is the merged result of the last query.

`odataOptions` is the same in raw OData vocabulary: `$select`, `$expand`, `$orderby`,
`$filter`, and any other key (`$count`, a custom parameter) lands in `customQueryParams`.
Both may be given; they are merged — filters AND-ed, `select`/`expand` unioned, the OData
bag winning ties. `$filter` is parsed into the array form so the store compiles it together
with the column filters and the search; an expression the parser cannot read (an `any()`
lambda, an ISO date literal) is sent as written and comes out as `(expr) eq true` — valid
OData, but devextreme rewrites every `.` in that text to `/`, so keep decimals and dotted
strings out of it, or write the array form under `dataSourceOptions.filter`. An array
source cannot evaluate a raw string and ignores it, with one console warning.

**Precedence.** A column sort the user picks wins; `sort` entries from the options and from
the source follow as tiebreakers, and clearing the column sort falls back to them instead
of to nothing. `<mono-table-paging :size>` / `setPreferredPageSize` win over
`dataSourceOptions.pageSize`, and clearing the override restores it. The grid's own
`searchValue` wins over `dataSourceOptions.searchExpr`. Server-side grouping receives the
base too — `store.load()` never saw the DataSource's filter before — and so does every
`$apply` the grid sends or hands over: the [header-filter](#header-filter) value list
(the built-in store request, a `distinctValues` resolver, or the column scan) and the
[summary footer](#where-the-number-comes-from) (the built-in store request or `summary.resolve`),
resolvers receiving it as `odataFilter` / `applyWithFilter`.

::: warning `setFilter` is a layer now
`table.setFilter(x)` used to replace the source filter outright — the consumer's scope, the
column filters and the search all went with it, and the next keystroke replaced *it*. It
is now composed like everything else and `setFilter(null)` clears only what it set. The
per-column `headerFilter.dataSourceOptions` is a different, older option: it shapes one
distinct-values request, not the base.
:::

<ClientOnly>
<DemoSingle name="table" id="base-filter" />
</ClientOnly>

## Mapping rows for display

`map` turns each raw row into a presentation row inside the controller, so you stop hand-rolling a `computed` over `items`:

```ts
const table = controlMonoTable(null, {
  map: (row) => ({ ...row, _status: renderStatus(row.Status), _date: formatDateTime(row.Tanggal) }),
  props: {
    th: [{ field: 'Tanggal', map: (v) => formatDateTime(v) }],   // column map: (value, row, index) => any
  },
})

table.subscribe(() => { rows.value = [...table.mapped] })   // was: [...table.items]
```

A column `map` receives the **raw** field value (so the body and header-filter list stay in agreement) and overwrites the grid map for that field — pick one per field. Read the results from `table.mapped`; **`items` stays raw** so editing, search, sort and filters read the unformatted values.

## Path field expressions

A `field` / `searchValue` entry can be a path: nested (`Job.Name`), indexed (`User.[1].Id`) or wildcard (`User.[*].Name`) — resolved for search, sort, filter and edit.

<ClientOnly>
<DemoSingle name="table" id="path-fields" />
</ClientOnly>

## Row striping

<DemoSingle name="table" id="striped" />

Zebra rows come free with `[mono-table]` — no component, no classes on the rows, nothing to
wire. Body rows are **opaque** by default (`--mono-table-surface`, with every second row
tinted by `--mono-table-zebra`), so the alternation reads the same on a white page, on a
card, or on a coloured background.

| To do this | Set |
| --- | --- |
| Turn striping off | `--mono-table-zebra: var(--mono-table-surface)` |
| Retint the stripe | `--mono-table-zebra: <color>` |
| Make the table see-through | `--mono-table-surface: transparent` |

Either token can go on the table, on any ancestor, or on `:root` — they inherit, and they
pierce the shadow boundary.

### Rows that are not records

Parity is counted over **data rows only**, so a row the reader does not perceive as a record
neither takes a stripe nor shifts the alternation of the rows beneath it. That covers the
rows mono injects itself — an open [row-detail](#row-detail) panel, a
[group](#grouping) header — and spacer rows marked `aria-hidden="true"`, which is how the
[virtual scroll](#virtual-scroll) demos pad their window.

For your own non-record rows — a section separator, a totals band inside the body — add
`data-mono-stripe-skip`:

```html
<tr data-mono-stripe-skip>
  <td colspan="4">Support functions</td>
</tr>
```

> Filtering the count needs `:nth-child(… of S)` (Chrome 111, Firefox 113, Safari 9). An
> older engine falls back to plain alternation over every row — striped, just with the
> pre-existing parity shift after an injected row.

## Fixed columns

Add `mono-sticky-left` / `-right` to a column's `<th>` and `<td>`s to pin it on horizontal scroll.

<ClientOnly>
<DemoSingle name="table" id="fixed" />
</ClientOnly>

### Filling the scroll box

A table is only as tall as its rows, so a short result set leaves dead space under the last row — and every line the rows carried stops there.

**A pinned column's edge does not.** Inside a `[mono-table-scroll]` it runs on down to the floor of the box automatically (the last row's pinned cells paint it as a border-image with a bottom outset — ink only, so it adds no scroll height, and once the rows overflow the box there is nothing below the last row for it to show in). Nothing to add.

If you also want your **own** column rules and the row background to reach the floor, put `mono-fill` on the `<table>` (it stretches to the box) **and** one `mono-filler` row at the end of the tbody — a row at `height: 100%` absorbs the whole remainder, so the data rows keep their natural height. Give it the same cells as a data row, empty, with the pinned classes on the pinned ones:

```html
<div mono-table-scroll mono-scroll-y style="height: 55vh">
  <table mono-table mono-fill>
    …
    <tbody>
      <tr v-for="row in rows" …>…</tr>
      <tr mono-filler>
        <td v-for="c in columns" :key="c.field" :class="stickyCls(c.field)"></td>
      </tr>
    </tbody>
  </table>
</div>
```

The filler is not a data row: no stripe, no hover tint, no row rule, no padding. Add it unconditionally — once the rows overflow the box it collapses to zero height.

Without a percent-height row the browser picks where the surplus goes, and it can pick the **header** — a banded header's second row ballooning over an empty body is that. A hand-written empty-message row that should centre its text is the other row that may ask for the height: give it a class of your own at `height: 100%` (with `vertical-align: middle` on the cell). Not `mono-table-empty-row` — that is the host row of `<mono-table-empty>` and is pinned to `height: 0`.

### Frozen header

`mono-sticky-head` (on the table or on its `[mono-table-scroll]` wrapper, with `mono-scroll-y` + a `max-height`) keeps the `<thead>` pinned while rows scroll under it.

A frozen header — and `mono-sticky-foot`, the same thing at the bottom, and a table holding a pinned column — switches that table to `border-collapse: separate` with zero spacing. In the default `collapse` mode a border belongs to the *table*, not the cell: it is painted where the cell sits in flow, so the header's bottom rule and any `th { border-right }` you add scrolled away under the frozen titles (and the header gradient, which lives on `<thead>`, went with them); a pinned column's edge did the same sideways, while the borders of the cells sliding under it showed through. With separate borders every cell paints its own edges inside its own box and carries them along, the pinned cells get an opaque background, and the row rule moves from `<tr>` onto the body cells. Same geometry — nothing to change in your own CSS, and a border you put on a `th` or `td` now sticks with it.

## Summary footer

Give a column a `summary` in `props.th` and read it in a `<tfoot>` via `<mono-table-summary field="…">` or `table.summary()` — computed over the full set, not just the current page.

<ClientOnly>
<DemoSingle name="table" id="summary" />
</ClientOnly>

### Where the number comes from

A total is page-independent, so something has to see every matching row. Three ways in, tried in this order:

1. **`summary.resolve`** — your hook, asked first (below).
2. **The source's own store** — for a remote devextreme `ODataStore`, the grid sends ONE `GET <store url>?$apply=filter(<base>)/aggregate(Nilai with sum as Nilai,…)` on the store's url, `beforeSend` and auth, and reads the one row back by alias. Automatic: nothing to configure. Like the [header filter](#header-filter), the clause goes into the url (`urlOverride`) rather than through `customQueryParams`, a `CustomStore` gets no request, plain entities instead of an aggregate row are detected and declined, and a backend that rejects the clause (4xx / 501) is remembered and not asked again. `serverApply: false` switches it off.
3. **The drain** — the definition of the result: the grid reads the bound source in `take: 100` chunks and adds the numbers up locally. Over an array that is free. Over a **server-paged** table it is the pathological case: opening a grid that shows ten rows fires a burst of `$skip`/`$top` requests for every row the pager exists to avoid — which is what 1 and 2 exist to avoid.

`summary.resolve` covers what the store path cannot: a source that is not a devextreme OData store, a fetcher of your own, a dialect the built-in clause does not fit, a cached answer. (**devextreme itself has no aggregate support** — `totalSummary`, `groupSummary` and `$apply` are all absent from its store, and an unknown load option is dropped in silence rather than refused — which is why the built-in request has to be spelled out as a url.)

mono builds the clause and hands it over:

```ts
monoDataGrid(source, {
  summary: {
    fields: { Nilai: { type: 'sum' }, NilaiRealisasi: { type: 'sum' } },
    resolve: async ({ applyWithFilter }) => {
      const { data } = await myFetch({
        url: '/History',
        params: { $apply: applyWithFilter },   // filter(…)/aggregate(Nilai with sum as Nilai,…)
      })
      return data?.[0] ?? null                 // keyed by alias, or null to fall back
    },
  },
})
```

The context carries `apply`, `applyWithFilter`, `odataFilter`, `filter`, `specs`, `aliases` and `source`. Return one value per spec — positionally, or keyed by `aliases` (the plain field name whenever a field carries a single aggregate).

**Returning `null` declines**, and the grid moves on to the store request and then the drain, exactly as it would with no resolver — so declining is always safe, and is the right answer for a source this resolver does not serve or a request that failed. A throw does the same and is warned about once.

For a grid built by a shared factory or composable that does not forward `summary`, attach it afterwards:

```ts
table.setSummaryResolver(resolve)   // recomputes immediately; null clears it
```

Attach it **before** a source is bound if you can. `initTable`-style helpers that bind and load in one call trigger the first recompute as part of that load, so a resolver attached afterwards lets exactly one drain through.

Either path uses the same predicate the grid is showing: the source's own filter AND its active `searchValue`, so a total can never count rows the user searched away.

### Wide / scrolling tables

Freeze the footer with `mono-sticky-foot` (plus `mono-scroll-y` + a `max-height`) so the totals stay pinned while rows scroll under them.

<ClientOnly>
<DemoSingle name="table" id="summary-sticky" />
</ClientOnly>

## Full example

Everything from a static array — stat cards, filters, selection, badges, progress and actions.

<ClientOnly>
<DemoSingle name="table" id="full" />
</ClientOnly>

## Infinite scroll

`<mono-table-paging type="infinity-scroll">` in a fixed-height scroll region auto-loads the next page as you reach the bottom.

<ClientOnly>
<DemoSingle name="table" id="infinite-scroll" />
</ClientOnly>

The same mode over a remote OData DataSource — each appended page is a real `skip`/`take` round-trip.

<ClientOnly>
<DemoSingle name="table" id="infinite-scroll-remote" />
</ClientOnly>

## Virtual scroll

`type="virtual-scroll"` renders only the height-visible rows (windowed slice + spacer rows), so 10,000 rows stay light.

<ClientOnly>
<DemoSingle name="table" id="virtual-scroll" />
</ClientOnly>

Virtual scroll over a remote DataSource — the DOM stays tiny *and* the server is paged as the window nears the loaded end; `:size` overrides the source's page size.

<ClientOnly>
<DemoSingle name="table" id="virtual-scroll-remote" />
</ClientOnly>

## Grouping

Pass `group` to `controlMonoTable` (array or DataSource); `table.displayRows` is a flat keyed list to `v-for` (switch on `kind`). The main pager pages the first group layer; `<mono-table-paging-group>` pages rows inside a group.

<ClientOnly>
<DemoSingle name="table" id="grouped" />
</ClientOnly>

Both pagers together (static array) — the footer pager moves between groups, each group pages its own rows.

<ClientOnly>
<DemoSingle name="table" id="grouped-static" />
</ClientOnly>

Automatic server-side paging over a real DataSource — one `groupby` for the group list + subtotal, each group fetches only its current page.

<ClientOnly>
<DemoSingle name="table" id="grouped-budget" />
</ClientOnly>

## CSS Variables

<DemoSingle name="table" id="css-vars" />

Themed through `--mono-table-*` custom properties (they inherit and pierce the shadow boundary). Each is the PUBLIC knob at the head of a resolver chain — set one and it wins over the flavour and over `mono-color`. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

Every row colour is **opaque** by design: a pinned column and a frozen head paint over the rows sliding beneath them, so a translucent row would show that content through. Override with an opaque value.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-table-accent` | `--primary` | Accent — sort and filter marks, pagination, the selected row's rail |
| `--mono-table-on-accent` | `--primary-foreground` | Ink on top of the accent |
| `--mono-table-text` | `--foreground` | Cell text colour |
| `--mono-table-muted` | `--muted-foreground` | Secondary ink — captions, counts, the empty message |
| `--mono-table-border` | `--border` | Grid border colour |
| `--mono-table-border-lite` | `--border` | Soft inner border |
| `--mono-table-outer-border-color` | `--border` | The table's outer edge colour (flavours retint it) |
| `--mono-table-outer-border` | `1px solid` that colour | The whole outer border shorthand; `none` removes it |
| `--mono-table-surface` | `--background` | Row / control surface — the base every body row paints |
| `--mono-table-soft` | muted 62% on the surface | The wash the detail panel and group row share |
| `--mono-table-zebra` | muted 42% on the surface | Every-second-row fill; set it to `--mono-table-surface` to switch striping off |
| `--mono-table-hover-bg` | *(the row's own colour)* | Row hover fill. **Off by default**: upstream's `bg-muted/50` lands within a hair of the zebra, so on a striped table hovering an odd row just repainted it as an even one. Set it to turn hover back on |
| `--mono-table-selected-bg` | `--muted` | Selected-row fill |
| `--mono-table-th-height` | `2.5rem` | Header cell height (flavours retune it) |
| `--mono-table-th-pad-x` | `0.5rem` | Header cell inset |
| `--mono-table-cell-pad` | `0.5rem` | Body cell inset |
| `--mono-table-radius` | `--mono-radius-lg` | The table's own corner |
| `--mono-table-loading-bg` | surface 64% | Loading-overlay backdrop (dim) |
| `--mono-table-loading-blur` | `2px` | Loading-overlay backdrop blur |
| `--mono-table-spinner-size` | `1.5rem` | Loading spinner diameter |
| `--mono-table-spinner-width` | `2.5px` | Loading spinner ring width |
| `--mono-table-spinner-color` | accent | Loading spinner color |
| `--mono-table-spinner-speed` | `0.65s` | Loading spinner rotation speed |
| `--mono-table-loading-z` | `10` | Loading-overlay stacking tier — above every tier the sheet itself uses (pinned header / footer tops out at 3) |
| `--mono-table-empty-min-h` | `12rem` | Room `mono-table-empty` reserves under the header (raised when the message is taller) |
| `--mono-table-empty-gap` | `2rem` | How far below the header the empty message sits |
| `--mono-table-empty-z` | `9` | Empty-state stacking tier — one below the loading overlay, so a reload's spinner paints over it |
| `--mono-table-loading-gap` | `1.25rem` | Gap between the header and the spinner |
| `--mono-table-loading-head` | *(measured)* | Read-only — the element publishes the frozen header's height here; `0` when the header is not sticky |
| `--mono-table-detail-size` | `1.5rem` | Row-detail chevron button size |
| `--mono-table-detail-radius` | `0.35rem` | Row-detail chevron corner radius |
| `--mono-table-detail-color` | muted | Row-detail chevron color (collapsed) |
| `--mono-table-detail-color-open` | accent | Row-detail chevron color (expanded / hover) |
| `--mono-table-detail-hover-bg` | the row hover fill | Row-detail chevron hover fill |
| `--mono-table-detail-panel-bg` | the soft wash | Detail panel row background |
| `--mono-table-detail-panel-pad` | `0.85rem 1rem` | Detail panel row padding |

## Types

`controlMonoTable` is also exported as `monoDataGrid`, and `:control-table` is also accepted as `:data-grid` — the older spellings still work.

<DemoTypes name="table" />

<style>
/* Fix native mono table inside VitePress .vp-doc */
.vp-doc table[mono-table] {
  display: table;
  width: 100%;
  margin: 0;
  /* NO `border-collapse: collapse` — the sheet needs `separate` or a sticky
     head, a sticky foot and every pinned column lose their edge. */
  overflow: visible;
}

.vp-doc [mono-table-scroll] {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  /* Leave overflow-y to the library rules: `[mono-table-scroll]` is hidden by
     default, `[mono-table-scroll][mono-scroll-y]` opts into `auto`. Forcing
     hidden here (same specificity, loaded later) would clobber it and kill
     vertical scroll for every scrolling table on this page. */
}

.vp-doc table[mono-table] thead {
  display: table-header-group;
}

.vp-doc table[mono-table] tbody {
  display: table-row-group;
}

.vp-doc table[mono-table] tr {
  display: table-row;
  border-top: 0;
}

/* The cell resets live in theme/custom.css, side by side — a blanket `border: 0`
   here sat above the sheet and zeroed the footer rule and every row separator. */
.vp-doc table[mono-table] th,
.vp-doc table[mono-table] td {
  display: table-cell;
}
</style>
