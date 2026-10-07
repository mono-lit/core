import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

import { SHADOW_ENTRY_TO_TAGS } from '../../../packages/helper/src/vite/shadow-manifest'

// ---------------------------------------------------------------------------
// mono-shadow-demos
//
// Derives the "Shadow" demo variant from the EXISTING `demos/<name>/vue/<id>.vue`
// source at build time — no hand-maintained duplicate files. `DemoSingle.vue`
// imports each vue demo a second time with a `?shadow` (compiled component) or
// `?shadow-raw` (transformed source string) query; this plugin serves those by
// rewriting only what differs for the shadow build:
//
//   import '@mono-lit/helper/ui/<name>'  →  import '@mono-lit/helper/ui/shadow/<name>'
//   <mono-<name> …>                 →  <mono-shadow-<name> …>   (every registered
//                                      tag of the entry — incl. multi-element
//                                      entries like table/breadcrumb)
//
// Every component with a shadow build qualifies (read from the central
// SHADOW_ENTRY_TO_TAGS map). A demo that uses a subject SUB-tag with no shadow
// build (e.g. `mono-menu-list` — shadow menu is items-mode only) is suppressed to
// a `null` module so no broken Shadow tab appears. Cross-component children
// (e.g. a `<mono-button>` inside a card demo) stay light — same as the real app.
//
// The compiled `?shadow` request resolves to a DISTINCT virtual path
// (`<abs>.__mono_shadow__.vue`) — a real-looking `.vue` id (NOT `\0`-prefixed, which
// @vitejs/plugin-vue skips) so plugin-vue compiles it as a separate SFC with its own
// descriptor cache (a bare same-path `?query` would collide with the light SFC's
// descriptor). `?shadow-raw` returns a plain string module.
// ---------------------------------------------------------------------------

/** Marker injected into the basename so the derived SFC has a unique filename. */
const SHADOW_MARK = '.__mono_shadow__.vue'
const RAW_PREFIX = '\0mono-shadow-raw:'
const NULL_ID = '\0mono-shadow-null'
const NULL_RAW_ID = '\0mono-shadow-null-raw'

