import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',         title: 'Basic',         description: 'Default select with label, placeholder and helper text.' },
  { id: 'sizes',         title: 'Sizes',         description: 'Small, medium and large.' },
  { id: 'colors',        title: 'Colors',        description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',        title: 'States',        description: 'Disabled, readonly and required.' },
  { id: 'validation',    title: 'Validation',    description: 'valid, invalid and warning states with messages.' },
  { id: 'clearable',     title: 'Clearable',     description: 'Clear button shown when a value is selected.' },
  { id: 'slots',         title: 'Slots',         description: 'Custom label, helper and prefix/suffix content via slots.' },
  { id: 'event-change',  title: 'Event: change', description: 'Listen to change to react to selection.' },
  { id: 'event-log',     title: 'Event log',     description: 'Live log of change and clear events.' },
  { id: 'customized',    title: 'Customized',    description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
  { id: 'custom-keys',   title: 'Custom keys',   description: 'Use key-value + display-value to feed natural-shape items (e.g. { id, name }) without pre-mapping.' },
]
