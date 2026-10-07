| `--mono-select-option-spacing` | `2px` | The seam between two rows, so a hovered row under the selected one stays a separate wash |
# Select

A dropdown picker built on a custom button + listbox UI. Sizes, color and visual variants, validation states, slot-overridable label/helper/prefix/suffix, and a clearable trigger. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.select` / `.combobox` (see [Theme](./theme)): the trigger is the same box as [input](./input) (1px `--input` border, `xs` shadow, 3px `--ring` focus ring), the panel is a `--popover` surface with a 1px `--foreground`/10 ring and an `md` shadow, options are `text-sm` rows that highlight on `--muted` and mark the selected one with a check at the end. Dark mode is built in.

## Basic

Default select with label, placeholder and helper text.

<DemoSingle name="select" id="basic" />

### Opening and closing

What a click on the field does depends on whether it is `searchable`:

- **Plain select** — the field is a button: a click opens the list, another click closes it (so do `↓` / `Enter` / `Space` on the focused field).
- **Searchable select** — clicking into the input opens the list and focuses it, as you would expect of a box you type in, and typing opens it with results. A click in the input while the list is open never closes it (that is caret placement or text selection) — close with the caret (`⌄`), `Esc` or a click outside.

The caret opens and closes in both modes. Tabbing into either opens nothing.

### Keyboard

Opening highlights the **first option**, so `↑` / `↓` start from a known place and `Enter` picks without needing an arrow press first. This works whether or not the select is `searchable` — the trigger drives the list when there's no search field to hold focus.

| Keys | Does |
| --- | --- |
| `Enter` / `Space` / `↓` (closed) | open the panel |
| `↑` / `↓` | move the highlight, scrolling it into view |
| `Enter` | select the highlighted option |
| `Esc` | close |

The highlight is drawn as a **leading bar** on the option's left edge, distinct from the background that marks the *selected* option — an option is often both at once. Tune it with `--mono-select-cursor-width` (default `3px`) and `--mono-select-cursor-color`.

## Sizes

`xs` … `xxl` on the shared control ladder (`--mono-control-height-*`); the trigger text follows the button's steps (`xs` `text-xs`, `sm`/`md`/`lg` `text-sm`, `xl` `text-base`, `xxl` `text-lg`). Options stay `text-sm` at every size, like Basecoat's.

<DemoSingle name="select" id="sizes" />

## Colors

Pick a colour and every variant takes it. `color` sets the **focus** colour — the ring and the focused border. A resting trigger is always on `--input`, whatever its colour; `primary` focuses with `--ring`, `secondary` with `--muted-foreground`, the rest with their role token.

`outlined` is Basecoat's `.select > button`. `filled` is luma's (a transparent border on an `--input`/50 surface, no shadow) and `underlined` is sera's (square, only the bottom edge painted, no ring — focus and validation recolour the line). Under the sera flavor the default variant *is* the underline.

<DemoSingle name="select" id="colors" />

## States

Disabled, readonly and required.

<DemoSingle name="select" id="states" />

## Validation

`valid`, `invalid` and `warning` states with messages. `invalid` is Basecoat's `aria-invalid` treatment — a permanent `--destructive` border and /20 ring, the label turns `--destructive`, the message carries `role="alert"`; the other two are the same pattern in `--success` / `--warning`.

<DemoSingle name="select" id="validation" />

## Clearable

Clear button shown when a value is selected.

One glyph. With something to clear, the clear button (`✕`) stands in for the
caret, open or closed; otherwise — nothing selected, or `clearable` off — the
caret (`⌄`) is alone. The value wins over the open state: a searchable field
with a value has no caret to close it with (see
[Opening and closing](#opening-and-closing) — its body only opens), so it closes
by picking, Escape or a click outside. A `disabled` or `readonly` field shows
**neither**: it refuses every gesture, so a caret would promise an open it never
delivers. The gutter the glyph sat in stays, so the text does not shift when the
state toggles. The same rule
[`<mono-tag-input>`](./tag-input#clear-and-caret) and
[`<mono-dropdown-table>`](./dropdown-table#clear-and-caret) follow, so the three
fields line up in a form.

<DemoSingle name="select" id="clearable" />

## Slots

Custom label, helper and prefix/suffix content via slots.

<DemoSingle name="select" id="slots" />

## Event: change

Listen to `change` to react to selection.

<DemoSingle name="select" id="event-change" />

## Event log

Live log of `change` and `clear` events.

<DemoSingle name="select" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="select" id="customized" />

## Custom keys

Use `key-value` and `display-value` to feed natural-shape items (for example `{ id, name }`) without pre-mapping. `key-value` names the property stored in `modelValue`; omit it to store the whole item object. `display-value` is either a property name (string) or a `(item) => string` function — when unset it falls back to `item.label`.

Without `key-value` the whole item is the value, and it is matched **by identity** — the object in `modelValue` has to be one of the objects in `items`. A reactive wrapper around it is fine (the select compares raw targets), but an item rebuilt between renders — a refetch, a `structuredClone`, a `JSON` round trip — is a different object and stops resolving. Pass `key-value` whenever items are re-created.

<DemoSingle name="select" id="custom-keys" />

## DataSource (devextreme)

Bind a live devextreme `DataSource` with `:data-source.prop`. The select reads its items and stays reactive to the source's events — so an external `ds.filter(...) + ds.load()` updates the list with no re-binding. With `load-more="scroll"` it pages the source one chunk at a time (here `pageSize: 5`). This example builds the source with `@mono-lit/utility`' `monoCreateFetcher` against a public OData endpoint (`baseUrl`, no `configBaseUrl`). Bind with `.prop` and use `key-value` / `display-value` to map the server fields.

<ClientOnly>
<DemoSingle name="select" id="datasource" />
</ClientOnly>

## Search

Add `searchable` and the trigger becomes a text box you type into — with a bound `DataSource` it queries the server (debounced, `search-value` names the fields), otherwise it filters the `items` array client-side. `search-operation` picks the comparison (default `contains`), `search-debounce` the delay (default 300 ms) and `search-placeholder` the hint shown while open.

<ClientOnly>
<DemoSingle name="select" id="searchable" />
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

**Leave it off and the default is `'*'`** — every top-level field of an option — so searching works without naming anything. `display-value` (when it's a string) and `key-value` stay in the list beside it, and the rendered display text is matched too, which is the only way to search a `display-value` **function**.

Two caveats on a bound `DataSource`: a `*` pattern is resolved against the rows already loaded, so it can only see fields present in that sample; and it only emits clauses for **string** columns, because `contains(Price,'x')` is not valid OData. That is exactly why `display-value` / `key-value` remain alongside `'*'` — they are explicit entries, so they still work before the first page arrives and a numeric `key-value` stays searchable. Give any other non-text column an explicit entry or a `custom` builder.

To offer no search at all, drop `searchable` rather than emptying `search-value`.

<DemoSingle name="select" id="search-expr" />

## Grouped options

`display-group` is an array with one accessor per level (string field or function), used as the group key and header. Add the boolean `group` to bucket a paginated source client-side, or feed pre-grouped `{ key, items }` data directly; `group-sticky` pins headers.

<ClientOnly>
<DemoSingle name="select" id="grouped" />
</ClientOnly>

Two levels over a 1,200-row static array, `load-more="scroll"` revealing a chunk at a time.

<ClientOnly>
<DemoSingle name="select" id="grouped-large" />
</ClientOnly>

Pre-grouped data with custom `group-key` / `group-items` field names.

<ClientOnly>
<DemoSingle name="select" id="grouped-static" />
</ClientOnly>

## Customized list rendering

`display-value` is a string and Lit escapes it, so an option can never carry markup — an icon, a
badge, a second line with its own styling. `slot="list"` hands the option rows to you instead: mono
keeps the panel, the search box, the filtering, the grouping, the keyboard and the value, and you
decide what each row looks like.

The slot is for markup, and only markup. Nothing behavioural moves to you: mono paints the selected
and keyboard-cursor states on the lines you render, and owns every click.

Two things to know before you reach for it. It requires `controlMonoForm` — what you loop is the
control's **resolved** list (post-search, post-DataSource, groups flattened), which exists only
inside the element and is reported back up onto `form.items()[key].list`. And mono places your
wrapper as one block without ever reaching inside it, so render exactly one element per entry: that
is how a click is paired back to its row.

A line you render IS an option: mono's own option styling applies to it, so it matches the panel
around it — font, padding, height, divider, hover, the selected tint, the keyboard cursor, and the
indent under a group header — without a single rule of your own.

State arrives as attributes on those lines — `data-mono-type`, `-level`, `-selected`
and `-active` — so you restyle with CSS instead of binding classes, and your own rule always
outranks mono's.

Identical to `mono-tag-input`'s slot of the same name, with one difference that follows from the
control: picking here sets the value and closes, rather than toggling one of many.

A flat list — one element per option, with a badge and a `(?)` tooltip that `display-value`
could never have carried.

<ClientOnly>
<DemoSingle name="select" id="custom-list" />
</ClientOnly>

Grouped, two levels deep. Grouping stays mono's — it decides which groups exist and drops the ones
the search emptied — and hands you the headers in the same flat sequence as the rows, each with its
`level` and its leaves.

<ClientOnly>
<DemoSingle name="select" id="custom-list-grouped" />
</ClientOnly>

## Width & height

Set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` — each takes a CSS string (`"260px"`, `"80%"`) or a number (px). This sizes the field (distinct from `dropdownHeight`/`dropdownMaxHeight`, which size the popup).

