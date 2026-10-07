import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',         description: 'Default classic variant — vertical spine, colored dots, four events.' },
  { id: 'variants',    title: 'Variants',      description: 'Same data rendered as classic / compact / approval side-by-side.' },
  { id: 'sizes',       title: 'Sizes',         description: 'sm / md / lg — affects font, dot, and spacing.' },
  { id: 'colors',      title: 'Colors',        description: 'Six accent colors driving the dot and spine.' },
  { id: 'statuses',    title: 'Approval statuses', description: 'done / active / pending / rejected / skipped status icons.' },
  { id: 'with-meta',   title: 'With meta',     description: 'Events with time, badges, and actor avatars.' },
  { id: 'slots',       title: 'Per-event slots', description: 'Custom icon and trailing actions for individual events.' },
  { id: 'interactive', title: 'Interactive',   description: 'Clickable events with model-value binding and event log.' },
  { id: 'customized',  title: 'Customized',    description: 'Per-element overrides via cssClass (Vue) or utility classes (CSS).' },
]
