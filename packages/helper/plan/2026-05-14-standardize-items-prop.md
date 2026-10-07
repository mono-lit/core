# Standardize array-list prop to `items` across @mono-lit/helper components

## Context

Two @mono-lit/helper Lit components, `<mono-select>` and `<mono-tag-input>`, still accept their list-of-choices via a prop called `options`. Every other list-rendering component in the package (`breadcrumb`, `menu`, `tabs`, `sidebar`, plus the `*-list` variants) uses `items`. The asymmetry forces consumers to remember which name applies where, and the matching TS types (`SelectOption`, `TagInputOption`) reinforce two parallel vocabularies for the same concept.

This plan aligns both components on the `items` name, propagates the rename through TS types, event payloads, internal helpers, CSS class names, and all demos under `@mono-lit/helper/demo/vitepress/docs/demos/`.

User decisions (already captured):
- **Rename depth**: prop + TS type + event-detail field + internal helpers (full single-vocabulary cleanup).
- **Back-compat**: hard rename, no deprecated alias.

Non-negotiable carve-outs:
- `role="option"` and `aria-selected` stay — they are W3C ARIA values for the combobox/listbox pattern, not project naming.
- `modelValue: TagInputValue[]` (tag-input) and `modelValue: FileUploadItem[]` (file-upload) stay — they are array-typed **values**, not lists of choices.

---

## Final state

| Surface | Before | After |
|---|---|---|
| Select prop | `options: SelectOption[] \| string` | `items: SelectItem[] \| string` |
| Tag-input prop | `options: TagInputOption[] \| string` | `items: TagInputItem[] \| string` |
| Select item type | `SelectOption` | `SelectItem` |
| Tag-input item type | `TagInputOption` (also broken `TagOption`) | `TagInputItem` |
| Event detail field | `selectedOption?: …Option` | `selectedItem?: …Item` |
| cssClass keys (select) | `option`, `optionSelected`, `optionDisabled` | `item`, `itemSelected`, `itemDisabled` |
| cssClass keys (tag-input) | `option`, `optionActive`, `optionDisabled`, `optionTitle`, `optionSub` | `item`, `itemActive`, `itemDisabled`, `itemTitle`, `itemSub` |
| CSS classes (select) | `.mono-select-option*` | `.mono-select-item*` |
| CSS classes (tag-input) | `.mono-tag-input-option*` | `.mono-tag-input-item*` |
| ARIA | `role="option"`, `aria-selected` | unchanged |

---

## Critical files

### Select
- `src/components/select/select-types.ts` — interface `SelectOption` → `SelectItem`; `SelectCssClass` keys; `SelectModelEventDetail.selectedOption`; `SelectProps.options`.
- `src/components/select/mono-select.ts` — `@property options` (line 236-237) → `items`; rename `_normalizedOptions`, `_handleOptionClick`, any internal helpers/state that say `option`; update template class strings (`.mono-select-option*`); update cssClass key reads; update event payload (`selectedOption` → `selectedItem`). Keep `role="option"`/`aria-selected`/listbox attributes (lines 277, 687, 689, 766, 768, 798, 799).
- `src/components/select/select.css` — rename every `.mono-select-option*` class.
- `src/components/select/select-utils.ts` — no work; only imports unrelated types.
- `src/components/select/index.ts` — also re-export `SelectItem` (not currently exported; align with how `MenuItem`/`TabItem` are exposed).

### Tag-input
- `src/components/tag-input/tag-input-types.ts` — interface `TagInputOption` → `TagInputItem`; `TagInputCssClass` keys; `TagInputModelEventDetail.selectedOption`; `TagInputProps.options`.
- `src/components/tag-input/mono-tag-input.ts` — `@property options` (line 278) → `items`; rename internal helpers; update template class strings; update cssClass key reads; update event payload. Keep `role="option"`/`role="listbox"`/`aria-selected`/`aria-controls` attributes (lines 318, 925, 927, 1036, 1059, 1060).
- `src/components/tag-input/tag-input.css` — rename every `.mono-tag-input-option*` class.
- `src/components/tag-input/tag-input-utils.ts` — fix the **pre-existing broken** `TagOption` import (currently fails typecheck per `tsc --noEmit`); change to `TagInputItem`. The function parameter rename `items: TagInputItem[]` is already idiomatic.
- `src/components/tag-input/index.ts` — re-export `TagInputItem` (replaces the currently broken `TagOption` re-export). Drop `normalizeSuggestions` if its signature changes meaningfully, or update its export.

---

## Demo files (@mono-lit/helper/demo/vitepress/docs/demos/)

### Vue demos that bind via `.prop` — rename `:options.prop=` → `:items.prop=`
Per exploration, 61 binding lines across these files (no other code changes inside the same file are usually needed beyond updating any `const options = …` variable to `const items = …` for readability):

