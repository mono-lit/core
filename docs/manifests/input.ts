import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',         title: 'Basic',          description: 'Default text input with label, placeholder and helper text.' },
  { id: 'types',         title: 'Types',          description: 'text, email, password, number, tel, url, date, time and search.' },
  { id: 'sizes',         title: 'Sizes',          description: 'Small, medium and large.' },
  { id: 'colors',        title: 'Colors',         description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',        title: 'States',         description: 'Disabled, readonly and required.' },
  { id: 'validation',    title: 'Validation',     description: 'valid, invalid and warning states with messages.' },
  { id: 'prefix-suffix', title: 'Prefix & suffix', description: 'Icon or text on either side of the native input.' },
  { id: 'clearable',     title: 'Clearable',      description: 'Clear button shown when the value is non-empty.' },
  { id: 'field-alignment', title: 'Field alignment', description: 'input, select, date, tag-input and button share --theme-control-height-* at every size.' },
  { id: 'event-log',     title: 'Event log',      description: 'Live log of input, change and clear events.' },
  { id: 'customized',    title: 'Customized',     description: 'Override per-element styling with the cssClass prop (Vue) or extra utility classes (CSS).' },
]
