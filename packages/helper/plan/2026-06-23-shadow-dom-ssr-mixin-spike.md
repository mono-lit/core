# 2026-06-23 — Shadow-DOM / SSR build via shared core mixin (spike on `mono-nav`)

## Context

Today every component renders in **light DOM** (`createRenderRoot()` returns `this`)
and is styled by the global `dist/ui/index.css`. That is great for Tailwind/Uno
utility classes and Vue interop, but it is **not server-renderable**: the existing
SSR story (`@mono-lit/helper/vite` → `monoSsr`) is *client-only* — it stubs the elements
on the server and wraps `<mono-*>` in `<ClientOnly>`. The server never produces markup.

We want a parallel, **opt-in** build that renders in a real **shadow root** so
`@lit-labs/ssr` can serialize it to Declarative Shadow DOM and a true SSR app gets
server-rendered markup that hydrates. This must be **purely additive** — current
light-DOM consumers (`@mono-lit/helper/ui/*`) are untouched.

The chosen mechanism (from the 2026-06-22 design discussion) is a **Lit mixin**: one
reusable function holds every render-mode-agnostic concern; two thin wrappers differ
only in `createRenderRoot()` + how styles are applied. This plan is a **spike on
`mono-nav`** to prove the whole pipeline end-to-end before committing to all 24 components.

## Goal of the spike

Prove, on one display-only component:

1. Mixin extraction with **zero behavior change** to the existing `mono-nav` (light).
2. A `mono-nav.shadow.ts` that renders in a shadow root with working CSS.
3. A new `@mono-lit/helper/shadow/nav` export path + build target.
4. A `@lit-labs/ssr` render producing Declarative Shadow DOM that hydrates.

If any of those is disproportionately costly, we stop and reassess **before** the other 23.

## Design

### What is shared vs. what differs

Reading `src/components/nav/mono-nav.ts`, almost everything is render-mode-agnostic:

| Shared → core mixin | Differs per build |
|---|---|
| `@property`/`@state` fields, `cssClass`/`css-class`/`cssclass` hybrid aliases, `observedAttributes`, `attributeChangedCallback` | `createRenderRoot()` (light: `return this`; shadow: default) |
| `_setCssClass`, `_cls`, `_rootClasses` (`generateNavRootClasses`), `getHeight`, `_writeLayoutVar`/`_clearLayoutVar` | How styles apply (light: global `index.css`; shadow: `static styles`) |
| event/lifecycle plumbing | `@customElement` tag registration |
| **the body** of `render()` (header → inner → start/center/end + extension) | **slot strategy** (light: capture+`data-mono-slot`; shadow: native `<slot>`) |

### Nav-specific catches the mixin must design around

1. **Slots can't be 100% shared.** The light build uses the capture/replace hack
   (`_captureSlots` in `connectedCallback`, `_placeSlots` in `updated`, rendering
   `data-mono-slot="…"` placeholders — see memory `project_lit_lightdom_slot_capture`).
   Shadow DOM uses native `<slot name="…">`. So `render()` is split: the chrome
   (`<header>`/`<div class="mono-nav-inner">…`) is shared; the **slot leaf** is a
   protected hook the mixin calls, overridden per build:
   - light: `<div … data-mono-slot="start"></div>` (+ the capture/place lifecycle)
   - shadow: `<slot name="start"></slot>`
   Concretely: mixin exposes `protected renderSlot(name): TemplateResult`; the capture
   lifecycle (`_captureSlots`/`_placeSlots`, `_slotsCaptured`, `_slotNodes`) moves into
   the **light wrapper only**, not the core.

2. **CSS must be re-homed for the shadow root.** `nav.css` targets `mono-nav { display:block }`
   and `.mono-nav { … }`. Inside a shadow root the global sheet can't reach, so the shadow
   build needs `static styles = [unsafeCSS(navCss)]` **with `mono-nav` → `:host` rewritten**
   (memory `project_lit_host_css_bug` removed `:host` precisely because it breaks light DOM —
   so the two builds genuinely need different top-level selectors). Theme tokens
   (`--theme-*`) are CSS custom properties and **inherit across the shadow boundary**, so
   the `--nav-*` fallback chain keeps working with no extra wiring. Approach: keep `nav.css`
   as the light source of truth; for shadow, ship a small `:host`-prefixed variant (either a
   `nav.shadow.css` or a build-time selector rewrite). Spike will pick whichever is simpler.

