// table-sort-icons.ts
//
// Inline sort-indicator SVGs for the SHADOW builds of `mono-table-th` and
// `mono-table-sort`. The light builds use global UnoCSS icon classes
// (`i-fluent-arrow-sort-16-filled`, `i-ri-arrow-up-long-fill`,
// `i-ri-arrow-down-long-fill`), but a shadow root can't reach page-level utility
// CSS, so the same three glyphs are inlined here — sourced verbatim from those
// iconify icons. `fill="currentColor"` so the `data-dir` colour rules in
// table.css still apply.

import { html, type TemplateResult } from 'lit'

import type { SortOrder } from './mono-data-grid.js'

/** One sort-indicator SVG, glyph chosen by the active direction. */
export function sortIndicatorSvg(current: SortOrder): TemplateResult {
  if (current === 'asc') {
    // ri:arrow-up-long-fill
    return html`
      <svg class="mono-table-sort-caret" mono-sort-caret viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 22h2V8.414h5.414L12 2L5.586 8.414H11z" />
      </svg>
    `
  }

  if (current === 'desc') {
    // ri:arrow-down-long-fill
    return html`
      <svg class="mono-table-sort-caret" mono-sort-caret viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13 2h-2v13.586H5.586L12 22l6.414-6.414H13z" />
      </svg>
    `
  }

  // fluent:arrow-sort-16-filled (note the 16-based viewBox)
  return html`
    <svg class="mono-table-sort-caret" mono-sort-caret viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path
        d="M10.73 13.79c.29.28.75.28 1.04 0l2.75-2.65a.75.75 0 1 0-1.04-1.08L12 11.486V2.75a.75.75 0 0 0-1.5 0v8.736L9.02 10.06a.75.75 0 1 0-1.04 1.08zM5.28 2.22a.75.75 0 0 0-1.06 0L1.47 4.97a.75.75 0 0 0 1.06 1.06L4 4.56v8.69a.75.75 0 0 0 1.5 0V4.56l1.47 1.47a.75.75 0 0 0 1.06-1.06z"
      />
    </svg>
  `
}
