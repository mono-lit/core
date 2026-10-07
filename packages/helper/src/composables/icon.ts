// icon.ts — shared iconify helpers.

import { html, type TemplateResult } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

import { mdiGlyphBody } from './mdi-glyphs.js'

/**
 * Detect whether an icon string is an iconify utility class — e.g.
 * `i-mdi-close`, `i-tabler-upload`. UnoCSS's preset-icons resolves these to a
 * background/mask, so components render them as an empty `<span class="i-...">`.
 *
 * Single source of truth — components re-export this from their own
 * `*-utils.ts` so their public API stays stable.
 */
export function isIconifyClass(icon: string | undefined | null): boolean {
  if (!icon || typeof icon !== 'string') return false
  return /^i-[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(icon.trim())
}

/**
 * Draw an `i-mdi-*` glyph as inline SVG — the SHADOW builds' counterpart to the
 * light builds' UnoCSS mask. Both come from `@iconify-json/mdi`, so one `icon`
 * value paints the same artwork in either build. Returns `undefined` when the
 * glyph is not bundled (see `scripts/mdi-glyphs.mjs`), so a caller can fall back.
 */
export function mdiGlyph(icon: string | undefined | null): TemplateResult | undefined {
  const body = mdiGlyphBody(icon)
  if (!body) return undefined
  return html`<svg viewBox="0 0 24 24" aria-hidden="true">${unsafeSVG(body)}</svg>`
}
