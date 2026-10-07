| `--mono-tag-input-option-spacing` | `2px` | The seam between two rows, so a hovered row under the selected one stays a separate wash |
# Tag input

A multi-value tag entry with optional autocomplete suggestions, validation states, `min` / `max` selection limits, and slot-overridable label/helper. Tags are added with **Enter**, **,** or **Tab**, and removed with **×** or **Backspace** on an empty input. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's multi-select combobox (see [Theme](./theme)): the field is `.combobox-chips` (the [input](./input) box, `px-1.5 py-1.5`, chips wrapping inside it), each tag a `.combobox-chip` (a muted `text-xs` pill-less chip with a fading ✕), the suggestion list the [select](./select)'s panel. Dark mode is built in.

## Basic

Default tag input that accepts custom values.

<DemoSingle name="tag-input" id="basic" />

## Sizes

Small, medium and large.

<DemoSingle name="tag-input" id="sizes" />

## Colors

Pick a colour and every variant takes it. `color` sets the **focus** colour — the ring and the focused border; a resting field is always on `--input`. The chips stay muted whatever the colour — pin them to a hue with [`chip.color`](#chips).

`outlined` is Basecoat's `.combobox-chips`. `filled` is luma's (a transparent border on an `--input`/50 surface, no shadow) and `underlined` is sera's (square, bottom edge only, no ring). The chips are the same muted combobox chip in every variant — Basecoat gives them one look.

<DemoSingle name="tag-input" id="colors" />

## Chips

The tags are Basecoat combobox chips (`bg-muted text-xs font-medium`, a ✕ that fades in on hover), configured as one object:

```vue
<mono-tag-input :chip.prop="{ size: 'md', shape: 'rounded', dot: true }" />
```

`chip` takes `behaviour`, `size`, `color`, `variant`, `shape`, `dot`, `closeLabel` and `cssClass`.
Only `behaviour`, `color`, `dot`, `closeLabel` and `cssClass` still change the paint: a chip is a
fixed Basecoat box (its height follows the field's `size`), and `color` pins a hue — the tonal
badge pattern, `bg-x/10 text-x` — where the default is the muted chip whatever the field's colour.
`size`, `variant` and `shape` are accepted and kept on the markup for 2.0 but no longer style anything.

It also carries the four limits — `max`, `min` ([selection](#limits-min-and-max)) and `maxVisible`,
`minVisible` ([display](#checkable-max-visible), kebab `'max-visible'` / `'min-visible'` work too).
A key set here **pins** over the matching element attribute, the same way `color` does.

Static HTML can pass the same object as a JSON attribute: `chip='{"size":"md","dot":true}'`.

<DemoSingle name="tag-input" id="chips" />

### Layout: `behaviour`

By default the chips **wrap**, so the field grows taller as tags are added. `behaviour: 'inline'`
keeps them on one line instead, in a strip that scrolls sideways — the field then never changes
height, however many tags it holds.

```vue
<mono-tag-input :chip.prop="{ behaviour: 'inline' }" />
```

The strip is moved **only** by the `‹` / `›` buttons that appear next to the clear button. There is
no scrollbar, and the wheel, click-dragging and the arrow keys all deliberately leave it alone — so
the strip can never end up scrolled somewhere the buttons did not put it. Each button appears only
when there is something to scroll toward: a strip parked at its start shows just `›`.

[`max-visible`](#checkable-max-visible) applies here too: the first N chips draw in the strip, the rest
collapse into a **"+N more"** chip at its end, and clicking it opens the same panel listing them.
Without a cap every tag is rendered and the `‹` / `›` buttons are the only overflow mechanism.

<DemoSingle name="tag-input" id="chip-inline" />

### Clear and caret

One glyph. With something to clear, the clear button (`✕`) stands in for the caret, open or closed;
otherwise — an empty field, or one where `clearable` is off — the caret (`⌄`) is alone. The value
wins over the open state: a click in the field only opens, so a field with a value closes by
picking, Escape or a click outside. In `inline` mode the scroll buttons sit before it, so the row
reads `‹ › ✕` or `‹ › ⌄` — one glyph's width either way, so `✕` sits exactly where the caret was.

A `disabled` or `readonly` field shows **neither** `✕` nor `⌄`: it refuses every gesture, so a caret
would promise an open it never delivers. The gutter stays, so the chips do not shift when the state
toggles — and in `inline` mode the `‹ ›` pair stays too and keeps paging, so a long selection can
still be read.

## States

Disabled, readonly and required.

<DemoSingle name="tag-input" id="states" />

## Validation

`valid`, `invalid` and `warning` states with messages.

<DemoSingle name="tag-input" id="validation" />

## Suggestions

Autocomplete dropdown driven by an `items` array.

<DemoSingle name="tag-input" id="suggestions" />

### Opening and closing

A `searchable` field (the default) opens when you click into its input — that is how you start typing — and typing opens it with results; a click in the input while the panel is open never closes it (caret placement, text selection) — close with the caret (`⌄`), `Esc` or a click outside. With `searchable="false"` there is nothing to type, so the field is a button: a click opens, another click closes. The caret opens and closes in both modes. Tabbing in, and the refocus after removing a chip, open nothing.

### Keyboard

Opening the panel highlights the **first suggestion**, so `↑` / `↓` move from there and `Enter` adds the highlighted one as a tag. The highlight scrolls into view on long lists and is Basecoat's `--muted` row — the same look as hover; a selected suggestion shows the check at its end (or its own checkbox when `checkable`).

`open()`, `close()`, `toggle()` and `isOpen` are public, mirroring `<mono-select>`, so the panel can be driven from outside (that's how the data grid opens it on `Enter` when a tag-input is an inline cell editor).

## Limits: `min` and `max`

`max` caps how many tags the user can select, `min` how few they can leave. Both are optional;
unset means unlimited. Nothing is disabled by either — the list stays as it is:

- Past `max`, a pick is **rejected**: the row stays clickable but the pick does not land, a typed
  tag is dropped and the query reset. A bulk add (the "All" row, a server drain) fills only the room
  left and stops.
- At `min`, the chips **lose their ✕**, a deselect or Backspace is rejected, the clear button hides
  (clearing would stop at the floor anyway) and a bulk deselect keeps the first `min`.
- A `model-value` pushed in is never trimmed — the limits are the user's, not the developer's.

`chip.max` / `chip.min` set the same limits on the chip object and pin over the attributes.

<DemoSingle name="tag-input" id="limits" />

::: warning Breaking: `max-tags` → `max`, `max` → `max-visible`
`max-tags` is gone; the selection cap is now plain `max`. The old `max` — how many chips to draw
before "+N more" — is now [`max-visible`](#checkable-max-visible), so an existing `:max="3"`
silently became a selection cap. Rename it.
:::

## Slots

Custom label and helper content via named slots.

<DemoSingle name="tag-input" id="slots" />

## Event log

Live log of `add`, `remove`, `clear` and `change`.

<DemoSingle name="tag-input" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="tag-input" id="customized" />

## Custom keys

Use `key-value` and `display-value` to feed natural-shape items (for example `{ id, name }`) without pre-mapping. `key-value` names the property stored in each tag of `modelValue`; omit it to store the whole item object. `display-value` is either a property name (string) or a `(item) => string` function — when unset it falls back to `item.label`.

Without `key-value` each tag is the whole item, and tags are matched **by identity** — that is what decides whether clicking an option selects or de-selects it. A reactive wrapper around an item is fine (the tag input compares raw targets), but an item rebuilt between renders — a refetch, a `structuredClone`, a `JSON` round trip — is a different object and would be added as a second tag. Pass `key-value` whenever items are re-created.

<DemoSingle name="tag-input" id="custom-keys" />

## DataSource (devextreme)

Bind a live devextreme `DataSource` with `:data-source.prop`. Suggestions come straight from the source, typing filters the loaded set client-side, and `load-more="scroll"` pages it one chunk at a time (here `pageSize: 5`). `:immediate.prop="true"` loads the first page on attach. This example builds the source with `@mono-lit/utility`' `monoFetchOdata` against a public OData endpoint (`baseUrl`, no `configBaseUrl`). Bind with `.prop` and use `key-value` / `display-value` to map the server fields.

<ClientOnly>
<DemoSingle name="tag-input" id="datasource" />
</ClientOnly>

## Checkable + max-visible

Add `checkable` for a checkbox multi-select: each suggestion row shows a checkbox, selected rows stay in the list **checked** instead of disappearing, and the dropdown stays open so you can tick several. The box **is** a [mono-checkbox](./checkbox): the row emits the checkbox's own attribute markup (`<span mono-checkbox mono-size="sm" mono-checked><span mono-box></span></span>`) and `checkbox.css` paints every pixel of it — checked, indeterminate ("All" with a partial selection) and the busy spinner of a server drain alike — so the CSS tab writes exactly that markup and a checkbox override (`--mono-checkbox-*`) reaches the rows too. The `max-visible` prop caps how many chips are *drawn* — the rest collapse into a clickable **"+N more"** chip whose dropdown lists them, in `flex` and [`inline`](#layout-behaviour) alike (display only; the selection cap is [`max`](#limits-min-and-max)). `min-visible` is the collapse floor: while the selection is at or under it every chip draws regardless, so a field is never collapsed for the sake of one or two chips. `chip.maxVisible` / `chip.minVisible` (or the kebab spellings) pin over the attributes. Works with a raw `items` array (shown here) and a bound `DataSource` alike. The "+N more" panel is a floating layer like the dropdown itself — portaled to `<body>`, so a card, table cell or modal with `overflow: hidden` never clips it, and it flips, shifts and shrinks at the viewport edge; a click outside or Escape closes it.

<DemoSingle name="tag-input" id="checkable" />

## Search the server

Typing filters loaded suggestions; with a bound `DataSource` and `search-value` set, it queries the server (debounced) so you can tick matches from the whole dataset. A plain `items` array filters client-side.

<ClientOnly>
<DemoSingle name="tag-input" id="searchable" />
</ClientOnly>

### Search expressions

`search-value` is not limited to top-level field names. It takes the same grammar the [data grid](./table#wildcards-and-custom-search-clauses) uses, as an array or as a comma-separated string — the two are equivalent, so plain HTML loses nothing:

```html
search-value="Company.Name,Transaction.[*].Price,*.[*].*"
```
```ts
:search-value.prop="['Company.Name', 'Transaction.[1].Name', 'Transaction.[*].Price', '*']"
```

An entry can be:

| Entry | Matches |
| --- | --- |
| `LastName` | a top-level field |
| `Company.Name` | a nested field |
| `Transaction.[1].Name` | one array element |
| `Transaction.[*].Name` | **any** element of the array |
| `*` | every top-level field |
| `Company.*` | every field of `Company` |
| `*.*` | every field of every nested object |
| `*.[*].*` | every field of every array element |

Patterns read **literally, segment by segment** — `'*'` covers the top level only, so pair it with `'*.*'` / `'*.[*].*'` to reach deeper. A field named explicitly always wins over a pattern, in either order, and is searched exactly once.

In the array form an entry may also be a `{ field, custom }` clause builder, for a column `contains` can't search — a boolean, or a code the user never types. Return `null` to opt the column out of a given term:

```ts
:search-value.prop="[
  '*',
  { field: 'Active', custom: ({ field, value }) => `${field} eq ${value === 'yes'}` },
]"
```

Setting `search-value` explicitly means it alone decides what is searched.

**Leave it off and the default is `'*'`** — every top-level field of an option — so searching works without naming anything. `display-value` (when it's a string) and `key-value` stay in the list beside it, and the rendered display text and each option's `description` are matched too.

Two caveats on a bound `DataSource`: a `*` pattern is resolved against the rows already loaded, so it can only see fields present in that sample; and it only emits clauses for **string** columns, because `contains(Price,'x')` is not valid OData. That is exactly why `display-value` / `key-value` remain alongside `'*'` — they are explicit entries, so they still work before the first page arrives and a numeric `key-value` stays searchable. Give any other non-text column an explicit entry or a `custom` builder.

To offer no search at all, use [`searchable="false"`](#turning-search-off) rather than emptying `search-value`.

<DemoSingle name="tag-input" id="search-expr" />

### Turning search off

The field is a text box by default, so `searchable` defaults to `true`. Pass `searchable="false"` to make it read-only: it can't be typed into, so it never filters, never queries the server, and no custom tag can be entered that way. Everything else is unchanged — clicking the field opens the dropdown (and, with nothing to type, a second click closes it), arrows and `Enter` pick, `Backspace` removes the last chip.

<DemoSingle name="tag-input" id="not-searchable" />

## Grouped options

`display-group` is an array with one accessor per level (string field or function). Add the boolean `group` to bucket a paginated source client-side, or feed pre-grouped `{ key, items }` data directly; `group-sticky` pins headers.

::: tip Pre-grouped data needs no `display-group`
A source that already loads `{ key, items }` nodes — a devextreme `DataSource` with `group:` set, for instance — is detected and rendered as groups on its own. `display-group` only has to name the levels when you are bucketing a **flat** source with `group`.

Set it anyway if you want a header label computed from a leaf row rather than taken from the node's own `key`.
:::

<ClientOnly>
<DemoSingle name="tag-input" id="grouped" />
</ClientOnly>

Two levels over a 1,200-row static array, `load-more="scroll"` revealing a chunk at a time.

<DemoSingle name="tag-input" id="grouped-large" />

Pre-grouped data with custom `group-key` / `group-items` field names.

<DemoSingle name="tag-input" id="grouped-static" />

## Customized list rendering

`display-value` is a string and Lit escapes it, so an option can never carry markup — an icon, a
badge, a second line with its own styling. `slot="list"` hands the option rows to you instead: mono
keeps the panel, the search box, the filtering, the grouping, the keyboard and the value, and you
decide what each row looks like.

The slot is for markup, and only markup. Nothing behavioural moves to you: mono injects its own
checkbox into each line you render, paints the selected and keyboard-cursor states, and owns every
click — including a header's select-all, which selects every leaf beneath it. `checkable`,
`group-select-all` and `select-all` govern that here exactly as they govern mono's own rows, so
`:checkable="false"` leaves you a bare list to decorate yourself.

Two things to know before you reach for it. It requires `controlMonoForm` — what you loop is the
control's **resolved** list (post-search, post-DataSource, groups flattened), which exists only
inside the element and is reported back up onto `form.items()[key].list`. And mono places your
wrapper as one block without ever reaching inside it, so render exactly one element per entry: that
is how a click is paired back to its row.

A line you render IS an option: mono's own option styling applies to it, so it matches the panel
around it — font, padding, height, divider, hover, the selected tint, the keyboard cursor, and the
indent under a group header — without a single rule of your own.

State arrives as attributes on those lines — `data-mono-type`, `-level`, `-selected`,
`-active`, and `-state` on a header — so you restyle with CSS instead of binding classes, and your
own rule always outranks mono's.

A flat list — one element per option, and a `(?)` with a native tooltip that `display-value`
could never have carried.

<DemoSingle name="tag-input" id="custom-list" />

Grouped, two levels deep. Grouping stays mono's — it decides which groups exist and drops the ones
the search emptied — and hands you the headers in the same flat sequence as the rows, each with its
`level` and its leaves. Note what the demo does NOT contain: no checkbox, no select-all, no handler.

<DemoSingle name="tag-input" id="custom-list-grouped" />

## Select all

A leading **"All"** row selects — or clears — every option the current search leaves visible. It is **on by default** (`select-all`), and `select-all-label` renames it.

**It follows the search.** Type to narrow the list and "All" means *all of these*, which is what makes it useful on a long list. Clear the search and it means the whole list again.

Disabled options are skipped, and `max` caps the result: a bulk add fills the room that is left and stops rather than overshooting the cap. Unticking it stops at `min`.

The box is **tri-state** — checked when every visible row is selected, an indeterminate dash when only some are, empty when none are.

```vue
<mono-tag-input :items.prop="items" checkable />                          <!-- "All" -->
<mono-tag-input :items.prop="items" checkable select-all-label="Semua" /> <!-- renamed -->
<mono-tag-input :items.prop="items" checkable :select-all="false" />      <!-- off -->
```

### From the server

With a bound `DataSource` **and** `load-more`, the list is a window onto something bigger — and there "All" would otherwise mean *all ten of the eleven hundred*. So on that combination, and only there, the row **drains the source** instead: it walks the store in `page-size` chunks (or the source's own page size, when that is larger) and selects every row the query matches, the same thing `<mono-table-checkbox type="all">` does for a grid. It only drains what is not here yet: once the last page has been loaded — scrolled to the end, or a result that fit its first page — the row selects the loaded rows outright, with no request.

```vue
<mono-tag-input :data-source.prop="ds" checkable load-more="button" />
```

Nothing to opt into: a plain `:items` array is already wholly in memory, so it keeps selecting what it has and nothing changes.

Three consequences worth knowing:

- **The box is judged against `totalCount()`, not the loaded page.** Tick every row of page one and it reads *indeterminate*, not checked — because clicking it again fetches the rest. It only fills in once the selection covers the whole count, and from there the next click clears it entirely.
- **The search still scopes it.** The drain re-applies the source's own filter and the folded query, so "All" under a search is every *matching* row on the server — never the whole table. A query still inside its debounce is flushed first, so it is never the previous one.
- **`max` caps this path too.** A hard cap is a hard cap: the drain fills the room left and stops, so "select all" under `max="50"` selects the first fifty matches.

While the drain runs the row shows a spinner in its box and refuses a second click. Chips appear with their `display-value` labels: the rows are cached as they arrive, so nothing is fetched twice to find out what a value is called.

<DemoSingle name="tag-input" id="select-all-remote" />

### Per group

When the list is grouped, every group header becomes its own select-all over that group's rows — also **on by default** (`group-select-all`). A nested header covers every leaf **below** it, not just its direct children, so a top-level header takes its whole subtree in one click.

The header keeps its label, indent and `group-sticky` behaviour either way, so turning the feature off cannot reflow the list.

```vue
<mono-tag-input
  :items.prop="rows"
  checkable
  group
  group-sticky
  :display-group.prop="['CompanyName']"
  key-value="_DeptKey"
></mono-tag-input>

<!-- headers stay plain labels -->
<mono-tag-input :items.prop="rows" group :group-select-all="false"></mono-tag-input>
```

::: tip One event, not N
A bulk toggle emits a **single** `change` carrying the whole next array, rather than one event per row for a consumer to coalesce. `addedValue` / `removedValue` are `undefined` on it — there is no single value to name — so read `detail.modelValue` and `detail.oldValue`.
:::

## Values the list cannot label yet

`key-value` is the statement *"the stored values are keys into `items`"*. So when a value has no matching row — the list is still loading, or the row lives on a page that has not been fetched — there is no label anyone would want to read, and the chip is **not rendered**. It appears the moment its row lands.

This matters on a filter panel seeded from saved state: without it the field paints `1` or `1|MKT` for a beat before the real label arrives.

The **value is untouched** — only the chip waits. `form.values()` (or `model-value`) still carries it, submitting still sends it, and the field's clear button still empties it.

```vue
<!-- value [1] with items still empty: no chip, and value stays [1] -->
<mono-tag-input key-value="Id" display-value="CompanyName" :model-value.prop="[1]" />
```

Without `key-value` the value **is** its own label, so nothing is ever hidden — which is what keeps `allow-custom` tags (never present in `items`) rendering.

## Width & height

Set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` — each takes a CSS string (`"320px"`, `"80%"`) or a number (px). Fields are full width by default; set `width` to constrain.

<DemoSingle name="tag-input" id="dimensions" />

### Panel size

The field and the suggestions panel are sized separately. By default the panel matches the field,
which is what you want for a picker whose options read as continuations of what was typed — and what
you do *not* want on a full-width field, where it leaves every option row running the width of the
page.

`:dropdown.prop="{ width, height, maxHeight, minWidth, maxWidth }"` sizes the panel alone. Each key
takes a CSS string or a number (px). Setting `width` also stops the panel tracking the field.

```vue
<mono-tag-input label="COA" width="100%" :items.prop="items"
  :dropdown.prop="{ maxWidth: '38rem', maxHeight: 320 }" />
```

Prefer `maxWidth` to `width` on a full-width field: the panel then caps on a wide screen but still
shrinks with the field on a narrow one.

`height` is an **exact** height and `maxHeight` the cap — the same split the `dropdown-height` /
`dropdown-max-height` attributes carry, and those stay for plain HTML, where there is no `.prop`
binding to pass an object with.

The object is shared: `<mono-select>` and `<mono-dropdown-table>` take the same six keys with the
same meanings.

<DemoSingle name="tag-input" id="dropdown-size" />

## Placement

The suggestions panel keeps itself inside the viewport, so a field near the bottom of the page is never clipped:

- **`flip`** (default `true`) opens the suggestions *upward* when there isn't room below.
- **`shift`** (default `true`) slides them horizontally so they don't overflow a screen edge.
- When neither side fits the full list, it opens on the roomier side and **shrinks to fit**, scrolling internally. This caps `dropdownHeight` / `dropdownMaxHeight` / `dropdown.height` / `dropdown.maxHeight` — those stay the requested size whenever there is room for them.

Set `:flip="false"` / `:shift="false"` to pin the suggestions below the field.

## CSS Variables

<DemoSingle name="tag-input" id="css-vars" />

Themed through `--mono-tag-input-*` custom properties (they inherit and pierce the shadow boundary — and reach the portaled panels); an explicit `--mono-tag-input-ring-color` override wins over the `color` prop. The field takes the same knobs as [input](./input#css-variables) and the panel the same as [select](./select#css-variables), renamed `--mono-tag-input-*`; re-skin globally via the [tokens](./theme) or switch flavor. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-tag-input-ring-color` (alias `--mono-tag-input-focus-color`) / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | Focus ring and focused border (set by `color`) |
| `--mono-tag-input-border-color` (aliases `--mono-tag-input-border`, `--mono-tag-input-rest-border`) / `--mono-tag-input-side-border-color` | `--input` / = border | Resting border; the three non-bottom edges |
| `--mono-tag-input-bg` (alias `--mono-tag-input-surface`) / `--mono-tag-input-shadow` | `--mono-mode-surface` / `--mono-shadow-xs` | Field surface and shadow |
| `--mono-tag-input-radius` / `-radius-<size>`, `--mono-tag-input-height-<size>`, `--mono-tag-input-padding-x(-<size>)`, `--mono-tag-input-padding-y(-<size>)`, `--mono-tag-input-font-<size>`, `--mono-tag-input-line-height(-<size>)`, `--mono-tag-input-gap` | `--mono-radius-md`, the control ladder, 1.5 × `--mono-spacing` (xs/sm 1, xl 2, xxl 2.5), 1.5 × spacing, `--mono-text-sm`, 3 × spacing | Geometry and text |
| `--mono-tag-input-chip-gap` | 1.5 × `--mono-spacing` | Gap between chips and the text box |
| `--mono-tag-input-chip-height-<size>` / `-chip-radius` / `-chip-bg` / `-chip-color` / `-chip-padding-x` / `-chip-font-size` / `-chip-line-height` / `-chip-font-weight` / `-chip-content-gap` | 5.5 × spacing at md / `--mono-radius-sm` / `--muted` / `--foreground` / 1.5 × spacing / `--mono-text-xs` / its line height / medium / 1 × spacing | The chips |
| `--mono-tag-input-icon-size` / `--mono-tag-input-clear-radius` | 4 × spacing / `calc(var(--radius) - 5px)` | Caret, ✕ and ‹ › glyphs; their button corner |
| `--mono-tag-input-disabled-bg` / `--mono-tag-input-readonly-bg` / `--mono-tag-input-filled-bg` / `--mono-tag-input-outline-*` | field bg / `--muted` / `--input`/50 / unset | State surfaces, `filled`, the outlined-only knobs the flavors set |
| `--mono-tag-input-label-*` / `--mono-tag-input-message-*` | as input | Label and message |
| `--mono-tag-input-dropdown-{bg,color,radius,shadow,ring,padding,min-width}` | `--popover` / `--popover-foreground` / `--mono-radius-md` / `--mono-shadow-md` / 1px `--foreground`/10 / `--mono-spacing` / 9rem | The suggestion panel and the "+N more" panel |
| `--mono-tag-input-option-{radius,padding-x,padding-end,padding-y,gap,font-size,line-height,font-weight,min-height,active-bg,active-color}`, `--mono-tag-input-check-icon` / `-check-size`, `--mono-tag-input-group-*` | as select | Rows, the selected check, group headers |
| `--mono-tag-input-color` (alias `--mono-tag-input-text`), `--mono-tag-input-placeholder`, `--mono-tag-input-muted` | `--foreground`, `--muted-foreground`, `--muted-foreground` | Text, placeholder, glyph / message ink |
| `--mono-tag-input-valid` / `--mono-tag-input-invalid` / `--mono-tag-input-warning` | `--success` / `--destructive` / `--warning` | Validation colours |

Deprecated and honoured as no-ops until 2.0: `--mono-tag-input-focus-rgb`, `--mono-tag-input-underline-glow`, `--mono-tag-input-cursor-width` / `-color`, `--mono-tag-input-background`, the `--mono-chip-*` bridge (the chips are no longer chip.css's).

## Types

<DemoTypes name="tag-input" />
