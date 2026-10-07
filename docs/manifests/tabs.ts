import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',        description: 'Three tabs with text panes that swap on click.' },
  { id: 'sizes',       title: 'Sizes',        description: 'Small, medium and large.' },
  { id: 'colors',      title: 'Colors',       description: 'Pick a colour; every variant re-paints live.' },
  { id: 'badges',      title: 'Badges',       description: 'Tabs with trailing count badges.' },
  { id: 'icons',       title: 'Icons',        description: 'Leading SVG icons via the icon-{id} slot.' },
  { id: 'disabled',    title: 'Disabled',     description: 'Whole-strip disabled, plus per-item disabled.' },
  { id: 'event-log',   title: 'Event log',    description: 'Live log of change events.' },
  { id: 'customized',  title: 'Customized',   description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
]
