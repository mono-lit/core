import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  {
    id: 'control',
    title: 'Control',
    description:
      'controlMonoFilterBuilder owns the filter tree; bind it with :control-filter-builder and read it back as an OData $filter string.',
  },
  {
    id: 'basic',
    title: 'Basic',
    description:
      'A filter loaded from a devextreme array. Pick a field, an OData operator and a value; the nested-rule icon pushes a rule one level deeper, the trash removes it, and Add rule / Add group extend the root. The panel below prints changed() in both shapes plus the untouched original().',
  },
  {
    id: 'from-string',
    title: 'From an OData string',
    description:
      'The same `filter` option given an OData $filter STRING — it is parsed and the rows render from it, with no extra flag. Also shows `texts` localising every operator and chrome label.',
  },
]
