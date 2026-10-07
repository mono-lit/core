/**
 * Colour parsing and contrast, for props that accept a raw CSS colour.
 *
 * `mono-sidebar`, `mono-nav` and `mono-menu` take a `color` that is either a theme token
 * name or a literal colour (`#7c3aed`, `rgb(124 58 237)`). A token resolves entirely in
 * CSS — the component sets a `-preset` var and the stylesheet reads `--theme-<name>` and
 * the matching `--theme-<name>-contrast`. A literal has no such tokens, so two values
 * have to be derived here instead: the `r, g, b` triple the `--*-rgb` half of the API
 * expects, and the ink that stays readable on it.
 *
 * Everything is a pure function over the prop's own string — no `getComputedStyle`, no
 * DOM — so it runs unchanged during SSR, where the component renders before any
 * stylesheet has been applied.
 *
 * Scope note: `src/components/chart/mono-data-chart.ts` has its own private `toRgb`.
 * It is deliberately left alone — it feeds Chart.js canvas paint, which cannot resolve
 * `var()` and has different needs.
 */
export interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}
/** The two inks the theme uses on a filled surface (`index.css` `--theme-*-contrast`). */
export declare const INK_LIGHT = "#ffffff";
export declare const INK_DARK = "rgba(0, 0, 0, 0.87)";
/**
 * Parse a literal CSS colour to sRGB, or null when it isn't one we can read.
 *
 * Handles `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()/rgba()` and `hsl()/hsla()` in
 * both the legacy comma syntax and the modern space syntax. Returns null for anything
 * else — `var(…)`, `color-mix(…)`, a named keyword — which callers treat as "paint it,
 * but fall back for the derived values", since the browser can still render it.
 */
export declare function parseCssColor(value: string | undefined | null): Rgba | null;
/** WCAG relative luminance. */
export declare function relativeLuminance({ r, g, b }: Rgba): number;
/** WCAG contrast ratio, 1–21. Order of the arguments does not matter. */
export declare function contrastRatio(a: Rgba, b: Rgba): number;
/**
 * The better of the theme's two inks for text sitting ON `value`, or null when the
 * colour can't be parsed (the caller then leaves the ink alone and the CSS default —
 * white, matching every `--theme-*-contrast` but warning's — applies).
 *
 * Compares actual contrast rather than thresholding luminance, so it stays correct for
 * mid-tone colours where a fixed cutoff picks the worse of the two.
 */
export declare function readableInk(value: string | undefined | null): string | null;
/**
 * `"r, g, b"` for the `--*-rgb` half of the colour API, which the stylesheets wrap in
 * `rgba(var(--…-rgb), α)`. Null when unparseable.
 */
export declare function toRgbTriple(value: string | undefined | null): string | null;
/**
 * Does this look like a literal colour rather than a token name?
 *
 * Only used AFTER the component's own token list has been checked, so `teal` and
 * `purple` — which are both theme slots and CSS keywords — always mean the theme slot.
 * Bare CSS keywords are deliberately not recognised here: a typo like `primry` should
 * fall through to the validator's warning instead of being silently painted as nothing.
 */
export declare function isRawColorValue(value: string | undefined | null): boolean;
/**
 * The brand slots `src/data/theme/index.css` defines, in the order they appear there.
 * Every one has a `--theme-<name>`, a `--theme-<name>-rgb` and a `--theme-<name>-contrast`,
 * so a component only has to name the slot for the whole treatment to follow the active
 * colour preset. `surface` is not here — it is each component's "not painted" state, not
 * a palette entry.
 */
export declare const THEME_COLOR_TOKENS: readonly ["primary", "secondary", "success", "danger", "warning", "info", "teal", "purple", "neutral", "dark"];
export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number];
/** The class token emitted for a `color` that is a literal rather than a slot name. */
export declare const CUSTOM_COLOR_CLASS = "custom";
export declare function isThemeColorToken(value: string | undefined | null): boolean;
/**
 * The class token for a `color` value.
 *
 * A literal MUST NOT reach the class list: the class string is built with `join(' ')`,
 * so `rgb(255, 0, 0)` would split into three garbage tokens (`rgb(255,`, `0,`, `0)`),
 * and `var(--brand)` likewise. Named slots — including `surface` — pass through; every
 * literal collapses to one marker class that the stylesheet keys the painted treatment
 * off, with the actual colour arriving inline (see `customColorStyle`).
 */
export declare function colorClassToken(value: string | undefined | null): string;
/**
 * The inline declarations that carry a literal colour, e.g.
 * `customColorStyle('#7c3aed', 'sidebar')`.
 *
 * Written on the component's ROOT element (the one whose stylesheet block declares the
 * resolvers) — an inline declaration beats the class-based `.mono-<c>.<token>` presets,
 * whereas the same property set on the host would only *inherit* and would lose to them.
 *
 * The rgb triple and the ink are emitted only when the value parses. An unparseable but
 * renderable value (`var(--brand)`, `color-mix(…)`) still paints: it just keeps the CSS
 * default ink, and `--mono-<c>-on-accent` stays available to set it by hand.
 */
export declare function customColorStyle(value: string | undefined | null, component: string): string;
/**
 * Shared validator arm for a `color` prop: a named slot, `surface`, or something that
 * reads as a CSS colour. Returns an error string, or null when the value is fine.
 */
export declare function validateColorProp(value: unknown): string | null;
