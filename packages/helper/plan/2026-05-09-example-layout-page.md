# Plan — Example Layout page in VitePress demo

## Context

The `@mono-lit/helper` package now ships a complete set of Lit web components (sidebar, nav, menu, breadcrumb, card, modal, button, badge, etc.) and a VitePress docs site under `demo/vitepress/` that documents each component in isolation. None of the existing demo pages compose those components into a real, full-screen application shell — every page is rendered inside the VitePress docs chrome (left sidebar with category links, top docs nav, footer).

The user wants a single fullscreen page that proves the components can be composed into a real app shell, modeled directly on `template/dashboardV2.html` (the canonical EkaJaya BMS dashboard mockup). The content area itself stays empty — this is a layout-shell showcase, not a content recreation. The mono-modal serves as the logout confirmation flow that is part of every dashboardV2 page.

Outcome: opening `http://localhost:5173/example/layout` shows the @mono-lit/helper components arranged as a full-screen sidebar + topbar + empty rounded card, with no VitePress docs chrome anywhere in the viewport.

---

## Decisions

- **Bypass docs chrome:** use VitePress `layout: false` frontmatter on `docs/example/layout.md`. This is the documented hook that strips the doc sidebar/nav/footer for one route only — no fork of `theme/Layout.vue` needed, and other doc pages stay untouched.
- **Sidebar mode:** `mode="permanent"`, leave `contained` off (default false). This matches the `dashboardV2.html` shell — sidebar `position: fixed`, content offset by `margin-left`. Mono-sidebar writes `--mono-sidebar-left-width` on `:root` when uncontained, so the main wrapper consumes that var directly.
- **Route URL:** add `cleanUrls: true` to `config.ts` so the page is reachable at `/example/layout` (no `.html` suffix), as the user phrased it.
- **SFC location:** `docs/components/ExampleLayout.vue` — co-located with the existing `ComponentDocs.vue`, `DemoPreview.vue`, `ThemeSwitcher.vue` SFCs. Globally registered via `theme/index.ts` so the .md file references it as `<ExampleLayout />`.
- **Glue HTML uses UnoCSS classes** (Wind4 + iconify presets are already configured in `demo/vitepress/uno.config.ts`).

---

## Files to create/modify

### CREATE — `demo/vitepress/docs/example/layout.md`
```md
---
layout: false
title: Example Layout
---

<ExampleLayout />
```

### CREATE — `demo/vitepress/docs/components/ExampleLayout.vue`
Single Vue 3 SFC with mono-sidebar + mono-menu (in body), mono-nav + mono-breadcrumb (topbar), mono-card (empty content), mono-modal (logout). Glue HTML uses UnoCSS utility classes.

Implementation notes for the executor:
- `:items.prop="…"` (NOT `:items=`) — required for Lit `@property({ attribute: false })` array props.
- v-model replacement: `:model-value` + `@mno-change`.
- Slots on custom elements: `slot="name"` attribute form (NOT `<template #name>`).
- Modal footer slot is named **`foot`** (`src/components/modal/mono-modal.ts:493`).
- Button variants are exactly `solid | outline | tonal | gradient` (`src/components/button/button-types.ts:19`) — no `text` or `soft`.
- Sidebar slots are `header`, default, `footer` (see `docs/demos/sidebar/vue/iconify.vue`).
- `--mono-sidebar-left-width` is written by `mono-sidebar` to `:root` when not contained (`src/components/sidebar/mono-sidebar.ts:309-310`).
- `i-mdi-*` iconify classes are resolved by `presetIcons` (`demo/vitepress/uno.config.ts:26-33`).

### MODIFY — `demo/vitepress/docs/.vitepress/config.ts`
Add `cleanUrls: true` next to `appearance: false`.

### MODIFY — `demo/vitepress/docs/.vitepress/theme/index.ts`
```ts
import ExampleLayout from '../../components/ExampleLayout.vue'
// ...
app.component('ExampleLayout', ExampleLayout)
```

### Reference files (read-only)
- `demo/vitepress/docs/demos/sidebar/vue/iconify.vue` — canonical sidebar+menu Vue composition with iconify icons.
- `demo/vitepress/docs/demos/modal/vue/*.vue` — modal `:model-value` + `slot="foot"` patterns.
- `template/dashboardV2.html` — visual reference for spacing, gradient, brand block.

---

## Execution checklist

1. Add `cleanUrls: true` to `demo/vitepress/docs/.vitepress/config.ts`.
2. Create `demo/vitepress/docs/example/layout.md` with frontmatter + `<ExampleLayout />` body.
3. Create `demo/vitepress/docs/components/ExampleLayout.vue`.
4. Edit `demo/vitepress/docs/.vitepress/theme/index.ts` — add import + `app.component(...)` registration.
5. Restart the dev server (config.ts changes need a restart for `cleanUrls`).

---

## Verification

From `C:\Users\VCT-DEV\Desktop\libs\packages\@mono-lit/helper\demo\vitepress\`:

```
pnpm dev
```

Open `http://localhost:5173/example/layout` and confirm:

1. **No docs chrome** — no left "Form/Display/…" sidebar, no "Components" top nav, no doc footer.
2. **Sidebar:** 264 px wide, white, EkaJaya gradient brand block at the top, user mini-card below it, mono-menu with two subheaders (`Main`, `Account`), divider between, two badged items.
3. **Topbar:** flush against the right edge of the sidebar; page title + breadcrumb on the left; inbox badge + avatar pill on the right.
4. **Main content:** one empty mono-card with soft rounded corners + thin border, full content area below the topbar.
5. **Logout flow:** clicking the red `Log Out` button opens mono-modal; both Batal and Log Out close it.
6. **Other docs pages still load** at `/checkbox`, `/button`, etc. and still show the full VitePress chrome.
7. **Theme switcher still works** — `theme-opsi-*` switching recolors mono-* components.
8. **DevTools sanity:** `:root` has `--mono-sidebar-left-width: 264px`.

If verification fails, root cause is usually: missing `.prop` suffix, `<template #slot>` instead of `slot="name"`, or `@update:model-value` instead of `@mno-change`.
