# Add `keyValue` and `displayValue` props to form components

## Context

After the prior `items`-prop standardization (`2026-05-14-standardize-items-prop.md`), `<mono-select>` and `<mono-tag-input>` still force every item to have a fixed `{ label, value }` shape. Real-world data rarely matches that — typical API rows look like `{ id: 9, name: 'john' }`, forcing consumers to hand-map every row before passing it to the component.

This plan introduces two new props on the form components that already accept `items` + `modelValue`:

- **`keyValue` / `key-value` / `keyvalue`** — string. Names which property of an item becomes the model value. **If unset, the whole item object is stored in `modelValue`.** Example: `key-value="id"` with `items = [{ id: 9, name: 'john' }]` → `modelValue = 9`.
- **`displayValue` / `display-value` / `displayvalue`** — string **or** function. If a string, names which property to render. If a function (signature `(item) => string`), it is called per item. **Falls back to `item.label` (or `String(item)`) when unset**, preserving the prior default-shape demos.

Scope: **only** the two form components that have `items` + `modelValue` — `<mono-select>` and `<mono-tag-input>`. Other items-bearing components (`breadcrumb`, `menu`, `tabs`, `sidebar`) are navigation/menu surfaces, not form data collection, and stay out of scope per the user's "only relevant to all form components" instruction.

## Examples

```html
<!-- A) Custom key + custom display (string) -->
<mono-select
  :items.prop="[{ id: 9, name: 'John' }, { id: 11, name: 'Jane' }]"
  key-value="id"
  display-value="name"
  :model-value="9"
/>

<!-- B) Whole-object modelValue (no key-value) -->
<mono-select
  :items.prop="rows"
  display-value="name"
  :model-value.prop="selectedRow"
/>

<!-- C) Function-form displayValue (Vue, requires .prop) -->
<mono-select
  :items.prop="rows"
  key-value="id"
  :display-value.prop="(item) => `${item.first} ${item.last}`"
/>
```

## Critical files

### Select
- `src/components/select/select-types.ts`
  - Loosen `SelectValue` to `unknown` (was `string | number | boolean | null`).
  - Loosen `SelectItem` to a permissive record: `{ label?: string; value?: unknown; disabled?: boolean; [key: string]: unknown }`.
  - New `SelectDisplayValue = string | ((item: SelectItem) => string)`.
  - Extend `SelectProps` with the `keyValue` triad (camel / kebab / lowercase) and the `displayValue` triad.

- `src/components/select/mono-select.ts`
  - `@property({ type: String, attribute: 'key-value', reflect: true }) keyValue = ''`.
  - `@property({ attribute: false }) displayValue: SelectDisplayValue = ''` plus manual attribute handling for `display-value` / `displayvalue` (Lit can't auto-type a string-or-function attribute).
  - Extend `defineHybridPropAliases([... , 'keyValue', 'displayValue'])` and `observedAttributes` (`keyvalue`, `displayvalue`).
  - New private helpers `_resolveItemValue(item)` and `_resolveItemDisplay(item)`.
  - `_selectedItem` now finds by `_resolveItemValue(item) === this.value` (was `item.value === this.value`).
  - `_selectItem` writes `_resolveItemValue(item)` into `modelValue` (was `item.value`).
  - `_renderValue` and `_renderItems` call `_resolveItemDisplay` (was `item.label`).
  - `_normalizeItems` drops the implicit `{ value: ... }` shaping — items pass through as-is.

### Tag-input
Symmetric to select:
- `src/components/tag-input/tag-input-types.ts` — `TagInputValue = unknown`, permissive `TagInputItem`, new `TagInputDisplayValue`, new props.
- `src/components/tag-input/mono-tag-input.ts` — new properties + resolver helpers; `_filteredItems` compares resolved values against the selected-values array; `_getItemByValue` matches via resolver; `_getLabelByValue` delegates to display resolver; chip + dropdown templates use display resolver; `_normalizeValue` stops string-coercing entries (passes them through unchanged when they're already objects/numbers).

### Demos
Existing demos in `demos/select/vue/*.vue` (11 files) and `demos/tag-input/vue/*.vue` (10 files) use the old `{ label, value }` shape and rely on `value` ending up in `modelValue`. Add `key-value="value"` to each to preserve current behavior.

Add one new demo per component to showcase the new feature:
- `demos/select/vue/custom-keys.vue` — items like `[{ id, name }]`, with `key-value="id"` + `display-value="name"` and a function-form branch.
- `demos/tag-input/vue/custom-keys.vue` — same pattern.

Update manifests (`demos/manifests/select.ts`, `demos/manifests/tag-input.ts`) to register the new demos.

CSS-only demo siblings for select/tag-input under `css/` don't bind props (they hand-roll markup) — no changes needed.

## Things explicitly NOT changing

- Non-form items-bearing components (`breadcrumb`, `menu`, `tabs`, `sidebar`) — items shape stays component-specific (their `*Item` types are already domain-specific and `keyValue` would muddy them).
- ARIA roles, CSS class names — already standardized in the prior plan.
- `BreadcrumbItem`, `MenuItem`, `TabItem`, `SidebarItem` shapes — unchanged.

## Execution order

1. Select: types → component → demos → manifest → new `custom-keys` demo.
2. Tag-input: same order.
3. Typecheck (`npx tsc --noEmit`).
4. Verification grep for residual hard-coded `item.label` / `item.value` reads in the two component files (should be replaced by resolver calls everywhere they affect display or model state).

## Verification

```powershell
npx tsc --noEmit -p tsconfig.json   # only the pre-existing button/* errors remain
```

Grep checks (should return only `dist/` matches):
- `option\.label|option\.value` inside `src/components/select/` and `src/components/tag-input/` — none should leak past the new resolvers.
- `:items\.prop=` paired with absence of `key-value`/`display-value` in demos that previously used `{ label, value }` — confirm each demo declares the resolver props.

Manual UI checks:
- Old demos still select + clear values exactly as before (visually no change, just an extra `key-value="value"` attribute).
- `custom-keys.vue` demos render `{ id, name }` rows with `name` shown, `id` in modelValue.
- Function-form `displayValue` branch renders the composed string and is selectable.
