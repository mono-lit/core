/// <reference path="../../vue.d.ts" />
import { c as MonoConfig } from "./create-config-D3m6xTaQ.js";
import { t as MergeEcosystemOptions } from "./merge-file-C5nzi_MY.js";
import { Plugin } from "vite";
import { NuxtModule } from "@nuxt/schema";

//#region src/nuxt/nuxt-ecosystem.d.ts
/**
 * Which Nuxt API consumes the discovered folders (the "destination").
 *
 * `layouts` / `middleware` / `plugins` are the shell a REMOTE inherits from its
 * host; the first four are what a host pulls out of its remotes.
 */
type EcosystemType = 'imports' | 'components' | 'pages' | 'layouts' | 'middleware' | 'plugins';
//#endregion
//#region ../helper/dist/src/vite/index.d.ts
interface MonoSsrOptions {
  /** Custom-element tag prefix wrapped in <ClientOnly>. Default 'mono-'. */
  prefix?: string;
  /** Wrapper component used for client-only rendering. Default 'ClientOnly'. */
  wrapper?: string;
  /** Import prefix of registration modules stubbed during SSR. Default '@mono-lit/helper/ui/'. */
  ssrStubPrefix?: string;
  /**
   * Tag names (e.g. `['mono-nav']`) to NOT wrap in `<ClientOnly>` — for
   * components server-rendered by another mechanism (e.g. `nuxt-ssr-lit`
   * shadow-DOM builds). Default `[]`.
   */
  exclude?: string[];
  /**
   * Wrap LIGHT `<prefix*>` elements in `<ClientOnly>`. Default `true`. `false`
   * keeps the server import-stub and the shadow `<LitWrapper>` wrap but leaves
   * light tags as they are — see `MonoClientOnlyOptions.lightWrap`.
   */
  lightWrap?: boolean;
  /**
   * Enable the import-driven SSR wrap: `<mono-*>` whose `@mono-lit/helper/ui/shadow/
   * <entry>` build a `.vue` file imports get wrapped in `<LitWrapper>`
   * (Declarative Shadow DOM) instead of `<ClientOnly>`. Default off.
   */
  litWrapper?: boolean;
  /** Component name used for the SSR wrap. Default `'LitWrapper'`. */
  litWrapperComponent?: string;
  /** Tags to ALWAYS treat as shadow (for globally-registered components). */
  shadowOverride?: string[];
}
//#endregion
//#region ../helper/dist/src/components/tooltip/tooltip-types.d.ts
type Side = 'top' | 'right' | 'bottom' | 'left';
type MonoTooltipPlacement = Side | `${Side}-start` | `${Side}-end`;
/** What opens the tooltip. `manual` = only `show()` / `hide()` do. */
type MonoTooltipTrigger = 'hover' | 'focus' | 'click' | 'manual';
/** `inverted` = Basecoat's dark-on-light chip (default); `popover` = the dropdown surface. */
type MonoTooltipVariant = 'inverted' | 'popover';
type MonoTooltipColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
type MonoTooltipSize = 'sm' | 'md' | 'lg';
/**
 * The tooltip body. A function is called with the ANCHOR on every show, so one
 * `controlMonoTooltip('.row-action', …)` can say something different per row.
 * Returning `null` / `''` skips the show.
 */
