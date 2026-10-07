/**
 * Nav (top app bar) Component Type Definitions
 */
export type NavDensity = 'compact' | 'comfortable' | 'default';
/**
 * A theme palette slot, `surface` for the unpainted default, or any CSS color —
 * `#7c3aed`, `rgb(124 58 237)`, `hsl(258 90% 66%)`.
 *
 * A slot name follows the active `.theme-color-*` preset automatically; a literal is
 * carried inline and its ink is derived from its own luminance. Note `teal` and
 * `purple` are CSS keywords too — the slot list is matched first, so they always mean
 * the theme colour.
 *
 * The `(string & {})` arm keeps the slot names in editor autocomplete.
 */
export type NavColorToken = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark' | 'surface';
export type NavColor = NavColorToken | (string & {}) | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark' | 'surface';
export type NavVariant = 'flat' | 'elevated' | 'outlined';
export interface NavCssClass {
    root?: string;
    inner?: string;
    start?: string;
    center?: string;
    end?: string;
    extension?: string;
}
export interface NavProps {
    /** Sticks the bar to the top of the viewport on scroll. */
    sticky?: boolean;
    /** Vertical spacing density of the bar. */
    density?: NavDensity;
    /** Theme color of the bar background. */
    color?: NavColor;
    /** Visual style of the bar (flat, elevated, or outlined). */
    variant?: NavVariant;
    /** Renders an additional extension row below the bar. */
    extension?: boolean;
    /** Per-part class overrides for internal elements. */
    cssClass?: NavCssClass;
    cssclass?: NavCssClass;
    'css-class'?: NavCssClass | string;
}
/**
 * Nav emits no events of its own — slotted buttons drive behavior.
 * Type kept for symmetry with other components but intentionally empty.
 */
export interface NavEvents {
}
