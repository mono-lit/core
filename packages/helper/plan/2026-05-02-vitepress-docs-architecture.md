# VitePress Docs Architecture for Mono UI

**Date:** 2026-05-02
**Owner:** Documentation site rewrite
**Goal:** Replace the existing demo pages under `demo/pages/` with a scalable VitePress + Vue 3 documentation site under `demo/vitepress/` that mirrors the VueUse docs experience: live demo + raw source toggled below it, two flavors per component (Vue / Native).

---

## 1. Why VitePress

- The current `demo/pages/<component>/index.html` setup uses a custom `<load src>` system, manual textareas, and a Lit/CSS mode switcher. It works but doesn't scale: every new section is hand-wired in HTML, code blocks are fetched at runtime, and there is no real navigation.
- VitePress gives us markdown-driven pages, sidebar navigation, search, and Vue 3 SFC support out of the box. Pairing it with `?raw` imports means every demo file is the **single source of truth** — the rendered demo and the displayed code can never drift.
- We keep the existing `demo/pages/` and `demo/public/` folders untouched as a reference / source of demo content. The new site lives in a sibling `demo/vitepress/` folder so both can coexist while we migrate.

## 2. Folder Layout

```
demo/
  pages/                        # legacy, leave as-is for now
  public/                       # legacy shared assets
  vitepress/                    # NEW
    package.json
    tsconfig.json
    .gitignore
    docs/
      .vitepress/
        config.ts               # site config + isCustomElement
        theme/
          index.ts              # theme entry: registers mono-* elements globally
      index.md                  # landing page
      components/
        DemoPreview.vue         # reusable live-demo + source-toggle card
      demos/
        checkbox/
          vue/
            Basic.vue
            WithLabel.vue
            Disabled.vue
          native/
            basic.html
            with-label.html
            disabled.html
        button/        (placeholder for next iteration)
        textarea/      (placeholder)
        select/        (placeholder)
      checkbox.md
      button.md
      textarea.md
      select.md
```

Why this shape:

- `docs/` is the VitePress source root (set via `srcDir` or by making it the cwd). Anything outside `docs/` is config/tooling.
- `docs/components/` holds reusable Vue components that markdown pages import. `DemoPreview.vue` is the only one for now, but this is where future shared UI (param tables, prop docs, etc.) goes.
- `docs/demos/<component>/vue/*.vue` and `docs/demos/<component>/native/*.html` are the **actual demo files** — short, readable, copy-paste-able. Markdown pages import the rendered version and the `?raw` text from the same file, so the code block is always in sync.
- New components plug in by adding a folder under `demos/<name>/`, a `<name>.md`, and one sidebar entry. No architecture changes required.

## 3. Source-of-truth Mapping (legacy → vitepress)

The legacy `demo/pages/checkbox/lit/*.html` and `demo/pages/checkbox/css/*.html` files map almost 1:1 to the new structure:

| Legacy lit fragment           | New vue demo                | New native demo                    |
|-------------------------------|-----------------------------|------------------------------------|
| `lit/basic.html`              | `vue/Basic.vue`             | `native/basic.html` (from css)     |
| `lit/basic.html` (labeled)    | `vue/WithLabel.vue`         | `native/with-label.html`           |
| `lit/states.html` (disabled)  | `vue/Disabled.vue`          | `native/disabled.html`             |

The Native demos use **the actual `<mono-checkbox>` web component**, not the CSS-only fallback — that matches the user's brief ("the same Web Components with plain HTML and JavaScript, without Vue"). The CSS-only fallback in `demo/pages/checkbox/css/` was a different product (no JS at all); the native flavor we're shipping in vitepress is "no Vue, but yes web components".

## 4. VitePress Config Decisions

- **TypeScript:** `config.ts` (not `.js`).
- **`isCustomElement`:** any tag starting with `mono-` is treated as a custom element and skipped by Vue's compiler, so `<mono-checkbox>` in markdown / SFCs renders as the actual web component instead of warning.
- **`vite.assetsInclude`** is unnecessary — `?raw` already works for `.vue` and `.html` since Vite ships that suffix loader.
- **Theme entry (`theme/index.ts`):**
  - Extends `DefaultTheme`.
  - On the client side, dynamically `import('@mono-lit/helper/dist/checkbox.js')` etc. so the web components are registered exactly once.
  - Imports `@mono-lit/helper/dist/index.css` so component styles are present on every page.
  - SSR-safe: imports are gated by `import.meta.env.SSR === false` (or done inside `enhanceApp` with a dynamic import) since web components register against `window.customElements`.