/** Subject component name from a `…/demos/<name>/vue/<id>.vue` path. */
function demoNameOf(p: string): string | null {
  const m = p.replace(/\\/g, '/').match(/\/demos\/([^/]+)\/vue\//)
  return m ? m[1] : null
}

/** Demo id (the file basename without extension) from a `…/vue/<id>.vue` path. */
function demoIdOf(p: string): string | null {
  const m = p.replace(/\\/g, '/').match(/\/demos\/[^/]+\/vue\/([^/]+)\.vue$/)
  return m ? m[1] : null
}

// Demo ids that get NO Shadow tab in ANY component. Previously the `customized`
// demos were suppressed here (their page-level `:css-class`/utility CSS couldn't
// cross the shadow boundary → unstyled). Every shadow build now adopts the page
// utility sheet into its shadow root (see `adoptUtilityStyles`/`withShadowUtilityStyles`),
// so `cssClass` UnoCSS utilities DO paint inside the shadow tree — `customized`
// is no longer suppressed. (Demos must use global styles, not scoped `:deep()`,
// which still can't cross the boundary.)
const SHADOW_SUPPRESSED_DEMO_IDS = new Set<string>([
  // breadcrumb/composition: a child <mono-breadcrumb-list> registers with its
  // wrapper through cross-element closest(), which the shadow build cannot do
  // (and SSR cannot do at all) — so the shadow tab renders the lists STANDALONE
  // and shows a different breadcrumb from the other two tabs.
  'composition',
])

/** A `<name>` qualifies when its shadow build registers at least one tag. */
function qualifies(name: string): boolean {
  return Boolean(SHADOW_ENTRY_TO_TAGS[name]?.length)
}

/**
 * Rewrite the subject component's import + EVERY tag it registers to the shadow
 * build. Manifest-driven so multi-element entries work too: `table` rewrites all
 * six `mono-table-*` tags, `breadcrumb` rewrites `mono-breadcrumb` AND
 * `mono-breadcrumb-list`. Each tag replacement is anchored to a `<`/`</` (element
 * position) and bounded by `(?![\w-])`, so it rewrites only real element tags —
 * NEVER a CSS class such as `class="mono-table-sel"` or `class="mono-breadcrumb"`
 * (a bare tag name can also be a class name). Longest tag first so
 * `mono-table-paging-group` wins before `mono-table-paging` and
 * `mono-breadcrumb-list` before `mono-breadcrumb`.
 */
function toShadowSource(src: string, name: string): string {
  let out = src.replace(
    new RegExp(`@mono-lit/helper/ui/${name}(?![\\w-])`, 'g'),
    `@mono-lit/helper/ui/shadow/${name}`,
  )

  const shadowTags = [...(SHADOW_ENTRY_TO_TAGS[name] ?? [])].sort(
    (a, b) => b.length - a.length,
  )
  for (const shadowTag of shadowTags) {
    const lightTag = shadowTag.replace(/^mono-shadow-/, 'mono-')
    out = out.replace(
      new RegExp(`(</?)${lightTag}(?![\\w-])`, 'g'),
      `$1${shadowTag}`,
    )
  }
  return out
}

/**
 * After transforming, a REGISTERED sub-tag has become `<mono-shadow-<name>-…>`;
 * only an UNregistered subject sub-tag (e.g. `mono-menu-list`, which the shadow
 * menu build doesn't register — shadow menu is items-mode only) survives as a
 * bare `<mono-<name>-…>`. Such a demo can't render a valid shadow variant, so we
 * suppress its Shadow tab instead of emitting an undefined element.
 */
function usesUnregisteredSubTag(shadowSrc: string, name: string): boolean {
  return new RegExp(`<mono-${name}-[a-z]`, 'i').test(shadowSrc)
}

/** Read the original vue source for a derived `<abs>.__mono_shadow__.vue` id. */
function loadDerived(markedAbs: string): { src: string; name: string } | null {
  const abs = markedAbs.replace(SHADOW_MARK, '.vue')
  const name = demoNameOf(abs)
  if (!name) return null
  return { src: fs.readFileSync(abs, 'utf-8'), name }
}

export function monoShadowDemosPlugin(): Plugin {
  return {
    name: 'mono-shadow-demos',
    enforce: 'pre',

    resolveId(source, importer) {
      // Claim our derived SFC id (the main request AND plugin-vue's `?vue&type=…`
      // sub-requests) so Vite doesn't try to read it from disk.
      if (source.includes(SHADOW_MARK)) return source
      if (source.startsWith(RAW_PREFIX)) return source
      if (source === NULL_ID || source === NULL_RAW_ID) return source

      const qIndex = source.indexOf('?')
      if (qIndex === -1) return null
      const query = source.slice(qIndex + 1)
      if (query !== 'shadow' && query !== 'shadow-raw') return null

      const clean = source.slice(0, qIndex)
      const abs = path.isAbsolute(clean)
        ? clean
        : path.resolve(path.dirname(importer ?? ''), clean)

      const name = demoNameOf(abs)
      if (!name || !qualifies(name)) {
        return query === 'shadow-raw' ? NULL_RAW_ID : NULL_ID
      }

      // Suppress demos whose id opts out of a Shadow tab everywhere (e.g. the
      // page-CSS-customized demos that can't style across the shadow boundary).
      const id = demoIdOf(abs)
      if (id && SHADOW_SUPPRESSED_DEMO_IDS.has(id)) {
        return query === 'shadow-raw' ? NULL_RAW_ID : NULL_ID
      }

      // Suppress demos that use a subject sub-tag with no shadow build.
      const shadow = toShadowSource(fs.readFileSync(abs, 'utf-8'), name)
      if (usesUnregisteredSubTag(shadow, name)) {
        return query === 'shadow-raw' ? NULL_RAW_ID : NULL_ID
      }

      return query === 'shadow-raw'
        ? RAW_PREFIX + abs
        : abs.replace(/\.vue$/, SHADOW_MARK)
    },

    load(id) {
      if (id === NULL_ID) return 'export default null'
      if (id === NULL_RAW_ID) return 'export default ""'

      // Raw transformed source string (plain JS module — plugin-vue ignores it).
      if (id.startsWith(RAW_PREFIX)) {
        const abs = id.slice(RAW_PREFIX.length)
        const name = demoNameOf(abs)
        if (!name) return 'export default ""'
        const src = fs.readFileSync(abs, 'utf-8')
        return `export default ${JSON.stringify(toShadowSource(src, name))}`
      }

      // The derived SFC's MAIN request (sub-requests carry a `?…` query and are
      // served by plugin-vue from its descriptor cache).
      if (id.endsWith(SHADOW_MARK)) {
        const derived = loadDerived(id)
        if (!derived) return null
        return toShadowSource(derived.src, derived.name)
      }

      return null
    },
  }
}
