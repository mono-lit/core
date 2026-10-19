import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'control',     title: 'Control',              description: 'controlMonoForm owns the value + validation; each mono-input / mono-select opts in with :control-form + key-form, and the live items() readout is yours to use.' },
  { id: 'basic',       title: 'Basic',                description: 'controlMonoForm owns the value and validation; controls opt in with :control-form + key-form and need no :model-value or @change. Rules run live (per keystroke) or on change (commit), and form.validate() runs every rule.' },
  { id: 'schema',      title: 'Schema rules',         description: 'Valibot (or yup) schemas as field rules: { schema } in validates, mixed with built-ins, an async availability check on commit, and a custom rule for the cross-field confirm.' },
  { id: 'cross-field', title: 'Cross-field watchers', description: 'Each field watcher runs for every change in the form — its own and every peer\'s — so Name can react to Age via peerKey and disable itself with changeProp, while changeValidation marks another control invalid.' },
  { id: 'external',    title: 'External refs',        description: 'Plain Vue refs handed to the form as `external` and read from watchers, plus the imperative side: form.refresh() from a Vue watch and form.changeValidation() to surface a server error.' },
  { id: 'complete',    title: 'Complete form',        description: 'Every control that supports controlMonoForm in one form — input, textarea, select, tag-input, date, dropdown-table, slider, otp, rich-text-editor, file-upload, radio, switch and checkbox — with submit, reset and a validation-position picker.' },
]
