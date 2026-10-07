import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',          title: 'Basic',          description: 'Default info toast with a message and the close button.' },
  { id: 'types',          title: 'Types',          description: 'success, info, warning, danger side-by-side.' },
  { id: 'sizes',          title: 'Sizes',          description: 'Small, medium and large.' },
  { id: 'dismissible',    title: 'Dismissible',    description: 'Sticky toast with the close button (no auto-timer).' },
  { id: 'auto-dismiss',   title: 'Auto dismiss',   description: 'Timed close — opens for 4 seconds then closes itself.' },
  { id: 'with-icon',      title: 'Custom icon',    description: 'Leading SVG icon via the icon slot, plus a title.' },
  { id: 'actions',        title: 'Actions',        description: 'Trailing action buttons in the toast — wired by the consumer.' },
  { id: 'imperative',     title: 'Notify helper',  description: 'Buttons that call MonoToast.notify({...}) to push toasts into a fixed region.' },
  { id: 'event-log',      title: 'Event log',      description: 'Live log of dismiss events with source.' },
  { id: 'customized',     title: 'Customized',     description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
]
