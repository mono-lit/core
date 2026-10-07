// src/vite/shadow-manifest.ts
//
// Single source of truth for the shadow-DOM/SSR builds: which `@mono-lit/helper/ui/
// shadow/<entry>` import registers which custom-element tag(s). Used by the
// import-driven SSR wrapper (`mono-client-only.ts`): a `.vue` file that imports
// `@mono-lit/helper/ui/shadow/button` gets its `<mono-shadow-button>` wrapped with the
// `nuxt-ssr-lit` `<LitWrapper>` (server-rendered to Declarative Shadow DOM)
// instead of `<ClientOnly>`. Every shadow element registers a `mono-shadow-<name>`
// tag — DISTINCT from the light build's `<mono-<name>>` — so both can coexist.
//
// Keep in sync with `vite.shadow.config.ts` `entry` keys. Most entries map to a
// single tag; `breadcrumb` and `table` register several from one module.

export const SHADOW_ENTRY_TO_TAGS: Record<string, readonly string[]> = {
  accordion: ['mono-shadow-accordion'],
  button: ['mono-shadow-button'],
  // Lives in `components/button/` but ships as its own entry. Its module also
  // registers `mono-shadow-button`, since every entry renders as one.
  'button-dropdown': ['mono-shadow-button-dropdown'],
  alert: ['mono-shadow-alert'],
  card: ['mono-shadow-card'],
  chart: [
    'mono-shadow-chart',
    'mono-shadow-chart-bar',
    'mono-shadow-chart-line',
    'mono-shadow-chart-pie',
    'mono-shadow-chart-doughnut',
  ],
  checkbox: ['mono-shadow-checkbox'],
  chip: ['mono-shadow-chip'],
  date: ['mono-shadow-date'],
  drawer: ['mono-shadow-drawer'],
  dropdown: ['mono-shadow-dropdown'],
  'file-upload': ['mono-shadow-file-upload'],
  input: ['mono-shadow-input'],
  menu: ['mono-shadow-menu'],
  modal: ['mono-shadow-modal'],
  nav: ['mono-shadow-nav'],
  radio: ['mono-shadow-radio'],
  select: ['mono-shadow-select'],
  sidebar: ['mono-shadow-sidebar'],
  switch: ['mono-shadow-switch'],
  'tag-input': ['mono-shadow-tag-input'],
  tabs: ['mono-shadow-tabs'],
  textarea: ['mono-shadow-textarea'],
  'rich-text-editor': ['mono-shadow-rich-text-editor'],
  breadcrumb: ['mono-shadow-breadcrumb', 'mono-shadow-breadcrumb-list'],
  filter: ['mono-shadow-filter-builder'],
  table: [
    'mono-shadow-table-info',
    'mono-shadow-table-page-size',
    'mono-shadow-table-paging',
    'mono-shadow-table-paging-group',
    'mono-shadow-table-search',
    'mono-shadow-table-sort',
    'mono-shadow-table-th',
    'mono-shadow-table-loading',
    'mono-shadow-table-detail',
    'mono-shadow-table-checkbox',
  ],
  'dropdown-table': ['mono-shadow-dropdown-table'],
}

/** Flat list of every shadow-built custom-element tag. */
export const SHADOW_TAGS: readonly string[] = Object.values(
  SHADOW_ENTRY_TO_TAGS,
).flat()

// Matches `…@mono-lit/helper/ui/shadow/<entry>…` (import specifier) — quote-agnostic
// so it catches `import '…'`, `from "…"`, and dynamic `import('…')`.
const SHADOW_IMPORT_RE = /@mono-lit\/helper\/ui\/shadow\/([a-z][\w-]*)/gi

/**
 * Extract the set of shadow tags a script block opts into, by scanning its
 * `@mono-lit/helper/ui/shadow/<entry>` imports and mapping each entry to its tag(s).
 */
export function shadowTagsFromScript(script: string): Set<string> {
  const tags = new Set<string>()
  if (!script) return tags
  SHADOW_IMPORT_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = SHADOW_IMPORT_RE.exec(script)) !== null) {
    const entry = match[1].toLowerCase()
    const entryTags = SHADOW_ENTRY_TO_TAGS[entry]
    if (entryTags) {
      for (const tag of entryTags) tags.add(tag)
    }
  }
  return tags
}
