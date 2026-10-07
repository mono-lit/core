# Template componentization roadmap

## Context

`src/components/` ships 11 implemented Lit components (`badge`, `button`, `card`, `checkbox`, `file-upload`, `input`, `radio`, `select`, `switch`, `tag-input`, `textarea`) plus three empty placeholder folders (`form/`, `table/`, `widgets/`). The `template/` directory holds Tailwind/HTML mockups for many more UI patterns that haven't been turned into Lit elements yet, and they all use a hardcoded local palette (`--cobalt`, `--ink`, `--silver`…) instead of the shared `--theme-*` system at `src/data/theme/`.

Goal: harvest the templates that aren't yet components, port them into the standard `mono-<name>` shape (Lit + standalone CSS), wire each into the shared `--theme-*` palette so the new VitePress theme switcher recolors them too, and ship a VitePress demo page for each. Process this list one component at a time, starting with the smallest.

## Survey of `template/`

| Template | Category | Status |
|---|---|---|
| `button-icon-starterkit.html` | Icon-only / FAB button variants | **Skip** — already covered by existing `mono-button` (icon-only, FAB, square, round, circle modifiers all exist). |
| `chart-starterkit.html` | Chart cards (line/bar/donut/sparkline) | **Defer** — needs SVG renderer + data prop; large scope. |
| `dashboardV2.html` | Dashboard shell composition | **Skip** — composite layout, not a single component. |
| `form-proposal.html` | Form layout proposal | **Skip** — composition of existing form fields. |
| `form-starterkit.html` | Form field gallery | **Skip** — already covered by existing input/select/textarea/etc. demos. |
| `table-no-expand.html` | Data table with sort + pagination + mobile cards | **Build** — empty `src/components/table/` placeholder is reserved for this. Medium complexity. |
| `table-with-expand.html` | Same + row expansion | **Build later** — same file as above with expansion variant; layered on top of `mono-table`. |
| `timeline-starterkit.html` | Timeline (8 visual styles) | **Build** — pure-markup component but 8 variants is a lot of CSS surface. |
| `widgets-starterkit.html` | Mixed bag: accordion, tabs, modal, drawer, dropdown, popover, toggle group, toast, … | **Build per widget** — each entry inside this template is its own component. |
| `wizard-starterkit.html` | Multi-step wizard / stepper | **Build** — needs current-step state + step status (todo/active/done). |

## Ordering by complexity (easiest first)

1. **Accordion** (extracted from `widgets-starterkit.html`) — single expand/collapse unit, one boolean state, one event. Smallest, cleanest surface. **← this session's deliverable.**
2. **Tabs** (extracted from `widgets-starterkit.html`) — strip of clickable tab buttons + content panes. Slightly more wiring (active index + matching content) than accordion.
3. **Toast** (extracted from `widgets-starterkit.html`) — small floating message; manager pattern (queue + auto-dismiss) but each toast itself is small.
4. **Modal / Dialog** (extracted from `widgets-starterkit.html`) — overlay + body + footer; needs focus trap and Escape handling.
5. **Drawer / Side panel** (extracted from `widgets-starterkit.html`) — same shell as modal but slides from a side; reuses much of modal's logic.
6. **Popover / Tooltip** (extracted from `widgets-starterkit.html`) — positioning is the tricky part.
7. **Timeline** (`timeline-starterkit.html`) — pure markup, but 8 visual variants is a wide CSS surface. Recommend trimming to 2–3 (Classic, Compact, Approval) for v1.
8. **Wizard / Stepper** (`wizard-starterkit.html`) — current-step state, step statuses, navigation events.
9. **Table** (`table-no-expand.html`) — sorting, pagination, mobile card fallback, action menus per row. The template already has dropdown menu + checkbox patterns we can compose from existing components.
10. **Table with expansion** (`table-with-expand.html`) — additive on top of table.
11. **Chart** (`chart-starterkit.html`) — SVG rendering + data prop, largest scope.

