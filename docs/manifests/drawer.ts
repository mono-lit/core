import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',        description: 'Default right-side drawer with a header, body, and close button.' },
  { id: 'positions',   title: 'Positions',    description: 'Slide in from left, right, top, or bottom.' },
  { id: 'stacked',     title: 'Stacked',      description: 'Set stackable to open drawers on top of each other, any depth; otherwise a drawer is exclusive.' },
  { id: 'sizes',       title: 'Sizes',        description: 'Five sizes from sm to full width / height.' },
  { id: 'auto-fullscreen', title: 'Auto full-screen', description: 'Fills the screen on small viewports, keeping the drawer position and hiding the resize handle.' },
  { id: 'resizeable',  title: 'Resizable',    description: 'Drag the inner-edge handle to resize the drawer (width or height).' },
  { id: 'colors',      title: 'Colors',       description: 'Six accent colors threaded through the head and scrollbar.' },
  { id: 'slots',       title: 'Header & footer slots', description: 'Custom header and footer content via slots.' },
  { id: 'persistent',  title: 'Persistent',   description: 'Overlay click and Escape are ignored — only the close button or programmatic hide() will dismiss.' },
  { id: 'no-overlay',  title: 'No overlay',   description: 'Side panel without a backdrop — page behind stays interactive; a click outside still closes it and reaches the page.' },
  { id: 'event-log',   title: 'Event log',    description: 'Live log of toggle, open and close events with source (overlay / close / escape / manual).' },
  { id: 'customized',  title: 'Customized',   description: 'Per-element overrides via cssClass (Vue) or utility classes (CSS).' },
]
