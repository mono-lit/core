# Dropdown table

A dropdown that opens a native `<table>` for picking row(s). `controlMonoDataDropdown` wraps `controlMonoTable` (exposed as `dd.grid`), so the panel's table controls bind with `:control-table.prop="dd.grid"`. Bind the field with `:control-data-dropdown.prop="dd"`.

## Control

`controlMonoDataDropdown` owns selection/value (it wraps a `controlMonoTable`, exposed as `dd.grid`); bind the field with `:control-data-dropdown` and read `dd.modelValue` from outside.

<ClientOnly>
<DemoSingle name="dropdown-table" id="control" />
</ClientOnly>

Because the options are forwarded to the wrapped grid, every [`controlMonoTable`](./table) option works here too — including [`searchValue`](./table#naming-the-searched-fields), which names the searched columns and takes an array or a comma string. Omit it and the panel searches `'*'`, every top-level field, like any other grid. The panel searches through a slotted `<mono-table-search>`, so its element-level `search-value` applies here as well.

`controlMonoDataDropdown(data, { props })` declares every element's props in one place — the same shape `controlMonoTable` and `controlMonoForm` use — so the field is wired with **only** `:control-data-dropdown.prop="dd"`. `props.dropdownTable` targets the field itself (label, placeholder, clearable, panel size…); every other key targets the **panel** and is forwarded verbatim to the wrapped grid. The panel's `mono-table-*` still bind `:control-table.prop="dd.grid"` — the panel really is a grid.

The field's events are accepted there as `on<Event>` keys — `props: { dropdownTable: { onChange, onOpen, onClose } }` — and attached to the field as listeners with the same event a template `@change` would get. The panel's slots take theirs the same way ([table › events from the controller](./table#events-from-the-controller)). This is separate from `dd.onValueChange`, the controller's own value sink.

## Basic

Single-select over a local array, with everything declared centrally.

<ClientOnly>
<DemoSingle name="dropdown-table" id="basic" />
</ClientOnly>

Clicking the field opens the panel and a second click closes it (there is no input in the field — the search box lives in the panel — so a click is never "I want to type"); the caret (`⌄`) does the same, and `Enter` / `Space` / `↓` open from the keyboard. Opening the panel puts the caret straight into the `<mono-table-search slot="search">`; closing it hands focus back to the field. Set `:auto-focus-search="false"` to keep focus on the field — useful on touch, where focusing an input raises the virtual keyboard over the rows.

### Keyboard

The panel has two zones — search box and row list. `Tab` moves between them; `↑`/`↓` move the highlight (scrolling it in), `Enter` selects it, `Esc` closes. The highlighted row is Basecoat's active option — the `--muted` row, the same wash as hover (`--mono-dropdown-table-row-active-bg` retunes it); a picked row is the table's own selected row, wash plus rail. Searching or paging moves the highlight onto the new first row.

### Popups inside the panel

Anything opened from inside the panel counts as inside it: a `<mono-table-th>`'s right-click menu and header-filter popup, a `<mono-select>` in a slot, the search's filter builder. Clicking into them — the filter's search box, a value row, an option — never closes the picker, and an `Esc` pressed in one of them closes only that popup; the next `Esc`, from the panel itself, closes the picker. (Every mono popup portals its panel to `<body>`, so by DOM position alone those clicks would be "outside"; the popups know which element opened them, and the picker asks that instead.) A popup that belongs to something else on the page is still outside, and still dismisses.

## Sizes

`xs`–`xxl`, the same scale as `<mono-select>` and `<mono-tag-input>`.

<ClientOnly>
<DemoSingle name="dropdown-table" id="sizes" />
</ClientOnly>

## Colors

Pick a colour and every variant takes it. Every built-in `color` tints the focus ring and the open border — and, unless `chip.color` pins another hue, the chips.

`outlined` (default), `filled` and `underlined`. `underlined` is sera's chip box: the bottom edge only, which takes the focus colour, and no ring.

<ClientOnly>
<DemoSingle name="dropdown-table" id="colors" />
</ClientOnly>

## States

`disabled`, `readonly` (neither opens — see [Clear and caret](#clear-and-caret)) and `required`.

<ClientOnly>
<DemoSingle name="dropdown-table" id="states" />
</ClientOnly>

## Validation

`validation-state` (`valid` / `invalid` / `warning`) with a `validation-message`.

<ClientOnly>
<DemoSingle name="dropdown-table" id="validation" />
</ClientOnly>

## Clearable

`clearable` shows a ✕ that resets the selection (emitting `change` with an empty value).

<ClientOnly>
<DemoSingle name="dropdown-table" id="clearable" />
</ClientOnly>

## Appearance

Same `size` / `variant` / `color` / `validation-state` / `label` props as `<mono-select>`, so the two look identical.

<ClientOnly>
<DemoSingle name="dropdown-table" id="appearance" />
</ClientOnly>

## Field & panel size

The field width is a css-size prop; the panel is sized separately by `:dropdown.prop="{ width, maxHeight }"` — so a narrow field can open a wide grid.

The object takes all six sizing keys (`width`, `height`, `minWidth`, `maxWidth`, `minHeight`,
`maxHeight`) and is the same one `<mono-select>` and `<mono-tag-input>` accept.

::: warning `height` changed meaning
It used to be the panel's max-height, because this object had no `maxHeight`. It now has one, so
`height` is an exact height and `maxHeight` caps. If you were passing `{ height }` to bound a
scrolling panel, pass `{ maxHeight }`.
:::

<ClientOnly>
<DemoSingle name="dropdown-table" id="sizing" />
</ClientOnly>

## Placement

The panel stays inside the viewport on its own, so a field low on the page — or in a grid row below the fold — is never clipped:

- **`flip`** (default `true`) opens the panel *upward* when there isn't room below.
- **`shift`** (default `true`) slides it along the cross axis so it doesn't overflow a screen edge.
- When *neither* side has room for the full panel, it opens on the roomier side and **shrinks to fit**, scrolling the table internally rather than running off-screen.

`placement` sets the preferred side + alignment (default `bottom-start`); with `flip` on it's a preference, not a guarantee. `offset` (default `6`) is the gap between the field and the panel.

<ClientOnly>
<DemoSingle name="dropdown-table" id="placement" />
</ClientOnly>

The resolved side is reflected on the root as `mono-side="top"` / `"bottom"` (and the classes `is-top` / `is-bottom`), so you can style a flipped panel.

## Multiple

Multi-select with chips + a "+N more" overflow (`max-visible`, default 5) — its panel is a floating layer like the dropdown's own, portaled to `<body>` so no `overflow: hidden` ancestor clips it, flipping at the viewport edge — a checkbox column and a select-all header checkbox. `type="all"` covers **every** row, not just the page on screen. The demo also caps the selection at `max="4"` — tick a fifth row and the box un-ticks itself.

<ClientOnly>
<DemoSingle name="dropdown-table" id="multiple" />
</ClientOnly>

## Limits: `min` and `max`

`max` caps how many rows the user can select, `min` how few they can leave. Both are optional;
unset means unlimited. Three places can set them, in this precedence:

```vue
<mono-dropdown-table :max="4" :min="1" />                    <!-- element attributes -->
<mono-dropdown-table :chip.prop="{ max: 4, min: 1 }" />      <!-- chip object — pins over the attributes -->
```

```ts
const dd = controlMonoDataDropdown(rows, { multiple: true, max: 4, min: 1 }) // controller — the fallback
```

The limits are **enforced by the wrapped grid's check store**, which is the one place every
selection goes through — a row click, the keyboard, a `<mono-table-checkbox>` bound to `dd.table`
(row and `type="all"`), and `dd.selectAll()`. So nothing is disabled and nothing needs wiring:

- Past `max` a pick is **rejected** — the row stays clickable, the pick does not land, and a native
  checkbox un-ticks itself. A bulk select (page or server drain) fills only the room left.
- At `min` the chips **lose their ✕**, un-ticking is rejected, the clear button hides and `clear()`
  (or un-ticking the header box) keeps the first `min` rows.
- A `model-value` pushed in (`dd.setValue()`) is never trimmed — the limits are the user's.

::: warning Breaking: `max` → `max-visible`, `maxSelect` → `max`
The old element `max` — how many chips to draw before "+N more" — is now `max-visible`, so an
existing `:max="3"` silently became a selection cap; rename it. The controller option `maxSelect`
is gone: pass `max` (and it now holds for the checkbox column too, which used to bypass it).
:::

## Chips

The selection chips are Basecoat combobox chips — the same chips [`mono-tag-input`](./tag-input#chips)
draws, painted by this component's own sheet — configured as one object, the same `chip` object tag-input takes:

```vue
<mono-dropdown-table :chip.prop="{ behaviour: 'inline', shape: 'rounded' }" />
```

`chip` takes `behaviour`, `color`, `rounded`, `dot`, `closeLabel` and `cssClass` (`size` and
`variant` are still accepted and ignored: a combobox chip has one size per field size and one skin).
Leave `color` out and the chips follow the field's `color`; set it and they are pinned to that hue.

It also carries the four limits — `max`, `min` ([selection](#limits-min-and-max)) and
`maxVisible`, `minVisible` (display: chips drawn before "+N more", and the collapse floor under
which every chip draws; kebab `'max-visible'` / `'min-visible'` work too). A key set here pins
over the matching element attribute.

Static HTML can pass the same object as a JSON attribute: `chip='{"shape":"rounded"}'`.

::: warning Changed
The chips are no longer `<mono-chip>` markup: `chip.size`, `chip.variant` and the `--mono-chip-*`
bridge are no-ops, and a chip is the muted combobox chip unless the field (or `chip.color`) colours it.
:::

### Layout: `behaviour`

By default the chips **wrap**, so the field grows taller as rows are selected. `behaviour: 'inline'`
keeps them on one line in a strip that scrolls sideways, so the field holds its height however many
rows are picked.

The strip is moved **only** by the `‹` / `›` buttons that appear next to the clear button. There is
no scrollbar, and the wheel, click-dragging and the arrow keys all deliberately leave it alone. Each
button appears only when there is somewhere to scroll toward.

`max-visible` applies here too: the first N chips draw in the strip, the rest collapse into a
**"+N more"** chip at its end, and clicking it opens the same panel listing them. Set
`max-visible="0"` to draw every chip and leave the `‹` / `›` buttons as the only overflow
mechanism.

<ClientOnly>
<DemoSingle name="dropdown-table" id="chips" />
</ClientOnly>

### Clear and caret

One glyph. With something to clear, the clear button (`✕`) stands in for the caret, open or closed;
otherwise — nothing selected, or `clearable` off — the caret (`⌄`) is alone (the same rule as
`<mono-select>` and `<mono-tag-input>`, so the three line up in a form; here the field body toggles
either way, so nothing is lost while the caret is away). In `inline` mode the scroll buttons sit
before it, so the row reads `‹ › ✕` or `‹ › ⌄` — one glyph's width either way, so `✕` sits exactly
where the caret was.

A `disabled` or `readonly` field shows **neither** `✕` nor `⌄`: it does not open, so a caret would
promise what it never delivers. The gutter stays, so the value does not shift when the state
toggles — and in `inline` mode the `‹ ›` pair stays too and keeps paging, so a long selection can
still be read.

## Custom keys

`keyExpr` picks the value field; `displayExpr` (field name or `(row) => string`) picks the text.

<ClientOnly>
<DemoSingle name="dropdown-table" id="custom-keys" />
</ClientOnly>

## Customized

`cssClass` appends a class to each field part (`root` / `label` / `value` / `message` / `trigger` / …).

<ClientOnly>
<DemoSingle name="dropdown-table" id="customized" />
</ClientOnly>

## CSS variables

Themed through `--mono-dropdown-table-*` custom properties (they inherit and pierce the shadow boundary). The field **is** the tag-input's chip box and the panel **is** its popover, so every knob falls back to the matching [`--mono-tag-input-*`](./tag-input#css-variables) one — a flavour that retunes the tag-input retunes this field, and the two line up in a form with nothing set. The panel's rows are the table's, themed by [`--mono-table-*`](./table#css-variables). Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-dropdown-table-primary` … `-info` | `--mono-tag-input-*` → `--ring`, `--muted-foreground`, `--success`, `--destructive`, `--warning`, `--info` | The ten `color` hues — the focus ring, the open border, the chips |
| `--mono-dropdown-table-text` / `-placeholder` / `-muted` | `--foreground` / `--muted-foreground` / `--muted-foreground` | Inks |
| `--mono-dropdown-table-border` (or `-border-color` / `-rest-border`) | `--input` | Resting border |
| `--mono-dropdown-table-bg` (or `-surface`) | `--mono-mode-surface` | Field surface |
| `--mono-dropdown-table-shadow` | `--mono-shadow-xs` (outlined) | Resting shadow |
| `--mono-dropdown-table-ring-color` / `-ring-width` / `-ring-alpha` | the `color` hue / `--mono-ring-width` / `--mono-ring-alpha` | The focus ring |
| `--mono-dropdown-table-height-<size>` | `--mono-control-height-<size>` | The field's minimum height per size |
| `--mono-dropdown-table-radius` / `-radius-<size>` | `--mono-radius-md` | Field corner |
| `--mono-dropdown-table-padding-x` / `-padding-y` (+ `-<size>`) | `1.5 × --mono-spacing` | Field inset |
| `--mono-dropdown-table-font-<size>` / `-line-height` | `--mono-text-sm` / `--mono-text-sm--lh` | The value's type |
| `--mono-dropdown-table-text-inset` | `1.5 × --mono-spacing` | Extra start inset for a text value, so it lines up with a `<mono-select>` |
| `--mono-dropdown-table-chip-gap` / `-chip-height-<size>` / `-chip-padding-x` / `-chip-radius` / `-chip-bg` / `-chip-color` / `-chip-font-size` / `-chip-font-weight` | `1.5 × --mono-spacing` / `5.5 × --mono-spacing` / `1.5 × --mono-spacing` / `--mono-radius-sm` / `--muted` / `--foreground` / `--mono-text-xs` / medium | The chips |
| `--mono-dropdown-table-icon-size` / `-clear-radius` | `4 × --mono-spacing` / `--radius − 5px` | The caret, clear and ‹ › glyphs |
| `--mono-dropdown-table-outline-*` / `-filled-bg` / `-readonly-bg` / `-disabled-bg` | tag-input's | Per-variant and per-state presets |
| `--mono-dropdown-table-dropdown-bg` / `-color` / `-radius` / `-ring` / `-shadow` / `-min-width` | `--popover` / `--popover-foreground` / `--mono-radius-md` / 1px `--foreground` 10% / `--mono-shadow-md` / `18rem` | The panel and the "+N more" panel |
| `--mono-dropdown-table-region-padding` | `2 × --mono-spacing` | The search and footer regions' inset |
| `--mono-dropdown-table-row-hover-bg` / `-row-active-bg` | `--muted` 50% / `--muted` | A hovered row, the keyboard cursor's row (a picked row is the table's `--mono-table-selected-bg`) |
| `--mono-dropdown-table-label-*` / `-message-*` | tag-input's | Label and message type |
| `--mono-dropdown-table-gap` | `3 × --mono-spacing` | Label ↔ field ↔ message |

Deprecated and honoured as no-ops until 2.0: `--mono-dropdown-table-underline-glow` (the underline is sera's line now), `--mono-dropdown-table-cursor-width` / `-color` (the keyboard cursor is Basecoat's `--muted` row), `--mono-dropdown-table-background`, the `--mono-chip-*` bridge (the chips are no longer chip.css's).

<ClientOnly>
<DemoSingle name="dropdown-table" id="css-vars" />
</ClientOnly>

## Event: change

`change` carries `modelValue`, `value` and the resolved `selectedItems` (`{ key, text, data }[]`).

<ClientOnly>
<DemoSingle name="dropdown-table" id="event-change" />
</ClientOnly>

## Event log

A live log of `change` as rows are picked and cleared — clearing emits `change` with an empty value (there is no separate `clear`).

<ClientOnly>
<DemoSingle name="dropdown-table" id="event-log" />
</ClientOnly>

## Remote DataSource

Bound to a remote OData source; selected keys resolve to display text with a `filter … in` load, and search runs server-side.

<ClientOnly>
<DemoSingle name="dropdown-table" id="datasource" />
</ClientOnly>

### Scoping the picker

`controlMonoDataDropdown` wraps a `controlMonoTable`, so a scope survives the panel's own
search, header filters, sort and scroll paging the same two ways: set it on the source
(`ds.filter([...])` then `dd.table.load()` — the grid adopts it), or derive it from reactive
state with `dataSourceOptions` / `odataOptions`, read fresh at every query:

```ts
const dd = controlMonoDataDropdown(dataSource, {
  keyExpr: 'Id',
  odataOptions: () => ({
    $filter: `CompanyId eq ${company.value} and DeptKode eq '${dept.value}'`,
    $select: 'Id,CoaNama,PostBudgetNama',
  }),
})
watch([company, dept], () => dd.table.refresh())
```

Typing in the slotted `<mono-table-search>` now ANDs onto that scope instead of replacing
it, and clearing the box returns to the scoped set. See
[DataSource options](/ui/table#datasource-options) on the table page for the full surface.

## Select all (server-side)

Multi-select **is** the wrapped grid's `check()` store, so `<mono-table-checkbox>` binds `dd.table` like every other `mono-table-*` helper here — no selection glue. `type="all"` drains the source and selects every row the current search matches, including ones never rendered; `dd.selectAll()` is the same thing from code.

::: tip
`max-visible` caps the chips *drawn* — expanding "+N more" renders one per remaining item, so a
selection of hundreds will feel slow to expand. (`max-visible="0"` renders every chip, so it is the
wrong choice for a selection that large.) A hard [`max`](#limits-min-and-max) caps the drain
itself: "select all" then fills the room left and stops.
:::

<ClientOnly>
<DemoSingle name="dropdown-table" id="select-all-remote" />
</ClientOnly>

## Error bar

Same story as the empty state — a failed request in a dropdown panel is
otherwise completely silent. It goes in a row of its own (`<tbody>` only takes
rows); the element adopts that row, so the two tags are all you write:

```vue
<tbody>
  <tr><td colspan="2"><mono-table-error :control-table.prop="dd.table" /></td></tr>
  <tr v-for="…">…</tr>
</tbody>
```

See [Error bar](/ui/table#error-bar) on the table page for the full surface.

## Empty state

`dd.table` **is** a `controlMonoTable` — the same object as `dd.grid` — so every `mono-table-*` element works inside the panel exactly as it does in a plain table. `<mono-table-empty>` is no exception: put it in the `<table>`'s `<caption>` and bind it like the rest.

The panel is where this matters most: a dropdown you have just typed into is the place a user most often lands on nothing, and until now the grid simply went blank. See [Empty state](/ui/table#empty-state) on the table page for the full surface — the `icon` / `title` / `subtitle` props, the `slot="body"` override, and the reload button.

<ClientOnly>
<DemoSingle name="dropdown-table" id="empty" />
</ClientOnly>

## Scroll paging

Swap the numbered pager for a scrolling one on a flat grid — bind `<mono-table-paging type="…">` to `dd.grid`, place it in the body slot right after the `<table>`, and give the panel a bounded `:dropdown.prop="{ maxHeight }"`.

### Infinity scroll

`type="infinity-scroll"` appends the next page onto `dd.grid.items` as you near the bottom — render it as a plain `v-for`.

<ClientOnly>
<DemoSingle name="dropdown-table" id="infinite-scroll" />
</ClientOnly>

Against a remote source each scroll fetches the next server page.

<ClientOnly>
<DemoSingle name="dropdown-table" id="infinite-scroll-remote" />
</ClientOnly>

### Virtual scroll

`type="virtual-scroll"` keeps only the visible rows in the DOM; render spacer `<tr>`s from `virtualPadTop` / `virtualPadBottom` and pin a fixed `:row-height`.

<ClientOnly>
<DemoSingle name="dropdown-table" id="virtual-scroll" />
</ClientOnly>

The same windowing over a remote source.

<ClientOnly>
<DemoSingle name="dropdown-table" id="virtual-scroll-remote" />
</ClientOnly>

## Types

`controlMonoDataDropdown` is also exported as `monoDataDropdown`, and `:control-data-dropdown` is also accepted as `:data-dropdown` — the older spellings still work.

<DemoTypes name="dropdown-table" />
