# Timeline component + docs

## Context

Next item on `2026-05-04-template-componentization-roadmap.md` after
accordion / tabs / toast / modal / drawer / popover. The template
(`template/timeline-starterkit.html`) ships **8** visual variants. The
roadmap explicitly recommends trimming v1 to **classic, compact,
approval** — that scope is what this delivers.

`mono-timeline` is a read-only display component for stacked events
(activity feeds, audit logs, approval workflows, milestones). Re-routes
the template's hardcoded cobalt palette to the shared `--theme-*` cascade,
follows the standard Lit + standalone-CSS shape, and ships with a
VitePress demo page that the global theme switcher recolors automatically.

## Files added

### Lib
- `src/components/timeline/index.ts` — public re-exports.
- `src/components/timeline/mono-timeline.ts` — Lit element. Light DOM
  render (no body portal — timeline flows in normal layout). Items array
  prop (`@property({ attribute: false })`); per-item slot capture for
  `icon-${id}`, `body-${id}`, `actions-${id}` mirrors the
  `mono-tabs` pattern (`src/components/tabs/mono-tabs.ts:358`). Three
  `_renderClassicItem` / `_renderCompactItem` / `_renderApprovalItem`
  paths so each variant gets the markup ordering it needs (e.g. compact
  puts time on the right, approval puts time inline with the title in a
  head row). Default status icons are hand-drawn Lucide-style SVGs
  per the codified SVG-only rule. The `focus()` method is named
  `focusEvent()` to avoid shadowing the inherited `HTMLElement.focus`
  signature.
- `src/components/timeline/timeline-types.ts` — `TimelineVariant`,
  `TimelineSize`, `TimelineColor`, `TimelineAlign`, `TimelineStatus`,
  `TimelineEvent`, `TimelineCssClass`, `TimelineClickEventDetail` (`{
  modelValue, currentValue, oldValue, value, item, index, sourceEvent? }`
  — same shape `mono-tabs` uses), `TimelineClickEvent`, `TimelineProps`,
  `TimelineEvents`.
- `src/components/timeline/timeline.css` — variables on `.mono-timeline`
  (no `:host`, per the codified rule). `mono-timeline { display: block }`.
  Six color modifiers redirect `--timeline-accent` /
  `--timeline-accent-rgb` to the matching `--theme-X`. Per-event color
  via `.mono-timeline-item.color-X` (emitted by Lit). Approval-variant
  status colors are pinned to `--theme-success` (done) /
  `--theme-info` (info) / etc. so workflow steps always read consistent
  semantics regardless of the parent's `color` modifier. Sm/md/lg sizes
  affect font, spacing, dot size, and spine offset.

### Docs
- `demo/vitepress/docs/timeline.md`
- `demo/vitepress/docs/manifests/timeline.ts` — 9 entries.
- `demo/vitepress/docs/demos/timeline/vue/*.vue` — 9 SFCs.
- `demo/vitepress/docs/demos/timeline/css/*.html` — 9 self-contained
  demos. No Lit needed — they hand-write the same `.mono-timeline.classic`
  / `.compact` / `.approval` markup the Lit element produces, so the
  shared `timeline.css` drives both. The interactive demo wires its own
  vanilla-JS click + keyboard handlers to mirror the Lit `mno-click`
  behavior in the log.

## Files changed

- `src/entries/index.ts` — added `export * from
  '../components/timeline/index';` between `textarea` and `toast`.
- `src/entries/index.css` — added `@import
  '../components/timeline/timeline.css';` between `textarea` and `toast`.
- `vite.config.ts` — added `timeline:
  r('./src/components/timeline/index.ts')` to `build.lib.entry`.
- `package.json` — added `./timeline` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — new "Data" sidebar group
  with `Timeline → /timeline` (reserves space for Table when it lands).

## Demo set (9)

`basic`, `variants`, `sizes`, `colors`, `statuses`, `with-meta`, `slots`,
`interactive`, `customized`.

## Patterns followed

- **SVG-only icons** — every default status icon and every demo icon is
  `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">`.
  Same baseline as accordion / tabs / toast / drawer.
- **Standardised event shape** — `mno-click` (+ `mnoClick` +
  `update:modelValue` + `update:model-value` aliases) emits `{
  modelValue, currentValue, oldValue, value, item, index, sourceEvent? }`.
  Only fires when `interactive` is true.
- **Vue array-prop rule** — `events` is `attribute: false`, so all Vue
  demos use `:events.prop="..."` per the codified memory entry.
- **Vue v-model rule** — `:model-value` + `@mno-click="x =
  $event.detail.modelValue"`. Never `v-model`.
- **Vue object-prop rule** — `:css-class.prop="{...}"` for the cssClass
  override demo.
- **CssClass hooks** — full set: `root`, `item`, `itemActive`,
  `itemDisabled`, `dot`, `icon`, `head`, `title`, `time`, `badge`,
  `description`, `body`, `actions`, `meta`, `avatar`. `_cls(base, key)`
  helper merges them onto the base class string.
- **No `:host`** — variables on `.mono-timeline` per codified light-DOM
  rule. `createRenderRoot()` returns `this`.
- **Theme integration** — every accent reads `var(--theme-X)`; the global
  VitePress theme switcher recolours every timeline.
- **CSS demos self-contained** — vanilla HTML + CSS only, no
  `<mono-timeline>` element.
- **Sidebar grouping** — new "Data" group reserves a home for Table later
  in the roadmap; keeps Display / Disclosure / Navigation / Feedback /
  Overlay groups uncluttered.
- **Method naming gotcha** — `focus(id?)` collides with
  `HTMLElement.focus(options)`; renamed to `focusEvent(id?)`.

## Verification

1. From `demo/vitepress/`, run the dev server and open `/timeline`.
2. All 9 demos render. Toggle Vue / CSS — both look identical.
3. `basic` shows 4 stacked events with dots on the spine; the spine and
   dots take the active theme accent.
4. `variants` shows the same data three ways; approval block shows the
   correct status icons (✓ for done, ● for active, ○ for pending).
5. `sizes` — font / dot / padding scale visibly across sm / md / lg.
6. `colors` — dots and accents recolour per modifier in a 2-column grid.
7. `statuses` — each status renders the correct default SVG with the
   semantic color (green check, red ×, etc.).
8. `with-meta` — avatars (initials of `by`), badges, and per-event color
   classes all show correctly.
9. `slots` — custom SVG icons replace the default dots in the first three
   items; an action button appears under the merge step via
   `actions-merge` slot.
10. `interactive` — clicking an event highlights it, model-value updates,
    log shows `[mno-click] modelValue="..." old="..." item.id="..."`
    lines per click. Keyboard (Enter / Space) also works.
11. `customized` — Vue cssClass object and bare utility classes both
    apply (uppercase title, italic description, bold time).
12. Switch the global theme picker — timeline accents recolour with the
    rest of the page.
13. `pnpm build` from package root — `dist/timeline.js` and
    `dist/timeline.d.ts` are emitted.

## Out of scope

- The deferred 5 variants (two-column, activity-feed-card, horizontal,
  chat, klaim-history). Layered on later.
- Animations on event appear/disappear.
- Server-rendered formatting helpers for `time`.
