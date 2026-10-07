import { SidebarMode, SidebarProps } from './sidebar-types.js';
export declare const SIDEBAR_AUTO_BREAKPOINT = 768;
/**
 * `typeof window === 'undefined'` alone is NOT a safe server guard: a DOM shim
 * can define `window` without `matchMedia` (the @lit-labs/ssr v3 shim happens
 * to leave `window` undefined, but that is an implementation detail). Check
 * lit's `isServer` first, then feature-detect `matchMedia`.
 */
export declare function isAutoTemporary(): boolean;
/**
 * Resolves the effective mode for `auto`. Other modes pass through.
 */
export declare function resolveMode(mode: SidebarMode): Exclude<SidebarMode, 'auto'>;
export declare function generateSidebarRootClasses(props: {
    mode: SidebarMode;
    resolvedMode: Exclude<SidebarMode, 'auto'>;
    location: string;
    density: string;
    color: string;
    variant: string;
    open: boolean;
    expandOnHover: boolean;
    contained: boolean;
    persistent: boolean;
    showScrim: boolean;
    cssClassName?: string;
    rootExtra?: string;
}): string;
export declare function validateSidebarProps(props: SidebarProps): string[];
/**
 * The Basecoat styling attributes for the sidebar ROOT, mirroring the props one
 * for one. A prop at its DEFAULT emits nothing — `:not([mono-density])` is
 * comfortable, `:not([mono-color])` is surface, `:not([mono-variant])` is
 * elevated and `:not([mono-location])` is left — so the rendered DOM is also
 * the shortest hand-written markup that paints the same (see sidebar.css).
 *
 * `mono-effective` is always written: it carries the mode AFTER `auto`
 * resolves, and it is what every layout rule keys on. A literal `color`
 * collapses to `custom`, with the colour itself arriving inline.
 */
export declare function sidebarRootAttrs(props: {
    mode: string;
    resolvedMode: string;
    location: string;
    density: string;
    color: string;
    variant: string;
}): {
    mode: string | null;
    effective: string;
    location: string | null;
    density: string | null;
    color: string | null;
    variant: string | null;
};
