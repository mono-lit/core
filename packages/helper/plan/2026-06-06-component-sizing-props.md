# Rich width/height sizing props; remove `fullWidth`

## Context

"Fullness" should come from `width`/`height`, not a `fullWidth` boolean. Only **button**
and **card** had `fullWidth` — removed it (breaking; full width = `width="100%"`). Added the
six sizing props the modal has — `width`, `height`, `minWidth`, `maxWidth`, `minHeight`,
`maxHeight` (CSS string or number→px, kebab + camelCase) — to **button, card, input, select,
textarea, tag-input**.

## Implementation

- **New `src/composables/css-size.ts`** — `toCssSize()` (number→px, string verbatim) +
  `buildSizeStyle()` (→ Lit `styleMap` object). Used by all six components. (Modal keeps its
  own local copy; de-dup is optional follow-up.)
- **Props** (each component): `width`/`height` (`@property({type:String})`, single word, no
  alias), `minWidth`/`maxWidth`/`minHeight`/`maxHeight` (`attribute:'min-width'` … + added to
  `defineHybridPropAliases`). Types: `width?/height?` + camel/kebab pairs for the four
  multi-word props (2-case standard).
- **Where applied**:
  - card + input + select + textarea + tag-input render a light-DOM root `.mono-<c>` →
    `style=${styleMap(this._sizeStyle())}` on it (`_sizeStyle()=buildSizeStyle(this)`),
    overriding the default `width:100%`.
  - button host is `inline-block` with content-width inner, so styleMap on the rendered root
    can't make `width:100%` fill. Instead `_applyHostSize()` sets the six values as inline
    styles on the **host** in `updated()`, and a `sized` class (added in `_buttonClasses` when
    any size is set) makes `.mono-button` + inner `button/a` fill the host (`button.css`:
    `.mono-button.sized` rules replace the old `.w-full`).
- **Removed `fullWidth`** from button + card: prop, ctor init, `fullwidth` observed-attr +
  `attributeChangedCallback` branch, the `'fullWidth'` alias, the `w-full` class push, the
  `fullWidth`/`'full-width'`/`fullwidth` type keys, and the CSS (`.mono-button.w-full`,
  `mono-card[full-width]`, `.mono-card.w-full`).

## Demos
- Migrated `full-width` → `width="100%"`: `demos/button/vue/state.vue` and the 9
  `demos/table/vue/*.vue` cards; reworded `ui/button.md` + `manifests/button.ts`.
- Added a `dimensions` demo (vue + css) for each of the six components + a "## Width & height"
  section in each `ui/*.md` (`DemoSingle` globs the files).

## Verification
- `npm run build` (package) — clean; no `fullWidth`/`w-full`/`mono-card[full-width]` in dist;
  `min-width`/`max-width` etc. present in each `*-types.d.ts`.
- `npm run build` (vitepress) — clean; no `full-width` left in `demos/**`.
- Dev: each "Width & height" demo shows fixed width, max-width cap, and `width="100%"` filling;
  button `width="100%"` stretches with centered label; table cards still span full width.
