// Legacy class aliases for the attribute-styled table sheets.
//
// The Basecoat port moved `table.css` and `dropdown-table.css` to ATTRIBUTE
// selectors (`[mono-table]`, `[mono-sticky-right]`, `[mono-dd-region="body"]`).
// The pre-port contract was CLASSES, and — unlike every other component — the
// table's markup is largely written BY THE CONSUMER: `<div class="mono-table-scroll">
// <table class="mono-table mono-table-sticky-head"> … <th class="mono-table-sticky-right">`.
// Host apps (esw-ui) carry hundreds of those. So both spellings must paint the same.
//
// This script rewrites every `[mono-x]` in those two sheets into
// `:is([mono-x],.legacy-class)` from the maps below — same specificity
// (`:is()` takes the heaviest argument; an attribute and a class both weigh
// (0,1,0)); a VALUE attribute (`[mono-dd-region="body"]`) aliases the old
// compound class inside `:where()` so the weight does not rise. Idempotent:
// its own aliases are stripped before re-applying, so run it after any edit:
//
//   node scripts/legacy-class-alias.mjs          rewrite both sheets in place
//   node scripts/legacy-class-alias.mjs --check  exit 1 if a sheet is stale
//
// `tests/perf/legacy-class-alias.spec.mjs` runs the --check.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** bare attribute → legacy class (without the dot), per sheet */
const TABLE_BARE = {
  // roots + sub-elements (identity names)
  ...Object.fromEntries(
    [
      'mono-table', 'mono-table-scroll', 'mono-table-foot', 'mono-table-shell', 'mono-table-card', 'mono-table-toolbar',
      'mono-table-info', 'mono-table-page-size', 'mono-table-search', 'mono-table-empty', 'mono-table-error',
      'mono-table-loading', 'mono-table-checkbox', 'mono-table-detail', 'mono-table-summary', 'mono-table-th', 'mono-table-sort',
      'mono-checkbox', 'mono-radio', 'mono-switch', 'mono-input', 'mono-date', 'mono-icon',
    ].map((n) => [n, n]),
  ),
  'mono-table-paging': 'mono-table-pg',
  'mono-table-paging-group': 'mono-table-pg-group',
  // table modifiers the consumer writes
  'mono-sticky-head': 'mono-table-sticky-head',
  'mono-sticky-left': 'mono-table-sticky-left',
  'mono-sticky-right': 'mono-table-sticky-right',
  'mono-sticky-foot': 'mono-table-sticky-foot',
  'mono-fixed': 'mono-table-fixed',
  'mono-filler': 'mono-table-filler',
  'mono-fill': 'mono-table-fill',
  'mono-wide': 'mono-table-wide',
  'mono-scroll-y': 'scroll-y',
  'mono-editing': 'mono-table-row-editing',
  // a selected row inside a dropdown-table's panel is painted by THIS sheet's rule
  // and spelled `.mono-dd-row-selected` by the host, so it aliases both
  'mono-selected': ['mono-table-row-selected', 'mono-dd-row-selected'],
  'mono-sel': 'mono-table-sel',
  // paging
  'mono-pgb': 'mono-table-pgb',
  'mono-pg-el': 'mono-table-pg-el',
  'mono-pg-scroll': 'mono-table-pg-scroll',
  'mono-loading-row': 'mono-table-loading-row',
  'mono-loading-spinner': 'mono-table-spinner',
  // states
  'mono-open': 'open',
  'mono-active': 'active',
  'mono-on': 'on',
  'mono-ghost': 'ghost',
  'mono-no-icon': 'no-icon',
  'mono-label-trigger': 'label-trigger',
  'mono-grabbing': 'is-grabbing',
  'mono-text': 'is-text',
  'mono-primary': 'primary',
  'mono-zone-list': 'zone-list',
}
/** prefixed families: `[mono-sort-x]` → `.mono-table-sort-x`, `[mono-th-x]` → `.mono-th-x` */
const TABLE_FAMILIES = [
  ['mono-sort-', 'mono-table-sort-'],
  ['mono-search-', 'mono-table-search-'],
  ['mono-group-', 'mono-table-group-'],
  ['mono-detail-', 'mono-table-detail-'],
  ['mono-empty-', 'mono-table-empty-'],
  ['mono-error-', 'mono-table-error-'],
  ['mono-th-', 'mono-th-'],
]
/** value attribute → legacy compound class (dotless, `a.b` form) */
const TABLE_VALUES = {
  'mono-color': (v) => `mono-table-${v}`,
}

