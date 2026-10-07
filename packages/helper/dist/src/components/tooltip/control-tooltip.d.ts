import { MonoTooltipController, MonoTooltipOptions, MonoTooltipTarget } from './tooltip-types';
/**
 * A REAL document. `typeof document` is not enough on the server: Lit's SSR DOM shim (loaded by
 * VitePress / Nuxt SSR through @mono-lit/helper's server entries) defines a global `document` stub with no
 * `addEventListener`, so a `typeof` guard passed and `createMonoTooltip()` in an app's setup threw
 * "document.addEventListener is not a function" during server render.
 */
export declare function hasLiveDocument(): boolean;
/** Prefix of the declarative anchor attributes (`mono-tooltip-content`, …). */
export declare const ANCHOR_ATTR_PREFIX = "mono-tooltip-";
/**
 * Attach a tooltip to every element `target` names — now or later.
 *
 * ```ts
 * // <script setup> — the elements need not exist yet
 * const tip = controlMonoTooltip('.save-btn', { content: 'Save changes', placement: 'bottom' })
 * onBeforeUnmount(() => tip.destroy())
 * ```
 *
 * `target` is a CSS selector, an element, a list of elements, or a Vue ref /
 * getter of any of those. Light `<mono-*>` elements, shadow `<mono-shadow-*>`
 * hosts and elements inside open shadow roots all match.
 *
 * Needs the optional peers `@floating-ui/dom` + `@floating-ui/core`, loaded on
 * the first show. Options set with `createMonoTooltip` override these.
 */
export declare function controlMonoTooltip(target: MonoTooltipTarget, options?: MonoTooltipOptions): MonoTooltipController;
/**
 * @internal — a controller with a per-anchor options layer. Used by the
 * declarative `mono-tooltip-*` attributes (`tooltip-declarative.ts`).
 */
export declare function createTooltipController(target: MonoTooltipTarget, options: MonoTooltipOptions, anchorOptions: (anchor: Element) => MonoTooltipOptions): MonoTooltipController;
/** Alias, matching the `monoX` / `controlMonoX` pairs of the other controllers. */
export declare const monoTooltip: typeof controlMonoTooltip;
/** @internal — close and forget every live controller. Public as `destroyAllMonoTooltips`. */
export declare function destroyAllTooltipControllers(): void;