- **Sidebar:** flat list under "Components" (`Checkbox`, `Button`, `Textarea`, `Select`). Adding a new component = one extra line.
- **Nav:** single top-level "Components" entry pointing to `/checkbox`.
- **UnoCSS:** keep the project's existing UnoCSS classes available inside `DemoPreview.vue` by adding the UnoCSS Vite plugin to the VitePress vite config and wiring `uno.css` import in the theme entry.

## 5. `DemoPreview.vue` Contract

Single component, two modes, decided by which prop is set:

- **Vue mode** (`component` prop is set): renders `<component :is="component" />` inside the preview area.
- **Native mode** (`nativeHtml` prop is set): renders an `<iframe :srcdoc="...">` with a small wrapper that imports `@mono-lit/helper/dist/<...>` from a CDN (esm.sh) and the CSS so the iframe is fully self-contained. The injected `srcdoc` wraps the demo body with `<!doctype html>` + import map + the user's HTML.
- **Code panel:** a `<pre><code>` with the raw source from `code` prop. Toggle button hides/shows the panel; default is collapsed (matches VueUse). Add a copy-to-clipboard button for completeness.
- **Styling:** UnoCSS utilities for the card frame (`border rounded-lg`, header row, etc.). No bespoke CSS file.
- **Props summary:**
  - `component?: Component`
  - `code: string` (required)
  - `title?: string`
  - `description?: string`
  - `language?: 'vue' | 'html' | 'ts' | 'js'` (used for syntax-highlight class on `<code>`)
  - `nativeHtml?: string`

Why iframe for native: `srcdoc` is the only way to render a fully-isolated HTML+JS demo inside a Vue page without leaking globals or letting the demo's `id="..."` clash with the docs page. It's also exactly how VueUse does its "embedded" examples.

## 6. Authoring Pattern for `<component>.md`

Every component page follows the same shape:

1. `<script setup>` block at the top of the markdown imports:
   - The Vue demo SFC (default export) — used for rendering.
   - Same path with `?raw` — used for the displayed code.
   - The native `.html` file with `?raw` — used both as the iframe content and the displayed code.
2. Heading + short description.
3. `## Vue Usage` section → one or more `<DemoPreview>` blocks with `:component` + `:code`.
4. `## Native JavaScript Usage` section → one or more `<DemoPreview>` blocks with `:native-html` + `:code`.

This keeps each markdown file mechanical: copy the pattern, swap the imports.

## 7. Scaling Plan

Adding a new component (e.g. `mono-radio`) is a 4-step recipe:

1. Create `demos/radio/vue/*.vue` and `demos/radio/native/*.html`.
2. Register the component bundle in `theme/index.ts` (one dynamic import line).
3. Create `radio.md` from the `checkbox.md` template.
4. Add one sidebar entry in `config.ts`.

No `DemoPreview` change, no config rewrite, no new conventions.

## 8. Out of Scope (this iteration)

- Migrating every existing example. The user explicitly asked to do **one component first** (checkbox) and then ask before continuing. We ship checkbox + scaffolding, then pause.
- Search/i18n/dark-mode toggle styling — VitePress defaults are fine.
- Removing the legacy `demo/pages/` site. Keep both running until the new site has feature parity.
- API/props documentation tables. The brief is demos-first; prop tables can be added later as a separate component without touching this architecture.

## 9. Order of Work

1. Write this plan (done — you are reading it).
2. Scaffold `demo/vitepress/` (package.json, tsconfig, gitignore).
3. Write `.vitepress/config.ts` and `.vitepress/theme/index.ts`.
4. Implement `components/DemoPreview.vue`.
5. Author the **checkbox** demos (3 vue + 3 native) and `checkbox.md`.
6. Pause and confirm with the user before doing button / textarea / select.

---

## Revision 2 — 2026-05-03

Three changes to v1 based on user feedback after first checkpoint.

