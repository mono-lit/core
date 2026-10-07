import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',       description: 'Three items separated by ›. Last item is the current page.' },
  { id: 'sizes',       title: 'Sizes',       description: 'sm / md / lg — affects font, padding, and gap.' },
  { id: 'colors',      title: 'Colors',      description: 'Pick a colour; every variant re-paints live.' },
  { id: 'with-icons',  title: 'With icons',  description: 'Items with leading SVG icons (slot icon-{id} for the Lit element).' },
  { id: 'separators',  title: 'Separators',  description: 'Custom separator strings (›, /, •) and a slotted SVG chevron.' },
  { id: 'interactive', title: 'Interactive', description: 'Clicks emit click; the demo logs each click and prevents anchor navigation.' },
  { id: 'truncation',  title: 'Truncation',  description: 'Long path with the truncate flag — items overflow to ellipsis instead of wrapping.' },
  { id: 'customized',  title: 'Customized',  description: 'Per-element overrides via cssClass (Vue) or extra utility classes (CSS).' },
  { id: 'composition', title: 'Slot-body composition', description: 'Wrap with <mono-breadcrumb> for nav semantics + theming, slot a <mono-breadcrumb-list> as the body.' },
  { id: 'standalone-list', title: 'Standalone list', description: '<mono-breadcrumb-list> used directly with no wrapper — themes itself via modifier attributes.' },
]
