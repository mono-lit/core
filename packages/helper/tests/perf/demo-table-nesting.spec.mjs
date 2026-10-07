// Docs convention guard: `<mono-table-error>` is never written bare in a row
// section.
//
// `<tbody>`'s content model is `<tr>` and nothing else. The element wraps itself
// in one at runtime, which is why the bare form worked in the demos for as long
// as it did — but Vue's compiler flags it on every consumer build
// ("<mono-table-error> cannot be child of <tbody>"), and a server-rendered page
// foster-parents it out of the table before hydration. So the taught form is
// `<tr><td colspan><mono-table-error>`, and the element adopts that row. This
// keeps the demos and the doc snippets on that form.
//
// Static only — no browser. Takes `{ reporter }` and ignores `page`.

import fs from 'node:fs'
import path from 'node:path'
import { PKG } from './harness.mjs'

const DEMOS = path.join(PKG, '../../docs/demos')
const DOCS = path.join(PKG, '../../docs/ui')

/** The tags that may only hold rows. `table` is here for the `<tr>`-less case. */
const ROW_SECTIONS = new Set(['table', 'tbody', 'thead', 'tfoot'])

/** Every element the guard covers. Loading/empty are taught in `<caption>`. */
const ELEMENTS = /<(mono-(?:shadow-)?table-(?:error|loading|empty))\b/g

function sources() {
  const out = []
  for (const comp of fs.readdirSync(DEMOS, { withFileTypes: true })) {
    if (!comp.isDirectory()) continue
    for (const variant of ['css', 'vue']) {
      const dir = path.join(DEMOS, comp.name, variant)
      if (!fs.existsSync(dir)) continue
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.vue')) continue
        out.push({ rel: `demos/${comp.name}/${variant}/${f}`, src: fs.readFileSync(path.join(dir, f), 'utf8') })
      }
    }
  }
  // Doc pages: only their fenced code, which is what a reader copies.
  for (const f of fs.readdirSync(DOCS)) {
    if (!f.endsWith('.md')) continue
    const md = fs.readFileSync(path.join(DOCS, f), 'utf8')
    const fences = [...md.matchAll(/```[a-z]*\r?\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n')
    out.push({ rel: `ui/${f}`, src: fences })
  }
  return out
}

/**
 * The nearest still-open ancestor tag at `index`, by a small tag-stack walk.
 * Void/self-closed tags and comments are skipped; good enough for demo markup.
 */
function enclosingTag(src, index) {
  const stack = []
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g
  let m
  while ((m = re.exec(src)) && m.index < index) {
    if (m[0].startsWith('<!--')) continue
    if (m[1]) {
      const i = stack.lastIndexOf(m[1].toLowerCase())
      if (i >= 0) stack.length = i
    } else if (!m[3]) {
      stack.push(m[2].toLowerCase())
    }
  }
  return stack[stack.length - 1] ?? null
}

export async function run({ reporter }) {
  const offenders = []
  let placements = 0

  for (const { rel, src } of sources()) {
    for (const m of src.matchAll(ELEMENTS)) {
      placements++
      const parent = enclosingTag(src, m.index)
      if (parent && ROW_SECTIONS.has(parent)) {
        const line = src.slice(0, m.index).split('\n').length
        offenders.push(`${rel}:${line}  <${m[1]}> directly in <${parent}>`)
      }
    }
  }

  // A guard that scans nothing passes vacuously; the demos place these elements
  // well over a dozen times.
  reporter.check(
    'the scan found the table elements it exists to check',
    placements >= 12,
    `${placements} placements scanned`,
  )

  reporter.check(
    'no mono-table-error/loading/empty is written bare in a row section',
    offenders.length === 0,
    offenders.length
      ? `${offenders.length} offender(s):\n        ${offenders.join('\n        ')}` +
        '\n        (write <tr><td colspan> for the error bar; <caption> for loading/empty)'
      : `${placements} placements, all in <tr><td> or <caption>`,
  )
}
