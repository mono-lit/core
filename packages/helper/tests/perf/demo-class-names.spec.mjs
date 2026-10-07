// Docs convention guard: every class a demo defines for ITSELF is `example-*`.
//
// Why this exists: each demo used to invent its own prefix — 83 of them across
// 370 class names (`dept-card`, `department-card`, `css-table-card`, `report-card`,
// `stat-card`, `fc-new`, `ddt-value`, plus bare words like `avatar` and `band`).
// "View source" on every demo shows that CSS, so the inconsistency was
// user-facing, and eight css/vue twins had drifted to different names for the
// same wrapper (`css-table-card` vs `department-card`).
//
// Static only — no browser. Takes `{ reporter }` and ignores `page`.

import fs from 'node:fs'
import path from 'node:path'
import { PKG } from './harness.mjs'

const DEMOS = path.join(PKG, '../../docs/demos')

/** Classes a demo may name without owning them. */
const FOREIGN = /^(mono|i|vp)-/

/**
 * `.name` in a style block. Only a DIGIT before the dot rules it out (`0.5rem`);
 * a letter must be allowed or the second half of a compound selector
 * (`.example-imp-status.is-ok`) is invisible — which is exactly how three `is-*`
 * classes escaped the original rename.
 */
const DEFINED = /(?<!\d)\.(-?[A-Za-z_][\w-]*)/g

function demoFiles() {
  const out = []
  for (const comp of fs.readdirSync(DEMOS, { withFileTypes: true })) {
    if (!comp.isDirectory()) continue
    for (const variant of ['css', 'vue']) {
      const dir = path.join(DEMOS, comp.name, variant)
      if (!fs.existsSync(dir)) continue
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.vue')) continue
        out.push({
          rel: `${comp.name}/${variant}/${f.replace(/\.vue$/, '')}`,
          comp: comp.name,
          id: f.replace(/\.vue$/, ''),
          src: fs.readFileSync(path.join(dir, f), 'utf8'),
        })
      }
    }
  }
  return out
}

const styleBlocks = (src) => [...src.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)]

export async function run({ reporter }) {
  const files = demoFiles()
  const offenders = []
  const orphans = []
  const globalOwners = new Map()
  let withStyles = 0
  let checked = 0

  for (const f of files) {
    const blocks = styleBlocks(f.src)
    if (!blocks.length) continue
    const styles = blocks.map((b) => b[2]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '')
    const rest = f.src.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

    const defined = new Set()
    for (const m of styles.matchAll(DEFINED)) if (!FOREIGN.test(m[1])) defined.add(m[1])
    if (!defined.size) continue
    withStyles++

    // 1. Everything a demo defines for itself is example-*.
    const wrong = [...defined].filter((c) => !c.startsWith('example-'))
    if (wrong.length) offenders.push(`${f.rel}: ${wrong.join(', ')}`)

    // 2. Defined <-> referenced, so a half-applied rename cannot ship. A class
    //    can be built dynamically (`` `example-avatar-color-${i}` ``), so the
    //    static part of a template literal counts as a prefix for every class
    //    that starts with it — without this the concrete classes read as unused.
    const used = new Set([...rest.matchAll(/(?<![\w-])(example-[\w-]+)/g)].map((m) => m[1]))
    const prefixes = [...rest.matchAll(/(?<![\w-])(example-[\w-]*?)\$\{/g)].map((m) => m[1])
    const unused = [...defined].filter(
      (c) => c.startsWith('example-') && !used.has(c) && !prefixes.some((p) => c.startsWith(p)),
    )
    const missing = [...used].filter((c) => !defined.has(c) && !prefixes.includes(c))
    if (unused.length) orphans.push(`${f.rel}: defined but never used — ${unused.join(', ')}`)
    if (missing.length) orphans.push(`${f.rel}: used but never defined — ${missing.join(', ')}`)

    // 3. A non-scoped block publishes page-wide. That is deliberate (the names go
    //    to a web component via :css-class, where a scoped hash would never land),
    //    but it means two DIFFERENT demos of one component must not define the
    //    same name — a page renders every demo of its component, css twin included.
    const isGlobal = blocks.some((b) => !/\bscoped\b/.test(b[1]))
    if (isGlobal) {
      for (const c of defined) {
        if (!globalOwners.has(c)) globalOwners.set(c, new Set())
        globalOwners.get(c).add(`${f.comp}/${f.id}`)
      }
    }
    checked++
  }

  const clashes = [...globalOwners.entries()]
    .filter(([, ids]) => ids.size > 1)
    .map(([c, ids]) => `${c} <- ${[...ids].join(' & ')}`)

  reporter.check(
    'every class a demo defines for itself is example-*',
    offenders.length === 0,
    `rename these: ${offenders.slice(0, 8).join(' | ')}`,
  )

  reporter.check(
    'demo classes are both defined and referenced',
    orphans.length === 0,
    orphans.slice(0, 8).join(' | '),
  )

  reporter.check(
    'no two demos of one component define the same page-global class',
    clashes.length === 0,
    `these would cross-apply: ${clashes.join(' | ')}`,
  )

  reporter.check(`checked ${checked} demo files with their own CSS`, withStyles > 100,
    `only ${withStyles}`)
}
