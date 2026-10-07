# Plan — Multi-Flavor Theme System for @mono-lit/helper

## Context

Today the theme system at `src/data/theme/` only tokenizes **colors** (`--theme-primary`, `--theme-success`, …). The four `opsi-*` presets swap colors but every component CSS hardcodes its own border-radius, shadows, transitions, paddings, font weights, and border widths (~75-80% of each component's visual identity). Because of that, a "Vuetify look" or "MUI look" cannot be achieved by a preset swap — the look is welded into 24 component CSS files.

The user wants to mimic the **flavor** of major UI libraries (Material/Vuetify/MUI first, light mode only, all 24 components in scope — exclude `toast`, `timeline`). Flavor-only fidelity, not pixel-exact, so we tokenize the highest-impact dimensions: **radius, elevation, motion, spacing, typography, border, focus**.

## Complexity Assessment (the headline answer)

- **Architecturally light**: extend `--theme-*` taxonomy, add a flavor-class layer orthogonal to the color-class layer, switch via the existing `applyTheme()` API. ~1 day to lay foundation.
- **Mechanically heavy**: every component CSS gets a small retrofit (replace literals with `var(--theme-radius-*)` etc.). 24 components, tiered by impact. ~3-4 days end-to-end for a flavor-recognizable Material preset.
- The single biggest risk is regression of the *current* `opsi-*` look — every literal we replace must have a matching token in a "mono" flavor that reproduces today's values. With that fallback, switching flavors is reversible and the existing UI is unchanged when no flavor class is set.

## Approach

### 1. Extend the token taxonomy (additive, no breaking change)

Add to every flavor selector — and as `:root` defaults equal to the "mono" flavor:

| Dimension | Tokens | Notes |
|---|---|---|
| Radius | `--theme-radius-xs/sm/md/lg/xl/2xl/full` (2 / 4 / 8 / 12 / 16 / 28 / 9999) | Material defaults at md=8; current mono stays at the 0.625-0.875rem ladder |
| Elevation | `--theme-elev-0…5` (full `box-shadow` strings, layered) | Material uses dual-layer ambient+key shadows |
| Motion | `--theme-motion-standard`, `--theme-motion-emphasized`, `--theme-duration-fast/base/slow` | Material standard: `cubic-bezier(0.2,0,0,1)` @ 200ms |
| Spacing | `--theme-space-1…6` (4 / 8 / 12 / 16 / 24 / 32) | 4-pt grid |
| Typography | `--theme-font-family`, `-weight-regular/medium/semibold/bold`, `-size-xs..xl`, `-line-height-tight/base`, `-letter-spacing-button` | Material's 0.0892857em label tracking is signature |
| Border | `--theme-border-width` | mono=1.5px, material=1px |
| Focus | `--theme-focus-ring`, `--theme-focus-ring-offset` | Full box-shadow string |

### 2. Orthogonal flavor + color classes

Today: `<body class="theme-opsi-a">` carries colors only.
Target: `<body class="theme-color-opsi-a theme-flavor-material">` — colors and flavor compose independently. Avoids N×M selector explosion. A `theme-flavor-mono` carries today's hand-tuned values verbatim, so omitting the flavor class still resolves to the current look (via `:root` fallback).

`applyTheme()` gains an overload:

```ts
applyTheme(name: ThemeName)                                  // legacy: color only
applyTheme({ color?: ThemeName, flavor?: FlavorName })       // new
```

The legacy single-arg path still works; it strips old `theme-<x>` classes and sets `theme-color-<x>` (plus migrates `theme-<x>` if present). The `theme-changed` CustomEvent payload gains `{ color, flavor }`.

### 3. Component refactor pattern

Each component CSS keeps its `--<comp>-*` block; defaults switch from literals to global tokens.

```css
/* button.css today */
--btn-radius: 0.75rem;
border-radius: 0.75rem;
transition: all 0.15s ease;

/* button.css after */
--btn-radius: var(--theme-radius-md);
--btn-transition-duration: var(--theme-duration-base);
--btn-transition-ease: var(--theme-motion-standard);
border-radius: var(--btn-radius);
transition: all var(--btn-transition-duration) var(--btn-transition-ease);
```

Tiering by retrofit depth (lighter tier = fewer dimensions tokenized):

- **Tier A — radius+elev+motion+spacing+typography+border+focus** (button, card, input, select, modal, dropdown, menu)
- **Tier B — radius+elev+motion+focus** (tabs, accordion, table, drawer, sidebar, popover, nav, breadcrumb, form, textarea, file-upload, tag-input)
- **Tier C — radius+motion only** (badge, checkbox, radio, switch, widgets) — checkbox/radio/switch picks up Material's signature toggle tween via motion tokens; badge gets `--theme-radius-full` for pill shape

### 4. Material preset values (concrete)

```
radius: xs=2, sm=4, md=8, lg=12, xl=16, 2xl=28, full=9999
elev-1: 0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)
elev-2: 0 1px 2px rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)
elev-3: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.30)
elev-4: 0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.30)
elev-5: 0 8px 12px 6px rgba(0,0,0,.15), 0 4px 4px rgba(0,0,0,.30)
motion-standard:   cubic-bezier(0.2, 0, 0, 1)
motion-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1)
duration: fast=100ms, base=200ms, slow=300ms
spacing: 4 / 8 / 12 / 16 / 24 / 32 px
font-family: "Roboto", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif
weights: 400 / 500 (button labels) / 600 / 700
sizes: .75 / .875 / 1 / 1.125 / 1.25 rem
letter-spacing-button: 0.0892857em
border-width: 1px
focus-ring: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.24)
focus-ring-offset: 2px
```

## Phased rollout

| Phase | Scope | Size |
|---|---|---|
| 1 — Foundation | Add token taxonomy across every existing color preset using current values (zero visual change), add `theme-flavor-mono` (today's look) and `theme-flavor-material` selectors, extend `presets.ts` types, extend `applyTheme()` | S — ~½ day |
| 2 — Pilot | Retrofit `button`, `card`, `input` → verify identical render under `theme-flavor-mono` and recognizably Material under `theme-flavor-material` | S — ½ day |
| 3 — Tier A rest | `select`, `modal`, `dropdown`, `menu` | M — 1 day |
| 4 — Tier B | 12 components | M — 1.5 days |
| 5 — Tier C | 5 components | S — ½ day |
| 6 — Demo flavor switcher + docs | Add picker in `demo/vitepress/docs/.vitepress/theme/Layout.vue`, persist to localStorage | S — ½ day |

Total ~4 days for a recognizable Material flavor across all 24 components. Adding subsequent flavors (Ant, Headless, etc.) becomes ~½ day each because the retrofit is done.

## Critical files

**Phase 1 (foundation)**
- `packages/helper/src/data/theme/index.css` — add tokens to `:root` and every `.theme-*` selector; add `.theme-flavor-mono` (current-look values) and `.theme-flavor-material` (Material values). Migrate existing `.theme-opsi-*` selectors to `.theme-color-opsi-*` (keep old names as aliases for one release for back-compat).
- `packages/helper/src/data/theme/presets.ts` — add `ThemeFlavor` type and `flavorPresets: Record<FlavorName, ThemeFlavor>`. Add `FlavorName` type.
- `packages/helper/src/data/theme/index.ts` — add overloaded `applyTheme()`, `getCurrentFlavor()`, manage two class lists, extend `theme-changed` payload.
- `packages/helper/src/entries.ts` — re-export `FlavorName`, `applyTheme` overload type.

**Phase 2 (pilot)**
- `packages/helper/src/components/button/button.css`
- `packages/helper/src/components/card/card.css`
- `packages/helper/src/components/input/input.css`

**Phase 6 (demo verification)**
- `demo/vitepress/docs/.vitepress/theme/Layout.vue` — add a flavor + color picker into the layout slot
- `demo/vitepress/docs/.vitepress/theme/index.ts` — wire pickers, restore from localStorage on mount

## Verification

- **Phase 1**: `pnpm --filter @mono-lit/helper build` succeeds. Open any existing demo page — visually identical to today (proves `theme-flavor-mono` defaults match the current literals).
- **Phase 2**: With the demo picker, flip flavor `mono` ↔ `material` on `demos/button/`, `demos/card/`, `demos/input/` pages. Same markup should render visibly Material under `material` (rounder corners on cards, layered shadows, 500-weight button labels with letter-spacing, 200ms motion). Then flip back — should be byte-identical to today.
- **Phase 3-5**: Same picker, walk through every demo page; record visible differences.
- **Phase 6**: Side-by-side proof using `demos/dashboard` (composite page if present) — mono vs material in two browser tabs.

No visual regression tooling is wired in (no Chromatic/Loki/Playwright snapshots in repo). Manual side-by-side via the picker is sufficient to call the work done. Optional follow-up: Playwright screenshots through the VitePress dev server.

## Risks & tradeoffs

- **Token-fallback discipline is load-bearing.** Every component literal we replace must have a value in `theme-flavor-mono` (and as `:root` default) that exactly matches today. If any literal is replaced *without* a matching mono token value, today's look regresses. Mitigation: do the literal-to-token swap and the mono-flavor token authoring in the **same commit** per component.
- **Hardcoded RGBA shadows in some components are tied to opsi-a primary** (e.g. button.css has values like `rgba(37, 99, 168, 0.4)` that don't even match the current opsi-a primary correctly). Phase 3 should opportunistically convert these to `rgba(var(--theme-primary-rgb), …)` so flavor swaps stay coherent — but this is a coherence improvement, not a flavor requirement.
- **`!important` on `.pill`/`.round`/`.circle` shape modifiers in button.css** resists token cascade. Acceptable — those are explicit user-chosen shapes and should win over flavor defaults.
- **Light DOM cascade is fine.** Components render in light DOM via `createRenderRoot()` returning `this` (per CLAUDE.md), so `body.theme-flavor-material .mono-button { … }` cascades normally — no `:host`, no Shadow DOM piercing needed.
- **Letter-spacing**: keep `--theme-letter-spacing-button` scoped to button labels (`.button-text` / equivalent), not applied globally — otherwise it bleeds into input placeholders and reads as a bug.
- **Density token** is reserved as `--theme-density` but **not implemented in v1**. Tier A components note it as a TODO so a future "compact Material" flavor can wire it without re-touching every CSS.
- **No build-step generation** in v1 — flavor CSS is hand-authored in `index.css`. If presets multiply later, add a `bin/` script to generate `index.generated.css` from `presets.ts`. Not needed yet.
