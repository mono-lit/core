import { LitElement } from 'lit';
type Constructor<T = object> = new (...args: any[]) => T;
export interface ToShadowCssOptions {
    /**
     * Element-selector tag to rewrite to `:host` (e.g. `'mono-nav'`). Handles
     * `tag { … }`, `tag[attr] { … }` and `tag,` — but NOT `.tag` or `tag-suffix`.
     */
    host?: string;
    /**
     * Prepend `:host { display: <value> }`. Use when the component has no element
     * selector to rewrite (its state classes live on an inner root) but the host
     * still needs a display value (e.g. dropdown → `'inline-block'`).
     */
    hostDisplay?: string;
    /** Shadow-only CSS appended verbatim (e.g. `[data-empty] { display: none }`). */
    append?: string;
}
export declare function toShadowCss(css: string, opts?: ToShadowCssOptions): string;
/**
 * Adopt the page's icon utility CSS into `root` so `i-…` / `.mono-icon` glyphs
 * render inside the shadow tree. Idempotent and SSR-safe (no-op on the server).
 * Call from `firstUpdated` AND `updated` — early calls adopt the (live) shared
 * sheet; later calls / the scheduled refresh repopulate it once UnoCSS loads.
 */
export declare function adoptIconStyles(root: ShadowRoot | null | undefined): void;
/**
 * Adopt the page's utility CSS into `root` so consumer `cssClass` utilities
 * (UnoCSS etc.) render inside the shadow tree. Idempotent and SSR-safe (no-op on
 * the server). Call from `firstUpdated` AND `updated` — early calls adopt the
 * (live) shared sheet; the scheduled refresh repopulates it as UnoCSS loads.
 */
export declare function adoptUtilityStyles(root: ShadowRoot | null | undefined): void;
/**
 * Mixin for `*.shadow.ts` builds: adopts the page's utility CSS into the shadow
 * root so consumer `cssClass` utilities (UnoCSS etc.) paint inside the tree.
 * Uses a reactive controller (its `hostUpdated` runs after EVERY render), so it
 * works regardless of whether a subclass overrides `updated`/`firstUpdated`.
 * Client-only — skipped entirely on the server (SSR renders unstyled, utilities
 * snap in on hydration). Apply as `extends withShadowUtilityStyles(XCore(LitElement))`.
 */
export declare function withShadowUtilityStyles<T extends Constructor<LitElement>>(superClass: T): T;
export {};
