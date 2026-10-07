import { remoteGate, type MonoRemoteGateOptions } from './remote-matcher'
import type { Plugin } from 'vite'
import type { MonoPageMetaPluginOptions } from './mono-pagemeta'

export interface MonoNuxtStatePluginOptions extends MonoPageMetaPluginOptions {
  /**
   * Module the shims are imported from. Default `'@mono-lit/utility/runtime'` — change
   * it if the host aliases the package or wants its own implementation.
   */
  importFrom?: string
  /**
   * Nuxt auto-imports to shim. Default `['useState', 'clearNuxtState']`. Every
   * name listed must be exported by `importFrom`.
   */
  composables?: string[]
}

/** Files we can inject an import into. */
const SCRIPT_RE = /\.(?:vue|[cm]?[jt]sx?)$/
/** `<script …> … </script>` — captured as (open, body, close). */
const SCRIPT_BLOCK_RE = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g
/** `import <clause> from '…'` — clause captured, lazy so it stops at its own `from`. */
const IMPORT_CLAUSE_RE = /import\s+([\s\S]*?)\s+from\s*['"][^'"]+['"]/g
/** `import { … } from '#imports' | '#app' | '#app/…'` — Nuxt's virtual modules. */
const NUXT_VIRTUAL_IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*(['"])#[^'"]*\2\s*;?[^\S\n]*\n?/g

const DEFAULT_COMPOSABLES = ['useState', 'clearNuxtState']

/**
 * Vite plugin: make Nuxt's `useState()` work in a Vue/Vite host.
 *
 * A synced Nuxt remote writes `const msg = useState('msg', () => 'hello')` and
 * relies on Nuxt auto-importing it. Nothing provides that name in a plain Vue app,
 * so the page dies with `useState is not defined`. This plugin rewrites the
 * remote's modules to pull the name from `@mono-lit/utility/runtime`, whose
 * {@link ../composables/nuxt-state.useState | shim} is the same thing minus the
 * SSR payload: a keyed ref registry, so `useState('msg', () => 'hello')` resolves
 * to a shared `ref('hello')` and a keyless call to a plain one.
 *
 * Injecting an import (rather than textually rewriting the call to `ref(...)`)
 * keeps the KEY meaningful — two components on the same key must see one ref,
 * which a per-call `ref()` can't do — and doesn't depend on the host auto-importing
 * `ref`.
 *
 * Scope: files under `.mono/apps/` (the `appsMarker` option; pass `''` to cover the
 * host's own sources too). A file is left alone when it already binds the name
 * itself — an explicit import, a local `const`/`function`, or an aliased
 * (`useState as x`) Nuxt import. A PLAIN import from a Nuxt virtual module
 * (`#imports` / `#app`) is stripped first, since those specifiers resolve to
 * nothing outside Nuxt.
 *
 * `enforce: 'pre'` so `.vue` files are still raw SFC source — register before
 * `@vitejs/plugin-vue`, alongside the other `monoVue()` plugins.
 */
export function monoNuxtStateToRef(
  options: MonoNuxtStatePluginOptions = {},
): Plugin {
  const isRemote = remoteGate(options)
  const importFrom = options.importFrom ?? '@mono-lit/utility/runtime'
  const composables = options.composables?.length
    ? options.composables
    : DEFAULT_COMPOSABLES

  return {
    name: 'mono-nuxt-state-to-ref',
    enforce: 'pre',
    transform(code: string, id: string) {
      const file = id?.split('?')[0]?.replace(/\\/g, '/')
      if (!file || !SCRIPT_RE.test(file) || !isRemote(file)) return
      if (!composables.some((name) => code.includes(name))) return

      const source = stripNuxtVirtualImports(code, composables)
      const out = file.endsWith('.vue')
        ? injectIntoSfc(source, composables, importFrom)
        : injectIntoModule(source, composables, importFrom)

      return out === code ? undefined : { code: out, map: null }
    },
  }
}

/** Clearer alias for {@link monoNuxtStateToRef}. */
export const monoNuxtState = monoNuxtStateToRef

/**
 * Drop the shimmed names from `import { … } from '#imports'`-style statements
 * (dead specifiers in a Vue/Vite host), removing the statement entirely once it's
 * empty. ALIASED specifiers (`useState as counter`) are kept as-is: the local name
 * is the alias, so our injected import wouldn't satisfy the call — better to leave
 * the file untouched and let the unresolved `#imports` error say so.
 */
function stripNuxtVirtualImports(code: string, composables: string[]): string {
  if (!code.includes('#')) return code

  return code.replace(NUXT_VIRTUAL_IMPORT_RE, (statement, specifiers: string) => {
    const all = specifiers.split(',').map((s) => s.trim()).filter(Boolean)
    const kept = all.filter((s) => !composables.includes(s))

    if (kept.length === all.length) return statement // nothing of ours in here
    if (!kept.length) return ''
    return statement.replace(specifiers, ` ${kept.join(', ')} `)
  })
}

/** The names `code` actually uses that nothing else in it already binds. */
function missingBindings(code: string, composables: string[]): string[] {
  return composables.filter((name) => isReferenced(code, name) && !isBound(code, name))
}

/**
 * `name` used as a free identifier — a call, or a bare reference like
 * `onUnmounted(clearNuxtState)`. Not `obj.name`, not `myName`, not an object key
 * (`{ useState: … }`). A mention inside a comment or string can slip through; the
 * cost is one unused import, so the false positive is the cheap direction.
 */
function isReferenced(code: string, name: string): boolean {
  return new RegExp(`(?<![\\w$.])${name}(?![\\w$])\\s*(?!:)`).test(code)
}

/** Already imported, declared, or aliased-in under this exact name. */
function isBound(code: string, name: string): boolean {
  // Each import matched lazily up to ITS OWN `from`, so a statement further down
  // the file can't be swallowed into the one above it (which would read as a
  // binding for everything in between).
  for (const match of code.matchAll(IMPORT_CLAUSE_RE)) {
    if (new RegExp(`\\b${name}\\b`).test(match[1] ?? '')) return true
  }
  return (
    // `const|let|var useState =` / `function useState(`
    new RegExp(`(?:const|let|var|function)\\s+${name}\\b`).test(code) ||
    // `as useState` (a rename landing on our name)
    new RegExp(`as\\s+${name}\\b`).test(code)
  )
}

function importStatement(names: string[], from: string): string {
  return `import { ${names.join(', ')} } from '${from}'`
}

/** Non-SFC module: imports hoist, so the top of the file is always safe. */
function injectIntoModule(code: string, composables: string[], from: string): string {
  const missing = missingBindings(code, composables)
  if (!missing.length) return code
  return `${importStatement(missing, from)}\n${code}`
}

/**
 * SFC: inject per `<script>` block, right after its opening tag (each block is its
 * own module — `<script>` and `<script setup>` don't share bindings). A call that
 * appears only in the template is skipped: that name has to come from setup, and
 * there's no scope to put an import in.
 */
function injectIntoSfc(code: string, composables: string[], from: string): string {
  return code.replace(SCRIPT_BLOCK_RE, (block, open: string, body: string, close: string) => {
    const missing = missingBindings(body, composables)
    if (!missing.length) return block
    return `${open}\n${importStatement(missing, from)}${body}${close}`
  })
}
