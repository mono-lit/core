import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',         title: 'Basic',         description: 'Simple modal with title, body, and close button.' },
  { id: 'sizes',         title: 'Sizes',         description: 'sm, md, lg and xl.' },
  { id: 'dimensions',    title: 'Width & height', description: 'Explicit width / height / min / max sizing, including full screen.' },
  { id: 'auto-fullscreen', title: 'Auto full-screen', description: 'Fills the screen on small viewports. Pick a breakpoint above your current width to see it flip.' },
  { id: 'stacked',       title: 'Stacked',       description: 'Set stackable to open modals on top of each other, any depth; otherwise a modal is exclusive.' },
  { id: 'draggable',     title: 'Draggable',     description: 'Drag the modal by its header; it snaps back inside the viewport on drop.' },
  { id: 'colors',        title: 'Colors',        description: 'All built-in color variants.' },
  { id: 'confirmation',  title: 'Confirmation',  description: 'Cancel + Confirm footer that triggers a status update.' },
  { id: 'with-form',     title: 'Form',          description: 'Modal containing an input + submit button.' },
  { id: 'persistent',    title: 'Persistent',    description: 'Overlay-click and Escape do not close — only the buttons or the ✕ work.' },
  { id: 'no-overlay',    title: 'No overlay',    description: 'Page behind stays interactive; a click outside still closes the modal and reaches the page.' },
  { id: 'event-log',     title: 'Event log',     description: 'Live log of close events showing which source closed the modal.' },
  { id: 'customized',    title: 'Customized',    description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
]