type MonoTooltipContent = string | Node | ((anchor: Element) => string | Node | null | undefined);
interface MonoTooltipOptions {
  /**
   * The text (or node) to show. When omitted the anchor supplies it:
   * `mono-tooltip-content` → `mono-tooltip-message` → `title` → `aria-label`.
   */
  content?: MonoTooltipContent;
  /** Treat string content as HTML. Default `false` (set as text). */
  allowHTML?: boolean;
  /** Preferred side (+ alignment). Default `'top'`. Flipped when there is no room. */
  placement?: MonoTooltipPlacement;
  /** Gap between the anchor and the tooltip, px. Default `6`. */
  offset?: number;
  /** Viewport padding kept by flip/shift, px. Default `8`. */
  padding?: number;
  /** Flip to the opposite side when the preferred one overflows. Default `true`. */
  flip?: boolean;
  /** Slide along the anchor to stay inside the viewport. Default `true`. */
  shift?: boolean;
  /** Draw the pointer arrow. Default `true`. */
  arrow?: boolean;
  /** What opens it. Default `['hover', 'focus']`. */
  trigger?: MonoTooltipTrigger | MonoTooltipTrigger[];
  /** Open / close delay in ms — one number for both, or `[show, hide]`. Default `[100, 0]`. */
  delay?: number | [number, number];
  /** Keep it open while the pointer is over the tooltip itself (links, buttons inside). Default `false`. */
  interactive?: boolean;
  /** CSS `max-width` of the bubble. Default: `--mono-tooltip-max-width`, else `20rem`. */
  maxWidth?: string;
  variant?: MonoTooltipVariant;
  /** Paint the bubble in a palette colour instead of the variant's surface. */
  color?: MonoTooltipColor;
  size?: MonoTooltipSize;
  /** Extra class(es) on the floating element. */
  class?: string;
  /** Where the floating element is appended. Default `document.body`. */
  appendTo?: Element | (() => Element | null);
  /** Stop opening (an open one closes). Default `false`. */
  disabled?: boolean;
  /** Close a hover/focus tooltip when its anchor is clicked. Default `true`. */
  hideOnClick?: boolean;
  /** Before it opens — return `false` to cancel. */
  onShow?: (anchor: Element, tooltip: HTMLElement) => void | boolean;
  /** Before it closes — return `false` to keep it. */
  onHide?: (anchor: Element, tooltip: HTMLElement) => void | boolean;
}
/**
 * What `createMonoTooltip` / Nuxt's `mono.helper.tooltip` take: every tooltip
 * option (applied app-wide) plus the addon switches below. The Nuxt config
 * additionally has to be JSON — no functions, no nodes.
 */
interface MonoTooltipGlobalOptions extends MonoTooltipOptions {
  /**
   * Turn on the declarative attributes — any element (plain HTML, light or
   * shadow `<mono-*>`) with `mono-tooltip-content="…"` (or `mono-tooltip-message`)
   * gets a tooltip, no `controlMonoTooltip` call needed. Default `true`.
   */
  attributes?: boolean;
}
//#endregion
//#region ../helper/dist/src/composables/mono-skeleton.d.ts
/** phantom-ui's options, camelCase (applied to the wrapper as kebab-case attributes). */
interface MonoPhantomProps {
  /** `shimmer` (default) | `pulse` | `breathe` | `solid`. */
  animation?: 'shimmer' | 'pulse' | 'breathe' | 'solid' | (string & {});
  /** `skeleton` (default, hides the content) | `overlay` (dims it and sweeps). */
  mode?: 'skeleton' | 'overlay' | (string & {});
  shimmerDirection?: 'ltr' | 'rtl' | 'ttb' | 'btt' | (string & {});
  /** Sweep colour. Unset = the mono theme's (`--mono-skeleton-color`). */
  shimmerColor?: string;
  /** Block colour. Unset = the mono theme's (`--mono-skeleton-bg`). */
  backgroundColor?: string;
  /** Animation cycle, seconds (default 1.5). */
  duration?: number;
  /** Delay between blocks, seconds. */
  stagger?: number;
  /** Fade-out when loading ends, seconds. */
  reveal?: number;
  /** Repeat the measured row set N times (table placeholders). */
  count?: number;
  /** Gap between repeated rows, px. */
  countGap?: number;
  /** Radius for flat elements, px (default 4). */
  fallbackRadius?: number;
  /** Screen-reader announcement (default "Loading"). */
  loadingLabel?: string;
  /** Measure inside open shadow roots of slotted components. */
  pierceShadow?: boolean;
  /** Outline the measured blocks. */
  debug?: boolean;
}
/** `createMonoUI({ skeleton: {...} })` — global phantom defaults + the SSR flag. */
interface MonoSkeletonDefaults extends Partial<MonoPhantomProps> {
  /**
   * Whether the app renders on the server. Decides the AUTO default of light elements:
   * `true` → pending on first connect, `false` → never pending unless asked. The Nuxt
   * module sets it from `nuxt.options.ssr`; unset, a Nuxt payload marker is sniffed.
   */
  ssr?: boolean;
  /**
   * Safety net for an automatic pending that never gets its "loaded" signal: released
   * after this many ms (default 15000; `0` disables).
   */
  maxWait?: number;
}
//#endregion
//#region ../helper/dist/src/composables/mono-ui.d.ts
/**
 * Tag → props map for typed configs. `scripts/gen-vue-types.mjs` augments it in
 * the published types (`'mono-button': ButtonProps`, …); it is empty in source.
 */
