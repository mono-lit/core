/* =========================================================================
   Field affordance icons — caret + chevrons
   -------------------------------------------------------------------------
   The small glyphs a field draws in its trailing corner: the dropdown caret,
   and the `‹` / `›` pair that pages an inline chip strip.

   Shared rather than per-component on purpose. `<mono-tag-input>` and
   `<mono-dropdown-table>` sit side by side in a form and their trailing rows
   must read as the same control; when each drew its own the tag-input's
   UnoCSS `i-mdi-*` glyphs came out visibly heavier and larger than the
   dropdown-table's, which is exactly the drift this file removes.

   Inline SVG, not a `.mono-icon` utility class: UnoCSS generates its icons as
   a background mask on the page stylesheet, which cannot reach a shadow root,
   so the shadow builds would otherwise need a second hand-written copy of
   every glyph. One template works in both builds.
   ========================================================================= */

import { html, type TemplateResult } from 'lit'

/** Downward caret — the "this opens a panel" affordance. */
export function caretIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 20 20"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.25 8.29a.75.75 0 0 1-.02-1.08z"
      clip-rule="evenodd"
    />
  </svg>`
}

/** The ✕ a clear button and a chip's remove button draw, at the caret's weight. */
export function closeIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 20 20"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"
      clip-rule="evenodd"
    />
  </svg>`
}

/** Left (`-1`) or right (`1`) chevron, matching {@link caretIcon}'s weight. */
export function chevronIcon(dir: -1 | 1): TemplateResult {
  const d =
    dir === -1
      ? 'M12.79 5.23a.75.75 0 0 1-.02 1.06L9.06 10l3.71 3.71a.75.75 0 1 1-1.06 1.06l-4.24-4.24a.75.75 0 0 1 0-1.06l4.24-4.24a.75.75 0 0 1 1.08 0z'
      : 'M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 0 1-1.08 0z'
  return html`<svg
    mono-icon
    viewBox="0 0 20 20"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fill-rule="evenodd" d=${d} clip-rule="evenodd" />
  </svg>`
}

/**
 * Busy arc for a field whose data source is still answering. Spun by the
 * component's own CSS (`[mono-ds-spinner] > svg`) so a reduced-motion rule can
 * stop it.
 */
export function spinnerIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>`
}

/** ↻ — the retry affordance a field shows after its data source failed. */
export function refreshIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
    />
  </svg>`
}

/**
 * ⓘ — the label's "more information" affordance (`tooltip` prop). The
 * `mdi:information-outline` path, so the shadow builds draw exactly what the
 * light build's `i-mdi-information-outline` mask paints.
 */
export function infoIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2z"
    />
  </svg>`
}

/** `validation-position="icon"` — mdi alert-circle-outline (invalid / warning). */
export function alertCircleIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8"
    />
  </svg>`
}

/** `validation-position="icon"` — mdi check-circle-outline (valid). */
export function checkCircleIcon(): TemplateResult {
  return html`<svg
    mono-icon
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4l8-8z"
    />
  </svg>`
}
