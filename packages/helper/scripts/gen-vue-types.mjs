/**
 * Generate `dist/vue.d.ts` — the Vue `GlobalComponents` augmentation that gives
 * `<mono-*>` tags prop completion and checking in a Vue SFC.
 *
 * Volar resolves a hyphenated tag by looking it up in `GlobalComponents`; without
 * an entry there, every `mono-*` tag is an "unknown element" — anything is
 * accepted and nothing is suggested. This maps each registered tag to the
 * `*Props` interface the component already declares.
 *
 * Deliberately a source scan rather than a `ts.createProgram`: only NAMES are
 * needed here (the docs' `extract-component-types.ts` pays for a full type checker
 * because it renders prop tables), so this stays fast enough to run on every build.
 *
 * Run after BOTH vite builds — `vite-plugin-dts` rewrites the entry declarations
 * each time, and the shadow build goes second.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'src')
const DIST = path.join(root, 'dist')

/* --------------------------------- scan ---------------------------------- */

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith('.ts')) out.push(full)
  }
  return out
}

const files = walk(path.join(SRC, 'components'))

/** tag → the class that registers it, e.g. 'mono-button' → 'MonoButton'. */
const tags = new Map()
/** Props interface name → the src file that declares it. */
const interfaces = new Map()
/** Events interface name → the src file that declares it (e.g. `ButtonEvents`). */
const eventInterfaces = new Map()

// Both regexes are /g and are reused across files, so `lastIndex` must be reset
// per file — and they must NOT be re-created inside the exec loop (a fresh literal
// each iteration resets lastIndex to 0 and never terminates).
const DECORATOR = /@customElement\(\s*'([^']+)'\s*\)\s*(?:\r?\n\s*)*export\s+class\s+([A-Za-z0-9_]+)/g
const INTERFACE = /export\s+interface\s+([A-Za-z0-9_]*Props)\b/g
const EVENTS = /export\s+interface\s+([A-Za-z0-9_]*Events)\b/g

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')

  // `@customElement('mono-button')` … `export class MonoButton extends …`
  DECORATOR.lastIndex = 0
  for (let m; (m = DECORATOR.exec(text)); ) tags.set(m[1], m[2])

  INTERFACE.lastIndex = 0
  for (let m; (m = INTERFACE.exec(text)); ) {
    if (!interfaces.has(m[1])) interfaces.set(m[1], file)
  }

  // The `*Events` interfaces are hand-maintained and map each emitted name to its
  // full `CustomEvent<Detail>` type — authoritative, so no dispatch-site scraping.
  EVENTS.lastIndex = 0
  for (let m; (m = EVENTS.exec(text)); ) {
    if (!eventInterfaces.has(m[1])) eventInterfaces.set(m[1], file)
  }
}

/* ------------------------------- resolution ------------------------------- */

const pascalFromTag = (tag) =>
  tag
    .replace(/^mono-/, '')
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/**
 * Tags whose props interface can't be derived from the name. The chart presets are
 * the generic `<mono-chart>` with `type` fixed, so they share its interface
 * verbatim — see `ChartProps`' own doc comment.
 */
const EXPLICIT = {
  'mono-chart-bar': 'ChartProps',
  'mono-chart-line': 'ChartProps',
  'mono-chart-pie': 'ChartProps',
  'mono-chart-doughnut': 'ChartProps',
}

/**
 * Same four-candidate fallback the docs plugin uses. The naming is inconsistent
 * across the library — `ButtonProps` but `MonoChipProps`, `MonoFilterBuilderProps`
 * — and this list is what absorbs that.
 */
function candidates(tag, className, suffix) {
  const rest = className.replace(/^Mono/, '').replace(/Shadow$/, '')
  const fromTag = pascalFromTag(tag.replace(/^mono-shadow-/, 'mono-'))
  return [`${rest}${suffix}`, `Mono${rest}${suffix}`, `${fromTag}${suffix}`, `Mono${fromTag}${suffix}`]
}

function resolveInterface(tag, className) {
  const light = tag.replace(/^mono-shadow-/, 'mono-')
  if (EXPLICIT[light] && interfaces.has(EXPLICIT[light])) return EXPLICIT[light]
  return candidates(tag, className, 'Props').find((c) => interfaces.has(c)) ?? null
}