<DemoSingle name="select" id="dimensions" />

### Panel size

The field and the dropdown panel are sized separately. By default the panel matches the field —
right for a picker whose options read as continuations of the field, wrong for a wide one.

`:dropdown.prop="{ width, height, minWidth, maxWidth, minHeight, maxHeight }"` sizes the panel
alone. Each key takes a CSS string or a number (px). Setting `width` also stops the panel tracking
the field.

```vue
<mono-select label="Account" width="100%" :items.prop="items"
  :dropdown.prop="{ maxWidth: '32rem', maxHeight: 280 }" />
```

Prefer `maxWidth` to `width` on a full-width field: the panel then caps on a wide screen but still
shrinks with the field on a narrow one.

`height` is an **exact** height and `maxHeight` the cap — the same split the `dropdown-height` /
`dropdown-max-height` attributes carry, and those stay for plain HTML, where there is no `.prop`
binding to pass an object with. The widths land on the panel and the heights on its scrolling body,
so a fixed `height` still scrolls rather than clipping.

The same object, with the same meanings, is accepted by `<mono-tag-input>` and
`<mono-dropdown-table>`.

<DemoSingle name="select" id="dropdown-size" />

## Many selects on one page

A grid with an inline select per row mounts one element per row, so the per-instance
cost is multiplied by the row count. Two things make that cheap, and both are
automatic:

- **The option list is only rendered while the dropdown is open.** A closed select has
  its panel in the DOM but no `<button role="option">` children. Previously all of
  them were rendered up front and merely hidden with CSS, which put `rows x options`
  elements in the document — 6,000 for a 200-row grid with 30 options each.
- **The outside-click / focus / Escape listeners are bound while open**, not from the
  moment the element connects. 200 closed selects add no document listeners.

Two things you still control:

- Bind `items` to a **stable reference** (a module constant, a `ref`, or a
  `computed`). `items`, `display-group`, `search-value` and `css-class` all
  content-compare, so rebuilding an equal one is free — but a genuinely new array
  re-renders, as it should.
- Prefer a **function that is not rebuilt per render** for `display-value`. A fresh
  arrow (`:display-value.prop="(i) => i.name"`) is a new value every parent render, and
  a function cannot be content-compared, so each render reaches the element. Hoist it
  to module scope or a `computed` when a grid has one select per row.

If rows are only editable one at a time, `v-if` on the editing cell mounts one select
instead of one per row — cheaper still than any of the above.

## Placement

The dropdown keeps itself inside the viewport, so a select near the bottom of the page is never clipped:

- **`flip`** (default `true`) opens the list *upward* when there isn't room below.
- **`shift`** (default `true`) slides it horizontally so it doesn't overflow a screen edge.
- When neither side fits the full list, it opens on the roomier side and **shrinks to fit**, scrolling internally. This caps `dropdownHeight` / `dropdownMaxHeight` / `dropdown.height` / `dropdown.maxHeight` — those stay the requested size whenever there is room for them.

Set `:flip="false"` / `:shift="false"` to pin the list below the field.

## CSS Variables

<DemoSingle name="select" id="css-vars" />

