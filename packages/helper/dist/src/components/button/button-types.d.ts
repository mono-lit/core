import { DebounceConfig, RateLimitOption, RateLimitPhase, ThrottleConfig } from '../../composables/rate-limit';
export type { DebounceConfig, RateLimitPhase, ThrottleConfig };
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark' | 'light';
/**
 * `solid` fills with the colour, `outline` borders in it, `tonal` lays a
 * translucent tint under coloured text, `text` is bare at rest. Each maps onto
 * a Basecoat `.btn[data-variant]` (primary / outline / destructive / ghost).
 * The old `gradient` variant is gone — Basecoat paints flat token colours.
 */
export type ButtonVariant = 'solid' | 'outline' | 'tonal' | 'text';
/**
 * Corner radius steps.
 *
 * A FIXED radius per step, not one scaled by the button's size: naming a step is
 * an instruction, so `rounded="md"` is the same corner on an `xs` button as on an
 * `xxl` one. Leave it unset to keep the per-size radius the theme defines.
 *
 * `none` is a real `0` that beats that per-size radius — the one thing the old
 * `shape="square"` could never do, since it emitted a class with no rule behind
 * it. `full` is a pill on a wide button and a circle on a square one, which is
 * what replaced the old `circle` / `round` / `fab` trio.
 */
export type ButtonRounded = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
export type ButtonIconPosition = 'left' | 'right';
export type ButtonBadgeColor = 'red' | 'green' | 'orange' | 'cobalt';
/**
 * Per-element class overrides. Each key maps to one of the rendered internal
 * elements; the supplied class string is appended to the element's base class.
 */
export interface ButtonCssClass {
    root?: string;
    /** The leading affix zone (`slot="prepend"`). */
    prepend?: string;
    main?: string;
    content?: string;
    text?: string;
    icon?: string;
    badge?: string;
    /** The trailing affix zone (`slot="append"`). */
    append?: string;
}
/**
 * Configuration for one affix zone — the `slot="prepend"` / `slot="append"`
 * regions that sit BESIDE the button rather than inside it.
 *
 * They are siblings of the native control on purpose. A `<button>` may not
 * contain interactive content: the HTML parser closes an open `<button>` at a
 * nested one (so DSD/SSR and `innerHTML` would silently restructure), clicks from
 * inside bubble into the button's own handler, and `disabled` plus
 * `pointer-events: none` would kill the affix exactly when the button is busy.
 * Sitting outside is what lets an affix hold a real control and be clicked
 * without firing the button.
 *
 * Bind as a property (`:append.prop="{ divider: true }"`); a JSON attribute
 * (`append='{"divider":true}'`) also works for static HTML.
 */
