# Fix `<mono-select>` model-value round-trip that swallowed the first `mno-change`

## Context

After loosening `SelectValue` to `unknown` (see `2026-05-14-key-value-display-value.md`), `<mono-select>` started behaving as if `@mno-change` only fired on the **second** click of an item. The event was actually firing on the first click, but the visual state regressed immediately after, so the user had to click again before the selection looked correct.

Root cause: the original property declaration was

```ts
@property({ type: String, attribute: 'model-value', reflect: true })
modelValue: SelectValue = null
```

`reflect: true` + `type: String` forced a string round-trip:

1. `_selectItem` sets `modelValue = 9` (number).
2. Lit auto-reflects: `setAttribute('model-value', String(9))` → `'9'`.
3. `mno-change` fires; Vue's handler sets `selectedId = 9`.
4. In Vue's microtask, `:model-value="9"` patches `setAttribute('model-value', '9')`.
5. Lit's attribute observer reads `'9'` and assigns `modelValue = '9'` (now a **string**).
6. `_selectedItem` searches for `item.id === '9'`, but `item.id === 9` (number) — no match, trigger renders the placeholder.
7. Second click of the same row: Vue's `selectedId` is already `9`, so it doesn't re-patch the attribute; `modelValue` stays as the number, and the selection renders correctly.

`<mono-tag-input>` already had `reflect: false`, so it wasn't affected.

Other components that use `reflect: true` (`mono-textarea`, `mono-drawer`, `mono-dropdown`, `mono-badge`, plus several booleans) bind only string/boolean payloads, where the round-trip is type-safe. Only `<mono-select>` needed the fix.

## Change

`src/components/select/mono-select.ts`:

- `modelValue` and `value` are now `@property({ attribute: false })` (no auto attribute observation, no reflect).
- Manual attribute observation stays in place via `observedAttributes` (`'model-value'`, `'modelvalue'`) so plain HTML usage (`<mono-select model-value="apple">`) and non-`.prop` Vue bindings (`:model-value="9"`) still work.
- `_toSelectValue` now parses numeric / boolean / `null` / JSON object / JSON array / JSON string attribute values back to their natural types via `JSON.parse`, so `'9'` becomes `9` instead of being stored as the string `'9'`.

## Verification

- `npx tsc --noEmit` — clean (only the pre-existing `button/index.ts` errors remain).
- Manual: `demos/select/vue/custom-keys.vue` (`{ id, name }` shape, numeric id) — selection updates on the first click; the trigger immediately reflects the chosen row.
- The existing string-id demos (`{ label, value: 'apple' }`) still work because `_toSelectValue('apple')` falls through to the string branch.

## Why this didn't appear before

`SelectValue` used to be `string | number | boolean | null`, and all stock demos used string ids (`'apple'`, `'USD'`). String → reflect-to-attribute → string round-trip is type-stable, so the bug was latent. The `custom-keys` demo introduced numeric ids and made the corruption visible.

## Scope check across the package

Searched for `reflect: true` on properties with non-primitive payloads:

| Component | `reflect: true` property | Payload | Risk |
|---|---|---|---|
| select | `modelValue` | arbitrary (was `string\|number\|bool\|null`, now `unknown`) | **yes — fixed** |
| textarea | `modelValue` | `string` | safe |
| drawer / dropdown / badge | `modelValue` | boolean (via `booleanStringConverter`) | safe |
| accordion / drawer / dropdown / badge / file-upload | `disabled`, `open`, etc. | boolean | safe |