Themed through `--mono-select-*` custom properties (they inherit and pierce the shadow boundary — and reach the portaled panel); an explicit `--mono-select-ring-color` override wins over the `color` prop. Re-skin globally via the [tokens](./theme) (`--input`, `--ring`, `--popover`, `--muted`, `--radius` …) — or switch flavor. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-select-ring-color` (alias `--mono-select-focus-color`) | `--ring` | Focus colour: the ring and the focused border (set by `color`) |
| `--mono-select-ring-width` / `--mono-select-ring-alpha` | `--mono-ring-width` (3px) / `--mono-ring-alpha` (50%) | Ring geometry |
| `--mono-select-border-color` (aliases `--mono-select-border`, `--mono-select-rest-border`) | `--input` | Resting trigger border |
| `--mono-select-side-border-color` | = border | The top / left / right edges only (sera and `underlined` set `transparent`) |
| `--mono-select-bg` (alias `--mono-select-surface`) / `--mono-select-hover-bg` | `--mono-mode-surface` / dark `--input`/50 | Trigger background, and its hover (dark only in vega) |
| `--mono-select-shadow` | `--mono-shadow-xs` (outlined) | Resting trigger shadow |
| `--mono-select-radius` / `--mono-select-radius-<size>` | `--mono-radius-md` | Trigger corner, for every size / one step |
| `--mono-select-height-<size>` | `--mono-control-height-<size>` | Trigger height per step |
| `--mono-select-padding-x-<size>` / `--mono-select-padding-end-<size>` (`--mono-select-padding-x` for all) | 2.5 / 2 × `--mono-spacing` at md | Trigger inset, start / end |
| `--mono-select-padding-y` | 0 | Trigger block inset (the height token owns the height) |
| `--mono-select-font-<size>` / `--mono-select-line-height` (`-<size>`) | `--mono-text-sm` / its line height | Trigger text |
| `--mono-select-trigger-gap` / `--mono-select-icon-size` | 1.5 × spacing / 4 × spacing | Gap between value and actions; chevron / clear glyph size |
| `--mono-select-gap` | 3 × `--mono-spacing` | Label ↔ trigger ↔ message spacing |
| `--mono-select-label-font-size` / `-font-weight` / `-line-height` / `-text-transform` / `-letter-spacing` / `-gap` | `--mono-text-sm` / `--mono-label-font-weight` / 1 / none / normal / 2 × spacing | Label |
| `--mono-select-message-font-size` / `-line-height` | `--mono-text-sm` / `--mono-leading-normal` | Message |
| `--mono-select-clear-radius` | `calc(var(--radius) - 5px)` | Chevron / clear button corner |
| `--mono-select-disabled-bg` / `--mono-select-readonly-bg` | trigger bg / `--muted` | State surfaces |
| `--mono-select-filled-bg` | `--input`/50 | `filled` surface |
| `--mono-select-outline-{bg,hover-bg,border-color,side-border-color,shadow,ring-width,radius,padding-x}` | unset | The same knobs scoped to the `outlined` variant — what the flavors set |
| `--mono-select-dropdown-bg` / `-color` / `-radius` / `-shadow` / `-ring` / `-padding` | `--popover` / `--popover-foreground` / `--mono-radius-md` / `--mono-shadow-md` / 1px `--foreground`/10 / `--mono-spacing` | The panel |
| `--mono-select-option-{radius,padding-x,padding-end,padding-y,gap,font-size,line-height,font-weight,min-height}` | `--mono-radius-sm` / 2 / 8 / 1.5 / 2 × spacing / `--mono-text-sm` / normal / 0 | Option rows |
| `--mono-select-option-active-bg` / `-active-color` | `--muted` / `--foreground` | Hover + keyboard cursor row |
| `--mono-select-check-icon` / `--mono-select-check-size` / `--mono-select-option-selected-font-weight` | `--check-icon` / 0.875rem / inherit | The selected row's check mark |
| `--mono-select-group-{padding-x,padding-y,font-size,line-height,font-weight,text-transform,letter-spacing}` | 2 / 1.5 × spacing / `--mono-text-xs` / normal / none / normal | Group headers |
| `--mono-select-color` (alias `--mono-select-text`), `--mono-select-placeholder`, `--mono-select-muted` | `--foreground`, `--muted-foreground`, `--muted-foreground` | Text, placeholder, chevron / message / group ink |
| `--mono-select-valid` / `--mono-select-invalid` / `--mono-select-warning` | `--success` / `--destructive` / `--warning` | Validation colours |
| `--mono-select-primary` … `--mono-select-info` | the role tokens | The `color` presets |

Deprecated and honoured as no-ops until 2.0: `--mono-select-focus-rgb`, `--mono-select-underline-glow` (the underline is sera's line now), `--mono-select-cursor-width` / `-color` (the keyboard cursor is Basecoat's `--muted` row, the same as hover), `--mono-select-background`, the per-colour `filled` tints.

## Types

<DemoTypes name="select" />
