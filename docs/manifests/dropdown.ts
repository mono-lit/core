import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',           title: 'Basic',           description: 'Click an activator button to open a dropdown panel below it.' },
  { id: 'placements',      title: 'Placements',      description: 'All 12 placements: top/bottom/left/right combined with -start, -end and bare (centered).' },
  { id: 'auto-flip',       title: 'Auto-flip + shift', description: 'Triggers placed near each viewport edge — the panel flips to the side with more room and shifts inward to stay on-screen.' },
  { id: 'sizes',           title: 'Sizes',           description: 'Small, medium and large.' },
  { id: 'colors',          title: 'Colors',          description: 'All built-in color variants.' },
  { id: 'triggers',        title: 'Triggers',        description: 'Click vs hover modes side-by-side.' },
  { id: 'with-mono-button', title: 'With mono-button', description: 'Use a real <mono-button> as the activator inside slot="main".' },
  { id: 'rich-content',    title: 'Rich content',    description: 'The body slot can host any HTML — including other mono components like input, checkbox, and button.' },
  { id: 'disabled',        title: 'Disabled',        description: "The activator does nothing on click." },
  { id: 'event-log',       title: 'Event log',       description: 'Live log of toggle / open / close with the source field and resolvedSide.' },
  { id: 'customized',      title: 'Customized',      description: 'Override per-element styling with cssClass (Vue) or utility classes (CSS).' },
]
