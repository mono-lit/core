# Popover component + docs

## Context

Fourth roadmap component shipped this week (after Accordion, Tabs, Toast). `mono-popover` is a floating panel anchored to a user-provided trigger element, with four placements (top/bottom/left/right), three trigger modes (click/hover/manual), six theme colours, sm/md/lg sizes, and slots for trigger / title / body / actions. Outside-click and Escape both close it (configurable).

## Files added

### Lib
- `src/components/popover/index.ts`
- `src/components/popover/mono-popover.ts` — Lit element. Host-class management via `_updateHostClasses` (host IS the wrapper; no inner div). Slot capture for trigger/title/body/actions. Document-level click + keydown listeners gated by `open` and the `closeOnOutsideClick` / `closeOnEscape` props. Trigger event listeners (click/keyboard/hover) attached to captured trigger nodes; re-attached when `trigger` prop changes. Light DOM render outputs only the trigger placeholder + panel (arrow + title + body + actions); the trigger is reparented into a `display: contents` placeholder placed first.
- `src/components/popover/popover-types.ts` — `PopoverPlacement`, `PopoverTrigger`, `PopoverSize`, `PopoverColor`, `PopoverSource`, `PopoverCssClass`, `PopoverClickEventDetail`, `PopoverClickEvent`, `PopoverProps`, `PopoverEvents`.
- `src/components/popover/popover.css` — variables on `.mono-popover` (no `:host`); per-color accent (`--popover-accent`/`-rgb`) from `--theme-X`; sm/md/lg sizing (panel padding, font, min/max-width, offset, arrow size); per-placement panel positioning + arrow direction (CSS-arrow technique with stacked transparent borders for the border + fill); entrance animation; closed-state `display: none`.

### Docs
- `demo/vitepress/docs/popover.md`
- `demo/vitepress/docs/manifests/popover.ts` — 10 entries.
- `demo/vitepress/docs/demos/popover/vue/*.vue` — 10 SFCs.
- `demo/vitepress/docs/demos/popover/css/*.html` — 10 self-contained demos with vanilla-JS IIFEs.

## Files changed

- `src/entries/index.ts` — added `export * from '../components/popover/index'`.
- `src/entries/index.css` — added `@import '../components/popover/popover.css';`.
- `vite.config.ts` — added `popover: r('./src/components/popover/index.ts')` to `build.lib.entry`.
- `package.json` — added `./popover` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — added `Popover → /popover` to the `Feedback` sidebar group (alongside `Toast`).

## Demo set (10)

`basic`, `placements`, `sizes`, `colors`, `with-title`, `with-actions`, `triggers`, `disabled`, `event-log`, `customized`.

## Patterns followed

- **Standardized event detail**: `mno-click` emits `{ modelValue, currentValue, oldValue, value, source, sourceEvent? }` with `source` ∈ `'trigger' | 'outside' | 'escape' | 'manual' | 'hover'`.
- **Vue v-model rule**: `:open` + `@mno-click="open = $event.detail.modelValue"`. Customized demo uses `:css-class.prop="{...}"`.
- **Host-as-wrapper** (toast lesson): the host element directly carries `mono-popover` + modifiers. Vue and CSS demos render with the same DOM depth → `.mono-popover.open .mono-popover-panel` and click-outside detection both work uniformly.
- **CSS demos** drive open/close via vanilla-JS IIFEs that toggle `.open` on the wrapper and listen for outside clicks + Escape.

## Verification

1. `pnpm dev`, open `/popover`.
2. All 10 demos render. Toggle Vue / CSS — both look identical.
3. Click trigger in `basic` — panel opens. Click outside or press Escape → closes.
4. `event-log` shows `[mno-click] modelValue=true old=false source="trigger"` on open, `source="outside"` / `"escape"` / `"trigger"` on each close.
5. Hover demo opens/closes on `mouseenter` / `mouseleave`.
6. `disabled` demo's trigger does nothing.
7. Switch the global theme — every popover border accent and arrow tip recolours.
