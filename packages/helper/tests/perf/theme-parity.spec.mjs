// Theme regression guard: a flavor must style the LIGHT and SHADOW builds identically,
// and must not reference selectors or vars that don't exist.
//
// Why this exists: the flavor system was designed (plan/2026-05-10-multi-flavor-theme-
// system.md:135) on the assumption "Light DOM cascade is fine … no Shadow DOM piercing
// needed". The shadow build landed six weeks later and the flavor sheets were never
// revisited, so every `.theme-X .mono-Y` rule silently stopped applying to
// `<mono-shadow-Y>` — the host carries no class, its `.mono-Y` is INSIDE the shadow
// root, and the `.theme-X` ancestor is outside the boundary. Before the fix this spec
// reported all 8 components differing, with shadow font-family falling back to
// "Times New Roman".
//
// The rule this encodes: everything a flavor themes must travel as an INHERITED custom
// property (or `font-family`, which every component root declares as `inherit`).
// Descendant rules are legitimate only for things that are genuinely light DOM — the
// consumer-authored `<table mono-table>` and flatpickr's body-portaled calendar.

import fs from 'node:fs'
import os from 'node:os'
import { stripAliases } from '../../scripts/legacy-class-alias.mjs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { PKG, pageHtml } from './harness.mjs'

// This spec bundles its own entry rather than using `bundleFixture`: it needs the
// SHADOW builds of card / accordion / chip / tabs / file-upload / switch, which the
// shared alias map doesn't carry. Absolute dist paths need no aliases at all.
const require_ = createRequire(import.meta.url)
const WORKSPACE = path.resolve(PKG, '../..')

async function bundleEntries(entries) {
  const esbuild = require_(path.join(WORKSPACE, 'node_modules', 'esbuild'))
  const entryFile = path.join(os.tmpdir(), 'mono-theme-parity-entry.js')
  fs.writeFileSync(
    entryFile,
    entries.map((e) => `import '${path.join(PKG, 'dist', e).replace(/\\/g, '/')}'`).join('\n'),
  )
  const built = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: 'iife',
    write: false,
    platform: 'browser',
    logLevel: 'error',
    nodePaths: [path.join(WORKSPACE, 'node_modules'), path.join(PKG, 'node_modules')],
  })
  fs.rmSync(entryFile, { force: true })
  return built.outputFiles[0].text
}

// Every flavor sheet: ONE (the default, also nameable) and Basecoat's eight
// styles, each paired with a colour preset.
const FLAVORS = [
  { name: 'one', css: 'dist/ui/theme/one.css', cls: 'theme-one theme-color-one' },
  ...['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'].map((name) => ({
    name, css: `dist/ui/theme/${name}.css`, cls: `theme-${name} theme-color-basecoat`,
  })),
]

// [light tag, shadow tag, light entry, shadow entry, inner selector, themed props]
const PAIRS = [
  ['mono-card', 'mono-shadow-card', 'card', '.mono-card',
   ['fontFamily', 'borderRadius', 'boxShadow', 'borderTopColor']],
  ['mono-accordion', 'mono-shadow-accordion', 'accordion', '.mono-accordion',
   ['fontFamily', 'borderRadius', 'boxShadow']],
  ['mono-alert', 'mono-shadow-alert', 'alert', '.mono-alert',
   ['fontFamily', 'borderRadius', 'paddingLeft', 'fontSize', 'borderTopColor']],
  ['mono-chip', 'mono-shadow-chip', 'chip', '.mono-chip > span',
   ['fontFamily', 'borderRadius', 'fontSize', 'fontWeight']],
  // The geometry three are here because their absence is what let a real bug
  // ship: the shadow build squared every text button's corners and dropped its
  // side borders (the affix `:has()` rules matched an always-rendered empty
  // span), and this spec — which checks `borderRadius` for card, accordion, chip
  // and file-upload — was looking at button's typography only.
  ['mono-button', 'mono-shadow-button', 'button', 'button',
   ['fontFamily', 'fontWeight', 'textTransform',
    'borderRadius', 'borderLeftWidth', 'borderRightWidth']],
  ['mono-tabs', 'mono-shadow-tabs', 'tabs', '.mono-tabs', ['fontFamily']],
  ['mono-breadcrumb', 'mono-shadow-breadcrumb', 'breadcrumb', '.mono-breadcrumb', ['fontFamily']],
  ['mono-file-upload', 'mono-shadow-file-upload', 'file-upload', '.mono-file-upload-dropzone',
   ['fontFamily', 'borderRadius']],
  ['mono-switch', 'mono-shadow-switch', 'switch', '.mono-switch', ['fontFamily']],
  // The panel, not the root: `--mono-sidebar-bg` / `-text` are what a flavor repaints
  // (ONE turns the panel into a brand-primary slab), and the panel is where they land.
  ['mono-sidebar', 'mono-shadow-sidebar', 'sidebar', '.mono-sidebar-panel',
   ['fontFamily', 'backgroundColor', 'color', 'boxShadow']],
]

