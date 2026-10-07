# Plan — Remove `update:modelValue` CustomEvent dispatches from Lit components

> **Note for execution:** the project keeps plans in `@mono-lit/helper/plan/` with a
> date-prefixed filename. Plan-mode restricts edits to this `.claude/plans/`
> path, so the **first execution step** is to copy this file to
> `packages/helper/plan/2026-05-07-remove-update-modelvalue-dispatch.md`.

## Context

Every form-style and overlay component under `src/components/` currently
dispatches both `update:modelValue` and `update:model-value` `CustomEvent`s
alongside its namespaced `mno-*` event(s). This was an attempt to support
Vue 3's `v-model` shorthand on the custom elements.

It does not work. Vue 3's `runtime-dom` skips `onUpdate:*` listeners on custom
elements — `@update:model-value="…"` silently never fires. The project already
documents this in memory (`project_vue_v_model_custom_element.md`): the
prescribed pattern is `:model-value="…" @mno-change="…"` reading
`$event.detail.modelValue`. So the dispatches are dead weight: they cost
runtime work, expand the public event surface, and mislead consumers into
attaching listeners that never fire.

Removing them is non-breaking for any consumer following the documented
pattern, because the companion `mno-*` event carries an **identical** detail
shape on every single component (verified component-by-component in the
audit).

Outcome: smaller event surface, less mislead-the-user code, types and
implementation in lockstep with the documented Vue integration.

## Approach

Mechanical removal across 14 components plus one demo fix. No phasing — it's
small enough for one pass and the change is internally consistent (you can't
half-remove an event that types still claim exists).

### Step 1 — Delete the dispatch lines in each component's `mono-*.ts`

For each component, remove the two `update:modelValue` / `update:model-value`
dispatches immediately after the matching `mno-*` dispatch(es). The companion
`mno-*` lines stay untouched.

| Component | File | Lines to delete |
|---|---|---|
| checkbox | `src/components/checkbox/mono-checkbox.ts` | 255–270 (the two `dispatchEvent(new CustomEvent('update:model-value' / 'update:modelValue', …))` blocks) |
| radio | `src/components/radio/mono-radio.ts` | 333–348 |
| input | `src/components/input/mono-input.ts` | 583–598 |
| select | `src/components/select/mono-select.ts` | 482–497 |
| switch | `src/components/switch/mono-switch.ts` | 354–369 |
| tag-input | `src/components/tag-input/mono-tag-input.ts` | 593–608 |
| textarea | `src/components/textarea/mono-textarea.ts` | 590–605 |
| badge | `src/components/badge/mono-badge.ts` | 304–319 |
| file-upload | `src/components/file-upload/mono-file-upload.ts` | 296–311 |
| modal | `src/components/modal/mono-modal.ts` | 369–370 (`_dispatch` calls) |
| drawer | `src/components/drawer/mono-drawer.ts` | 363–364 (`_dispatch` calls) |
| sidebar | `src/components/sidebar/mono-sidebar.ts` | 423–424 (`_dispatch` calls) |
| menu | `src/components/menu/mono-menu.ts` | 416–417 (`_dispatch` calls) |
| timeline | `src/components/timeline/mono-timeline.ts` | 215–216 (entries in the event-name array literal) |

Note: the first 9 use explicit `dispatchEvent(new CustomEvent(...))` blocks;
delete each pair (~6–8 lines each). The last 5 use a `_dispatch` helper —
just delete the two lines / array entries that name `'update:modelValue'` and
`'update:model-value'`. Don't touch any other dispatch in the file.

### Step 2 — Drop the type entries in each `*-types.ts`

Each component types file declares the event in its `XxxEvents` interface.
Remove the two lines for both keys.

| Component | File | Lines |
|---|---|---|
| checkbox | `src/components/checkbox/checkbox-types.ts` | 72–73 |
| radio | `src/components/radio/radio-types.ts` | 65–66 |
| input | `src/components/input/input-types.ts` | 129–130 |
| select | `src/components/select/select-types.ts` | 111–112 |
| switch | `src/components/switch/switch-types.ts` | 65–66 |
| tag-input | `src/components/tag-input/tag-input-types.ts` | 128–129 |
| textarea | `src/components/textarea/textarea-types.ts` | 115–116 |
| badge | `src/components/badge/badge-types.ts` | 147–148 |
| file-upload | `src/components/file-upload/file-upload-types.ts` | 115–116 |
| modal, drawer, sidebar, menu, timeline | matching `*-types.ts` | the two `'update:modelValue'` / `'update:model-value'` keys in the events interface |

The exact line numbers above came from a snapshot audit — re-verify with a
quick grep before each edit, since previous edits in the same file shift
later lines.

### Step 3 — Fix the one stale demo

`demo/vitepress/docs/demos/checkbox/vue/customized.vue` line 45 still uses
the no-op listener:

```vue
@update:model-value="active = $event.detail.modelValue"
```

Replace with:

```vue
@mno-change="active = $event.detail.modelValue"
```

This was already silently broken — the listener never fired. The fix makes
the demo actually reactive and matches the documented pattern.

### Step 4 — Search for stragglers

After Steps 1–3, run two greps to make sure nothing's left in the source or
demo trees:

- `rg "update:modelValue|update:model-value" src/` → expect zero matches.
- `rg "update:modelValue|update:model-value" demo/vitepress/docs/` → expect
  zero matches (other than possibly historical references in `dist/`, which
  the next build overwrites).

If anything remains, delete it.

## Critical files

- 14 × `src/components/<comp>/mono-<comp>.ts` — dispatch removal.
- 14 × `src/components/<comp>/<comp>-types.ts` — type removal.
- `demo/vitepress/docs/demos/checkbox/vue/customized.vue` — listener fix.

## Reused patterns

- The companion `mno-*` event already carries an identical detail shape on
  every component (audit confirmed the `XxxModelEventDetail` / `XxxChangeEventDetail`
  type is the exact same object passed to both dispatches). So consumers
  switching from the broken listener to `@mno-change` get the same payload
  with no schema migration.
- The documented pattern in
  `C:\Users\VCT-DEV\.claude\projects\C--Users-VCT-DEV-Desktop-libs\memory\project_vue_v_model_custom_element.md`
  is exactly the replacement: `:model-value="…" @mno-change="…"` reading
  `$event.detail.modelValue`. No new convention needed.

## Verification

1. **Static checks**
   - `rg "update:modelValue|update:model-value" src/` → zero matches.
   - `rg "update:modelValue|update:model-value" demo/vitepress/docs/` → zero
     matches.
   - `pnpm --filter @mono-lit/helper build` (or the equivalent root build) — the
     library still compiles; no `*-types.ts` references the deleted keys.

2. **Docs build**
   - `pnpm build` from `demo/vitepress/` (the docs build) finishes with no
     errors. Migrated `customized.vue` checkbox demo renders with the fixed
     listener.

3. **Runtime spot-check** (dev server)
   - `pnpm dev` from `demo/vitepress/`. Open the checkbox docs page, switch to
     the Vue tab, click the customized demo's checkbox — toggling should now
     work (it was silently broken before). Repeat for one or two other
     components in the affected list (e.g. switch, select) to confirm
     `@mno-change` paths still fire and update Vue refs.

4. **Type-check the docs**
   - If TypeScript is on for the docs project, ensure `XxxEvents` interfaces
     no longer expose the two deleted keys — anything depending on them in
     the demos would surface a type error here, but the audit found none.
