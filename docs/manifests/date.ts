import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',      title: 'Date',       description: 'Default date picker with label, placeholder and value binding.' },
  { id: 'sizes',      title: 'Sizes',      description: 'Small, medium and large — the same scale as the other form controls.' },
  { id: 'colors',     title: 'Colors',     description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',     title: 'States',     description: 'Disabled, readonly and required.' },
  { id: 'validation', title: 'Validation', description: 'error and success states with messages (mono-date has no warning state).' },
  { id: 'clearable',  title: 'Clearable',  description: 'A clear (✕) button shown when a date is selected.' },
  { id: 'datetime',   title: 'Datetime',   description: 'type="datetime" — calendar plus a time picker.' },
  { id: 'time',       title: 'Time',       description: 'type="time" — time-only picker (no calendar).' },
  { id: 'range',      title: 'Range',      description: 'mode="range" — select a start and end date.' },
  { id: 'inline',     title: 'Inline',     description: 'Always-visible inline calendar.' },
  { id: 'typeable',   title: 'Typeable',   description: 'typeable lets the user type a date; it live-parses and auto-selects.' },
  { id: 'options',    title: 'Options passthrough', description: 'Any flatpickr option via the `options` prop (week numbers, custom format).' },
  { id: 'customized', title: 'Customized', description: 'Override per-part styling (root/label/field/message) with the cssClass prop.' },
]
