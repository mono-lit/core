# Rename `<mono-badge>` → `<mono-chip>`

## Context

`<mono-badge>` is being renamed to `<mono-chip>`. The component itself has a `mode = 'badge' | 'chip' | 'tag'` style switch — calling the whole element "badge" was confusing when most usages actually render in chip/tag mode. The new name reflects the primary intent. The mode values themselves stay (they're visual presets, not the component identity).

Out of scope (stays as-is):
- The `*BadgeColor` types on **button**, **breadcrumb** and **menu** — those describe small notification indicators rendered *inside* those components, not the standalone chip. Unrelated concept.
- `MonoStatusDot` / `<mono-status-dot>` — a sibling helper that lives in the same file but is its own custom element.
- The `mode` value `'badge'` — it's a stylistic preset alongside `'chip'` and `'tag'`. Keeping it preserves the soft / loud / outlined variants users already rely on.

## Critical files

### Source rename
- Folder: `src/components/badge/` → `src/components/chip/`
- `badge-types.ts` → `chip-types.ts`
  - `BadgeSize`/`BadgeColor`/`BadgeVariant`/`BadgeShape`/`BadgeMode`/`BadgeIconPosition`/`BadgeCssClass`/`BadgeModelEventDetail`/`BadgeModelEvent`/`BadgeEvents` → `Chip*`
  - `MonoBadgeProps` → `MonoChipProps`
  - `MonoStatusDotProps` / `StatusDotState` unchanged
- `badge-utils.ts` → `chip-utils.ts`
  - `generateBadgeRootClasses` → `generateChipRootClasses`; root class string `'mono-badge'` → `'mono-chip'`
  - `validateBadgeProps` → `validateChipProps`
- `badge.css` → `chip.css`
  - All `.mono-badge*` selectors → `.mono-chip*`
  - Element selector `mono-badge { … }` → `mono-chip { … }`
- `mono-badge.ts` → `mono-chip.ts`
  - `@customElement('mono-badge')` → `@customElement('mono-chip')`
  - `class MonoBadge` → `class MonoChip`
  - `HTMLElementTagNameMap['mono-badge']` → `HTMLElementTagNameMap['mono-chip']`
  - All template class strings (`'mono-badge'`, `'mono-badge-content'`, `'mono-badge-label'`, etc.) → `mono-chip*`
  - `import badgeCss from './badge.css?raw'` → `chipCss from './chip.css?raw'`
  - `MonoStatusDot` (class, `<mono-status-dot>` element) unchanged
- `index.ts`
  - `export { MonoBadge } from './mono-badge.js'` → `export { MonoChip } from './mono-chip.js'`
  - `MonoStatusDot` re-export still points at `./mono-chip.js`
  - Type re-exports updated to the new names

### Package wiring
- `src/entries/index.ts` — `'../components/badge/index'` → `'../components/chip/index'`
- `src/data/theme/index.css` — single selector `.theme-flavor-material .mono-badge` → `.mono-chip`
- `vite.config.ts` — sub-entry `'ui/badge': r('./src/components/badge/index.ts')` → `'ui/chip': r('./src/components/chip/index.ts')`
- `package.json` `exports['./ui/badge']` → `exports['./ui/chip']`

### Demos rename
- Folder: `demo/vitepress/docs/demos/badge/` → `demo/vitepress/docs/demos/chip/`
- All 13 `vue/*.vue` files — `<mono-badge>` → `<mono-chip>`, any class strings updated
- All 13 `css/*.vue` files — hand-rolled markup uses `.mono-badge*` classes; rename to `.mono-chip*`
- `demo/vitepress/docs/manifests/badge.ts` → `manifests/chip.ts` (content unchanged)
- `demo/vitepress/docs/ui/badge.md` → `ui/chip.md`
  - Import `@mono-lit/helper/ui/badge` → `@mono-lit/helper/ui/chip`
  - Every `<DemoSingle name="badge" …>` → `name="chip"`
  - Title `# Badge` → `# Chip`; intro text updated; the "Modes" section note that `mode="badge"` still exists

### Other consumers
- `demo/vitepress/docs/example/oddo-example.vue` — `import('@mono-lit/helper/ui/badge')` → `import('@mono-lit/helper/ui/chip')`, all `<mono-badge>` tags → `<mono-chip>`

## Things explicitly NOT changing

- The `BadgeMode = 'badge' | 'chip' | 'tag'` *values* — still a real visual axis. The type alias name becomes `ChipMode`, but `mode="badge"` keeps working as a soft notification-indicator style.
- `<mono-status-dot>` / `MonoStatusDot` / `MonoStatusDotProps` / `StatusDotState` — colocated but conceptually separate.
- `ButtonBadgeColor`, `BreadcrumbBadgeColor`, `MenuBadgeColor` (and the `badgeColor` props on those components) — these are tiny indicator counts on buttons / breadcrumb items / menu rows, unrelated to the standalone chip component.
- `dist/` — auto-built. Will regenerate on next `vite build`.

## Execution order

1. `git mv` the source folder and its files to new names.
2. Edit source files to swap symbol names and class strings.
3. Update `src/entries/index.ts`, `src/data/theme/index.css`, `vite.config.ts`, `package.json`.
4. `git mv` the demos folder, the manifest, and the docs page.
5. Edit demo / manifest / docs content.
6. Update `demo/vitepress/docs/example/oddo-example.vue`.
7. Typecheck — only the pre-existing `button/index.ts` errors should remain.

## Verification

```powershell
npx tsc --noEmit -p tsconfig.json
```

Grep checks (each should return only `dist/` matches):
- `mono-badge` (custom element tag)
- `MonoBadge[^P]` (class name; avoid matching `MonoBadgeProps` which is also being renamed but the regex catches the bare class)
- `class="mono-badge` / `\.mono-badge` (CSS class)
- `BadgeProps|BadgeColor|BadgeSize|BadgeMode|BadgeShape|BadgeVariant|BadgeIconPosition|BadgeCssClass|BadgeEvents|BadgeModelEvent` — should only match the **other** components' badge indicators (`ButtonBadgeColor`, etc.), never the standalone chip.

Manual UI:
- Open `/chip/` page in the vitepress dev server — all 16 demos render, dropdown / clear / event-log all work.
- Open `/example/` (oddo) — chips still render in the same spots.
