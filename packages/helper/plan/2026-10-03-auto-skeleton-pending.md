# @mono-lit/helper 0.0.6: built-in automatic skeleton (`pending`) via phantom-ui

## Context

esw-ui now SSRs only the shell (shadow sidebar/nav); every page is client-only and its light-DOM `<mono-*>` content appears only after mount + data fetch. The user wants a **skeleton feature built into @mono-lit/helper**: every mono element gets a universal `pending` prop; in an SSR app light elements start pending automatically on initial load and release themselves (data-aware), shadow elements default to `false`; the skeleton is drawn by the third-party Lit web component **`@aejkatappaja/phantom-ui`** (structure-aware shimmer measured from the real DOM) which is an **optional peer** — nothing to import for the consumer, `pending` is a no-op when the peer is absent. "Addons" = the docs section `demo/vitepress/docs/addons` only. The skeleton must follow every mono theme and `.dark`. esw-ui is the test bed (copy dist by hand, as today).

Decisions taken with the user:
- Auto-release is **data-aware**: table helpers / select / tag-input / chart / dropdown-table wait for their first load; everything else releases before first paint.
- Table helpers (`mono-table-th`, `mono-table-loading`, …) get `pending` too; `mono-table-loading` gets a phantom **pending mode** (N placeholder rows mirroring the thead).
- **Constant wrapper**: light elements render `<phantom-ui mono-skeleton>` once (when active) and only toggle `loading`.
- `pending` also accepts an object: `:pending.prop="{ active: true, ...phantomProps }"` (`active` omitted = auto).
- No new subpath / package: zero-import activation keyed on the peer being installed; Nuxt module auto-wires it.

