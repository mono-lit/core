import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',      title: 'Basic',      description: 'Single-file upload with default styling.' },
  { id: 'compact',    title: 'Compact',    description: 'Reduced padding via variant="compact".' },
  { id: 'slots',      title: 'Title & subtitle', description: 'title / subtitle props (old placeholder / subtext still accepted) and slot="title" / slot="subtitle" — a slot beats its prop.' },
  { id: 'multiple',   title: 'Multiple',   description: 'Allow multiple files with optional max-files / max-file-size.' },
  { id: 'image',      title: 'Image',      description: 'Image-only upload with previews.' },
  { id: 'validation', title: 'Validation', description: 'Valid, invalid and warning states with messages.' },
  { id: 'states',     title: 'States',     description: 'Disabled and required examples.' },
  { id: 'preloaded',  title: 'Preloaded',  description: 'Initialize the uploader with existing files.' },
  { id: 'event-log',  title: 'Event log',  description: 'Live log of change, remove and error events.' },
  { id: 'customized', title: 'Customized', description: 'Override per-element styling with the cssClass prop (Vue) or extra utility classes (CSS).' },
]
