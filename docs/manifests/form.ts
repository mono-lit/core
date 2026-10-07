import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'control',     title: 'Control',              description: 'controlMonoForm owns the value + validation; each mono-input / mono-select opts in with :control-form + key-form, and the live items() readout is yours to use.' },
  { id: 'basic',       title: 'Basic',                description: 'controlMonoForm owns the value and validation; controls opt in with :control-form + key-form and need no :model-value or @change. Rules run live (per keystroke) or on change (commit), and form.validate() runs every rule.' },
  { id: 'cross-field', title: 'Cross-field watchers', description: 'Each field watcher runs for every change in the form — its own and every peer\'s — so Name can react to Age via peerKey and disable itself with changeProp, while changeValidation marks another control invalid.' },
  { id: 'external',    title: 'External refs',        description: 'Plain Vue refs handed to the form as `external` and read from watchers, plus the imperative side: form.refresh() from a Vue watch and form.changeValidation() to surface a server error.' },
]
