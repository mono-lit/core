import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'control',     title: 'Control',          description: 'controlMonoDataDropdown owns selection/value; bind :control-data-dropdown and read dd.modelValue from outside.' },
  { id: 'basic',      title: 'Basic',            description: 'Single-select grid dropdown over a local array — pick a row, the field shows its display text. Search / sort / paging come free from the wrapped controlMonoTable.' },
  { id: 'empty',      title: 'Empty state',      description: 'dd.table IS a controlMonoTable, so <mono-table-empty> works inside the panel with no dropdown-specific wiring — search for something that does not exist and the grid shows a message instead of going blank.' },
  { id: 'sizes',      title: 'Sizes',            description: 'The field size prop from xs to xl — same scale as mono-select / mono-tag-input.' },
  { id: 'colors',     title: 'Colors',           description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',     title: 'States',           description: 'Disabled, readonly and required fields.' },
  { id: 'validation', title: 'Validation',       description: 'valid, invalid and warning states with messages, mirroring mono-select.' },
  { id: 'clearable',  title: 'Clearable',        description: 'A clear (✕) button shown in the field whenever there is a value.' },
  { id: 'appearance', title: 'Appearance',       description: 'The field mimics mono-select: size, variant, color and validation-state props, with label/helper/validation messages.' },
  { id: 'sizing',     title: 'Field & panel size', description: 'Field size via width/minWidth (css-size); the popup panel is sized independently by the :dropdown.prop object { width, maxHeight } — no matchWidth coupling.' },
  { id: 'multiple',   title: 'Multiple',         description: 'Multi-select with chips + a "+N more" overflow, remove-tag, a select-all header checkbox covering every page, and a preset value resolved to display text.' },
  { id: 'chips',      title: 'Chips',           description: 'The chip prop — the same object mono-tag-input takes — configures every selection chip, including behaviour: inline, which keeps them on one line in a strip scrolled only by the ‹ › buttons.' },
  { id: 'custom-keys', title: 'Custom keys',     description: 'keyExpr + a field or function displayExpr feed natural-shape rows ({ id, first, … }) — modelValue is the key.' },
  { id: 'customized', title: 'Customized',       description: 'Override per-part styling (root/label/value/message) with the cssClass prop, like mono-select.' },
  { id: 'css-vars',   title: 'CSS variables',    description: 'Theme the accent and border with the --mono-dropdown-table-* custom properties (they cascade through the shadow boundary).' },
  { id: 'event-change', title: 'Event: change',  description: 'Listen to change — detail carries modelValue + the resolved selectedItems.' },
  { id: 'event-log',  title: 'Event log',        description: 'Live log of change as rows are picked and cleared (multi-select).' },
  { id: 'datasource', title: 'Remote DataSource', description: 'Bound to a remote OData source. Selected keys are resolved to display text via store.load (never byKey), and mono-table-search runs server-side.' },
  { id: 'select-all-remote', title: 'Select all (server-side)', description: 'mono-table-checkbox type="all" drains the remote source and selects every row the current search matches, including ones the panel never rendered.' },
]