Verified facts the plan relies on (libs repo `C:/Users/VCT-DEV/Desktop/libs/packages/helper`):
- No shared base class; every light/shadow element passes through `customElement`/`defineMonoElement` in `src/composables/mono-element.ts` (`withMonoUI` subclass) → the single injection point. Lit `createProperty` on that subclass lands in the attribute map before `customElements.define` finalizes.
- Light-slot plumbing (`src/composables/light-slots.ts`) uses descendant `querySelector('[data-mono-slot]')` → wrapper-safe. Only `file-upload.css` has a `>` rule and it keys on the inner root, not the host.
- Light popups are body-portaled (`src/composables/popup-portal.ts`); shadow builds keep panels in their root.
- Host display kinds: inline-block = button, chip, checkbox, radio, switch, dropdown, status-dot; inline-flex = button-dropdown, table-detail, table-checkbox; `display: contents` = drawer, modal, sidebar; rest block.
- Data signals: `mono-data-grid.ts` `loading` / `hasLoaded` (latched in `sync()`), `dataSource`; `data-source-controller.ts` `loading` (`_loadFirstPage` sets it synchronously, bound in select/tag-input `willUpdate`); `mono-data-chart.ts` `loading` + `setLoading` notify; `dropdown-table-core.ts` `_dd.grid`.
- `table-overlay.ts`: `applyOverlayHost` accepts a function `hold`, ONE WeakMap entry per element → pending hold and spinner hold must share `holdVar`.
- phantom-ui 1.6.1: tag `<phantom-ui>`, props `loading, animation, mode, shimmerDirection, shimmerColor, backgroundColor, duration, stagger, reveal, count, countGap, fallbackRadius, loadingLabel, pierceShadow, debug`; CSS vars `--shimmer-color`, `--shimmer-bg`, `--shimmer-duration`; `:host{display:block;position:relative;overflow:hidden}`; observers only while `loading`; guards its own `define` (HMR-safe); injects `<style id="phantom-ui-loading-styles">` into `document.head` (does not reach shadow roots); applies `inert`/`aria-busy`; `count` repeats the measured row set and sets host `minHeight`; depends on `lit ^3.3.3` (already deduped by the Nuxt module's `LIT_DEDUPE`).
- Vite tolerates an unresolvable bare import only via the optional-peer rule; core will **not** import the peer at all.
- Theme tokens: `--muted`, `--foreground`, `--input`, `--radius`, `--mono-radius-*`, `--mono-mode-surface-hover` (= muted), `--mono-mode-surface-strong` (= input) — all flip under `.dark` / per flavor.

## Files to add

| File | Role |
| --- | --- |
| `src/composables/mono-skeleton.ts` | Pure, server-safe core: shared state at `Symbol.for('mono-helper.skeleton')`; activation watcher; types; option resolution; the `withMonoPending(Base)` mixin; `setMonoSkeletonDefaults`, `getMonoSkeletonStatus`, `resetMonoSkeleton`. |
| `src/components/skeleton/skeleton.css` | Theme/dark/radius/motion tokens for `phantom-ui[mono-skeleton]`, idle `display: contents`, loading display per host kind, nested-outer-wins rule. Imported by `src/entries/index.css`; appended to every shadow sheet by `toShadowCss`. |
| `src/components/skeleton/skeleton-shadow.css` | Shadow-only: copy of phantom's document-level `phantom-ui[loading]:not([mode=overlay])` text-transparent / media-opacity rules (take exact selectors from the installed `dist/phantom-ui.js`), plus `.mono-table-skeleton*` rules for the shadow table-loading. |
| `tests/skeleton-pending.test.ts`, `tests/nuxt-module-skeleton.test.ts` | See Tests. |
| `demo/vitepress/docs/addons/skeleton.md` | Docs page (model: `addons/tooltip.md`). |
| `plan/2026-10-03-auto-skeleton-pending.md` | Copy of this plan in the repo's plan folder. |

## Files to modify

| File | Change |
| --- | --- |
| `src/composables/mono-element.ts` | `withMonoUI`: `class extends withMonoPending(Base)`; after the class expression `registerPendingProperty(Mono)` (`createProperty('pending', PENDING_DECL)`) and `watchSkeletonActivation()` (idempotent per realm). Keep the `name` define. |
| `src/composables/mono-ui.ts` | `MonoUIConfig.skeleton?: MonoSkeletonDefaults \| false` routed to `setMonoSkeletonDefaults()` (before the `^mono-` key warning); `applyMonoUIDefaults` stores `prop === 'pending'` on `el[MONO_PENDING_TAG_DEFAULT]` instead of assigning (so objects can merge); `resetMonoUI` also resets skeleton. |
| `src/composables/shadow-css.ts` | Append `skeleton.css` + `skeleton-shadow.css` after `selection.css` in `toShadowCss`. |
| `src/entries/index.css` | `@import '../components/skeleton/skeleton.css'` after the legacy `mono-skeleton.css`. |
| `src/entries/index.node.ts` | Re-export `getMonoSkeletonStatus`, `resetMonoSkeleton` + types `MonoPending, MonoPendingOptions, MonoPhantomProps, MonoSkeletonDefaults`. |
| `src/vite/mono-skeleton.css` | Legacy `client-skeleton-*` bars: replace `rgb(226 232 240)` / white sweep with `var(--mono-skeleton-bg, var(--mono-mode-surface-hover, var(--muted)))`, `color-mix(in oklab, var(--background) 60%, transparent)`, radius `var(--mono-skeleton-radius, var(--mono-radius-md, .5rem))`. |
| `src/components/table/table-controller-core.ts` | `static monoPendingAuto = 'data'` + `_monoPendingReady()` → covers all 13 `mono-table-*` helpers. |
| `src/components/table/mono-table-loading-core.ts` | Pending mode (below). |
| `src/components/table/table.css` | `[data-mono-pending]` host rule + `.mono-table-skeleton`, `-row`, `-cell`, `-bar`. |
| `src/components/table/mono-table-th-core.ts` | `data-shimmer-ignore` on funnel + sort buttons (only the caption shimmers). |
| `select-core.ts`, `tag-input-core.ts`, `chart-core.ts`, `dropdown-table-core.ts` | `static monoPendingAuto = 'data'` + `_monoPendingReady()`. |
| `modal-core.ts`, `drawer-core.ts` | `static monoPendingAuto = 'never'` (manual `pending` still works). |
| `src/nuxt/index.ts` | `skeleton` option, peer resolution, client plugin template, flag folded into the `mono-ui.mjs` plugin, optimizeDeps include. |
| `scripts/gen-vue-types.mjs` | `MonoCommonProps { pending?: MonoPending }` intersected into `MonoElement<P,E>` and `uiRows`. |
| `vite.config.ts`, `vite.shadow.config.ts` | Defensive external for `@aejkatappaja/*` (pre resolveId like the other optional peers). |
| `package.json` | `0.0.6`; optional peer `@aejkatappaja/phantom-ui ^1.6.0` (+ `peerDependenciesMeta`). No `exports` change. |
| `C:/Users/VCT-DEV/Desktop/libs/version.json` | add `"0.0.6"` under @mono-lit/helper. |
| Docs | `.vitepress/config.ts` sidebar (Mono-Addons: Skeleton), `ui/dom-type.md` row, `ui/global-defaults.md` (`pending` per tag + `skeleton` key), `ai/template.md` new rule, `repo/setup.md` nuxt option + catalog entry. |

## Runtime design

### State & zero-import activation (`mono-skeleton.ts`)
- `state = globalThis[Symbol.for('mono-helper.skeleton')] ??= { active, ssr: boolean|null, defaults, watching, createdBeforeActive }` — shared by the light bundle, the shadow bundle and duplicate pnpm copies.
- `watchSkeletonActivation()`: skip on `isServer`/no `customElements`/already watching; `customElements.get('phantom-ui')` → active, else `customElements.whenDefined('phantom-ui').then(active = true)`. Any way of loading phantom-ui (Nuxt plugin, `main.ts` import, CDN) activates it.
- `isSsrApp()`: `state.ssr ?? heuristic` where the heuristic (computed once) is `document.getElementById('__NUXT_DATA__')?.dataset.ssr === 'true'`; the Nuxt module always sets `ssr` explicitly (authoritative). Non-Nuxt SSR apps opt in via `createMonoUI({ skeleton: { ssr: true } })`.

### `pending` property
```ts
type MonoPhantomProps = { animation?, mode?, shimmerDirection?, shimmerColor?, backgroundColor?, duration?, stagger?, reveal?, count?, countGap?, fallbackRadius?, loadingLabel?, pierceShadow?, debug? }
type MonoPendingOptions = { active?: boolean } & Partial<MonoPhantomProps>
type MonoPending = boolean | MonoPendingOptions
type MonoSkeletonDefaults = { ssr?: boolean; maxWait?: number } & Partial<MonoPhantomProps>
```
- Declared with `createProperty('pending', { attribute: 'pending', reflect: false, converter, hasChanged: shallow })`. Attribute form is boolean-only (`pending`, `"true"`, `"false"`, `"auto"` → undefined); object form is property-only (`:pending.prop` or plain `:pending` — the accessor is on the prototype so Vue sets the property).
- Resolution in the mixin's `willUpdate` **after** `super.willUpdate` (cores have bound/started their loads by then):
  `explicit = own.active ?? tagDefault.active` (booleans count as `active`); `loading = !state.active ? false : explicit ?? autoRule()`; phantom options = `{ ...globalDefaults, ...tagDefault, ...own }` minus `active/ssr/maxWait`.
- `autoRule()`: shadow (`renderRoot !== this`) → false; `monoPendingAuto === 'never'` → false; light → `isSsrApp() && !_monoReleased`. `_monoReleased` latches when `ready()` is true: `'render'` (default) → true in the first `willUpdate` (so the first render already has `loading=false`: static controls never paint a skeleton); `'data'` → `this._monoPendingReady()`, re-evaluated on every update (cores `requestUpdate()` on controller notify). Safety `maxWait` (default 15 s, `0` off) releases a never-loading element. A `_monoPendingGrace` flag (true after one `setTimeout(0)` from the first pending update) lets data cores say "no controller after one tick → nothing to wait for" without releasing before an `onMounted` binding.

### Wrapper rendering (mixin `render()` override)
```ts
render() { const inner = super.render(); return this._monoWrap ? html`<phantom-ui mono-skeleton ?loading=${this._monoLoading}>${inner}</phantom-ui>` : inner }
```
- `_monoWrap` latched in the first `willUpdate`: light → `state.active && monoPendingMode !== 'custom'`; shadow → false, flipped once to true only when `state.active && _monoLoading && (hasUpdated || !hadShadowRootAtConstruction)` (never on the hydrating render — SSR markers must match; the server never activates). Once true it never flips back; only `loading` toggles.
- Elements constructed before activation stay unwrapped for life (counted in `createdBeforeActive`, dev-warned once; the Nuxt plugin/`main.ts` import always precede mount).
- `updated()`: `_monoApplyPhantomOptions(target)` shallow-compares the resolved record with the last one and sets/removes kebab-case **attributes** on the wrapper (`shimmer-color`, `count`, booleans via `toggleAttribute`). Colours are only passed when configured — otherwise theme CSS vars rule.
- Light-slot capture/placement unaffected (regions stay descendants); `mono-button`'s host sizing fine because the idle wrapper is `display: contents`.

### Data-aware hooks (statics inherit through the registered subclass)
```ts
static monoPendingAuto?: 'render' | 'data' | 'never'   // default 'render'
static monoPendingMode?: 'wrap' | 'custom'              // default 'wrap'
protected _monoPendingReady?(): boolean
```
- `table-controller-core.ts`: `const g = this.dataGrid; if (!g) return grace; if (g.hasLoaded) return true; return grace && !g.loading && !g.dataSource`.
- `select-core.ts` / `tag-input-core.ts`: `return !this.dataSource || !this._ds.loading`.
- `chart-core.ts`: `c ? !c.loading && (grace || c.data().datasets.length > 0) : this.data != null || grace`.
- `dropdown-table-core.ts`: same as the table rule on `this._dd?.grid`.
- `modal-core.ts`, `drawer-core.ts`: `'never'`.

### `mono-table-loading` pending mode
- `static monoPendingMode = 'custom'` (auto `'data'` inherited); the mixin resolves `_monoLoading`, the core renders:
  `<div class="mono-table-skeleton" style="padding-top: var(--mono-table-loading-head,0px)"><phantom-ui mono-skeleton loading count=${rows}><div class="mono-table-skeleton-row" style="height:${rowH}px">${cols.map(pct => <span class="mono-table-skeleton-cell" style="width:${pct}%"><span class="mono-table-skeleton-bar" data-shimmer-no-children></span></span>)}</div></phantom-ui></div>` — bars have a real `background: var(--muted)` + fixed height so phantom measures them; `count` repeats the row; configured phantom options (incl. `count`) applied to this inner element.
- Measurement in `updated()` while pending: column widths from `table.querySelectorAll(':scope > thead th')` `offsetWidth / table.clientWidth` (%), fallback equal split over registered columns, fallback 4×25%; row height from `--_mono-table-th-height` → first th `offsetHeight` → 40px; rows = `dataGrid.pageSize` when 0<ps≤50 and not "all", else 8.
- Sizing via the spinner's slot: `applyOverlayHost(this, true, { headVar: '--mono-table-loading-head', holdVar: '--mono-table-hold-loading', hold: () => head + rows*rowH px, measureHead: 'always' })`.
- Coexistence: `_sync()` returns early while pending (timers cleared); `_apply()` uses `on = !pending && (...)`; on pending→false: remove `data-mono-pending`, `releaseOverlayHost`, reset the latch (`_visible=false`, clear timer) so no min-duration spinner flashes, then `_sync()` so an in-flight load shows the spinner normally. Manual `loading`/`data-loading` honoured once pending releases.
- CSS: `mono-table-loading[data-mono-pending], mono-shadow-table-loading[data-mono-pending] { display:block; pointer-events:none; background:transparent; backdrop-filter:none }` + skeleton row/cell/bar rules (`--_mono-table-th-height`, `--mono-radius-sm`, `var(--mono-skeleton-bg, var(--muted))`).

### Theming CSS (`skeleton.css`)
```css
phantom-ui[mono-skeleton] { --shimmer-bg: var(--mono-skeleton-bg, var(--mono-mode-surface-hover, var(--muted))); --shimmer-color: var(--mono-skeleton-color, color-mix(in oklab, var(--mono-mode-surface-strong, var(--foreground)) 22%, transparent)); --shimmer-duration: var(--mono-skeleton-duration, 1.5s); display: contents; }
phantom-ui[mono-skeleton][loading] { display:block; position:relative; overflow:hidden; box-sizing:border-box; max-width:100%; border-radius: var(--mono-skeleton-radius, var(--mono-radius-md, var(--radius))); }
:is(mono-button, mono-chip, mono-checkbox, mono-radio, mono-switch, mono-dropdown, mono-status-dot) > phantom-ui[mono-skeleton][loading] { display:inline-block; vertical-align:middle; width:100%; }
:is(mono-button-dropdown, mono-table-detail, mono-table-checkbox) > phantom-ui[mono-skeleton][loading] { display:inline-flex; }
phantom-ui[mono-skeleton][loading] phantom-ui[mono-skeleton][loading] { --shimmer-color: transparent; --shimmer-bg: transparent; } /* nested: outer wins */
@media (prefers-reduced-motion: reduce) { phantom-ui[mono-skeleton] { --shimmer-duration: 0s; } }
```
Tokens already flip under `.dark` / per flavor → no separate dark block (add one only if vega-dark contrast is poor in esw-ui). Portaled popups are never clipped; fixed dialogs are not clipped by ancestor overflow.

### Nuxt module (`src/nuxt/index.ts`)
- Option `skeleton?: false | MonoSkeletonDefaults`. Resolve `tryResolveModule('@aejkatappaja/phantom-ui', appAnchor)` (compute `appAnchor` earlier in setup).
- Resolved: `addPluginTemplate({ filename: 'mono-skeleton.client.mjs', mode: 'client', order: -40, getContents: "import '@aejkatappaja/phantom-ui'; export default defineNuxtPlugin({ name: '@mono-lit/helper:skeleton', setup(){} })" })`; emit the universal `mono-ui.mjs` plugin when `helper.ui` has keys **or** phantom resolved, with ONE call `createMonoUI({ ...helper.ui, skeleton: { ssr: ssrApp, ...helper.skeleton } })`; push the peer into the `optimizeDeps.include` wanted list. Not resolved: `logger.debug(...)`, nothing else. Dedupe unchanged (lit already pinned).
- Plain Vue: `import '@aejkatappaja/phantom-ui'` in `main.ts` is the whole activation; defaults via `createMonoUI({ skeleton: {...}, 'mono-table-loading': { pending: { count: 6 } } })`.

### Vue types (`scripts/gen-vue-types.mjs`)
Import `MonoPending`; emit `export interface MonoCommonProps { pending?: MonoPending }`; `MonoElement<P,E> = DefineComponent<StripIndex<P> & MonoCommonProps & …>`; `uiRows` → `StripIndex<Iface> & MonoCommonProps`.

## Tests (vitest jsdom; most from `dist` → build first)
`tests/skeleton-pending.test.ts` with a fake peer `customElements.define('phantom-ui', class extends HTMLElement {})`:
1. Inactive → `pending` attr accepted, no wrapper, no errors, `status.active === false`.
2. Active → `<mono-card pending>` renders `phantom-ui[mono-skeleton][loading]`; `pending=false` keeps the same node, drops `loading`; `"false"`/`"auto"` (SPA) → not loading.
3. Object form + merge order (global `skeleton` < per-tag `pending` < element object); equal shallow copy → no attribute churn (spy `setAttribute`).
4. `ssr: true` auto: `mono-input` never has `loading` after `updateComplete`; `mono-table-th` with fake grid `{ subscribe, loading, hasLoaded, dataSource, props }` loading until `hasLoaded` + notify; no grid → released after one macrotask; `mono-select` with fake `dataSource` released when loading ends; `maxWait` releases.
5. Shadow: `mono-shadow-button` under `ssr: true` → no wrapper; `pending = true` → wrapper inside `shadowRoot`; both bundles share `active`.
6. `mono-table-loading` pending mode: 3 `<th>` + `hasLoaded:false` → `[data-mono-pending] phantom-ui[count]` with 3 cells; `hasLoaded = true` → attribute removed, no `data-mono-loading` flash; manual `loading = true` afterwards still shows the spinner.
7. `tests/mono-ui.test.ts`: `pending` in a tag config is stored not assigned; `skeleton` key raises no "not a mono tag" warning.
`tests/nuxt-module-skeleton.test.ts` (mocked `@nuxt/kit` harness from `tests/nuxt-module-client-only.test.ts`): peer resolvable → both templates (`mono-ui.mjs` contains `"skeleton":{"ssr":true`), include gains the peer; unresolvable → neither (when `ui` empty); `skeleton: false` → none; `ssr:false` app → `"ssr":false`.
Run: `cd C:/Users/VCT-DEV/Desktop/libs/packages/helper && pnpm build && pnpm exec vitest run` (3 pre-existing button-dropdown/dropdown failures are known).

## Docs
`addons/skeleton.md`: install (`pnpm add @aejkatappaja/phantom-ui`), zero-code activation (Nuxt: nothing / `mono.helper.skeleton`; Vue: one import), `pending` attribute/prop/object table, auto rules (SSR vs SPA, shadow manual, data-driven list, `maxWait`), per-tag + global defaults and merge order, theming vars (`--mono-skeleton-bg/-color/-duration/-radius`), table pending mode (`count`), nested rule, `inert`/focus note, legacy `client-skeleton-*` (compile-time `<ClientOnly>` fallback, now theme-aware), status API. Sidebar entry; `ui/dom-type.md` row ("light: automatic in an SSR app · shadow: manual only"); `ui/global-defaults.md`; `ai/template.md` rule (never hand-roll skeletons; `:pending="busy"` for custom busy states; install the peer in the host); `repo/setup.md` option + catalog line.

## Verification in esw-ui (`C:/Users/VCT-DEV/Desktop/template_vueform/esw-ui`)
1. Build libs + tests (above).
2. Copy `dist/*` (and `package.json`) into BOTH pnpm copies: `node_modules/.pnpm/mono-helper@0.0.4_@floating_1d8fb148…/node_modules/@mono-lit/helper/` and `…b2632809…` (PowerShell `Copy-Item -Recurse -Force`).
3. Peer: add `'@aejkatappaja/phantom-ui': 1.6.1` to the `frontend` catalog in `pnpm-workspace.yaml`; `./node_modules/.bin/vp add @aejkatappaja/phantom-ui@catalog:frontend --filter esw-host` (+ esw-master / esw-project so standalone builds resolve it too).
4. `apps/*/nuxt.config.ts`: optionally `helper: { clientOnly: false, skeleton: {} }` (presence of the peer is enough).
5. `vp run --filter esw-host dev`; with the headless CDP script (`scratchpad/cdp-home3.mjs` pattern) install a `MutationObserver` before navigation recording `phantom-ui[loading]` appearances per host tag for ~3 s on `/home`, `/master/brand`, `/budget/input-post-budget`: expect `mono-table-loading[data-mono-pending] phantom-ui[loading]` (and `mono-select` with a dataSource) to appear then disappear after data; `mono-button`/`mono-input`/`mono-card` never `loading`; one `#phantom-ui-loading-styles`; `__NUXT_DATA__` `data-ssr="true"`; no `[mono-*]` console errors; API 401s only.
6. Dark mode: toggle `html.dark` and compare `getComputedStyle(phantom).getPropertyValue('--shimmer-bg')`; force `el.pending = true` on a visible `mono-card` to inspect colours (vega light/dark + basecoat).
7. Interaction: open a `mono-select` while a sibling card is `pending` (portal unaffected); `mono-table-th` menu opens after release.
8. `vp run --filter esw-host build:dev` and `typecheck` (accepts `pending`, `:pending.prop="{…}"`, `createMonoUI({ skeleton })`).
9. Negative: standalone esw-master without the peer → no wrappers, no errors, `getMonoSkeletonStatus().active === false`.
10. Update esw-ui README (SSR section) + memory; libs: `version.json`, plan file.

## Risks / edge cases (decided)
- Elements created before `phantom-ui` is defined stay unwrapped (no light-slot DOM churn); diagnosed via status + one dev warning.
- HMR / double define: phantom guards its define; our watcher is idempotent via the shared symbol.
- Two lit / two @mono-lit/helper copies: only DOM + attributes cross to phantom; shared `Symbol.for` state; lit deduped.
- Nested pending: outer wins via inherited vars. `inert` while loading drops focus (escape: `pending: false` on that element).
- Shadow SSR markup unchanged (server never activates; shadow never wraps on the hydrating render); phantom `ssr.css` not needed.
- `display: contents` hosts: modal/drawer `'never'`; manual wrapper around fixed dialogs is harmless.
- esw-ui is `ssr: true` with client-only pages → the module sets `ssr: true` → light elements auto-pend on first connect (intended); the explicit flag beats the heuristic.

## Outcome notes (after implementation, 2026-10-03)

- The wrapper is NOT constant after all: it exists only while `pending` resolves true. A permanent
  `<phantom-ui>` child broke light builds that style parts with direct-child selectors from the host
  (`[mono-dropdown] > [mono-panel]`, `[mono-textarea] > [mono-native]`) and the ~20 elements that re-scan
  `this.childNodes` for slotted content (they captured the wrapper). Those scans now use
  `monoHostChildNodes()` / `monoHostChildren()` (wrapper-aware) — kept, because the scan can also run while pending.
- First-load rule (user decision): render-driven elements hold their skeleton while ANY data-driven element on
  the page is still waiting for its first load (`state.waiting` / `state.holders`), and release together; a
  page with no data-driven element releases them in the same microtask (no paint). Data-driven release:
  `hasLoaded || error`, or not loading one tick after mount.
- `mono-table-loading` / `mono-table-empty` subscribe callbacks call `requestUpdate()` while pending (their
  spinner/empty states are attribute-driven and never re-rendered otherwise).
- Nuxt: the peer is loaded by a DYNAMIC import in the generated plugin (a static one evaluated `lit-element`
  before nuxt-ssr-lit's hydrate-support hook → `defer-hydration` ignored → hydration mismatch) and is
  EXCLUDED from `optimizeDeps` (pre-bundling inlined a second lit). The pure root entry must stay lit-free
  (mixin split into `mono-pending.ts`).
- Tests: lit's `isServer` is `true` under vitest/jsdom (node export condition); the feature uses its own
  `hasDom` check instead.
