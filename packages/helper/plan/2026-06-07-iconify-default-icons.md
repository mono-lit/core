# Migrate all hardcoded default icons to MDI iconify (`i-mdi-*`)

## Context
Components rendered built-in default icons inconsistently — inline `<svg>` in some, emoji/unicode
(`✕ × ▾`) in others, all hand-written in Lit templates. Migrated every **default** icon to a UnoCSS
MDI iconify mask (`i-mdi-*`) for consistency and class-based access. Slotted/user-provided icons and
CSS-drawn indicators (checkbox tick, radio dot, switch knob) were left untouched.

## Mechanics
- **Markup**: each inline `<svg>`/emoji → `<span class="<existing-classes> mono-icon i-mdi-<name>" aria-hidden="true"></span>`.
- **Shared baseline** `.mono-icon { display:inline-block; width:1em; height:1em; color:currentColor; flex-shrink:0 }`
  added to `src/data/theme/index.css` (ships **unlayered**, so it beats preset-icons' layered 1.2em;
  per-component rules override it by specificity).
- **CSS retarget**: every `… > svg` rule for a migrated icon → `… > .mono-icon` (size + rotation kept).
- **Safelist**: 8 names added to `uno.config.ts` so the CSS ships in `dist/ui/index.css`.
- **Dedupe**: `isIconifyClass` centralized in `src/composables/icon.ts`; file-upload/menu/breadcrumb
  utils re-export it.

## Mapping
close/clear/remove → `i-mdi-close`; accordion + select arrow → `i-mdi-chevron-down`;
menu + sidebar chevron → `i-mdi-chevron-right`; date time → `i-mdi-clock-outline`; date calendar →
`i-mdi-calendar-outline`; table sort → `i-mdi-menu-up`/`i-mdi-menu-down`; table search → `i-mdi-magnify`.

## Files touched
- New: `src/composables/icon.ts`.
- `uno.config.ts` (safelist), `src/data/theme/index.css` (`.mono-icon`).
- `.ts` markup swaps: accordion, chip, date, drawer, menu-render, modal, sidebar, select (clear+arrow),
  mono-input, mono-table-sort, mono-table-search, mono-tag-input, mono-file-upload (remove fallback).
- `.css` retargets: chip, drawer, modal, accordion, menu, sidebar (6 rotation rules), date, table
  (sort caret box squared to 9×9, gap 0), input/select/tag-input (flex-centered clear buttons + icon sizing).
- Re-exports: file-upload-utils, menu-utils, breadcrumb-utils.

## Verification (done)
- `npm run build` (package) clean; all 8 `i-mdi-*` present in `dist/ui/index.css`; `.mono-icon`
  confirmed unlayered (sits in `:root`/theme block, not in `@layer mono`); no stray `<svg>` left in
  migrated `.ts` files.
- `npm run build` (vitepress) clean.
- Remaining `<svg>` in components are slot/decorative paths intentionally left (e.g. `.mono-*-icon > svg`
  slot rules in accordion/menu/chip/breadcrumb).

## Edge cases handled
- Emoji defaults had no intrinsic size → explicit `> .mono-icon` sizing added (input/select/tag-input clear).
- Sidebar rotates the icon element directly → all 6 direction/rotation rules retargeted (highest risk).
- Accordion/menu/select rotate the wrapper → unchanged.
- Table sort carets don't map 1:1 to MDI (square triangles) → caret box squared, stack gap set to 0.
