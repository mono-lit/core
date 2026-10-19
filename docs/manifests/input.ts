import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',         title: 'Basic',          description: 'Default text input with label, placeholder and helper text.' },
  { id: 'types',         title: 'Types',          description: 'text, email, password, number, tel, url, date, time and search (file and range have their own sections).' },
  { id: 'sizes',         title: 'Sizes',          description: 'Small, medium and large.' },
  { id: 'colors',        title: 'Colors',         description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',        title: 'States',         description: 'Disabled, readonly and required.' },
  { id: 'tooltip',    title: 'Tooltip',          description: 'Info icon beside the label; hover or focus shows a mono-tooltip. Plain text or full tooltip options.' },
  { id: 'label-position', title: 'Label position', description: 'label-position: top (default), notched on the border (inset for filled / underlined), left or right of the box.' },
  { id: 'validation-position', title: 'Validation position', description: 'validation-position: bottom (default), icon (state icon in the box, hover for the message) or float (message floats under the box on hover / focus).' },
  { id: 'validation',    title: 'Validation',     description: 'valid, invalid and warning states with messages.' },
  { id: 'prefix-suffix', title: 'Prefix & suffix', description: 'Icon or text on either side of the native input.' },
  { id: 'clearable',     title: 'Clearable',      description: 'Clear button shown when the value is non-empty.' },
  { id: 'file',          title: 'File',           description: 'type="file": a read-only name field with an upload icon; modelValue is the File (or File[] with multiple).' },
  { id: 'range',         title: 'Range',          description: 'type="range": Basecoat\'s slider with the value on screen; under ONE it follows the EJI guide.' },
  { id: 'field-alignment', title: 'Field alignment', description: 'input, select, date, tag-input and button share --theme-control-height-* at every size.' },
  { id: 'event-log',     title: 'Event log',      description: 'Live log of input, change and clear events.' },
  { id: 'customized',    title: 'Customized',     description: 'Override per-element styling with the cssClass prop (Vue) or extra utility classes (CSS).' },
]
