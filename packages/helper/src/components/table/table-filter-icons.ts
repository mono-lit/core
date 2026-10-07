// table-filter-icons.ts
//
// Inline header-filter funnel SVGs for the SHADOW build of `mono-table-th`. The
// light build uses the global UnoCSS icon classes (`i-mdi-filter-outline` when the
// column carries no filter, `i-mdi-filter` once it does), but a shadow root can't
// reach page-level utility CSS, so the same two glyphs are inlined here — sourced
// verbatim from those iconify icons. `fill="currentColor"` so the `[data-filtered]`
// colour rules in table.css still apply.
//
// Mirrors `table-sort-icons.ts`, which does the same job for the sort caret.

import { html, type TemplateResult } from 'lit'

/** One funnel SVG: outlined while the column is unfiltered, filled once it isn't. */
export function filterIndicatorSvg(active: boolean): TemplateResult {
  if (active) {
    // mdi:filter
    return html`
      <svg class="mono-th-filter-glyph" mono-th-filter-glyph viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 12v7.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0l-2.01-2.01a.99.99 0 0 1-.29-.83V12h-.03L4.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L14.03 12z" />
      </svg>
    `
  }

  // mdi:filter-outline
  return html`
    <svg class="mono-th-filter-glyph" mono-th-filter-glyph viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15 19.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0L9.29 16.7a.99.99 0 0 1-.29-.83v-5.12L4.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L15 10.75zM7.04 5L11 10.06v5.52l2 2v-7.53L16.96 5z" />
    </svg>
  `
}