export interface ButtonAffixProps {
    /**
     * Draw a divider between this affix and the button body. Per side, so a
     * leading icon can sit flush while a trailing caret is fenced off.
     */
    divider?: boolean;
    /**
     * Disable just this affix. Defaults to the button's own `disabled`.
     *
     * Deliberately NOT tied to `loading`: a busy main action with a still-live
     * trailing menu is the useful case, and it is the one thing slotted content
     * cannot express for itself.
     */
    disabled?: boolean;
}
export interface ButtonProps {
    /** Visual size of the button. */
    size?: ButtonSize;
    /** Color theme of the button. */
    color?: ButtonColor;
    /**
     * Visual style variant (solid, outline, tonal, text).
     *
     * `text` has no background and no border at rest — just the coloured label —
     * and takes the tonal look on hover or keyboard focus.
     */
    variant?: ButtonVariant;
    /**
     * Corner radius — `none`, the `xs`…`xxl` scale, or `full`. Unset follows the
     * theme's per-size radius.
     */
    rounded?: ButtonRounded;
    /** Disables interaction and dims the button. */
    disabled?: boolean;
    /** Shows a loading state and blocks clicks. */
    loading?: boolean;
    /**
     * Explicit sizing. Each accepts a CSS length string (`"220px"`, `"80%"`) or a
     * number (interpreted as px). Use `width="100%"` for a full-width button.
     */
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    'min-width'?: string | number;
    maxWidth?: string | number;
    'max-width'?: string | number;
    minHeight?: string | number;
    'min-height'?: string | number;
    maxHeight?: string | number;
    'max-height'?: string | number;
    /** Renders the button as an anchor with this URL. */
    href?: string;
    /** Anchor target window when href is set. */
    target?: string;
    /** Native button type attribute. */
    type?: 'button' | 'submit' | 'reset';
    /** Placement of the icon relative to the text. */
    iconPosition?: ButtonIconPosition;
    'icon-position'?: ButtonIconPosition;
    iconposition?: ButtonIconPosition;
    /**
     * Config for the leading affix (`<span slot="prepend">`). The slot supplies the
     * content; this only says how the zone behaves. Bind with `.prop`.
     *
     * NOTE: this name deliberately SHADOWS `ParentNode.prepend()` on the element.
     * `monoButtonEl.prepend(node)` therefore stops being callable — reading it
     * returns this config object instead of the DOM method. Nothing inside the
     * library calls it (slot placement uses `appendChild`), but consumer code and
     * third-party helpers that do will break on a `<mono-button>`.
     */
    prepend?: ButtonAffixProps | string;
    /**
     * Config for the trailing affix (`<span slot="append">`). Bind with `.prop`.
     * Shadows `ParentNode.append()` — see the note on `prepend`.
     */
    append?: ButtonAffixProps | string;
    /** Badge text shown on the button. */
    badge?: string;
    /** Color of the badge. */
    badgeColor?: ButtonBadgeColor;
    'badge-color'?: ButtonBadgeColor;
    badgecolor?: ButtonBadgeColor;
    /** Renders an icon-only button without text. */
    iconOnly?: boolean;
    'icon-only'?: boolean;
    icononly?: boolean;
    /** Applies a translucent glass effect. */
    glass?: boolean;
    /** Tooltip text shown on hover. */
    tooltip?: string;
    /** Accessible label text for screen readers. */
    ariaLabelText?: string;
    'aria-label-text'?: string;
    arialabeltext?: string;
    /** Per-element class overrides. */
    cssClass?: ButtonCssClass;
    'css-class'?: ButtonCssClass;
    /**
     * Rate-limit clicks: at most `limit` executions per `interval` ms, the rest
     * queued and replayed rather than dropped. A bare number is the interval.
     * Emits `throttle` per execution.
     */
    throttle?: RateLimitOption<ThrottleConfig>;
    /**
     * Collapse a burst of clicks into one execution, `wait` ms after the last.
     * A bare number is the wait. Emits `debounce` per execution.
     */
    debounce?: RateLimitOption<DebounceConfig>;
    /**
     * The work a click performs. Bind as a property (`:handler.prop="save"`) —
     * it's what gets throttled/debounced, and its promise drives the spinner.
     */
    handler?: ButtonHandler;
    /** Opt out of the self-driven spinner; `loading` stays fully consumer-controlled. */
    noAutoLoading?: boolean;
    'no-auto-loading'?: boolean;
    noautoloading?: boolean;
}
/** A click's work. Its promise defines how long the button shows as loading. */
export type ButtonHandler = (event: MouseEvent) => unknown | Promise<unknown>;
export interface ButtonClickEventDetail {
    originalEvent: MouseEvent;
    /** The handler's resolved value; `undefined` on `click` (it fires first). */
    result?: unknown;
    /**
     * Extend the button's loading window over your own async work — the
     * listener-side equivalent of binding `handler`:
     *
     *   `@click="e => e.detail.waitUntil(save())"`
     */
    waitUntil(promise: Promise<unknown>): void;
}
/** Detail of `throttle` / `debounce`. Same shape, `result` populated. */
export type ButtonRateLimitEventDetail = ButtonClickEventDetail;
export interface ButtonLoadingChangeEventDetail {
    /** Whether the button is currently self-driving a loading state. */
    loading: boolean;
    /** `pending` = waiting out the debounce/throttle, `running` = work in flight. */
    phase: RateLimitPhase;
}
export type ButtonClickEvent = CustomEvent<ButtonClickEventDetail>;
export type ButtonRateLimitEvent = CustomEvent<ButtonRateLimitEventDetail>;
export type ButtonLoadingChangeEvent = CustomEvent<ButtonLoadingChangeEventDetail>;
export interface ButtonEvents {
    click: ButtonClickEvent;
    throttle: ButtonRateLimitEvent;
    debounce: ButtonRateLimitEvent;
    'loading-change': ButtonLoadingChangeEvent;
    loadingChange: ButtonLoadingChangeEvent;
    'mno-click': ButtonClickEvent;
    mnoClick: ButtonClickEvent;
    'mno-throttle': ButtonRateLimitEvent;
    mnoThrottle: ButtonRateLimitEvent;
    'mno-debounce': ButtonRateLimitEvent;
    mnoDebounce: ButtonRateLimitEvent;
    'mno-loading-change': ButtonLoadingChangeEvent;
    mnoLoadingChange: ButtonLoadingChangeEvent;
}
export interface IconProps {
    size?: number;
    class?: string;
}
