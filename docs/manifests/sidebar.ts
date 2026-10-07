import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'permanent',     title: 'Permanent',     description: 'Always-visible sidebar that pushes the main content area to the side.' },
  { id: 'temporary',     title: 'Temporary',     description: 'Drawer-style sidebar with scrim — Escape, scrim-click, or close button dismiss.' },
  { id: 'rail',          title: 'Rail',          description: 'Mini collapsed sidebar (icons only); toggle expands to full width.' },
  { id: 'rail-on-hover', title: 'Rail · expand on hover', description: 'Rail mode that auto-expands while the cursor is over it.' },
  { id: 'manual-rail',   title: 'Rail · manual control', description: 'Bind :rail to your own state and toggle it from any external button. The default chevron is hidden when the prop is provided.' },
  { id: 'location',      title: 'Location',      description: 'Anchor left or right.' },
  { id: 'colors',        title: 'Colors',        description: 'Pick a colour; every variant re-paints live.' },
  { id: 'with-menu',     title: 'With nav list', description: 'Sidebar housing a brand header, nav list, and footer — the typical app-shell composition.' },
  { id: 'iconify',       title: 'With iconify icons', description: 'Sidebar nav using mono-menu with i-mdi-* iconify classes — paints SVG masks via currentColor.' },
  { id: 'customized',    title: 'Customized',    description: 'Override per-element styling via cssClass (Vue) or utility classes (CSS).' },
]