**Select (`demos/select/vue/`):** `basic`, `clearable`, `colors`, `customized`, `event-change`, `event-log`, `sizes`, `slots`, `states`, `validation`, `variants`.

**Tag-input (`demos/tag-input/vue/`):** `basic`, `customized`, `event-log`, `max-tags`, `sizes`, `slots`, `states`, `suggestions`, `validation`, `variants`.

Additionally, `demos/select/vue/event-change.vue:15` reads `event.detail.selectedOption?.label` — update to `event.detail.selectedItem?.label`.

### CSS demos that hand-roll markup
- `demos/tag-input/css/suggestions.vue` — uses `.mono-tag-input-option*` class names in hard-coded markup (lines 79, 84, 85). Update class names so the CSS demo still resolves against the renamed `.mono-tag-input-item*` rules.
- Other CSS demos for select/tag-input don't reference the renamed classes; their hand-rolled HTML uses generic `<option>`/`<input>` markup unrelated to the rename. Confirm by grep during execution.

### Manifests
- `demos/manifests/tag-input.ts:10` description: "driven by an options array" → "driven by an items array" (cosmetic text alignment).
- `demos/manifests/select.ts` — no text update needed.

---

## Things explicitly NOT changing

- ARIA: `role="option"`, `role="listbox"`, `aria-selected`, `aria-controls=…-listbox` — these are W3C-defined and must not be renamed.
- `modelValue` arrays in `tag-input` (`TagInputValue[]`) and `file-upload` (`FileUploadItem[]`) — these are **values**, not choice lists.
- `value`, `currentValue`, `oldValue` event-detail fields — unaffected; only the `selectedOption` → `selectedItem` accessor changes.
- Other components that already use `items` (`breadcrumb`, `menu`, `tabs`, `sidebar`, `mono-breadcrumb-list`, `mono-menu-list`).

---

## Execution order (one branch, one commit per component is fine)

1. **Select first** (simpler — only one `selectedOption` consumer in demos):
   1. Update `select-types.ts`.
   2. Update `mono-select.ts` (prop, internal helpers, template class strings, event payload).
   3. Update `select.css` class names.
   4. Update `select/index.ts` to also export `SelectItem`.
   5. Update all 11 `demos/select/vue/*.vue` files (`:options.prop=` → `:items.prop=`, plus `event-change.vue` event-payload rename, plus local `const options` → `const items`).
   6. Typecheck: `npx tsc --noEmit -p tsconfig.json` should report zero new select errors.
   7. Visual smoke test (vitepress dev server) — open `/select/` page, click through every demo.

2. **Tag-input** (also fixes the pre-existing `TagOption` typecheck error):
   1. Update `tag-input-types.ts`.
   2. Update `mono-tag-input.ts`.
   3. Update `tag-input.css`.
   4. Update `tag-input-utils.ts` (fix broken import — change `TagOption` to `TagInputItem`).
   5. Update `tag-input/index.ts` (re-export `TagInputItem`, drop broken `TagOption` export).
   6. Update all 10 `demos/tag-input/vue/*.vue` files.
   7. Update `demos/tag-input/css/suggestions.vue` CSS class names.
   8. Update `demos/manifests/tag-input.ts` description string.
   9. Typecheck — verify the previous `tag-input-utils.ts(6,3): TS2305 'TagOption'` error is now gone.
   10. Visual smoke test on `/tag-input/` page.

3. **Save plan to project convention path**: copy this plan into `packages/helper/plan/2026-05-14-standardize-items-prop.md` (plan mode cannot create that file — must happen on execution start).

---

## Verification

After both passes:

```powershell
# 1. No remaining references to the renamed identifiers anywhere except dist/
npx tsc --noEmit -p tsconfig.json   # zero select/tag-input errors
```

Use Grep with these patterns (each should return only `dist/` matches or zero results):

- `SelectOption` (TS identifier)
- `TagInputOption|TagOption` (TS identifiers)
- `selectedOption` (event payload)
- `mono-select-option` (CSS class)
- `mono-tag-input-option` (CSS class)
- `:options\.prop` (demo bindings)

ARIA grep to confirm we **didn't** touch the listbox semantics:
- `role="option"` — must still match `mono-select.ts:687` and `mono-tag-input.ts:925`.
- `role="listbox"` — must still match `mono-select.ts:799` and `mono-tag-input.ts:1060`.

Manual UI checks (vitepress dev server):
- Select demos: open dropdown, pick items, verify `event-change.vue` log displays the chosen label (now via `event.detail.selectedItem.label`).
- Tag-input demos: confirm `suggestions.vue` (Vue) still surfaces the dropdown driven by `:items.prop`, and `css/suggestions.vue` (hand-rolled) still styles correctly against renamed `.mono-tag-input-item*` rules.
- Customized demos: confirm the cssClass keys (now `item`/`itemSelected`/etc.) still cascade onto the correct elements.
