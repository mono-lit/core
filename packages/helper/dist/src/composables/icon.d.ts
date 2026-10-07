import { TemplateResult } from 'lit';
/**
 * Detect whether an icon string is an iconify utility class — e.g.
 * `i-mdi-close`, `i-tabler-upload`. UnoCSS's preset-icons resolves these to a
 * background/mask, so components render them as an empty `<span class="i-...">`.
 *
 * Single source of truth — components re-export this from their own
 * `*-utils.ts` so their public API stays stable.
 */
export declare function isIconifyClass(icon: string | undefined | null): boolean;
/**
 * Draw an `i-mdi-*` glyph as inline SVG — the SHADOW builds' counterpart to the
 * light builds' UnoCSS mask. Both come from `@iconify-json/mdi`, so one `icon`
 * value paints the same artwork in either build. Returns `undefined` when the
 * glyph is not bundled (see `scripts/mdi-glyphs.mjs`), so a caller can fall back.
 */
export declare function mdiGlyph(icon: string | undefined | null): TemplateResult | undefined;
