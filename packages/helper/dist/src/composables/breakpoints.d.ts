/**
 * Shared viewport breakpoints — Tailwind's values, so `auto-fullscreen="lg"` in a
 * mono component and `lg:` in the consumer's utility classes agree on where the
 * boundary is.
 *
 * The library already hard-codes `@media (max-width: 640px)` in `button.css`,
 * `card.css` and `nav.css`; those stay as they are. This module exists because
 * `autoFullscreen` needs the same five tokens in two components plus the matching
 * JS check, and three copies of a magic number is where it stops being fine.
 *
 * `sidebar-utils.ts` keeps its own `SIDEBAR_AUTO_BREAKPOINT = 768` deliberately —
 * re-pointing it here would silently change the sidebar's auto-temporary threshold.
 */
export declare const MONO_BREAKPOINTS: {
    readonly sm: 640;
    readonly md: 768;
    readonly lg: 1024;
    readonly xl: 1280;
    readonly '2xl': 1536;
};
export type MonoBreakpoint = keyof typeof MONO_BREAKPOINTS;
/**
 * `autoFullscreen`'s value: `false` off, `true` = the default `sm`, or a token to
 * move the boundary. "lg" means **lg and below** — i.e. everything Tailwind's `lg:`
 * prefix does NOT match.
 */
export type MonoAutoFullscreen = boolean | MonoBreakpoint;
/**
 * Normalise the prop to the breakpoint it should act at, or `null` when off.
 *
 * An unrecognised token falls back to `sm` rather than switching the feature off:
 * the author clearly asked for auto-fullscreen, and silently ignoring them is the
 * worse failure. Warns once in dev.
 */
export declare function resolveAutoFullscreen(value: MonoAutoFullscreen | string | undefined | null): MonoBreakpoint | null;
/**
 * Lit converter for the `auto-fullscreen` attribute.
 *
 * Modelled on `booleanStringConverter` (composables/hybird-prop.ts), including its
 * non-string guard: nuxt-ssr-lit forwards the raw PROPERTY value into
 * `fromAttribute`, so a real boolean can arrive here instead of a string.
 */
export declare const autoFullscreenConverter: {
    fromAttribute(value: unknown): MonoAutoFullscreen;
    toAttribute(value: MonoAutoFullscreen): string | null;
};
/**
 * Is the viewport currently at or below `bp`?
 *
 * Guard order copied from `sidebar-utils.ts`: `typeof window === 'undefined'` alone
 * is NOT a safe server check, because a DOM shim can define `window` without
 * `matchMedia`. Check lit's `isServer` first, then feature-detect.
 *
 * Deliberately point-in-time with no listener — the only callers are pointer
 * handlers (the modal's header drag, the drawer's resize start), so there is
 * nothing to re-render from and nothing to leak. Every VISUAL decision is made by
 * the `@media` blocks in modal.css / drawer.css, which have no SSR surface at all.
 */
export declare function isBelowBreakpoint(bp: MonoBreakpoint): boolean;
