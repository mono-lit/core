<!-- @unocss-includes -->

# Filter builder

A universal, inline OData filter builder. `controlMonoFilterBuilder` owns the filter; `<mono-filter-builder :control-filter-builder.prop="…">` renders it as nested rule rows and writes edits straight back.

## Control

`controlMonoFilterBuilder` owns the filter tree; bind it with `:control-filter-builder` and read it back as an OData `$filter` string whenever it notifies.

It also owns the element's own props. Declare them in the controller's `props` block and `<mono-filter-builder>` needs nothing but the controller binding — the same arrangement as [`controlMonoTable({ props })`](./table), minus the per-element nesting, since this family has a single element.

```ts
const filter = controlMonoFilterBuilder({
  fields,
  props: { size: 'sm', width: '100%', maxHeight: 260 },
})

filter.props()                  // { size: 'sm', width: '100%', maxHeight: 260 }
filter.setProps({ size: 'lg' }) // merges, notifies, the element re-applies
```

`props()` returns one object with a stable identity, so a controller can be handed around and stay in sync. `setProps` is a **merge** — keys you omit keep their current value. A grid-owned builder takes the same block: `controlMonoTable({ filterBuilder: { props: … } })`.

::: tip Setting props on the element still works
Writing `size` / `width` / `max-height` directly on `<mono-filter-builder>` is still supported. Where both declare the same key, the **controller wins**; keys the controller never mentions are left to the template.
:::

<ClientOnly>
<DemoSingle name="filter" id="control" />
</ClientOnly>

## Basic

<ClientOnly>
<DemoSingle name="filter" id="basic" />
</ClientOnly>

## Reading the filter

```ts
const filter = controlMonoFilterBuilder({ fields, filter: ['Name', 'contains', 'Andy'] })

filter.original({ type: 'array' }) // the filter as first supplied — never changes
filter.changed({ type: 'array' })  // as currently edited; a devextreme expr — feed to a DataSource
filter.changed({ type: 'string' }) // an OData $filter — "contains(Name,'Andy')"
filter.changed()                   // omit `type` to get back the shape you passed in
```

`subscribe(cb)` fires on every edit; the element also emits `change` (with `array` and `string` in the detail), plus `apply` / `clear` from the action row.

## `filter` takes either shape

There is no `filterType` flag — a **string** is parsed, an **array** is normalised, decided by `typeof`. Input and output shapes are independent, so you can load a string and read back an array.

<ClientOnly>
<DemoSingle name="filter" id="from-string" />
</ClientOnly>

::: warning Parsing covers the subset this builder emits
The string parser handles parentheses, `and` / `or` / `not`, the six comparisons, `contains` / `startswith` / `endswith`, `in (…)`, `null`, and quoted / numeric / boolean literals. Anything else — a lambda like `Job/any(d: d/X eq 1)`, arithmetic, other functions — **warns once and yields an empty builder** rather than a filter that silently means something different. Array input has no such limit.
:::

## Fields

`fields` is the source of truth for the field dropdown — `dataType` decides which operators and value editor a column gets, `values` renders a select instead of free text, and a dotted `field` maps a nav column (`Job.Name` → `Job/Name`). Pass `dataGrid: table` instead (or as well) to derive fields from a table's `props.th`; explicit `fields` win.

## Operators

Only OData-expressible operators are offered, filtered by `dataType` — pick a field type in the demo to see each set. Group operators are `and` / `or` / `notAnd` / `notOr` (the last two wrap the group in `not (…)`). `in` expands to an OR of equalities, `between` to `ge … and le …`, and `isblank` / `isnotblank` to `eq null` / `ne null`. Values are quoted properly — `O'Brien` serialises as `'O''Brien'`, numbers and booleans stay bare.

## Localisation

Every user-facing string is overridable through `texts`; anything omitted keeps its English default.

```ts
controlMonoFilterBuilder({
  fields,
  texts: {
    matchPrefix: 'Cocokkan', matchSuffix: 'dari aturan berikut:',
    and: 'semua', or: 'apapun',
    contains: 'mengandung', eq: 'adalah sama dengan', isblank: 'diatur',
    addRule: 'Peraturan Baru', apply: 'Pencarian', clear: 'Buang',
  },
})
```

## Apply / Clear

The action row renders **above** the rules. It's on by default; pass `actions: false` when the surrounding modal supplies its own buttons and you'd rather read `changed()` yourself.

## Custom serializer

`type: 'string'` uses a built-in serializer. To route it through your own — e.g. `dxFilterToString` from `@mono-lit/utility` — pass `toODataString`; it must be synchronous, and it only affects the string form.

```ts
const { dxFilterToString } = useMonoUtility()
controlMonoFilterBuilder({ fields, toODataString: (f) => dxFilterToString({ filter: f }) })
```

## CSS Variables

Themed through `--mono-filter-*` (read via private `--_mono-filter-*` resolvers, so they inherit and pierce the shadow boundary). The builder scroll area uses the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

The controls borrow their shape from `<mono-input>`, `<mono-select>` and `<mono-button>` **through those components' public knobs** — `--mono-input-outline-radius`, `--mono-button-<size>-radius`, `--mono-control-height-<size>` — which is exactly what a flavour writes. So an `xs` builder matches an `xs` field, and maia's pill, sera's square edge and lyra's `text-xs` reach the builder with no flavour deltas of its own.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-filter-primary` | `--primary` | The Apply button's fill |
| `--mono-filter-on-primary` | `--primary-foreground` | Ink on the Apply button |
| `--mono-filter-accent` | `--primary` | The add links and the group operator (`.btn[data-variant='link']` is `text-primary`) |
| `--mono-filter-text` | `--foreground` | Control and label ink |
| `--mono-filter-muted` | `--muted-foreground` | Group sentence, placeholders, icon buttons at rest |
| `--mono-filter-border` | `--input` | Control edge (`border-input`) |
| `--mono-filter-guide` | `--border` | The dashed guide down a nested group |
| `--mono-filter-surface` | `--mono-mode-surface` | Control fill — transparent in light, the mode's wash in dark |
| `--mono-filter-ring` | `--ring` | Focus ring on every control and button |
| `--mono-filter-danger` | `--destructive` | The trash button on hover |
| `--mono-filter-indent` | `1.25rem` | Nested-group indent |
| `--mono-filter-radius` | `--mono-input-outline-radius` | Control corner |
| `--mono-filter-height-<size>` | `--mono-control-height-<size>` | Control / button height per `size` |
| `--mono-filter-font-<size>` | `--mono-text-xs` … `-base` | Type size per `size` |
| `--mono-filter-btn-radius-<size>` | `--mono-button-<size>-radius` | Apply / Clear / icon-button corner per `size` |
| `--mono-filter-icon-<size>` | `0.7rem` … `1.375rem` | Icon-button glyph per `size` |
| `--mono-filter-gap` | `0.5rem` | Row and group gap |

## Types

`controlMonoFilterBuilder` is also exported as `monoFilterBuilder`, and `:control-filter-builder` is also accepted as `:data-filter` — the older spellings still work.

<DemoTypes name="filter" />