const DROPDOWN_BARE = {
  'mono-dropdown-table': 'mono-dropdown-table',
  'mono-table': 'mono-table',
  'mono-icon': 'mono-icon',
  'mono-chip': 'mono-chip',
  'mono-input': 'mono-input',
  'mono-dd-label': 'mono-dropdown-table-label',
  'mono-dd-required-mark': 'mono-dropdown-table-required',
  'mono-dd-control': 'mono-dropdown-table-control',
  'mono-dd-trigger': 'mono-dropdown-table-trigger',
  'mono-dd-value': 'mono-dropdown-table-value',
  'mono-dd-placeholder': 'mono-dropdown-table-placeholder',
  'mono-dd-actions': 'mono-dropdown-table-actions',
  'mono-dd-clear': 'mono-dropdown-table-clear',
  'mono-dd-arrow': 'mono-dropdown-table-arrow',
  'mono-dd-panel': 'mono-dropdown-table-panel',
  'mono-dd-region': 'mono-dropdown-table-region',
  'mono-dd-scroll': 'mono-dropdown-table-scroll',
  'mono-dd-message': 'mono-dropdown-table-message',
  'mono-dd-more': 'mono-dropdown-table-more',
  'mono-dd-chip': 'mono-dropdown-table-chip',
  'mono-dd-chip-strip': 'mono-dropdown-table-chip-strip',
  'mono-dd-active': 'mono-dd-row-active',
  'mono-selected': 'mono-dd-row-selected',
  'mono-open': 'open',
  'mono-more-open': 'more-open',
  'mono-disabled': 'disabled',
  'mono-readonly': 'readonly',
  'mono-inline': 'is-inline',
  'mono-idle': 'is-idle',
  'mono-th-filter-list': 'mono-th-filter-list',
}
const DROPDOWN_VALUES = {
  'mono-dd-region': (v) => `mono-dropdown-table-region.${v}`,
  'mono-dd-message': (v) => `mono-dropdown-table-message.${v}`,
  'mono-size': (v) => `mono-dropdown-table.${v}`,
  'mono-variant': (v) => `mono-dropdown-table.${v}`,
  'mono-color': (v) => `mono-dropdown-table.${v}`,
  'mono-validation-state': (v) => `mono-dropdown-table.is-${v}`,
}

const SHEETS = [
  { file: 'src/components/table/table.css', bare: TABLE_BARE, families: TABLE_FAMILIES, values: TABLE_VALUES },
  { file: 'src/components/dropdown-table/dropdown-table.css', bare: DROPDOWN_BARE, families: [], values: DROPDOWN_VALUES },
]

const classOf = (sheet, name) => {
  if (sheet.bare[name]) return sheet.bare[name]
  for (const [from, to] of sheet.families) if (name.startsWith(from)) return to + name.slice(from.length)
  return null
}

/**
 * Strip aliases this script generated (the no-space `:is([…],.x)` /
 * `:is([…],.x,.y)` / `:is([…],:where(.x))` forms). Exported for the lints that
 * parse these sheets by selector: normalise first, then split on commas.
 */
export const stripAliases = (css) =>
  css.replace(/:is\((\[mono-[^\]]+\]),(?::where\(\.[A-Za-z0-9_.-]+\)|\.[A-Za-z0-9_.-]+(?:,\.[A-Za-z0-9_.-]+)*)\)/g, '$1')
const strip = stripAliases

const aliasPrelude = (prelude, sheet) =>
  prelude.replace(/\[(mono-[a-z0-9-]+)(?:="([^"]*)")?\]/g, (m, name, value) => {
    if (value !== undefined) {
      const fn = sheet.values[name]
      if (!fn || /[|…]/.test(value)) return m
      return `:is(${m},:where(.${fn(value)}))`
    }
    const cls = classOf(sheet, name)
    if (!cls) return m
    const list = Array.isArray(cls) ? cls : [cls]
    return `:is(${m},${list.map((c) => '.' + c).join(',')})`
  })

/** Transform one sheet: aliases are applied to rule preludes only (never comments / declarations). */
export function transform(css, sheet) {
  const src = strip(css)
  let out = '', i = 0, start = 0
  while (i < src.length) {
    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      i = end < 0 ? src.length : end + 2
      continue
    }
    const ch = src[i]
    if (ch === '{') {
      // prelude = text since the last `{`, `}` or `;` (comments inside it are kept verbatim)
      const seg = src.slice(start, i)
      out += aliasSegment(seg, sheet) + '{'
      start = i + 1
    } else if (ch === '}' || ch === ';') {
      out += src.slice(start, i + 1)
      start = i + 1
    }
    i++
  }
  out += src.slice(start)
  return out
}

/** alias only the code parts of a prelude segment, leaving embedded comments alone */
function aliasSegment(seg, sheet) {
  let res = '', i = 0
  while (i < seg.length) {
    const c = seg.indexOf('/*', i)
    if (c < 0) { res += aliasPrelude(seg.slice(i), sheet); break }
    res += aliasPrelude(seg.slice(i, c), sheet)
    const e = seg.indexOf('*/', c + 2)
    const end = e < 0 ? seg.length : e + 2
    res += seg.slice(c, end)
    i = end
  }
  return res
}

export function run({ check = false } = {}) {
  const stale = []
  for (const sheet of SHEETS) {
    const p = path.join(root, sheet.file)
    const cur = fs.readFileSync(p, 'utf8')
    const crlf = cur.includes('\r\n')
    const next = transform(cur.replace(/\r\n/g, '\n'), sheet)
    const final = crlf ? next.replace(/\n/g, '\r\n') : next
    if (final !== cur) {
      stale.push(sheet.file)
      if (!check) fs.writeFileSync(p, final)
    }
  }
  return stale
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  const stale = run({ check })
  if (check) {
    if (stale.length) { console.error('legacy class aliases are stale in: ' + stale.join(', ') + '\n  run: node scripts/legacy-class-alias.mjs'); process.exit(1) }
    console.log('legacy class aliases are current')
  } else console.log(stale.length ? 'aliased: ' + stale.join(', ') : 'nothing to do')
}
