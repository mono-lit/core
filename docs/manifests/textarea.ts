import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',        title: 'Basic',        description: 'Default textarea with label, placeholder and helper text.' },
  { id: 'sizes',        title: 'Sizes',        description: 'Small, medium and large.' },
  { id: 'colors',       title: 'Colors',       description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',       title: 'States',       description: 'Disabled, readonly and required.' },
  { id: 'tooltip',    title: 'Tooltip',          description: 'Info icon beside the label; hover or focus shows a mono-tooltip. Plain text or full tooltip options.' },
  { id: 'label-position', title: 'Label position', description: 'label-position: top (default), notched on the border (inset for filled / underlined), left or right of the box.' },
  { id: 'validation-position', title: 'Validation position', description: 'validation-position: bottom (default), icon (state icon in the box, hover for the message) or float (message floats under the box on hover / focus).' },
  { id: 'validation',   title: 'Validation',   description: 'valid, invalid and warning states with messages.' },
  { id: 'autoresize',   title: 'Auto resize',  description: 'Grow with content between min-rows and max-rows.' },
  { id: 'counter',      title: 'Counter',      description: 'Live character count via show-counter and max-length.' },
  { id: 'slots',        title: 'Slots',        description: 'Custom label and helper content via named slots.' },
  { id: 'event-log',    title: 'Event log',    description: 'Live log of input and change events.' },
  { id: 'customized',   title: 'Customized',   description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
]
