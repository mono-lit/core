// The colour lists a demo's Color picker offers — the FULL set each component
// accepts, so a reader sees every colour, not the six a form control shares.
// Mirrors the `*Color` unions in src/components/*/…-types.ts; keep in step.
export const PALETTE = {
  /** input / select / date / textarea / tag-input / dropdown-table / table search, checkbox / radio / switch, accordion / tabs / drawer / modal / dropdown — the ten roles */
  form: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark'],
  /** mono-button (button-types.ts `ButtonColor`) */
  button: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark', 'light'],
  /** mono-chip (chip-types.ts `ChipColor`) — also the `chip.color` of tag-input / dropdown-table */
  chip: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark'],
  /** mono-card (card-types.ts `CardColor`) */
  card: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'dark', 'neutral', 'light'],
  /** breadcrumb / nav / sidebar / menu — the ten roles plus `surface` */
  nav: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark', 'surface'],
} as const

export type PaletteName = keyof typeof PALETTE
