import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',     title: 'Basic',     description: 'Icon, title and subtitle — Basecoat’s alert.' },
  { id: 'variants',  title: 'Variants',  description: 'outline (default), tonal, solid and text — the same four looks as the button.' },
  { id: 'colors',    title: 'Colors',    description: 'Every colour role; danger is Basecoat’s destructive.' },
  { id: 'sizes',     title: 'Sizes',     description: 'xs to xxl — one factor over the md metrics.' },
  { id: 'icon',      title: 'Icon',      description: 'An iconify class, plain text, or slot="icon".' },
  { id: 'slots',     title: 'Slots',     description: 'title / subtitle slots, and slot="body" (or plain children) replacing the whole content.' },
  { id: 'clearable', title: 'Clearable & stacking', description: 'The ✕ hides the alert; stacked alerts close the gap.' },
  { id: 'nested',    title: 'Nested',    description: 'Alerts inside an alert — each keeps its own colour, size and variant, and its ✕ hides only itself.' },
]
