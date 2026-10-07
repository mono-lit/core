import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',          title: 'Basic',          description: 'Sticky top bar with a brand on the left and an avatar on the right.' },
  { id: 'density',        title: 'Density',        description: 'compact (48px), comfortable (56px), default (64px).' },
  { id: 'colors',         title: 'Colors',         description: 'Pick a colour; every variant re-paints live.' },
  { id: 'with-extension', title: 'Extension row',  description: 'Second row beneath the main bar via the extension slot — useful for tabs or breadcrumbs.' },
  { id: 'non-sticky',     title: 'Non-sticky',     description: 'Inline header that scrolls with the page.' },
  { id: 'with-actions',   title: 'Dashboard top bar', description: 'Realistic composition: brand on the left, search center, icon actions and avatar on the right.' },
  { id: 'layout-var',     title: 'Layout var',     description: 'Reads --mono-nav-height from :root to auto-pad the page below the bar.' },
  { id: 'customized',     title: 'Customized',     description: 'Override per-section styling via cssClass (Vue) or utility classes (CSS).' },
]