interface MonoUIComponents {}
type KnownConfig = { [K in keyof MonoUIComponents]?: Partial<MonoUIComponents[K]> };
/**
 * Per-component default props. Keys are tags (`mono-button`); props are camelCase or kebab-case.
 * The reserved `skeleton` key holds the global defaults of the automatic skeleton
 * (`pending`, see ./mono-skeleton.ts) and its `ssr` flag; `false` disables it.
 */
type MonoUIConfig = KnownConfig & {
  skeleton?: MonoSkeletonDefaults | false;
} & {
  [tag: `mono-${string}`]: Record<string, unknown> | undefined;
};
//#endregion
//#region ../helper/dist/src/nuxt/index.d.ts
interface MonoHelperModuleOptions extends MonoSsrOptions {
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
//#endregion
//#region src/nuxt/host-nuxt.d.ts
/**
 * One ecosystem unit: discover folder(s) across every remote (via
 * `mergeEcosystem`) and wire each into one Nuxt API. Carries the full
 * `mergeEcosystem` discovery props (minus `dirname`, always the Nuxt rootDir,
 * and `map`, used internally) plus a `type` destination.
 */
interface EcosystemEntry extends Omit<MergeEcosystemOptions<string>, 'dirname' | 'map'> {
  /**
   * Destination: auto-imports (composables/stores), components, pages ->
   * routes, or one of the shell folders a remote inherits from its host —
   * layouts, middleware, plugins.
   */
  type: EcosystemType;
  /**
   * Type-aware subpath(s) relative to each remote's srcDir — e.g. `'pages'`.
   * Resolved per remote via its `type` (`vue` -> `src/<rel>`, `nuxt` ->
   * `app/<rel>`). Preferred over `dir`; the built-in defaults use it. When set,
   * `dir`/`sub` are ignored (folders come from `monoEcosystem`).
   */
  relDir?: string | string[];
  /** Toggle without removing the entry. Default true. */
  enabled?: boolean;
  /** `components` only — prefix component names with their path. Default true. */
  pathPrefix?: boolean;
  /**
   * `pages` / `layouts` / `middleware` / `plugins` — file globs (relative to
   * each dir) to skip.
   *
   * For `pages` the default is derived from disk rather than hardcoded: an app
   * that ships its own `pages/index.vue` owns `/`, so the federated root
   * `index.vue` is excluded; an app that does not (every remote, which takes the
   * host's login page as `/`) lets it through. Deeper `<folder>/index.vue` pages
   * are always merged in. For the other three the default is no exclusions —
   * the own-file-wins rule already covers replacement.
   */
  exclude?: string[];
}
interface MonoModuleOptions {
  /**
   * Merge remote folders into Nuxt. Name-keyed; each entry carries full
   * `mergeEcosystem` discovery props (`dir`, `sub`, `appDir`, `appDirs`,
   * `includes`/`excludes`, `dirIncludes`/`dirExcludes`) plus a `type`
   * destination. `dirname` is always the Nuxt rootDir. Set an entry to `false`
   * to disable it.
   *
   * The built-in defaults wire pages/composables/stores/components for every
   * role, plus the shell a REMOTE inherits from its host — layouts (unless
   * `template: 'host'`) and, on an explicit `template: 'remote'`, middleware and
   * plugins. See `nuxtEcosystemDefaults`. Your entries merge with them by key,
   * so you can override one (restate its `type`), add new ones, or disable a
   * default with `false`.
   *   ecosystem: {
   *     components: false,                                   // disable a default
   *     widgets: { type: 'components', dir: 'src/widgets' }, // add a new one
   *     middleware: { type: 'middleware', relDir: 'middleware' }, // host opt-in
   *   }
   */
  ecosystem?: Record<string, EcosystemEntry | false>;
  /**
   * Override/extend the auto-computed `monoAlias` map. Each entry's `dir` is
   * resolved against the Nuxt rootDir (absolute paths kept as-is). Example:
   *   alias: { '@mono-host': { dir: 'app' } }
   */
  alias?: Record<string, {
    dir: string;
  }>;
  /** Packages excluded from Vite dep pre-bundling (web-components dedup). Default ['@mono-lit/helper']. */
  optimizeExclude?: string[];
  /**
   * Customize the client-exposed config global `__MONO_CONFIG_EXPOSE__`.
   * Receives the resolved mono config; return the (serialisable) object to
   * expose. Defaults to a trimmed, browser-safe subset
   * (`name`/`apps`/`cookie`/`jwt`/`menu` + `fetching.auth`) — never the full
   * `fetching.api`. Spread `config` to expose everything, or pick your own keys:
   *   expose: (c) => ({ name: c.name, apps: c.apps, theme: c.theme })
   */
  expose?: (config: MonoConfig) => Record<string, unknown>;
  /**
   * Let the config chain load when a federated app isn't synced into
   * `.mono/apps/`: its `mono.config` import resolves to an empty config instead of
   * throwing `Cannot find module '@<app>-root/mono.config'`. Only that specifier is
   * stubbed — app code importing a missing app still fails. Default true.
   */
  stubMissing?: boolean;
  /** Warn (once) naming the apps that were stubbed. Default true. */
  warnMissing?: boolean;
  /**
   * Rewrite `<RouterLink>` -> `<NuxtLink>` in synced remote templates, so a Vue
   * remote's links get Nuxt's prefetching / external-URL handling instead of
   * rendering as plain vue-router links. Default true.
   */
  nuxtLink?: boolean;
  /**
   * Namespaced form. This module reads its options from `mono.utils`; the
   * sibling `@mono-lit/helper/nuxt` module reads `mono.helper`. The flat shape above
   * (`mono.alias`, `mono.ecosystem`, …) is still honored for back-compat.
   *   mono: { utils: { alias: { … } }, helper: { … } }
   */
  utils?: Omit<MonoModuleOptions, 'utils' | 'helper'>;
  /**
   * Options consumed by `@mono-lit/helper/nuxt` (SSR/UI helper module). Typed via a
   * type-only import from `@mono-lit/helper/nuxt` — @mono-lit/helper is a workspace
   * devDependency of @mono-lit/utility (no runtime dependency: the import is erased,
   * and @mono-lit/helper itself doesn't import @mono-lit/utility). So the real shape
   * (`css` / `customElement` / `ssr` / `shadow` / `MonoSsrOptions`) ships in
   * `dist/nuxt.d.ts` and `mono.helper` gets full autocomplete in `nuxt.config.ts`.
   */
  helper?: MonoHelperModuleOptions;
}
declare const monoNuxtModule: NuxtModule<MonoModuleOptions, MonoModuleOptions, false>;
//#endregion
export { type EcosystemEntry, type EcosystemType, type MonoModuleOptions, monoNuxtModule as default };