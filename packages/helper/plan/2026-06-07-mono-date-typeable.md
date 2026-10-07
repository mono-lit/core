# mono-date — type-to-pick (live parse typed input)

## Context
mono-date was click-only. Added live typing: with `allow-input`, the user types a date and the
calendar navigates to and auto-selects it as soon as a complete value is entered (beyond
flatpickr's default Enter/blur parsing).

## Changes
- `src/components/date/mono-date.ts`:
  - `_onTyping(e)` bound handler — gated on `allowInput` (not disabled/readonly, single mode
    only). Uses the flatpickr instance: `parseDate(raw, config.dateFormat)`; if valid →
    `jumpToDate(parsed)`; if `formatDate(parsed, fmt) === raw` (complete, round-trips) →
    `setDate(parsed, true)` (selects + emits `mno-change`/updates `modelValue`). Text equals the
    typed value so the caret doesn't jump; programmatic `setDate` doesn't fire `input` (no loop).
  - `render()` — `@input=${this._onTyping}` on the native `<input>` (already editable when
    `allowInput` via the existing `?readonly=${this.readonly && !this.allowInput}`).
- `date-types.ts` — `allowInput` JSDoc notes the live auto-pick; best without `altInput`.
- Demo: `demos/date/vue/typeable.vue` + "## Typeable" section in `ui/date.md` + `typeable`
  entry in `manifests/date.ts`.

## Verification
- `npm run build` (package) — passes; `_onTyping` in `dist/date-*.js`.
- `demo/vitepress` build clean.
- Dev `/ui/date` Typeable: type a full `Y-m-d` date → calendar follows + auto-selects, value
  updates; partial typing only navigates; range/multiple still finalize on Enter; click unaffected;
  non-`allow-input` pickers stay click-only.
