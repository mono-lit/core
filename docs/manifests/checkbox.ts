import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic', title: 'Basic', description: 'Default checkbox; optional label and sublabel.' },
  { id: 'states', title: 'States', description: 'Disabled, pre-checked and indeterminate states.' },
  { id: 'sizes', title: 'Sizes', description: 'Small, medium and large.' },
  { id: 'colors', title: 'Colors', description: 'All built-in color variants.' },
  { id: 'group', title: 'Group', description: 'Simple group layout.' },
  { id: 'custom', title: 'Slots', description: 'Custom label/sublabel via slots.' },
  { id: 'event-change', title: 'Event: change', description: 'Listen for change events.' },
  { id: 'event-controlled', title: 'Controlled', description: 'Drive the value imperatively.' },
  { id: 'event-indeterminate', title: 'Indeterminate toggle', description: 'Toggle the indeterminate flag.' },
  { id: 'event-group', title: 'Select-all group', description: 'Master checkbox + members.' },
  { id: 'event-log', title: 'Event log', description: 'Live log of emitted events.' },
  { id: 'customized', title: 'Customized', description: 'Custom checkbox with advanced styling.' },
]
