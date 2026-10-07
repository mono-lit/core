/**
 * The Basecoat style matrix — what each of the eight styles (vega, nova, maia,
 * lyra, mira, luma, sera, rhea) says for a given upstream selector.
 *
 * A Basecoat style never touches tokens or fonts; it is a per-component set of
 * `@apply` choices (heights, radius step, padding, text size, whether a shadow
 * is present …). @mono-lit/helper mirrors every style as a FLAVOR
 * (`src/data/theme/flavors/<style>.css`): vega is the default and its values
 * are what the component CSS bakes in; the other seven are sheets of inherited
 * knobs. When porting a component, run this for each of its selectors to see
 * what the seven non-default flavors must set.
 *
 *   node scripts/basecoat-styles.mjs ".btn[data-size='sm']"      the 8 variants + diff vs vega
 *   node scripts/basecoat-styles.mjs --grep "\.btn"              every selector matching a regex
 *   node scripts/basecoat-styles.mjs --varying "\.btn"           only the selectors that differ somewhere
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { STYLES, VENDOR_DIR } from './basecoat-sync.mjs'

/** selector → utility list, per style. Nested rules keyed `parent >> &child`. */
export function matrix() {
  const out = {}
  for (const style of STYLES) {
    const css = postcss.parse(fs.readFileSync(path.join(VENDOR_DIR, 'styles', `${style}.css`), 'utf8'))
    const walk = (container, prefix) => {
      for (const node of container.nodes ?? []) {
        if (node.type === 'rule') {
          const key = prefix ? `${prefix} >> ${node.selector.replace(/\s+/g, ' ').trim()}` : node.selector.replace(/\s+/g, ' ').trim()
          const applies = []
          node.each((n) => {
            if (n.type === 'atrule' && n.name === 'apply') applies.push(...n.params.split(/\s+/))
            else if (n.type === 'decl') applies.push(`${n.prop}:${n.value}`)
          })
          out[key] ??= {}
          out[key][style] = [...(out[key][style] ?? []), ...applies]
          walk(node, key)
        } else if (node.type === 'atrule') {
          walk(node, node.name === 'layer' ? prefix : `${prefix ? prefix + ' >> ' : ''}@${node.name} ${node.params}`)
        }
      }
    }
    walk(css, '')
  }
  return out
}

/** Utilities a style adds / drops relative to vega, for one selector. */
export function diffVsVega(row) {
  const base = new Set(row.vega ?? [])
  const out = {}
  for (const style of STYLES) {
    if (style === 'vega') continue
    const mine = new Set(row[style] ?? [])
    const added = [...mine].filter((u) => !base.has(u))
    const dropped = [...base].filter((u) => !mine.has(u))
    if (added.length || dropped.length) out[style] = { added, dropped }
  }
  return out
}

function print(selector, row) {
  console.log(`\n${selector}`)
  console.log(`  vega: ${(row.vega ?? []).join(' ')}`)
  const d = diffVsVega(row)
  for (const style of STYLES) {
    if (style === 'vega') continue
    if (!row[style]) { console.log(`  ${style}: (absent)`); continue }
    if (!d[style]) { console.log(`  ${style}: = vega`); continue }
    const parts = []
    if (d[style].added.length) parts.push(`+ ${d[style].added.join(' ')}`)
    if (d[style].dropped.length) parts.push(`- ${d[style].dropped.join(' ')}`)
    console.log(`  ${style}: ${parts.join('   ')}`)
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const args = process.argv.slice(2)
  const m = matrix()
  if (args[0] === '--grep' || args[0] === '--varying') {
    const re = new RegExp(args[1] ?? '.')
    for (const [sel, row] of Object.entries(m)) {
      if (!re.test(sel)) continue
      if (args[0] === '--varying' && !Object.keys(diffVsVega(row)).length) continue
      print(sel, row)
    }
  } else if (args[0]) {
    const row = m[args[0]]
    if (!row) { console.error(`no such selector; try --grep`); process.exit(1) }
    print(args[0], row)
  } else {
    console.log(`${Object.keys(m).length} selectors across ${STYLES.length} styles; ${Object.values(m).filter((r) => Object.keys(diffVsVega(r)).length).length} vary`)
  }
}
