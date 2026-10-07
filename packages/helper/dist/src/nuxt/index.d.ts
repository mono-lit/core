/// <reference path="../../vue.d.ts" />
import { NuxtModule } from '@nuxt/schema';
import { MonoSsrOptions } from '../vite';
import { MonoTooltipGlobalOptions } from '../components/tooltip/tooltip-types';
import { MonoUIConfig } from '../composables/mono-ui';
import { MonoSkeletonDefaults } from '../composables/mono-skeleton';
export interface MonoHelperModuleOptions extends MonoSsrOptions {
    /** Auto-add `@mono-lit/helper/ui/index.css` to nuxt css. Default true. */
    css?: boolean;
    /** Register `<prefix*>` tags as custom elements (composed). Default true. */
    customElement?: boolean;
    /**
     * Auto-wire SSR for shadow builds: importing `@mono-lit/helper/ui/shadow/<c>` in a
     * `.vue` file makes its `<mono-c>` server-render (Declarative Shadow DOM) — no
     * manual `litElementPrefix` / `exclude` lists, and nothing for the app to
     * install (`nuxt-ssr-lit` ships as a @mono-lit/helper dependency). Default true.
     * Set false (or keep a manual `nuxt-ssr-lit` module entry) to use the legacy
     * manual wiring.
     */
    ssr?: boolean;
    /**
     * Wrap every LIGHT `<prefix*>` in `<ClientOnly>`. Default: **`nuxt.options.ssr !== false`**.
     *
     * The wrap exists so the server never renders a light-DOM custom element. It has a cost:
     * Nuxt's `<ClientOnly>` renders its slot one tick AFTER it mounts, so the owning page's
     * `onMounted` runs before the `<mono-*>` element exists and a `controlMonoTable(ref)` /
     * `controlMonoForm(ref)` bound there sees `null`. Hence:
     *  - `ssr: false` app: nothing renders on the server — no wrap, no `nuxt-ssr-lit`
     *    (set `true` to force the legacy wrap anyway).
     *  - `ssr: true` app: wrapped by default. Set `false` when the pages are client-only as a
     *    WHOLE (route `mode: 'client'`, or `<ClientOnly><NuxtPage/>`) and only a shadow-built
     *    shell server-renders: light tags are then left alone (they SSR as inert tags and
     *    upgrade in the browser), while the server import-stub and the `<LitWrapper>` wrap of
     *    the shadow tags a file imports stay on.
     */
    clientOnly?: boolean;
    /**
     * Tags to ALWAYS treat as shadow (SSR-wrapped) regardless of per-file imports
     * — for components registered once in a shared plugin (e.g. nav/sidebar).
     */
    shadow?: string[];
    /**
     * Packages to add to `vite.resolve.dedupe`. Defaults to the lit family, which
     * MUST resolve to one instance — @mono-lit/helper's externalized shadow build and
     * `@lit-labs/ssr` / `nuxt-ssr-lit` otherwise get separate lit-html copies and
     * hydration dies with `currentDirective._$initialize is not a function`.
     * Merged with whatever the app already lists. Pass `false` to opt out.
     */
    dedupe?: string[] | false;
    /**
     * Packages to add to `vite.optimizeDeps.include`. Pre-bundling these keeps the
     * optimize-deps hash stable, so Vite doesn't discover them mid-session on the
     * first federated-route visit, re-optimize, and re-fetch @mono-lit/helper's chunks
     * under a new `?v=` — which re-evaluates its `@customElement()` side effects
     * and throws `'mono-nav' has already been defined`.
     *
     * Defaults to `['@mono-lit/devextreme']`. Entries that don't resolve from the app
     * are dropped, because Vite hard-fails on an unresolvable include. Add your
     * app's own federated-only deps here (or keep them in `vite.optimizeDeps`).
     * Pass `false` to opt out.
     */
    optimizeInclude?: string[] | false;
    /**
     * The tooltip addon — the Nuxt twin of `createMonoTooltip({...})` in a Vue
     * `main.ts`. `true` (or an options object) turns on the `mono-tooltip-content`
     * attributes app-wide; the options WIN over those passed to `controlMonoTooltip`.
     * Applied by a client-only plugin, so they must be JSON (no `content` /
     * `onShow` functions, no nodes). Needs the optional peers `@floating-ui/dom` +
     * `@floating-ui/core`.
     */
    tooltip?: MonoTooltipGlobalOptions | boolean;
    /**
     * App-wide default props for every mono component — the Nuxt twin of
     * `createMonoUI({...})` in a Vue `main.ts`:
     *   ui: { 'mono-button': { size: 'xs' }, 'mono-input': { size: 'sm' } }
     * One key covers the light and the shadow build. Applied by an EARLY plugin on
     * the server AND the client (shadow SSR must render with the same defaults the
     * browser hydrates with). Must be JSON.
     */
    ui?: MonoUIConfig;
    /**
     * The automatic skeleton (`pending` on every mono element, drawn by phantom-ui). BUILT
     * IN and ZERO-CONFIG: when the optional peer `@aejkatappaja/phantom-ui` resolves from the
     * app, the module loads it in a client plugin before anything mounts and tells mono
     * whether this is an SSR app (`nuxt.options.ssr`, which decides the automatic default of
     * light elements). Not installed → nothing happens and `pending` is a no-op.
     * `false` turns it off even when installed; an object sets the GLOBAL phantom defaults
     * (`{ animation: 'pulse', duration: 1.2 }`) — the same as `createMonoUI({ skeleton })`.
     * Must be JSON.
     */
    skeleton?: false | MonoSkeletonDefaults;
}
declare const monoHelperModule: NuxtModule;
export default monoHelperModule;
