import { html } from "lit";
//#region src/composables/field-icons.ts
/** Downward caret — the "this opens a panel" affordance. */
function caretIcon() {
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
  </svg>`;
}
/** The ✕ a clear button and a chip's remove button draw, at the caret's weight. */
function closeIcon() {
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
  </svg>`;
}
/** Left (`-1`) or right (`1`) chevron, matching {@link caretIcon}'s weight. */
function chevronIcon(dir) {
	return html`<svg
    mono-icon
    viewBox="0 0 20 20"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fill-rule="evenodd" d=${dir === -1 ? "M12.79 5.23a.75.75 0 0 1-.02 1.06L9.06 10l3.71 3.71a.75.75 0 1 1-1.06 1.06l-4.24-4.24a.75.75 0 0 1 0-1.06l4.24-4.24a.75.75 0 0 1 1.08 0z" : "M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 0 1-1.08 0z"} clip-rule="evenodd" />
  </svg>`;
}
/**
* Busy arc for a field whose data source is still answering. Spun by the
* component's own CSS (`[mono-ds-spinner] > svg`) so a reduced-motion rule can
* stop it.
*/
function spinnerIcon() {
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
  </svg>`;
}
/** ↻ — the retry affordance a field shows after its data source failed. */
function refreshIcon() {
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
  </svg>`;
}
//#endregion
export { spinnerIcon as a, refreshIcon as i, chevronIcon as n, closeIcon as r, caretIcon as t };
