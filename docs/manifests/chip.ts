import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',       description: 'Five color variants with the default soft style.' },
  { id: 'size',        title: 'Sizes',       description: 'xs, sm, md, lg.' },
  { id: 'colors',      title: 'Colors',      description: 'Pick a colour; every variant re-paints live.' },
  { id: 'shape',       title: 'Rounded',     description: 'The shared corner scale: none, xs-xxl, full. Unset keeps the pill a chip has by default.' },
  { id: 'dot',         title: 'Dot',         description: 'Status dot indicator next to the label.' },
  { id: 'icon',        title: 'Icon',        description: 'Slot an icon on the left or right of the label.' },
  { id: 'interactive', title: 'Interactive', description: 'Clickable, selected, disabled and removable states.' },
  { id: 'link',        title: 'Link',        description: 'Renders as <a> when href is set.' },
  { id: 'event-click',  title: 'Event: click',  description: 'Listen for the click event on a clickable chip.' },
  { id: 'event-toggle', title: 'Event: toggle', description: 'Two-way binding to a clickable chip’s selected state.' },
  { id: 'event-remove', title: 'Event: remove', description: 'Remove items from a list when their close button fires close.' },
  { id: 'event-group',  title: 'Event: group',  description: 'Multi-select chip group; clicks toggle each chip.' },
  { id: 'event-log',    title: 'Event log',     description: 'Live log of click and close events.' },
  { id: 'customized',   title: 'Customized',    description: 'Override per-element styling with the cssClass prop (Vue) or extra utility classes (CSS).' },
]
