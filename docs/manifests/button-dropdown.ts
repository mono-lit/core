import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  {
    id: 'basic',
    title: 'Collapsing on min',
    description:
      'While buttons.length <= min the entries render as plain buttons; past that they ALL move into the dropdown and only the ⋮ trigger is left. Change either select to cross the threshold. Each entry keeps its own mono-button props (color, variant, disabled) and its own onClick, and the element also emits click carrying the item and its index.',
  },
  {
    id: 'trigger',
    title: 'Row actions + custom trigger',
    description:
      'The realistic case: one menu per table row, with `trigger` shaping the ⋮ button from the same ButtonProps. Because the entries are real <mono-button>s, button-only behaviour still works inside the menu — Approve uses `handler`, so it drives its own spinner while the promise runs.',
  },
]