3. **`_writeLayoutVar` writes to `document.documentElement`.** Already guarded by
   `typeof document === 'undefined'`, so it is SSR-safe (no-op on the server) and works in
   both builds. No change needed, but note: the `--mono-nav-height` global var is a
   light-DOM-era affordance; it still functions from inside a shadow component.

### Registration collision — the hard constraint (not a sharing problem)

`customElements.define('mono-nav', …)` throws if called twice in one document. So
`mono-nav.ts` (light) and `mono-nav.shadow.ts` (shadow) **must never load into the same
registry**. The sharing is fine; the rule is about *which build an app imports*:

- ✅ Separate apps/bundles: SPA imports `@mono-lit/helper/ui/nav`; an SSR app imports
  `@mono-lit/helper/shadow/nav`. Same tag, never coexist.
- ✅ One SSR app: uses the **shadow** build on both server and client (server emits DSD,
  client hydrates the same definition). The light build is simply unused there.
- ❌ Not possible: one document server-rendering shadow but hydrating light under the same
  tag (DOM shapes differ → hydration mismatch). If both were ever needed in one document,
  the shadow build would need a distinct tag (e.g. `mono-nav-ssr`) — out of scope for the spike.

## File plan (spike)

```
src/components/nav/
  nav-core.ts          NEW  MonoNavCore<T> mixin — all shared logic + chrome render() +
                            protected renderSlot() hook. No @customElement, no createRenderRoot.
  mono-nav.ts          EDIT becomes: class MonoNav extends MonoNavCore(LitElement)
                            + createRenderRoot()=>this, the slot capture/place lifecycle,
                            renderSlot()=data-mono-slot placeholder. Public contract unchanged.
  mono-nav.shadow.ts   NEW  class MonoNavShadow extends MonoNavCore(LitElement)
                            + static styles (:host-adapted nav css), renderSlot()=<slot>.
                            @customElement('mono-nav').
  nav.shadow.css       NEW? :host-prefixed variant of nav.css (if rewrite-at-build is harder)
  index.shadow.ts      NEW  barrel: export { MonoNavShadow } + shared types/utils.
```

Build / package wiring:

- `package.json` `exports`: add `"./shadow/nav"` → `dist/shadow/nav.js` (+ `.d.ts`).
- `vite.config.ts` `lib.entry`: add `'shadow/nav': src/components/nav/index.shadow.ts`.
- Add `@lit-labs/ssr` (and `@lit-labs/ssr-client` for hydration) — needed for the
  server-render verification step; gate it as a devDependency for the spike, promote to a
  documented peer/optional dep only if we roll this out to all components.

> Note: light-build wiring (`entries/index.ts`, `entries/index.css`, `ui/nav` export,
> `components/nav/index.ts`) stays exactly as-is — see memory `project_component_wiring`.
> The shadow build is a separate entry and is **not** added to the light barrels.

## Verification

1. `pnpm build` → `dist/ui/nav.js` byte-for-byte equivalent in behavior (light unchanged);
   new `dist/shadow/nav.js` + `dist/src/components/nav/index.shadow.d.ts` emitted.
2. Light regression: existing nav demo (`demo/pages/nav`) renders identically — slots,
   density, sticky, `css-class` string + object forms, `--mono-nav-height` var.
3. Shadow client: a minimal page importing `@mono-lit/helper/shadow/nav` renders a real
   `#shadow-root` with `<slot>`s populated; theme vars cascade in; CSS applies.
4. SSR: `@lit-labs/ssr` `render()` of `<mono-nav>` emits `<template shadowrootmode="open">`
   (Declarative Shadow DOM) with no `HTMLElement is not defined`; client hydrates without
   mismatch warnings.

## Decision point after the spike

The sharing is cheap and reusable. The recurring per-component cost is **CSS-in-shadow
adaptation** and, for the hard ones, **forms + slots**:

- Cheap (display-only, like nav): button, card, chip, breadcrumb, accordion.
- Expensive: form controls (input/select/textarea/checkbox/radio/switch/tag-input/date/
  file-upload) need `ElementInternals` for form participation inside shadow DOM; slot-heavy
  ones need a per-build `renderSlot` like nav's.

Roll out only if the spike shows the mixin + CSS split is mechanical enough to template.
This effectively revives the abandoned `RenderModeMixin` idea (memory
`project_shadow_dom_ssr_build`) but expressed cleanly as a per-component core mixin instead
of one monolithic mixin.
