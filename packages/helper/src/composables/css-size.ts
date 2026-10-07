import type { StyleInfo } from 'lit/directives/style-map.js'

/** A sizing prop value: a CSS length string, or a number (interpreted as px). */
export type CssSizeValue = string | number | undefined

/**
 * Normalize a sizing prop to a CSS length string.
 * - `number` (or numeric string) → `${n}px`
 * - any other non-empty string → passed through verbatim (`"12rem"`, `"80%"`, …)
 * - `null` / `undefined` / `''` → `undefined` (treated as "not set")
 */
export function toCssSize(value: CssSizeValue): string | undefined {
  if (value === null || value === undefined) return undefined

  if (typeof value === 'number') {
    return Number.isFinite(value) ? `${value}px` : undefined
  }

  const trimmed = String(value).trim()
  if (trimmed === '') return undefined

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`

  return trimmed
}

/** The six sizing props shared by sizing-driven components. */
export interface SizeProps {
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
}

/**
 * The popup-PANEL sizing object shared by `mono-select`, `mono-tag-input` and
 * `mono-dropdown-table`, bound as `:dropdown.prop="{ … }"`.
 *
 * The same six keys as {@link SizeProps}, applied to the panel rather than the field:
 * `height` is an exact height and `maxHeight` the cap, on all three.
 *
 * Aliased rather than re-declared per component so the key set cannot drift between them —
 * each still exports its own name (`SelectDropdownOptions`, `TagInputDropdownOptions`,
 * `DropdownPanelOptions`) for the consumers who already import one.
 *
 * There is deliberately no shared style BUILDER to go with it: the three write these keys onto
 * different elements with different fallbacks, and a helper parameterised over all of that would
 * bury the one part that is genuinely subtle — which cap goes to a custom property, and why.
 */
export type PanelSizeProps = SizeProps

/**
 * Build a Lit `styleMap` object from the six sizing props, normalizing each via
 * `toCssSize` and omitting the ones that aren't set.
 */
export function buildSizeStyle(src: SizeProps): StyleInfo {
  const style: StyleInfo = {}

  const width = toCssSize(src.width)
  const height = toCssSize(src.height)
  const minWidth = toCssSize(src.minWidth)
  const maxWidth = toCssSize(src.maxWidth)
  const minHeight = toCssSize(src.minHeight)
  const maxHeight = toCssSize(src.maxHeight)

  if (width) style.width = width
  if (height) style.height = height
  if (minWidth) style['min-width'] = minWidth
  if (maxWidth) style['max-width'] = maxWidth
  if (minHeight) style['min-height'] = minHeight
  if (maxHeight) style['max-height'] = maxHeight

  return style
}
