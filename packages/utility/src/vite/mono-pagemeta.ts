import { remoteGate, type MonoRemoteGateOptions } from './remote-matcher'
import type { Plugin } from 'vite'

export interface MonoPageMetaPluginOptions extends MonoRemoteGateOptions {}

/**
 * Remove every `definePageMeta( … )` call from `code`, matching the call's
 * argument list with a balanced-delimiter scan (so nested `{}`/`[]`/`()`,
 * strings, template literals and comments inside the args are handled). Returns
 * the original string unchanged if there's nothing to strip, or `null` if the
 * source looks malformed (unterminated call) so the caller can bail safely.
 */
function stripDefinePageMeta(code: string): string | null {
  const MACRO = 'definePageMeta'
  let out = ''
  let last = 0
  let i = 0

  while (i < code.length) {
    const at = code.indexOf(MACRO, i)
    if (at === -1) break

    // Require a word boundary before the macro (not part of a longer ident).
    const before = at > 0 ? code[at - 1] : ''
    if (before && /[A-Za-z0-9_$]/.test(before)) {
      i = at + MACRO.length
      continue
    }

    // Skip whitespace between the name and its `(`.
    let p = at + MACRO.length
    while (p < code.length && /\s/.test(code[p]!)) p++
    if (code[p] !== '(') {
      i = at + MACRO.length
      continue
    }

    // Walk from `(` to its matching `)`, honoring strings/templates/comments.
    const close = matchClose(code, p)
    if (close === -1) return null // unterminated — leave file untouched

    out += code.slice(last, at)
    last = close + 1
    i = close + 1
  }

  if (last === 0) return code
  out += code.slice(last)
  return out
}

/** Index of the `)` matching the `(` at `open`, or -1 if unbalanced. */
function matchClose(code: string, open: number): number {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    const c = code[i]!
    // String / template literals — skip to their close.
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(code, i)
      if (i === -1) return -1
      continue
    }
    // Comments.
    if (c === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i + 2)
      if (nl === -1) return -1
      i = nl
      continue
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      if (end === -1) return -1
      i = end + 1
      continue
    }
    if (c === '(' || c === '{' || c === '[') depth++
    else if (c === ')' || c === '}' || c === ']') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Index of the closing quote for the string/template starting at `start`. */
function skipString(code: string, start: number): number {
  const quote = code[start]!
  for (let i = start + 1; i < code.length; i++) {
    const c = code[i]!
    if (c === '\\') {
      i++ // skip escaped char
      continue
    }
    if (c === quote) return i
  }
  return -1
}

/**
 * Vite plugin: strip the Nuxt page macro `definePageMeta({ … })` from synced
 * remote `.vue` files (those under `.mono/apps/`) so it never reaches the Vue/Vite
 * host's runtime.
 *
 * The Vue host doesn't need the macro: route META (layout/title) is injected
 * separately by the host's `extendRoute` via `parsePageMetaFromFile`, which reads
 * the page from disk (and so is unaffected by this in-memory strip). Removing the
 * call outright — rather than rewriting it to unplugin-vue-router's `definePage`
 * — means we don't depend on vue-router's own macro-stripping transform (and its
 * `transform.filter`/ordering) ever running on the same module. Our single
 * `enforce: 'pre'` transform, before `@vitejs/plugin-vue` compiles the SFC, is
 * all that's required.
 *
 * `enforce: 'pre'` so it runs before the SFC is compiled — place `monoVue()`
 * before `VueRouter()` in the plugins array.
 */
export function monoPageMetaToDefinePage(
  options: MonoPageMetaPluginOptions = {},
): Plugin {
  const isRemote = remoteGate(options)

  return {
    name: 'mono-strip-pagemeta',
    enforce: 'pre',
    transform(code: string, id: string) {
      const file = id?.split('?')[0]?.replace(/\\/g, '/')
      if (!file || !file.endsWith('.vue') || !isRemote(file)) return
      if (!code.includes('definePageMeta')) return

      const out = stripDefinePageMeta(code)
      return !out || out === code ? undefined : { code: out, map: null }
    },
  }
}

/** Clearer alias for {@link monoPageMetaToDefinePage}. */
export const monoStripPageMeta = monoPageMetaToDefinePage
