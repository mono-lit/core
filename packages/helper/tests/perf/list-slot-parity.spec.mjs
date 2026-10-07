// A line rendered through `slot="list"` must be styled by the SAME rules as the option mono
// renders itself — not by a copy of them.
//
// Why this exists: the first cut of the slot's styling hand-copied four or five declarations out of
// `.mono-tag-input-item` (a dozen) into a separate block. On screen the difference was immediate —
// mono's own select-all row sat directly above the consumer's rows in a bigger font, with a divider
// the custom rows lacked and a checkbox column that did not line up. A copy cannot help drifting;
// this asserts the twin selector rides along on the ORIGINAL rule instead.
//
// It also pins the specificity trick that makes the twin usable: `:where()` wraps the CONTAINER
// only, so the twin weighs the same (0,1,0) as the native class. Written `:where(A B)` it would
// weigh nothing at all and lose to a host page's `*` reset — which is exactly what happened.
//
// Static only — no browser. Takes `{ reporter }` and ignores `page`.

import fs from 'node:fs'
import path from 'node:path'
import { PKG } from './harness.mjs'

/** Native selector → the twin its rule must also carry. */
const PAIRS = [
  // tag-input — Basecoat-ported, keyed on attributes (`[mono-tag-input] [mono-item]`)
  ['tag-input', '[mono-tag-input] [mono-item]', "[mono-list-slot]) [data-mono-type='row']"],
  ['tag-input', '[mono-tag-input] [mono-item]:hover:not([mono-disabled]):not(:disabled)', "[mono-list-slot]) [data-mono-type='row']:hover"],
  ['tag-input', '[mono-tag-input] [mono-item][mono-active]:not([mono-disabled]):not(:disabled)', '[mono-list-slot]) [data-mono-active]'],
  [
    'tag-input',
    '[mono-tag-input] [mono-item][mono-selected]:not([mono-check])',
    "[mono-list-slot]) [data-mono-type='row'][data-mono-selected]",
  ],
  // The title is a CHILD natively and IS the line in the slot, so the twin lands on the row.
  ['tag-input', '[mono-tag-input] [mono-item-title]', "[mono-list-slot]) [data-mono-type='row']"],
  ['tag-input', '[mono-tag-input] [mono-check-box]', '[mono-list-slot]) [data-mono-chrome]'],
  ['tag-input', '[mono-tag-input] [mono-group]', "[mono-list-slot]) [data-mono-type='group']"],
  // select — Basecoat-ported, keyed on attributes (`[mono-select] [mono-item]`); the twin
  // container is `[mono-list-slot]`, still wrapped in :where() so the twin weighs the same.
  ['select', '[mono-select] [mono-item]', "[mono-list-slot]) [data-mono-type='row']"],
  ['select', '[mono-select] [mono-item]:hover:not([mono-disabled]):not(:disabled)', "[mono-list-slot]) [data-mono-type='row']:hover"],
  ['select', '[mono-select] [mono-item][mono-active]:not([mono-disabled]):not(:disabled)', '[mono-list-slot]) [data-mono-active]'],
  [
    'select',
    '[mono-select] [mono-item][mono-selected]',
    "[mono-list-slot]) [data-mono-type='row'][data-mono-selected]",
  ],
  ['select', '[mono-select] [mono-group]', "[mono-list-slot]) [data-mono-type='group']"],
]

const FILES = {
  'tag-input': path.join(PKG, 'src/components/tag-input/tag-input.css'),
  select: path.join(PKG, 'src/components/select/select.css'),
}

/** Every rule in a stylesheet, as `{ selector, body }`. Comments stripped first. */
function rules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(clean))) out.push({ selector: m[1].trim(), body: m[2] })
  return out
}

/** The rule whose selector list opens with exactly this native selector. */
function ruleFor(all, selector) {
  return all.find((r) =>
    r.selector.split(',').some((s) => {
      const t = s.trim()
      return t === selector || t.startsWith(`${selector}:not(`)
    }),
  )
}

export async function run({ reporter }) {
  const parsed = Object.fromEntries(
    Object.entries(FILES).map(([k, f]) => [k, rules(fs.readFileSync(f, 'utf8'))]),
  )

  const missing = []
  for (const [file, native, twin] of PAIRS) {
    const rule = ruleFor(parsed[file], native)
    if (!rule) {
      missing.push(`${file}: no rule for ${native}`)
      continue
    }
    if (!rule.selector.includes(twin)) missing.push(`${file}: ${native} has no twin — ${twin}`)
  }

  reporter.check(
    'every native option rule also lists its slot twin',
    missing.length === 0,
    missing.join(' | '),
  )

  // The twin must be `:where(container) …`, never `:where(container …)`: the second form drops the
  // whole selector to zero specificity, where a host page's reset outranks it.
  const flattened = []
  for (const [file, list] of Object.entries(parsed)) {
    for (const rule of list) {
      for (const s of rule.selector.split(',')) {
        const t = s.trim()
        if (!t.startsWith(':where(') || !t.includes('data-mono-')) continue
        // Anything inside the parens beyond the container class means the attribute went in too.
        const inner = t.slice(':where('.length, t.indexOf(')'))
        if (/\s/.test(inner.trim())) flattened.push(`${file}: ${t}`)
      }
    }
  }

  reporter.check(
    'slot twins keep the specificity of the class they mirror',
    flattened.length === 0,
    flattened.join(' | '),
  )

  const twinCount = Object.values(parsed)
    .flat()
    .filter((r) => r.selector.includes('data-mono-')).length

  reporter.check(`checked ${PAIRS.length} native rules, ${twinCount} twinned selectors`, true)
}
