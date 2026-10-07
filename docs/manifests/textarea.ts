import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',        title: 'Basic',        description: 'Default textarea with label, placeholder and helper text.' },
  { id: 'sizes',        title: 'Sizes',        description: 'Small, medium and large.' },
  { id: 'colors',       title: 'Colors',       description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',       title: 'States',       description: 'Disabled, readonly and required.' },
  { id: 'validation',   title: 'Validation',   description: 'valid, invalid and warning states with messages.' },
  { id: 'autoresize',   title: 'Auto resize',  description: 'Grow with content between min-rows and max-rows.' },
  { id: 'counter',      title: 'Counter',      description: 'Live character count via show-counter and max-length.' },
  { id: 'slots',        title: 'Slots',        description: 'Custom label and helper content via named slots.' },
  { id: 'event-log',    title: 'Event log',    description: 'Live log of input and change events.' },
  { id: 'customized',   title: 'Customized',   description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
]
