// Docs regression guard: a demo's `css/` variant and its `vue/` variant must lay out
// the same, so switching the Vue + Light DOM / Vue + CSS / Vue + Shadow DOM tabs on a
// demo card never changes the width or spacing of what you are looking at.
//
// Why this exists: `DemoPreview.vue` renders the stage as a column flexbox with
// `align-items: center`, which sizes every child to its own content — that is what
// keeps a small demo (one button, a checkbox) centred rather than pinned left, but it
// also means a demo fills the stage only if its wrapper declares `width: 100%`. The
// two variants are authored separately (the `css/` one is hand-written HTML), so they
// drifted: `accordion/vue/sizes.vue` had `width: 100%` and `accordion/css/sizes.vue`
// did not, and the CSS tab rendered visibly narrower. Stretching the stage would hide
// that at the cost of the centring, so the agreement is enforced here at the source
// instead — which also keeps the two tabs' *View source* / *Copy* output consistent.
//
// The Shadow variant is never checked because it cannot drift: `mono-shadow-demos.ts`
// derives it from the SAME `vue/` file, rewriting only the import and the tag names.
//
// Static only — no browser. Takes `{ reporter }` and ignores `page`.

import fs from 'node:fs'
import path from 'node:path'
import { PKG } from './harness.mjs'

const DEMOS = path.join(PKG, '../../docs/demos')

/**
 * Layout properties whose disagreement is visible when you switch tabs.
 * `box-sizing` is in here because a `width: 100%` root that also has padding renders
 * a padding-width WIDER than the stage under the default `content-box` — so two roots
 * can both say `width: 100%` and still come out different sizes.
 */
const KEYS = ['width', 'box-sizing', 'display', 'gap', 'flex-direction']

/**
 * Pairs whose roots legitimately differ, with the reason. Every entry here is a demo
 * whose two variants show DIFFERENT CONTENT, not the same content laid out two ways —
 * so there is no shared wrapper to agree on. Adding to this list should require the
 * same kind of justification.
 */
const ALLOWED = new Map([
  // The CSS tab is a dashed "this prop lives on the custom element — see the Vue tab"
  // notice, not a rendering of the control, so it has no grid to match. Only the pairs
  // whose Vue root actually declares a grid are listed; the rest of that family agrees
  // on all four keys already and is checked normally.
  ...['custom-keys', 'grouped-large', 'grouped-static', 'search-expr'].map((id) => [
    `select/${id}`, 'CSS variant is a "no plain-HTML counterpart" notice',
  ]),
  ...['custom-keys', 'grouped-large', 'grouped-static', 'search-expr'].map((id) => [
    `tag-input/${id}`, 'CSS variant is a "no plain-HTML counterpart" notice',
  ]),
  // Formatting is a behaviour of the component, not markup — there is nothing to hand-write.
  ...['format-number', 'format-template'].map((id) => [
    `input/${id}`, 'CSS variant is a "no plain-HTML counterpart" notice',
  ]),
])

/** The opening tag of the first element inside `<template>`, comments skipped. */
function rootOpenTag(src) {
  const t = src.indexOf('<template>')
  if (t < 0) return null
  let i = t + '<template>'.length
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i)
      if (e < 0) return null
      i = e + 3
      continue
    }
    break
  }
  if (src[i] !== '<') return null
  const close = src.indexOf('>', i)
  return close < 0 ? null : src.slice(i, close + 1)
}

/**
 * The root's inline style. A `:style="wrapStyle"` binding is resolved back to its
 * `const` in the same file (the menu demos hold the wrapper style that way, and
 * without this they read as a mismatch against a css/ twin that inlines the same
 * string).
 */
function rootStyle(src) {
  const open = rootOpenTag(src)
  if (open === null) return null
  const literal = open.match(/\bstyle="([^"]*)"/)
  if (literal) return literal[1]

  const bound = open.match(/:style="([^"]*)"/)
  if (!bound) return ''
  const expr = bound[1].trim()
  if (!/^[A-Za-z_$][\w$]*$/.test(expr)) return null // computed — can't compare statically
  const decl = src.match(
    new RegExp(`const\\s+${expr}\\s*=\\s*['"\`]([^'"\`]*)['"\`]`, 's'),
  )
  return decl ? decl[1] : null
}

function declarations(style) {
  const out = {}
  for (const part of style.split(';')) {
    const c = part.indexOf(':')
    if (c < 0) continue
    out[part.slice(0, c).trim()] = part.slice(c + 1).replace(/\s+/g, ' ').trim()
  }
  return out
}

export async function run({ reporter }) {
  let compared = 0
  const mismatches = []
  const unparsed = []
  const staleAllowances = new Set(ALLOWED.keys())

  for (const comp of fs.readdirSync(DEMOS, { withFileTypes: true })) {
    if (!comp.isDirectory()) continue
    const cssDir = path.join(DEMOS, comp.name, 'css')
    const vueDir = path.join(DEMOS, comp.name, 'vue')
    if (!fs.existsSync(cssDir) || !fs.existsSync(vueDir)) continue

    for (const file of fs.readdirSync(cssDir)) {
      if (!file.endsWith('.vue')) continue
      const twin = path.join(vueDir, file)
      if (!fs.existsSync(twin)) continue

      const key = `${comp.name}/${file.replace(/\.vue$/, '')}`
      const cssStyle = rootStyle(fs.readFileSync(path.join(cssDir, file), 'utf8'))
      const vueStyle = rootStyle(fs.readFileSync(twin, 'utf8'))
      if (cssStyle === null || vueStyle === null) {
        unparsed.push(key)
        continue
      }

      const a = declarations(cssStyle)
      const b = declarations(vueStyle)
      const diff = KEYS.filter((k) => (a[k] ?? '') !== (b[k] ?? ''))

      if (ALLOWED.has(key)) {
        // Exempt from failing — but an entry that no longer differs (or names a pair
        // that no longer exists) stays in `staleAllowances` and is reported below.
        if (diff.length) staleAllowances.delete(key)
        continue
      }

      compared++
      if (diff.length) {
        mismatches.push(
          `${key}: ` +
            diff.map((k) => `${k} css=${a[k] ?? '-'} vue=${b[k] ?? '-'}`).join(', '),
        )
      }
    }
  }

  reporter.check(
    `demo css/ and vue/ roots agree on ${KEYS.join(' / ')}`,
    mismatches.length === 0,
    mismatches.slice(0, 6).join(' | '),
  )

  reporter.check(
    'every demo pair root was parseable',
    unparsed.length === 0,
    `could not read a root style for: ${unparsed.join(', ')}`,
  )

  // A pair that no longer differs should lose its exemption, so the list stays honest.
  reporter.check(
    'no allowlist entry has become unnecessary',
    staleAllowances.size === 0,
    `these now match and can leave ALLOWED: ${[...staleAllowances].join(', ')}`,
  )

  reporter.check(`compared ${compared} demo pairs`, compared > 200, `only ${compared}`)
}