/** The `*Events` interface for a tag, if the component declares one. */
function resolveEvents(tag, className) {
  return candidates(tag, className, 'Events').find((c) => eventInterfaces.has(c)) ?? null
}

const entries = []
const skipped = []
const withoutEvents = []

for (const [tag, className] of [...tags].sort(([a], [b]) => a.localeCompare(b))) {
  const iface = resolveInterface(tag, className)
  if (!iface) {
    skipped.push(tag)
    continue
  }
  const events = resolveEvents(tag, className)
  if (!events) withoutEvents.push(tag)
  entries.push({ tag, iface, events })
}

/* -------------------------------- emit ----------------------------------- */

// Import specifier from `dist/vue.d.ts` into the emitted declarations, which
// vite-plugin-dts writes under `dist/src/**` mirroring the source tree.
const specifierFor = (srcFile) =>
  './' + path.posix.join('src', path.relative(SRC, srcFile).replaceAll('\\', '/')).replace(/\.ts$/, '.js')

const used = [...new Set(entries.map((e) => e.iface))].sort()
const usedEvents = [...new Set(entries.map((e) => e.events).filter(Boolean))].sort()

const imports = [
  ...used.map((name) => `import type { ${name} } from '${specifierFor(interfaces.get(name))}'`),
  ...usedEvents.map(
    (name) => `import type { ${name} } from '${specifierFor(eventInterfaces.get(name))}'`,
  ),
].join('\n')

const rows = entries
  .map((e) => `    '${e.tag}': MonoElement<${e.iface}${e.events ? `, ${e.events}` : ''}>`)
  .join('\n')

const uiRows = entries
  .filter((e) => !e.tag.startsWith('mono-shadow-'))
  .map((e) => `    '${e.tag}': StripIndex<${e.iface}> & MonoCommonProps`)
  .join('\n')

// The universal props every element gets from the mono `customElement` decorator
// (`pending`, src/composables/mono-skeleton.ts) — not in any `*Props` interface.
const commonImport = `import type { MonoPending } from '${specifierFor(path.join(SRC, 'composables/mono-skeleton.ts'))}'`

const out = `// GENERATED by scripts/gen-vue-types.mjs — do not edit.
//
// Vue \`GlobalComponents\` augmentation for every registered \`<mono-*>\` element.
// Volar reads this to offer prop completion and to type-check attributes inside a
// Vue SFC template. It is referenced from the package's types entry, so importing
// anything from '@mono-lit/helper' activates it — no consumer setup.

import type { DefineComponent, HTMLAttributes, ReservedProps } from 'vue'
${imports}
${commonImport}

/**
 * Props EVERY mono element has, light and shadow, on top of its own \`*Props\`:
 * \`pending\` — the automatic skeleton (\`:pending="busy"\`, \`:pending.prop="{ active, count }"\`).
 */
export interface MonoCommonProps {
  pending?: MonoPending
}

/**
 * Drop a string index signature so a typo stays an error.
 *
 * \`MonoChartProps\` and \`MonoFilterProps\` carry \`[key: string]: unknown\` because
 * they double as the controllers' \`props()\` bag. Left alone, chart and
 * filter-builder would accept any attribute — the one place strictness would
 * silently not apply.
 */
type StripIndex<T> = {
  [K in keyof T as string extends K ? never : symbol extends K ? never : K]: T[K]
}

/**
 * Turn a component's \`*Events\` interface into the handler props Vue expects.
 *
 * Each \`*Events\` interface lists the PLAIN names (\`change\`, \`click\`, \`open\`; a
 * multi-word one as both \`'loading-change'\` and \`loadingChange\`) and, after them,
 * the kept \`mno-*\` / \`mnoX\` aliases. Only the non-kebab keys become props: Volar
 * compiles \`@change\` to \`onChange\`, \`@loading-change\` and \`@loadingChange\` both to
 * \`onLoadingChange\`, and \`@mno-change\` to \`onMnoChange\`, so
 * \`on\${Capitalize<K>}\` over the camel keys lands exactly on every spelling, while
 * a kebab key would produce \`onMno-change\` and never match.
 */
type MonoEvents<E> = {
  [K in Extract<keyof E, string> as K extends \`\${string}-\${string}\`
    ? never
    : \`on\${Capitalize<K>}\`]?: (event: E[K]) => void
}

/**
 * \`HTMLAttributes\` keeps \`id\` / \`class\` / \`style\` / \`data-*\` / \`v-if\` valid;
 * \`ReservedProps\` keeps \`key\` / \`ref\`. The native handler props a component
 * re-types (\`onInput\`, \`onChange\`, \`onClick\` with a \`CustomEvent<Detail>\`) are
 * taken OUT of \`HTMLAttributes\` first — intersected with Vue's \`(e: Event) => void\`
 * they would reject every typed handler under \`strictFunctionTypes\`.
 */
type MonoElement<P, E = {}> = DefineComponent<
  StripIndex<P> & MonoCommonProps & Omit<HTMLAttributes, keyof MonoEvents<E>> & ReservedProps & MonoEvents<E>
>

declare module 'vue' {
  interface GlobalComponents {
${rows}
  }
}

/**
 * \`createMonoUI({ 'mono-button': { size: 'xs' } })\` — per-tag prop completion.
 * Light tags only: one key configures both builds (\`mono-button\` also reaches
 * \`mono-shadow-button\`). Augments the interface where it is declared.
 */
declare module '${specifierFor(path.join(SRC, 'composables/mono-ui.ts'))}' {
  interface MonoUIComponents {
${uiRows}
  }
}

export {}
`

