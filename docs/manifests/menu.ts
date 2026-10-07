import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',                title: 'Basic',                 description: 'Flat list of clickable items with icons and the active item highlighted.' },
  { id: 'colors',               title: 'Colors',                description: 'Pick a colour; the active item and hover accent take it.' },
  { id: 'groups',               title: 'Collapsible groups',    description: 'Section-style groups whose children expand and collapse on header click.' },
  { id: 'nested',               title: 'Nested children',       description: 'Items can have a children array — auto-rendered as an indented sub-list.' },
  { id: 'multiple',             title: 'Multi-select',          description: 'Multiple items can be active at once; modelValue becomes a string array.' },
  { id: 'with-iconify-icons',   title: 'Iconify icons',         description: 'item.icon strings like "i-mdi-view-dashboard" resolve through UnoCSS preset-icons — works with any icones.js.org collection.' },
  { id: 'badges',               title: 'Badges',                description: 'Numeric counts and status pills via badge + badgeColor on each item.' },
  { id: 'dividers-subheaders',  title: 'Dividers & subheaders', description: 'Section labels and thin rules grouped via the divider and subheader item types.' },
  { id: 'plain-variant',        title: 'Plain variant',         description: 'nav={false} for a softer fill on the active item; useful in popovers and dialogs.' },
  { id: 'customized',           title: 'Customized',            description: 'Override per-element styling via cssClass (Vue) or utility classes (CSS).' },
  { id: 'nested-elements',      title: 'Declarative nesting',   description: 'Stack <mono-menu-list> tags to any depth — each tag is one row, children compose its body slot.' },
  { id: 'with-vue-router',      title: 'Vue Router integration', description: 'Real <a href> rows give status-bar URL preview, right-click "Open in new tab", and middle-click — intercepted on plain click for SPA navigation via router.push.' },
  { id: 'aliases',              title: 'Alias fallback',         description: 'When an item has no icon, the renderer emits a 1–2 char monogram from the title (Dashboard → D, Post Budget → PB) so rail-mode sidebars never show empty rows.' },
]