/** Descendant selectors a flavor is still allowed to use — genuinely light DOM. */
const LIGHT_DOM_OK = /^\.theme-[a-z]+ \.(mono-table|flatpickr-calendar)/

function readComponentCss() {
  const parts = []
  const base = path.join(PKG, 'src/components')
  for (const dir of fs.readdirSync(base, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const f of fs.readdirSync(path.join(base, dir.name))) {
      if (f.endsWith('.css')) parts.push(fs.readFileSync(path.join(base, dir.name, f), 'utf8'))
    }
  }
  parts.push(fs.readFileSync(path.join(PKG, 'src/vite/mono-skeleton.css'), 'utf8'))
  return parts.join('\n')
}

/** Static checks — no browser needed. */
function lintFlavors(reporter) {
  const components = readComponentCss()
  // `var(\n  --name,` is common in the resolvers, so flatten before substring tests.
  const flat = components.replace(/var\(\s+/g, 'var(')
  // `.mono-theme` is the documented scope wrapper for a theme / mode class, not a component.
  const known = new Set([...components.matchAll(/\.(mono-[a-z0-9-]+)/g)].map((m) => m[1]).concat('mono-theme'))

  for (const flavor of fs.readdirSync(path.join(PKG, 'src/data/theme/flavors')).filter((f) => !f.startsWith('_')).map((f) => `src/data/theme/flavors/${f}`)) {
    const src = fs.readFileSync(path.join(PKG, flavor), 'utf8')
    const label = path.basename(flavor)

    // Selectors are matched textually rather than with a CSS parser so this file
    // stays dependency-free; the flavor sheets are hand-written and simple.
    const selectorBlocks = [...src.matchAll(/(^|\})\s*([^{}]+)\{/g)].map((m) => m[2].trim())

    const usedClasses = new Set()
    const descendants = []
    for (const block of selectorBlocks) {
      if (block.startsWith('@') || block.startsWith('/*')) continue
      for (const sel of block.split(',').map((s) => s.trim())) {
        for (const m of sel.matchAll(/\.(mono-[a-z0-9-]+)/g)) usedClasses.add(m[1])
        if (/^\.theme-[a-z]+\s+\S/.test(sel) && !LIGHT_DOM_OK.test(sel)) descendants.push(sel)
      }
    }

    const dead = [...usedClasses].filter((c) => !known.has(c))
    reporter.check(`${label}: no selectors for classes no component emits`, dead.length === 0,
      `dead: ${dead.join(', ')}`)

    reporter.check(`${label}: no descendant rules that cannot reach shadow DOM`,
      descendants.length === 0,
      `these only style the light build: ${descendants.slice(0, 5).join(' | ')}`)

    // A flavor may also (re)set the token-layer vocabulary — `--mono-radius-*`,
    // `--mono-shadow-*`, `--mono-ring-*` … — which the generated tokens.css
    // declares and the ported components read. Those are not component knobs, so
    // they are exempt from the "read by a component" rule; the layer itself is
    // the reader.
    const tokenLayer = new Set(
      [...fs.readFileSync(path.join(PKG, 'src/data/theme/generated/tokens.css'), 'utf8')
        .matchAll(/^\s*(--mono-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
    )
    const setVars = [...src.matchAll(/^\s*(--(?:_)?mono-[a-z0-9-]+)\s*:/gm)].map((m) => m[1])
    const inert = [...new Set(setVars)].filter((v) => !tokenLayer.has(v) && !flat.includes(`var(${v}`))
    reporter.check(`${label}: every --mono-* it sets is read by a component`, inert.length === 0,
      `inert (typo or removed API): ${inert.join(', ')}`)

    // A flavor block sits on <body>. A component's PRIVATE `--_mono-<c>-*` resolver is
    // declared on the component's own element, so reading one here substitutes nothing
    // and the whole declaration is invalid at computed-value time — the component
    // silently keeps its default and the flavor's intent never ships. ONE and Material
    // both did this for the menu's active pill; ONE's produced a solid white pill
    // inside a painted sidebar. Setting a private knob the component reads is fine —
    // only READING one from here is the bug, so this looks at values, not properties.
    // Comments are stripped first — these files explain the rule in prose, and the
    // words describing it are not themselves a violation.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '')
    const privateReads = [...new Set(
      [...code.matchAll(/:\s*([^;{}]*)/g)]
        .flatMap((m) => [...m[1].matchAll(/var\(\s*(--_mono-[a-z0-9-]+)/g)].map((v) => v[1])),
    )]
    reporter.check(`${label}: reads no component-private --_mono-* var`,
      privateReads.length === 0,
      `never resolves from a flavor block, use the public --mono-* twin: ${privateReads.join(', ')}`)
  }
}

// ───────────────────────────────────────────────────────────────────────────
// The shared scrollbar (src/data/theme/scrollbar.css)
//
// There is ONE scrollbar design and it lives in one file. These checks keep that
// true, because the two ways it can rot are both silent:
//
//   - a component re-styles its own scrollbar, and now there are two designs;
//   - a new component adds an `overflow: auto` container that nobody adds to the
//     shared selector list, and it quietly shows the browser's own scrollbar —
//     which on a brand-painted panel is the dark-bar bug this replaced.
//
// The third check is the one that would have caught the bug that made the whole
// previous attempt a no-op: the partial repeats its selector list once per
// pseudo-element rule (plain CSS has no way to name a list), so the lists have
// to be verified identical rather than trusted.
// ───────────────────────────────────────────────────────────────────────────

const SCROLLBAR_CSS = path.join(PKG, 'src/data/theme/scrollbar.css')

/** Scroll containers that deliberately have no mono scrollbar, with the reason. */
const SCROLLBAR_EXEMPT = new Map([
  ['[mono-search-chips]', 'drag-to-scroll strip — the bar is hidden on purpose'],
  ['[mono-search-chips]::-webkit-scrollbar', 'drag-to-scroll strip — the bar is hidden on purpose'],
])

/**
 * Innermost rules only: `[^{}]*` cannot span a brace, so an at-rule prelude can
 * never be captured as a selector and `@supports`/`@media` bodies are walked into
 * rather than swallowed. Comments are stripped first so prose cannot match.
 */
function cssRules(src) {
  // The table sheets alias every attribute as `:is([mono-x],.legacy)` for the
  // consumer-written class markup (scripts/legacy-class-alias.mjs); normalise back
  // to the attribute first, or the comma inside the alias splits a selector in two.
  const code = stripAliases(src.replace(/\/\*[\s\S]*?\*\//g, ''))
  return [...code.matchAll(/([^{}]*)\{([^{}]*)\}/g)].map((m) => ({
    selectors: m[1].split(',').map((s) => s.trim()).filter(Boolean),
    body: m[2],
  }))
}

/** `.a::-webkit-scrollbar-thumb:hover` → `.a` */
const baseSelector = (sel) => sel.replace(/::-webkit-scrollbar[\w-]*(:hover)?$/, '').trim()

/** Drop every balanced `@…{ … }` block, so what remains is the unfenced CSS. */
function stripAtBlocks(code) {
  let out = ''
  for (let i = 0; i < code.length; i++) {
    if (code[i] !== '@') {
      out += code[i]
      continue
    }
    const open = code.indexOf('{', i)
    if (open < 0) break
    let depth = 0
    let j = open
    for (; j < code.length; j++) {
      if (code[j] === '{') depth++
      else if (code[j] === '}' && --depth === 0) break
    }
    i = j
  }
  return out
}

function lintScrollbars(reporter) {
  const shared = fs.readFileSync(SCROLLBAR_CSS, 'utf8')
  const rules = cssRules(shared)

  // The resolver rule (the one declaring the tokens) defines the canonical list.
  const canonical = rules.find((r) => r.body.includes('--_mono-scrollbar-size:'))
  const covered = new Set(canonical ? canonical.selectors : [])

  // 1. No component styles a scrollbar itself any more.
  const offenders = []
  const base = path.join(PKG, 'src/components')
  const scrollers = []
  for (const dir of fs.readdirSync(base, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const f of fs.readdirSync(path.join(base, dir.name))) {
      if (!f.endsWith('.css')) continue
      const file = `${dir.name}/${f}`
      const src = fs.readFileSync(path.join(base, dir.name, f), 'utf8')
      for (const rule of cssRules(src)) {
        const touchesScrollbar =
          rule.selectors.some((s) => s.includes('::-webkit-scrollbar')) ||
          /(^|\s)scrollbar-(width|color)\s*:/.test(rule.body)
        const sels = rule.selectors.map(baseSelector)
        if (touchesScrollbar && !sels.every((s) => SCROLLBAR_EXEMPT.has(s))) {
          offenders.push(`${file}: ${rule.selectors.join(', ')}`)
        }
        // 2. Collect every scroll container so the next check can verify coverage.
        if (/overflow(-[xy])?\s*:\s*(auto|scroll)/.test(rule.body)) {
          for (const s of rule.selectors) scrollers.push({ file, sel: s })
        }
      }
    }
  }

  reporter.check(
    'no component CSS styles its own scrollbar (one shared design)',
    offenders.length === 0,
    `move these into src/data/theme/scrollbar.css: ${offenders.join(' | ')}`,
  )

  // 2. Every scroll container is in the shared list — this is the check that
  //    catches a NEW component whose author never thought about scrollbars.
  const uncovered = scrollers.filter(({ sel }) => {
    if (SCROLLBAR_EXEMPT.has(sel)) return false
    // `.mono-table-scroll.scroll-y` is covered by `.mono-table-scroll`.
    return ![...covered].some((c) => sel === c || sel.startsWith(c))
  })

  reporter.check(
    'every scroll container uses the shared scrollbar',
    uncovered.length === 0,
    `add to scrollbar.css (or SCROLLBAR_EXEMPT): ${
      [...new Set(uncovered.map((u) => `${u.sel} (${u.file})`))].join(', ')
    }`,
  )

  // 3. The list is repeated once per pseudo-element rule — they must all agree,
  //    or one pseudo silently stops matching a container the others still style.
  const lists = rules.map((r) => [...new Set(r.selectors.map(baseSelector))].sort().join('|'))
  const desynced = [...new Set(lists)].filter((l) => l !== [...covered].sort().join('|'))

  reporter.check(
    'every rule in scrollbar.css covers the same selector list',
    desynced.length === 0,
    `${desynced.length} rule(s) drifted from the canonical list`,
  )

  // 4. Both engines are addressed, and each in its OWN lane. Chrome ignores every
  //    `::-webkit-scrollbar` rule as soon as `scrollbar-width`/`-color` is set on
  //    the same element, so the standard properties MUST stay behind @supports —
  //    unfencing them silently hands Chrome its default scrollbar back.
  const code = shared.replace(/\/\*[\s\S]*?\*\//g, '')
  reporter.check(
    'scrollbar.css addresses non-WebKit engines',
    /@supports[^{]*\{[\s\S]*?scrollbar-color/.test(code),
    'no @supports lane sets scrollbar-color — Firefox would get its own scrollbar',
  )
  reporter.check(
    'scrollbar.css keeps the standard properties behind @supports',
    !/scrollbar-(width|color)\s*:/.test(stripAtBlocks(code)),
    'an unfenced scrollbar-width/scrollbar-color disables the WebKit lane in Chrome',
  )

  // 5. The partial actually reaches shadow roots — `dist/ui/index.css` never
  //    loads into one, so this reads the SHIPPED bundle rather than the source.
  //    `toShadowCss` (and with it the inlined sheet) lands in a shared chunk, so
  //    follow the shadow entry's own imports one level rather than guessing.
  const entryPath = path.join(PKG, 'dist/ui/shadow/sidebar.js')
  const entry = fs.readFileSync(entryPath, 'utf8')
  const graph = [entry]
  for (const m of entry.matchAll(/from\s*"([^"]+\.js)"/g)) {
    const dep = path.resolve(path.dirname(entryPath), m[1])
    if (fs.existsSync(dep)) graph.push(fs.readFileSync(dep, 'utf8'))
  }
  reporter.check(
    'the shipped shadow build carries the shared scrollbar sheet',
    graph.some((src) => src.includes('::-webkit-scrollbar-thumb')),
    'shadow components would fall back to the browser scrollbar',
  )
}

export async function run({ page, reporter }) {
  lintFlavors(reporter)
  lintScrollbars(reporter)

  const baseCss = fs.readFileSync(path.join(PKG, 'dist/ui/index.css'), 'utf8')
  const bundle = await bundleEntries(
    PAIRS.flatMap(([, , entry]) => [`ui/${entry}.js`, `ui/shadow/${entry}.js`]),
  )

  // `setContent` swaps the document but NOT the window, so the custom-element
  // registry survives between flavors — inject the bundle once or the second pass
  // throws "mono-card has already been used with this registry". Elements in the
  // replaced document upgrade against the registry that is already there.
  let registered = false

  for (const flavor of FLAVORS) {
    const flavorCss = fs.readFileSync(path.join(PKG, flavor.css), 'utf8')
    const body = PAIRS.map(([l, s]) =>
      `<${l} id="L-${l}">Text</${l}><${s} id="S-${s}">Text</${s}>`).join('')

    const html = pageHtml(baseCss + '\n' + flavorCss, '')
      .replace('<div id="app"></div>', `<div class="${flavor.cls}">${body}</div>`)

    await page.setContent(html, { waitUntil: 'load' })
    if (!registered) {
      await page.addScriptTag({ content: bundle })
      registered = true
    }
    await page.waitForTimeout(600)

    const results = await page.evaluate((pairs) => {
      return pairs.map((p) => {
        const [lightTag, shadowTag, , inner, props] = p
        const lh = document.getElementById('L-' + lightTag)
        const sh = document.getElementById('S-' + shadowTag)
        const le = (lh && lh.querySelector(inner)) || lh
        const se = sh && sh.shadowRoot ? sh.shadowRoot.querySelector(inner) : null
        if (!se) return { lightTag, missing: true }
        const a = getComputedStyle(le)
        const b = getComputedStyle(se)
        return {
          lightTag,
          diffs: props.filter((k) => a[k] !== b[k]).map((k) => `${k}: light=${a[k]} shadow=${b[k]}`),
        }
      })
    }, PAIRS)

    for (const r of results) {
      reporter.check(`${flavor.name}: ${r.lightTag} light === shadow`,
        !r.missing && r.diffs.length === 0,
        r.missing ? 'shadow element not found (did the component fail to register?)'
                  : r.diffs.join(' | '))
    }
  }
}
