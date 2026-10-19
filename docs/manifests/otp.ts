import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',               title: 'Basic',               description: 'Six boxes that act as one field: type, Backspace, paste.' },
  { id: 'types',               title: 'Types',               description: 'type="numeric | alphanumeric | text".' },
  { id: 'mask',                title: 'Mask',                description: 'mask hides the characters like a password.' },
  { id: 'groups',              title: 'Groups',              description: 'groups + separator split the boxes; placeholder per box.' },
  { id: 'sizes',               title: 'Sizes',               description: 'xs to xxl — each box is a square at the control height.' },
  { id: 'colors',              title: 'Colors',              description: 'color is the focus colour.' },
  { id: 'variants',            title: 'Variants',            description: 'outlined, filled, underlined.' },
  { id: 'states',              title: 'States',              description: 'Disabled, readonly, required and validation.' },
  { id: 'label-position',      title: 'Label position',      description: 'top, left, right (notched renders as top).' },
  { id: 'validation-position', title: 'Validation position', description: 'bottom, icon or float.' },
  { id: 'tooltip',             title: 'Tooltip',             description: 'An info icon at the end of the label.' },
  { id: 'form',                title: 'Form',                description: 'controlMonoForm owns the value and renders the validation.' },
  { id: 'event-log',           title: 'Event log',           description: 'input, complete, change and clear.' },
  { id: 'css-vars',            title: 'CSS Variables',       description: 'Restyle through --mono-otp-* knobs.' },
]
