import { MonoBreakpoint } from '../../composables/breakpoints';
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
/**
 * Content scale of the drawer — title font, body font, padding and the close icon.
 * The same 6-step scale accordion, modal and the form controls use.
 *
 * It does **not** set the panel's width or height. Use the `width` / `height` props
 * (or `--mono-drawer-width` / `--mono-drawer-height`) for that, so a compact
 * `size="sm"` drawer can still be wide. Before 2026-08-17 `size` was a dimension
 * preset; the old `size="full"` is now `width="100%"` for a left/right drawer or
 * `height="100%"` for a top/bottom one.
 */
export type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
/**
 * Named dimension presets accepted by `width` and `height`.
 *
 * The same six tokens as {@link DrawerSize}, on a different axis — `size` scales the
 * CONTENT, these name a MEASURE. Widths (left/right) are `220px` … `900px` and
 * heights (top/bottom) `22vh` … `95vh`; `md` reproduces the drawer's stylesheet
 * defaults, `420px` and `50vh`.
 */
export type DrawerDimensionPreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
/**
 * A dimension-prop value: a {@link DrawerDimensionPreset} token, any CSS length
 * string, or a number / numeric string read as px.
 *
 * The `string & {}` arm keeps the token list in editor autocomplete without
 * narrowing the type — `"32rem"` is still perfectly valid.
 */
export type DrawerDimension = DrawerDimensionPreset | (string & {}) | number;
export type DrawerColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export type DrawerSource = 'overlay' | 'close' | 'escape' | 'manual';
export interface DrawerCssClass {
    root?: string;
    overlay?: string;
    panel?: string;
    head?: string;
    /** The heading column inside the head (title + subtitle, or `slot="header"`). */
    heading?: string;
    title?: string;
    subtitle?: string;
    close?: string;
    body?: string;
    foot?: string;
    resizer?: string;
}
export type DrawerClickEventDetail = {
    modelValue: boolean;
    currentValue: boolean;
    oldValue: boolean;
    value: boolean;
    source: DrawerSource;
    sourceEvent?: Event;
};
export type DrawerClickEvent = CustomEvent<DrawerClickEventDetail>;
/** Emitted on the false → true transition only. */
export type DrawerOpenEventDetail = DrawerClickEventDetail;
export type DrawerOpenEvent = CustomEvent<DrawerOpenEventDetail>;
/** Emitted on the true → false transition only. */
export type DrawerCloseEventDetail = DrawerClickEventDetail;
export type DrawerCloseEvent = CustomEvent<DrawerCloseEventDetail>;
export interface DrawerProps {
    /** Two-way bound open state of the drawer. */
    modelValue?: boolean;
    'model-value'?: boolean;
    modelvalue?: boolean;
    /** Edge the drawer slides in from. */
    position?: DrawerPosition;
    /** Sizing scale of the drawer panel. */
    size?: DrawerSize;
    /** Color theme applied to the drawer. */
    color?: DrawerColor;
    /** Heading text shown in the drawer header. `slot="title"` replaces it. */
    title?: string;
    /**
     * Secondary line under the title — muted and smaller, hidden when empty.
     * `slot="subtitle"` replaces it; `slot="header"` replaces title + subtitle
     * together (the close ✕ stays).
     */
    subtitle?: string;
    /** Shows a close button and allows dismissal. */
    dismissible?: boolean;
    /** Prevents closing via overlay click or escape. */
    persistent?: boolean;
    /** Renders a backdrop overlay behind the panel. */
    overlay?: boolean;
    /** Closes the drawer when the Escape key is pressed. */
    closeOnEscape?: boolean;
    'close-on-escape'?: boolean;
    closeonescape?: boolean;
    /** Closes the drawer on a click outside the panel: the overlay, or — with `overlay: false` — the page itself (the click still reaches the page). */
    closeOnOverlay?: boolean;
    'close-on-overlay'?: boolean;
    closeonoverlay?: boolean;
    /**
     * Locks page scroll while the drawer is open (default `true`). The lock is shared
     * across overlapping overlays, so it lifts only when the last one closes.
     */
    lockScroll?: boolean;
    'lock-scroll'?: boolean;
    lockscroll?: boolean;
    /**
     * Fill the screen at a breakpoint and below (default `false`). `auto-fullscreen`
     * on its own means Tailwind's `sm` (< 640px); a token moves the boundary, so
     * `auto-fullscreen="lg"` covers everything `lg:` does not match (< 1024px).
     */
    autoFullscreen?: boolean | MonoBreakpoint;
    'auto-fullscreen'?: boolean | MonoBreakpoint;
    autofullscreen?: boolean | MonoBreakpoint;
    /** Allow resizing the drawer by dragging a handle on the panel's inner edge. */
    resizeable?: boolean;
    /**
     * Allow this drawer to stack on top of others. When false (default) it is
     * exclusive — opening it closes any other open drawers.
     */
    stackable?: boolean;
    /**
     * Panel dimensions. Each accepts a preset token (`"xs"`…`"xxl"` — see
     * {@link DrawerDimensionPreset}), a CSS length string (`"12rem"`, `"80%"`,
     * `"100vw"`), or a number / numeric string (interpreted as px).
     *
     * `width` applies to left/right drawers, `height` to top/bottom ones — the other
     * axis is pinned to the viewport edge by `position`. `width="100%"` (or
     * `height="100%"`) replaces the old `size="full"`.
     */
    width?: DrawerDimension;
    height?: DrawerDimension;
    /**
     * Pin the drawer to an explicit stacking level. Unset (the default) lets the
     * shared popup stack assign one so the newest layer is always on top. The value
     * is the overlay's `z-index`; the panel sits one above it.
     */
    zIndex?: number | string;
    'z-index'?: number | string;
    zindex?: number | string;
    /** Per-element class overrides for internal parts. */
    cssClass?: DrawerCssClass;
    cssclass?: DrawerCssClass;
    'css-class'?: DrawerCssClass | string;
    /** Extra class name applied to the drawer root. */
    cssClassName?: string;
}
export interface DrawerEvents {
    toggle: DrawerClickEvent;
    open: DrawerOpenEvent;
    close: DrawerCloseEvent;
    'mno-click': DrawerClickEvent;
    mnoClick: DrawerClickEvent;
    'mno-open': DrawerOpenEvent;
    mnoOpen: DrawerOpenEvent;
    'mno-close': DrawerCloseEvent;
    mnoClose: DrawerCloseEvent;
}
