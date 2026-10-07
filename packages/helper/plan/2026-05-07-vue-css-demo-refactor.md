# Plan — Migrate `demos/*/css/*.html` to Vue SFCs (Vue + native CSS)

> **Note for execution:** the project keeps plans in `@mono-lit/helper/plan/` with a
> date-prefixed filename. Plan-mode restricts file edits to this `.claude/plans/`
> path, so the **first execution step** is to copy this file to
> `packages/helper/plan/2026-05-07-vue-css-demo-refactor.md` (preserving
> the project's naming convention). The content is identical.

## Context

Each component demo currently lives in two files:

- `demos/<component>/vue/<id>.vue` — Vue SFC that uses the Lit custom elements
  (`<mono-menu>`, `<mono-sidebar>`, …) for both DOM and reactivity.
- `demos/<component>/css/<id>.html` — raw HTML markup that uses the
  hand-rolled `.mono-*` class structure (no Lit element). Interactivity
  (active-row toggling, drawer open/close, scrim clicks) is wired with a
  vanilla `<script>` IIFE in the same file.

The `<DemoPreview>` viewer renders the vanilla-JS variant by parsing the HTML
string in `NativeMount.vue`, rewriting IDs, and re-attaching rewritten
`<script>` tags at runtime. The tab label for that variant is **"CSS"**.

We want both variants to be Vue SFCs going forward: the `vue/` tab keeps using
Lit elements, while the `css/` tab uses **native CSS classes inside a Vue SFC**
— interactivity expressed with `ref()` and `@click`, not vanilla JS. The tab
label becomes **"Vue + CSS"**.

Outcome: simpler runtime (no string-parsing / script-rewriting), full reactivity
in both demo variants, consistent SFC authoring for contributors, and the
`NativeMount.vue` shim can eventually be deleted.

## Approach

Three phases. Phase A is a small central change that lets both `.html` and
`.vue` coexist under `css/` so demos can be migrated incrementally. Phase B
converts the ~100 demo files component-by-component. Phase C drops the legacy
shim once every demo is migrated.

## Phase A — Plumbing (one commit, small)

### A1. `demo/vitepress/docs/components/ComponentDocs.vue`

Add a Vue-component glob and raw-source glob for the new `css/*.vue` files;
keep the existing `css/*.html` globs as a temporary fallback so unmigrated
demos still render.

```ts
// new
const cssVueModules = import.meta.glob('../demos/*/css/*.vue', { eager: true })
  as Record<string, { default: Component }>
const cssVueRaw = import.meta.glob('../demos/*/css/*.vue',
  { query: '?raw', import: 'default', eager: true })
  as Record<string, string>
```

In the per-entry mapper, prefer `.vue` over `.html`:

```ts
const cssVueKey  = `../demos/${props.name}/css/${entry.id}.vue`
const cssHtmlKey = `../demos/${props.name}/css/${entry.id}.html`

const cssComponent = cssVueModules[cssVueKey]?.default
const cssCode      = cssVueRaw[cssVueKey] ?? cssRaw[cssHtmlKey]   // raw source for view
const cssHtml      = cssComponent ? undefined : cssRaw[cssHtmlKey] // legacy fallback
```

Pass `cssComponent` (new) alongside `cssHtml` (legacy) to `<DemoPreview>`.

### A2. `demo/vitepress/docs/components/DemoPreview.vue`

Update the prop list and template so the css tab renders a Vue component when
available, falling back to `<NativeMount>`:

```vue
<component :is="vueComponent" v-if="mode === 'vue' && vueComponent" />
<component :is="cssComponent" v-else-if="mode === 'css' && cssComponent" />
<NativeMount  v-else-if="mode === 'css' && cssHtml"
              :html="cssHtml" :scope-id="scopeId" />
```

Other touch-ups in the same file:

- **Line 130** literal `CSS` → `Vue + CSS`.
- `langLabel` computed (line 36):
  `'HTML + CSS'` → `'Vue + CSS'`.
- `currentLanguage` computed: when `mode === 'css'` and `cssComponent` is
  present, return `'vue'` (so Shiki highlights the SFC); otherwise `'html'`.
- `hasCss` computed: `Boolean(props.cssComponent || props.cssHtml)`.

### A3. `demo/vitepress/docs/components/NativeMount.vue`

No code change in Phase A. It stays as the legacy fallback path.

## Phase B — Migrate `.html` demos to `.vue` (incremental, per component)

For each `demos/<component>/css/<id>.html`, create
`demos/<component>/css/<id>.vue` and delete the `.html`. The migration recipe
is mechanical:

1. **Markup** — copy the HTML body into a `<template>`. Keep every `.mono-*`
   class as-is. Strip the outer `id="…"` (no longer needed for scoping).
2. **Reactive state** — replace each piece of mutable state previously held by
   the script (active item id, drawer open flag, …) with a `ref()` in
   `<script setup>`. Bind via `:class`, `:aria-selected`, `v-show`, `v-for`
   for repeating rows.
3. **Event handlers** — replace `addEventListener('click', …)` with
   `@click="…"`. The class-toggle imperative loops become reactive
   `:class="{ active: id === active }"` bindings.
4. **Styles** — paste the existing `<style>` block verbatim. Keep the
   demo-local class prefix (e.g. `.native-sidebar-permanent`) as the scope —
   it already isolates per-demo styles.
5. **No imports** — these demos must not import `@mono-lit/helper/<component>`
   (that would pull in the Lit element and change the tab's meaning). Plain
   Vue, plain markup, plain CSS.

### Concrete example: `demos/sidebar/css/permanent.html` → `permanent.vue`

```vue
<script setup>
import { ref } from 'vue'

const items = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'sales',     title: 'Sales',     icon: '💰' },
  { id: 'targets',   title: 'Targets',   icon: '🎯' },
  { id: 'reports',   title: 'Reports',   icon: '📓' },
  { id: 'settings',  title: 'Settings',  icon: '⚙️' },
]
const active = ref('dashboard')
</script>

<template>
  <div class="native-sidebar-permanent">
    <div class="mono-sidebar mode-permanent effective-permanent location-left
                comfortable surface elevated contained closed"
         style="--sidebar-width: 220px; --sidebar-rail-width: 64px;">
      <div class="mono-sidebar-scrim"></div>
      <aside class="mono-sidebar-panel" style="width: 220px;">
        <div class="mono-sidebar-header">
          <div class="brand"><span class="logo">M</span><span>Mono UI</span></div>
        </div>
        <div class="mono-sidebar-body">
          <nav class="mono-menu comfortable primary nav">
            <ul class="mono-menu-list" role="listbox">
              <li v-for="it in items" :key="it.id"
                  class="mono-menu-item"
                  :class="{ active: active === it.id }">
                <button type="button" class="mono-menu-action" role="option"
                        :aria-selected="active === it.id"
                        @click="active = it.id">
                  <span class="mono-menu-icon">{{ it.icon }}</span>
                  <span class="mono-menu-content">
                    <span class="mono-menu-title">{{ it.title }}</span>
                  </span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        <div class="mono-sidebar-footer">v1.0.0</div>
      </aside>
    </div>
    <div class="content"><h3>Main content</h3><p>…</p></div>
  </div>
</template>

<style>
/* paste existing styles unchanged */
</style>
```

### Migration order

Suggest doing the smallest demo sets first to validate the recipe, then the
larger ones. Rough ordering by complexity:

1. `badge`, `card`, `button`, `tag-input`, `switch`, `radio`, `checkbox`
   (decorative — little or no JS).
2. `accordion`, `tabs`, `nav`, `menu`, `select`, `input`, `textarea`,
   `file-upload` (single-state interactivity).
3. `drawer`, `modal`, `popover`, `toast`, `timeline` (open/close + scrim).
4. `sidebar` (most variants — already partially Vue-aware after recent work).

Each component is one commit so failures stay localized.

## Phase C — Cleanup (one commit, after Phase B is fully done)

1. Delete `demo/vitepress/docs/components/NativeMount.vue`.
2. In `ComponentDocs.vue`, drop `cssRaw` (the `*/css/*.html` glob), drop the
   `cssHtml` plumbing, simplify the per-entry mapper to just `cssComponent` +
   `cssCode`.
3. In `DemoPreview.vue`, drop the `cssHtml` prop, the `<NativeMount>` branch,
   the `scopeId` import, and the `'html'` branch of `currentLanguage` /
   `langLabel`. Remove the Shiki `html` lang import (only `vue` remains).
4. Confirm no `.html` files remain under `demos/*/css/`.

## Critical files

| File | Phase | Change |
|---|---|---|
| `demo/vitepress/docs/components/ComponentDocs.vue` | A, C | add `.vue` globs, prefer `.vue`; drop `.html` globs in C |
| `demo/vitepress/docs/components/DemoPreview.vue` | A, C | render `cssComponent`, rename tab/chip; drop NativeMount in C |
| `demo/vitepress/docs/components/NativeMount.vue` | C | delete |
| `demo/vitepress/docs/demos/<comp>/css/<id>.html` × ~100 | B | convert each to `.vue`, delete `.html` |

## Reused utilities / patterns

- `useId()` / Vite glob imports — already in place; the new `cssVueModules` /
  `cssVueRaw` globs follow the exact pattern of `vueModules` / `vueRaw`.
- Shiki highlight config in `DemoPreview.vue` already loads `vue.mjs`; no new
  langs needed when `currentLanguage` returns `'vue'` for css-tab too.
- Per-demo class prefixes (e.g. `.native-sidebar-permanent`) already isolate
  styles, so a non-scoped `<style>` block continues to work.

## Verification

1. **Plumbing only (after Phase A):**
   - `pnpm --filter @mono-lit/helper docs:dev` (or whatever the project script is).
   - Open any component page that still has `.html`-only css demos — those
     should keep rendering through `NativeMount` unchanged.
   - Tab label reads **"Vue + CSS"** in the segmented toggle.
   - Source-view chip on the css tab reads **"Vue + CSS"**.
   - No console warnings about missing demos.

2. **Per-component migration (during Phase B):**
   - For each migrated demo: switch to the Vue + CSS tab, exercise the
     interaction (click rows, open drawer, etc.) — state must be reactive.
   - View source: the chip is "Vue + CSS"; Shiki shows highlighted SFC syntax.
   - Resize / reload — no leftover IDs from the old NativeMount path remain
     because the migrated file no longer relies on `getElementById`.

3. **End-to-end (after Phase C):**
   - `rg "NativeMount" demo/` returns nothing.
   - `find demo/vitepress/docs/demos -name '*.html'` returns nothing.
   - `pnpm build` (docs build) finishes; rendered HTML for every component
     page contains both demo variants.
