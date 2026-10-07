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
  r: number
  g: number
  b: number
  a: number
}

/** The two inks the theme uses on a filled surface (`index.css` `--theme-*-contrast`). */
export const INK_LIGHT = '#ffffff'
export const INK_DARK = 'rgba(0, 0, 0, 0.87)'

const HEX = /^#([0-9a-f]{3,8})$/i
const FN = /^(rgba?|hsla?)\(\s*([^)]+?)\s*\)$/i

/** Split `rgb(1 2 3 / 0.5)` and `rgb(1, 2, 3, 0.5)` alike. */
function args(body: string): string[] {
  return body
    .replace(/\//g, ' ')
    .split(/[\s,]+/)
    .filter(Boolean)
}

/** `50%` → 0.5, `0.5` → 0.5. Alpha is given either way. */
function alpha(token: string | undefined): number {
  if (token === undefined) return 1
  const n = token.endsWith('%') ? Number.parseFloat(token) / 100 : Number.parseFloat(token)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1
}

/** A channel is `0-255` or a percentage of it. */
function channel(token: string): number {
  const n = token.endsWith('%')
    ? (Number.parseFloat(token) / 100) * 255
    : Number.parseFloat(token)
  return Number.isFinite(n) ? Math.min(255, Math.max(0, n)) : Number.NaN
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r, g, b] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x]
  const m = l - c / 2
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/**
 * Parse a literal CSS colour to sRGB, or null when it isn't one we can read.
 *
 * Handles `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()/rgba()` and `hsl()/hsla()` in
 * both the legacy comma syntax and the modern space syntax. Returns null for anything
 * else — `var(…)`, `color-mix(…)`, a named keyword — which callers treat as "paint it,
 * but fall back for the derived values", since the browser can still render it.
 */
export function parseCssColor(value: string | undefined | null): Rgba | null {
  if (!value) return null
  const input = value.trim()

  const hex = HEX.exec(input)
  if (hex) {
    const h = hex[1]
    const expand = (s: string) => Number.parseInt(s.length === 1 ? s + s : s, 16)
    if (h.length === 3 || h.length === 4) {
      return {
        r: expand(h[0]),
        g: expand(h[1]),
        b: expand(h[2]),
        a: h.length === 4 ? expand(h[3]) / 255 : 1,
      }
    }
    if (h.length === 6 || h.length === 8) {
      return {
        r: Number.parseInt(h.slice(0, 2), 16),
        g: Number.parseInt(h.slice(2, 4), 16),
        b: Number.parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1,
      }
    }
    return null // 5 or 7 digits is not a colour
  }

  const fn = FN.exec(input)
  if (!fn) return null
  const parts = args(fn[2])
  if (parts.length < 3) return null

  if (fn[1].toLowerCase().startsWith('hsl')) {
    const h = Number.parseFloat(parts[0])
    const s = Number.parseFloat(parts[1]) / 100
    const l = Number.parseFloat(parts[2]) / 100
    if (![h, s, l].every(Number.isFinite)) return null
    const [r, g, b] = hslToRgb(h, Math.min(1, Math.max(0, s)), Math.min(1, Math.max(0, l)))
    return { r, g, b, a: alpha(parts[3]) }
  }

  const [r, g, b] = [channel(parts[0]), channel(parts[1]), channel(parts[2])]
  if (![r, g, b].every(Number.isFinite)) return null
  return { r, g, b, a: alpha(parts[3]) }
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgba): number {
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG contrast ratio, 1–21. Order of the arguments does not matter. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The better of the theme's two inks for text sitting ON `value`, or null when the
 * colour can't be parsed (the caller then leaves the ink alone and the CSS default —
 * white, matching every `--theme-*-contrast` but warning's — applies).
 *
 * Compares actual contrast rather than thresholding luminance, so it stays correct for
 * mid-tone colours where a fixed cutoff picks the worse of the two.
 */
export function readableInk(value: string | undefined | null): string | null {
  const bg = parseCssColor(value)
  if (!bg) return null
  const onWhite = contrastRatio(bg, { r: 255, g: 255, b: 255, a: 1 })
  // INK_DARK is 87% black over the background, which is what actually gets painted.
  const darkOver = {
    r: bg.r * 0.13,
    g: bg.g * 0.13,
    b: bg.b * 0.13,
    a: 1,
  }
  return onWhite >= contrastRatio(bg, darkOver) ? INK_LIGHT : INK_DARK
}

/**
 * `"r, g, b"` for the `--*-rgb` half of the colour API, which the stylesheets wrap in
 * `rgba(var(--…-rgb), α)`. Null when unparseable.
 */
export function toRgbTriple(value: string | undefined | null): string | null {
  const c = parseCssColor(value)
  if (!c) return null
  return `${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}`
}

/**
 * Does this look like a literal colour rather than a token name?
 *
 * Only used AFTER the component's own token list has been checked, so `teal` and
 * `purple` — which are both theme slots and CSS keywords — always mean the theme slot.
 * Bare CSS keywords are deliberately not recognised here: a typo like `primry` should
 * fall through to the validator's warning instead of being silently painted as nothing.
 */
export function isRawColorValue(value: string | undefined | null): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith('#') || /^(rgba?|hsla?|color|color-mix|var|light-dark)\(/i.test(v)
}

/**
 * The brand slots `src/data/theme/index.css` defines, in the order they appear there.
 * Every one has a `--theme-<name>`, a `--theme-<name>-rgb` and a `--theme-<name>-contrast`,
 * so a component only has to name the slot for the whole treatment to follow the active
 * colour preset. `surface` is not here — it is each component's "not painted" state, not
 * a palette entry.
 */
export const THEME_COLOR_TOKENS = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'teal',
  'purple',
  'neutral',
  'dark',
] as const

export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number]

/** The class token emitted for a `color` that is a literal rather than a slot name. */
export const CUSTOM_COLOR_CLASS = 'custom'

export function isThemeColorToken(value: string | undefined | null): boolean {
  return !!value && (THEME_COLOR_TOKENS as readonly string[]).includes(value)
}

/**
 * The class token for a `color` value.
 *
 * A literal MUST NOT reach the class list: the class string is built with `join(' ')`,
 * so `rgb(255, 0, 0)` would split into three garbage tokens (`rgb(255,`, `0,`, `0)`),
 * and `var(--brand)` likewise. Named slots — including `surface` — pass through; every
 * literal collapses to one marker class that the stylesheet keys the painted treatment
 * off, with the actual colour arriving inline (see `customColorStyle`).
 */
export function colorClassToken(value: string | undefined | null): string {
  if (!value) return ''
  if (isThemeColorToken(value) || value === 'surface') return value
  return CUSTOM_COLOR_CLASS
}

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
export function customColorStyle(value: string | undefined | null, component: string): string {
  if (!value) return ''
  const out = [`--_mono-${component}-accent-preset:${value};`]
  const triple = toRgbTriple(value)
  if (triple) out.push(`--_mono-${component}-accent-rgb-preset:${triple};`)
  const ink = readableInk(value)
  if (ink) out.push(`--_mono-${component}-on-accent-preset:${ink};`)
  return out.join('')
}

/**
 * Shared validator arm for a `color` prop: a named slot, `surface`, or something that
 * reads as a CSS colour. Returns an error string, or null when the value is fine.
 */
export function validateColorProp(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return `Invalid color: ${String(value)}`
  if (isThemeColorToken(value) || value === 'surface' || isRawColorValue(value)) return null
  return `Invalid color: ${value} — expected one of ${THEME_COLOR_TOKENS.join(', ')}, surface, or a CSS color`
}
