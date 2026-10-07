import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',        description: 'Single accordion with a title and body.' },
  { id: 'sizes',       title: 'Sizes',        description: 'Small, medium and large.' },
  { id: 'colors',      title: 'Colors',       description: 'All built-in color variants.' },
  { id: 'states',      title: 'States',       description: 'Default-open, default-closed and disabled.' },
  { id: 'icon',        title: 'Icon & subtitle', description: 'Leading icon plus a subtitle under the title.' },
  { id: 'group',       title: 'Group',        description: 'Multiple stacked items with the optional group helper.' },
  { id: 'slots',       title: 'Slots',        description: 'Custom title, subtitle, icon, actions and body via named slots — or slot="header" to replace the title and subtitle together.' },
  { id: 'event-log',   title: 'Event log',    description: 'Live log of toggle, open and close events.' },
  { id: 'customized',  title: 'Customized',   description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
  { id: 'css-vars',    title: 'CSS Variables', description: 'Re-skin a single accordion through --mono-accordion-* custom properties.' },
  { id: 'heavy',       title: 'Performance',  description: 'Many panels, each holding several components — collapsed bodies stay out of layout.' },
]