## This session: ship `mono-accordion`

### Files added
- `src/components/accordion/index.ts`
- `src/components/accordion/mono-accordion.ts` — Lit element representing a single accordion item.
- `src/components/accordion/accordion-types.ts` — `AccordionSize`, `AccordionColor`, `AccordionCssClass`, `AccordionToggleEventDetail`, `AccordionProps`, `AccordionEvents`.
- `src/components/accordion/accordion.css` — variables on `.mono-accordion` (NOT `:host`, per the codified rule), with `mono-accordion { display: block }` for the custom-element tag.
- `demo/vitepress/docs/accordion.md`
- `demo/vitepress/docs/manifests/accordion.ts`
- `demo/vitepress/docs/demos/accordion/vue/*.vue` (9 SFCs)
- `demo/vitepress/docs/demos/accordion/css/*.html` (9 self-contained HTML)
- This plan note.

### Files changed
- `src/entries/index.ts` — add `export * from '../components/accordion/index'`.
- `src/entries/index.css` — add `@import '../components/accordion/accordion.css';`.
- `vite.config.ts` — add `accordion: r('./src/components/accordion/index.ts')` to `build.lib.entry`.
- `package.json` — add `./accordion` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — add a new `Disclosure` sidebar group with `Accordion → /accordion`.

### Component surface

**Tag**: `<mono-accordion>` represents a **single** accordion item (mirroring `mono-radio`, `mono-checkbox`). Users compose multiple in any container they like. Standalone CSS ships an optional `.mono-accordion-group` helper for the typical stacked layout.

**Props**:
- `label: string` — header text
- `description: string` — optional sub-text under the label
- `icon: string` — leading icon glyph (emoji or single character)
- `open: boolean` — current expanded state, reflected
- `disabled: boolean` — disable interaction
- `size: 'sm' | 'md' | 'lg'`
- `color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'`
- `cssClass: AccordionCssClass` — per-element override object
- `cssClassName: string` — root utility class fallback

**Slots**: `label`, `description`, `icon`, `actions` (trailing chip in head), and the default slot for the body content.

**Events**: `mno-toggle` / `mnoToggle` with detail `{ open: boolean, oldOpen: boolean, sourceEvent?: Event }`. Plus `update:open` / `update:openValue` aliases (filtered out by Vue per the codified rule, so demos use `@mno-toggle`).

**Methods**: `toggle()`, `expand()`, `collapse()`, `focus()`, `blur()`.

### Demo set (9)
`basic`, `sizes`, `colors`, `states` (disabled + default-open + default-closed), `icon` (icon + description in the head), `group` (multiple stacked items, several open), `slots`, `event-log`, `customized`.

### Theme integration
All colours pulled from the shared `--theme-*` palette via `var(--theme-X, fallback)`, identical to existing components. `.mono-accordion.primary/secondary/success/danger/warning/info` modifiers redirect `--accordion-focus-color` and `--accordion-accent-rgb` to the corresponding `--theme-*` variable, so the global VitePress theme switcher recolors accordions automatically.

### Verification
1. From `demo/vitepress/`, run the dev server and open `/accordion`.
2. All 9 demos render. Toggle Vue/CSS — both look identical.
3. Click a head — the body expands, arrow rotates, `mno-toggle` fires with `{open: true, oldOpen: false}` in `event-log`.
4. Switch the global theme picker — accordion accent recolors with the rest of the page.
5. The `customized` demo applies `:css-class.prop="{...}"` overrides via Vue and bare utility classes via CSS.
6. `pnpm build` — type check passes; `dist/accordion.js` and `dist/accordion.d.ts` are emitted.

## Out of scope for this session
- Tabs / Modal / Drawer / Popover / Timeline / Wizard / Table / Chart — listed above for later sessions.
- Building a `mono-accordion-group` parent that enforces "exclusive open" behavior — can be layered on later if needed.
