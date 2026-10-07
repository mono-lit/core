import fs from 'node:fs'

/**
 * Page meta mono cares about: `layout` (which layout wraps the page)
 * and `title` (route title). Both optional.
 */
export interface MonoPageMeta {
  /** Layout name, or `false` for a page that opts out of layouts entirely. */
  layout?: string | false
  title?: string
}

/**
 * Extract `{ layout, title }` from a page's `<script setup>` source, supporting
 * BOTH macro forms:
 *  - Nuxt:    `definePageMeta({ layout: 'home', title: 'Home' })`
 *  - vue-router (unplugin-vue-router): `definePage({ meta: { layout, title } })`
 *
 * String-literal values only (layout/title are always literals in these apps).
 * Used by the Nuxt host module (to seed remote route meta) and by the Vite
 * host's `extendRoute` (since unplugin-vue-router reads page files from disk and
 * never sees the `definePageMeta -> definePage` Vite transform).
 */
export function parsePageMeta(code: string): MonoPageMeta {
  const meta: MonoPageMeta = {}

  // The `{ ... }` body of either `definePageMeta({ ... })` or the inner
  // `meta: { ... }` of `definePage({ meta: { ... } })`.
  const block =
    code.match(/definePageMeta\s*\(\s*\{([\s\S]*?)\}\s*\)/)?.[1] ??
    code.match(/definePage\s*\(\s*\{\s*meta\s*:\s*\{([\s\S]*?)\}\s*,?\s*\}\s*\)/)?.[1]

  if (!block) return meta

  const layout = block.match(/layout\s*:\s*['"]([^'"]+)['"]/)?.[1]
  const title = block.match(/title\s*:\s*['"]([^'"]+)['"]/)?.[1]
  if (layout) meta.layout = layout
  // `layout: false` (no layout at all) is a DECLARED value, not a missing one —
  // callers distinguish "opted out" from "said nothing" to decide whether to
  // supply a default.
  else if (/layout\s*:\s*false\b/.test(block)) meta.layout = false
  if (title) meta.title = title

  return meta
}

/** {@link parsePageMeta} for a file path (build-time, Node). Returns `{}` on read error. */
export function parsePageMetaFromFile(file: string): MonoPageMeta {
  try {
    return parsePageMeta(fs.readFileSync(file, 'utf-8'))
  } catch {
    return {}
  }
}
