import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',          title: 'Basic',          description: 'Default colors across the palette.' },
  { id: 'size',           title: 'Sizes',          description: 'xs, sm, md, lg, xl.' },
  { id: 'colors',         title: 'Colors',         description: 'Pick a colour; every variant re-paints live.' },
  { id: 'shape',          title: 'Rounded',        description: 'One prop for corners: none, the xs-xxl scale, or full. Unset follows the theme per-size radius. A FAB is a fixed square plus rounded=full, and unlike the old fab prop it takes any colour or variant.' },
  { id: 'text-with-icon', title: 'Text with icon', description: 'Icon slot with left or right position.' },
  { id: 'prepend-append', title: 'Prepend & append', description: 'Affix zones beside the label that are clickable on their own — an icon, HTML, or a whole component — with an optional divider per side.' },
  { id: 'state',          title: 'States',         description: 'Disabled, loading and full width.' },
  { id: 'badge',          title: 'Badges',         description: 'Notification badge in four colors.' },
  { id: 'link',           title: 'Link buttons',   description: 'Renders as <a> when href is set.' },
  { id: 'type',           title: 'Button type',    description: 'button, submit, reset.' },
  { id: 'icon-only',      title: 'Icon buttons',   description: 'Icon-only buttons with optional badge or tooltip.' },

  { id: 'button-with-input', title: 'Button with input', description: 'Inline input + button groups with aligned heights.' },
  { id: 'rate-limit',     title: 'Throttle & debounce', description: 'Rate-limit clicks with the throttle and debounce props.' },
  { id: 'async-loading',  title: 'Async loading',   description: 'The button drives its own spinner from an async handler.' },
  { id: 'customized',     title: 'Customized',     description: 'Override per-element styling with the cssClass prop (Vue) or extra utility classes (CSS).' },
]
