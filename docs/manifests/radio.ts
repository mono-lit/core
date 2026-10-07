import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',         title: 'Basic',         description: 'Single radio option with a label.' },
  { id: 'group',         title: 'Group',         description: 'Multiple radios sharing one model-value.' },
  { id: 'sizes',         title: 'Sizes',         description: 'Small, medium and large.' },
  { id: 'colors',        title: 'Colors',        description: 'All built-in color variants.' },
  { id: 'states',        title: 'States',        description: 'Disabled and pre-selected.' },
  { id: 'description',   title: 'Sublabel',      description: 'Radio with a secondary sublabel line.' },
  { id: 'slots',         title: 'Slots',         description: 'Custom label and sublabel via named slots.' },
  { id: 'event-change',  title: 'Event: change', description: 'Listen to change to react to selection.' },
  { id: 'event-log',     title: 'Event log',     description: 'Live log of change events.' },
  { id: 'customized',    title: 'Customized',    description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
  { id: 'card',          title: 'Card recipe',   description: 'Compose a card-style radio with your own CSS — the library ships no helper.' },
]
