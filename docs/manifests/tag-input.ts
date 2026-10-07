import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',        title: 'Basic',        description: 'Default tag input that accepts custom values.' },
  { id: 'sizes',        title: 'Sizes',        description: 'Small, medium and large.' },
  { id: 'colors',       title: 'Colors',       description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',       title: 'States',       description: 'Disabled, readonly and required.' },
  { id: 'validation',   title: 'Validation',   description: 'valid, invalid and warning states with messages.' },
  { id: 'suggestions',  title: 'Suggestions',  description: 'Autocomplete dropdown driven by an items array.' },
  { id: 'chips',        title: 'Chips',        description: 'The chip prop configures every tag as mono-chip markup — size, shape, dot and a color that follows the field unless pinned.' },
  { id: 'chip-inline',  title: 'Inline chips', description: 'chip.behaviour: inline keeps the tags on one line in a strip scrolled only by the ‹ › buttons — no scrollbar, no wheel or drag scrolling; max-visible collapses the rest into +N more.' },
  { id: 'limits',       title: 'Limits',       description: 'max / min (or chip.max / chip.min) cap what the user can select — a pick past max is rejected, not disabled; at min the chips lose their ✕.' },
  { id: 'slots',        title: 'Slots',        description: 'Custom label and helper content via named slots.' },
  { id: 'event-log',    title: 'Event log',    description: 'Live log of add, remove, clear and change.' },
  { id: 'customized',   title: 'Customized',   description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
  { id: 'custom-keys',  title: 'Custom keys',  description: 'Use key-value + display-value to feed natural-shape items (e.g. { id, name }) without pre-mapping.' },
  { id: 'select-all-remote', title: 'Select all from the server', description: 'With a dataSource and load-more, the "All" row drains the source in chunks instead of selecting the loaded page — spinner in the box while it runs, and the search still scopes it.' },
]