### 9a. Native demos do not run inside an iframe

**Problem:** v1 rendered native HTML demos via `<iframe srcdoc>`. Inline `<script>` blocks behaved unreliably (tag-soup escaping inside the `srcdoc` string + cross-origin esm.sh loads inside a sandboxed iframe), so the live demo did not actually run.

**New approach:** the native demo is **also a `.vue` file**, but it does not use Vue reactivity. Instead the SFC runs imperative DOM code inside `onMounted`, scoped to a `useTemplateRef` root. This is the same code a vanilla user would write — just hosted inside a Vue host so the docs page can render it directly. Example shape:

```vue
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
const root = useTemplateRef<HTMLElement>('root')

onMounted(() => {
  const el = root.value!.querySelector('mono-checkbox')!
  el.addEventListener('update:model-value', (e) => {
    el.modelValue = e.detail.modelValue
  })
})
</script>

<template>
  <div ref="root">
    <mono-checkbox></mono-checkbox>
  </div>
</template>
```

**Displayed code is still the plain-HTML version.** Each native demo keeps two files:
- `native/<Name>.vue` — what actually renders on the docs page (Vue host + onMounted DOM init).
- `native/<name>.html` — the standalone HTML+JS the user is meant to copy. Imported with `?raw` and shown in the source panel.

This preserves the brief — users see authentic vanilla HTML/JS code — while the live demo uses the same execution path as the Vue version. Trade-off: there are two files per native demo instead of one. Acceptable cost to remove the iframe.

### 9b. Unified section per demo, with Vue/Native toggle

**Problem:** v1 split each component page into "Vue Usage" and "Native JavaScript Usage" sections. Each demo therefore appeared twice on the page, doubling the scroll length and making it harder to compare the two flavors.

**New layout:** one `<DemoPreview>` block per demo. Both flavors are passed in as props:

```md
<DemoPreview
  title="Basic"
  description="..."
  :vue-component="CheckboxBasicVue"
  :vue-code="CheckboxBasicVueCode"
  :native-component="CheckboxBasicNative"
  :native-code="CheckboxBasicNativeCode"
/>
```

Inside `DemoPreview` the toolbar is reorganized:
- Bottom-right cluster, in this order (left → right): **[Vue | Native] segmented switch** → **Copy** → **Show source**.
- The segmented switch only renders when both `vueComponent` and `nativeComponent` are present (it falls back gracefully if a demo only ships one flavor).
- Toggling the switch swaps both the rendered demo **and** the displayed source code together. Code panel highlight language tracks the mode (`vue` vs `html`).

**DemoPreview prop signature (revised):**
- `vueComponent?: Component`
- `vueCode?: string`
- `nativeComponent?: Component`
- `nativeCode?: string`
- `title?: string`
- `description?: string`

The old `component`, `code`, `language`, `nativeHtml` props are removed. There is no more iframe path.

### 9c. Syntax highlighting for the code panel

**Problem:** v1 rendered the code as plain `<pre><code>` text — no colors. The user asked for "the most popular code editor styling for VitePress."

**Decision:** use **Shiki** with VitePress's own default theme pair: `github-light` + `github-dark`. This is what VitePress 1.x uses for markdown code fences, so the DemoPreview source panel matches the rest of the docs.

**Implementation:**
- Add `shiki` as a direct dependency of `demo/vitepress/`.
- In `DemoPreview.vue`, call `codeToHtml(code, { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false })` and render the result with `v-html`.
- Highlight on demand (only when the source panel is open) and re-highlight on mode toggle.
- Add a small CSS snippet so the dual-theme tokens flip on `html.dark`:
  ```css
  .shiki, .shiki span { color: var(--shiki-light); background-color: var(--shiki-light-bg) }
  html.dark .shiki, html.dark .shiki span { color: var(--shiki-dark) !important; background-color: var(--shiki-dark-bg) !important }
  ```

Shiki is async, so the panel shows a brief "highlighting…" state on first open. After that the result is cached per-mode.

### 9d. "Polish first component before continuing" rule

The user has called pause until **checkbox** is fully polished (working live demos for both modes, working toggle, working highlighted code, no iframe). Button / textarea / select stay as stub markdown pages — no demos written for them yet.