fs.mkdirSync(DIST, { recursive: true })
fs.writeFileSync(path.join(DIST, 'vue.d.ts'), out)

/* ---------------------- activate from the types entry --------------------- */

// TS follows a triple-slash reference out of node_modules, so pointing a types
// entry at the augmentation is what makes it automatic.
//
// EVERY entry needs it, not just the root: the documented, tree-shakeable import
// is `import '@mono-lit/helper/ui/button'`, which only ever loads
// `dist/src/components/button/index.d.ts`. Referencing the root alone left that —
// the common case — with no suggestions at all.
//
// The list is read from package.json `exports` so a new subpath is covered the day
// it's added. Idempotent: the dts plugin rewrites these files on every build, so
// the line is re-added each time.
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

const typeEntries = new Set()
for (const [subpath, value] of Object.entries(pkg.exports ?? {})) {
  if (subpath === './vue') continue // the augmentation itself
  const types = value && typeof value === 'object' ? value.types : undefined
  if (typeof types === 'string') typeEntries.add(path.resolve(root, types))
}
// Not an `exports` entry of its own — the root resolves to it under the `node`
// condition, and a Nuxt/SSR consumer loads it directly.
typeEntries.add(path.join(DIST, 'src/entries/index.node.d.ts'))

let referenced = 0
let alreadyReferenced = 0
for (const file of typeEntries) {
  if (!fs.existsSync(file)) continue
  // Relative to each file's own depth: dist/src/entries/… → ../../vue.d.ts,
  // dist/src/components/button/… → ../../../vue.d.ts.
  const rel = path.relative(path.dirname(file), path.join(DIST, 'vue.d.ts')).replaceAll('\\', '/')
  const reference = `/// <reference path="${rel}" />`

  const text = fs.readFileSync(file, 'utf8')
  if (text.includes(reference)) {
    alreadyReferenced++
    continue
  }
  fs.writeFileSync(file, `${reference}\n${text}`)
  referenced++
}

/* -------------------------------- report --------------------------------- */

console.log(
  `[gen-vue-types] ${entries.length} tags → dist/vue.d.ts ` +
    `(${used.length} prop interfaces, ${usedEvents.length} event interfaces)`,
)
if (withoutEvents.length) {
  console.log(
    `[gen-vue-types] no *Events interface for ${withoutEvents.length} tag(s) — props typed, handlers untyped:\n` +
      withoutEvents.map((t) => `  - ${t}`).join('\n'),
  )
}
console.log(
  `[gen-vue-types] referenced from ${referenced + alreadyReferenced} types entr${
    referenced + alreadyReferenced === 1 ? 'y' : 'ies'
  } (${referenced} written, ${alreadyReferenced} already present)`,
)
if (skipped.length) {
  console.log(
    `[gen-vue-types] no *Props interface for ${skipped.length} tag(s) — they stay untyped:\n` +
      skipped.map((t) => `  - ${t}`).join('\n'),
  )
}
