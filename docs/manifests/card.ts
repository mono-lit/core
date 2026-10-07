import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',    title: 'Basic',    description: 'Simple card with optional title and subtitle.' },
  { id: 'nested',   title: 'Nested',   description: 'Cards stacked inside cards, including behind v-if / v-for.' },
  { id: 'sizes',      title: 'Sizes',      description: 'Six content-scale steps from xs to xxl — padding, type, gaps and the header icon. Not a dimension: every card in the demo is the same width.' },
  { id: 'dimensions', title: 'Width & height', description: 'Explicit width / height / min / max sizing, independent of the size scale.' },
  { id: 'css-vars',   title: 'CSS Variables',  description: 'Per-element theming through the --mono-card-* custom properties.' },
  { id: 'colors',   title: 'Colors',   description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',   title: 'States',   description: 'Bordered, hoverable, clickable and disabled.' },
  { id: 'actions',  title: 'Actions',  description: 'Footer actions slot with multiple buttons.' },
  { id: 'event-click',  title: 'Event: click',  description: 'Listen for click on a clickable card.' },
  { id: 'event-toggle', title: 'Event: toggle', description: 'Use the click event to switch the card variant.' },
  { id: 'event-log',    title: 'Event log',     description: 'Live log of click events, distinguishing mouse vs keyboard.' },
  { id: 'customized',   title: 'Customized',    description: 'Override per-element styling with the cssClass prop (Vue) or extra utility classes (CSS).' },
]
