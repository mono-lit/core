/**
 * Sync the Basecoat UI source we mirror into `src/data/theme/vendor/basecoat/`.
 *
 * @mono-lit/helper's styling is a PORT of Basecoat (vega style): every component rule
 * that can come from Basecoat mirrors it and cites it (`basecoat-cite.mjs`).
 * Basecoat itself is only a pinned devDependency — consumers never install it and
 * nothing under `vendor/` is imported by a build. The tracked copy exists so a
 * version bump shows up as an ordinary `git diff` of readable `@apply` source,
 * and so `blocks.json` can tell `basecoat-cite changed` exactly which ported
 * rules have a moved upstream.
 *
 *   node scripts/basecoat-sync.mjs           copy + fingerprint (+ theme:build)
 *   node scripts/basecoat-sync.mjs --check   exit 1 if the tracked copy drifted
 *
 * Bump procedure lives in `src/data/theme/vendor/basecoat/README.md`.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require_ = createRequire(import.meta.url)

export const VENDOR_DIR = path.join(root, 'src', 'data', 'theme', 'vendor', 'basecoat')
export const MANIFEST = path.join(VENDOR_DIR, 'manifest.json')
export const BLOCKS = path.join(VENDOR_DIR, 'blocks.json')

/** Basecoat's eight styles — @mono-lit/helper's flavors mirror all of them (vega = default). */
export const STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea']
/** The vendor files we track, relative to the package's `dist/`. */
const TRACKED = ['base/base.css', ...STYLES.map((s) => `styles/${s}.css`), 'basecoat-vega.cdn.css']

function pkgDir() {
  return path.dirname(require_.resolve('basecoat-css/package.json'))
}

/** Line-ending agnostic: git's autocrlf must not make a fresh clone read as drift. */
function normalise(buf) {
  return buf.toString('utf8').replace(/\r\n?/g, '\n')
}
function sha256(buf) {
  return createHash('sha256').update(normalise(buf)).digest('hex')
}
function sha1(text) {
  return createHash('sha1').update(text).digest('hex')
}

function listTracked(dist) {
  const files = [...TRACKED]
  for (const name of fs.readdirSync(path.join(dist, 'components')).sort()) {
    if (name.endsWith('.css')) files.push(`components/${name}`)
  }
  return files
}

/** "  .btn[data-size='sm']  " → ".btn[data-size='sm']" — stable keys for blocks.json. */
function normaliseSelector(sel) {
  return sel.replace(/\s+/g, ' ').trim()
}

/**
 * Per-rule fingerprints: selector → sha1 of its declaration text. Nested rules
 * (`&:hover`, `@media` inside a rule) are keyed `parent >> child` so a change in
 * only a nested variant still surfaces. At-rules that only group (`@layer`) are
 * transparent; `@media`/`@supports` keep their params in the key.
 */
function fingerprint(css) {
  const out = {}
  const walk = (container, prefix) => {
    for (const node of container.nodes ?? []) {
      if (node.type === 'rule') {
        const key = prefix ? `${prefix} >> ${normaliseSelector(node.selector)}` : normaliseSelector(node.selector)
        const decls = node.nodes
          .filter((n) => n.type === 'decl' || n.type === 'atrule')
          .map((n) => (n.type === 'decl' ? `${n.prop}:${n.value}` : `@${n.name} ${n.params}`))
          .join(';')
        // Concatenate when the same selector appears twice (vega.css does this for
        // `.alert`, `.avatar`, `.card`: a structural rule then a skin rule).
        out[key] = out[key] ? sha1(out[key] + decls) : sha1(decls)
        walk(node, key)
      } else if (node.type === 'atrule') {
        const transparent = node.name === 'layer'
        walk(node, transparent ? prefix : `${prefix ? prefix + ' >> ' : ''}@${node.name} ${node.params}`)
      }
    }
  }
  walk(postcss.parse(css), '')
  return out
}

function tailwindVersion(cdnCss) {
  return /tailwindcss v([\d.]+)/.exec(cdnCss)?.[1] ?? null
}

/** Build the in-memory picture of what `vendor/` SHOULD contain right now. */
export function snapshot() {
  const dir = pkgDir()
  const dist = path.join(dir, 'dist')
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  const files = {}
  const contents = {}
  for (const rel of listTracked(dist)) {
    const buf = fs.readFileSync(path.join(dist, rel))
    files[rel] = sha256(buf)
    contents[rel] = buf
  }
  const license = fs.readFileSync(path.join(dir, 'LICENSE.md'))
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    tailwind: tailwindVersion(contents['basecoat-vega.cdn.css'].toString('utf8')),
    styles: STYLES,
    defaultStyle: 'vega',
    files,
  }
  // Per-selector fingerprints for every @apply source sheet (not the compiled cdn).
  const blocks = {}
  for (const rel of Object.keys(files)) {
    if (rel.endsWith('.cdn.css')) continue
    blocks[rel] = fingerprint(contents[rel].toString('utf8'))
  }
  return { manifest, blocks, contents, license }
}

function stable(obj) {
  return JSON.stringify(obj, null, 2) + '\n'
}

export function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}
export function readBlocks() {
  return JSON.parse(fs.readFileSync(BLOCKS, 'utf8'))
}

/** Returns a list of human-readable drift lines; empty when the tracked copy is current. */
export function check() {
  const want = snapshot()
  const drift = []
  if (!fs.existsSync(MANIFEST)) return ['vendor/basecoat/manifest.json is missing — run `pnpm basecoat:sync`']
  const have = readManifest()
  if (have.version !== want.manifest.version) drift.push(`version: tracked ${have.version}, installed ${want.manifest.version}`)
  for (const [rel, hash] of Object.entries(want.manifest.files)) {
    const file = path.join(VENDOR_DIR, rel)
    if (!fs.existsSync(file)) drift.push(`missing: ${rel}`)
    else if (sha256(fs.readFileSync(file)) !== hash) drift.push(`changed: ${rel}`)
    if (have.files?.[rel] !== hash) drift.push(`manifest stale: ${rel}`)
  }
  for (const rel of Object.keys(have.files ?? {})) {
    if (!(rel in want.manifest.files)) drift.push(`tracked but no longer shipped: ${rel}`)
  }
  const blocksText = fs.existsSync(BLOCKS) ? normalise(fs.readFileSync(BLOCKS)) : ''
  if (blocksText !== stable(want.blocks)) drift.push('blocks.json is stale')
  return drift
}

export function sync() {
  const want = snapshot()
  for (const [rel, buf] of Object.entries(want.contents)) {
    const file = path.join(VENDOR_DIR, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, buf)
  }
  fs.writeFileSync(path.join(VENDOR_DIR, 'LICENSE.md'), want.license)
  fs.writeFileSync(MANIFEST, stable(want.manifest))
  fs.writeFileSync(BLOCKS, stable(want.blocks))
  return want.manifest
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  if (process.argv.includes('--check')) {
    const drift = check()
    if (drift.length) {
      console.error('basecoat vendor copy is out of sync:\n  ' + drift.join('\n  '))
      process.exit(1)
    }
    console.log(`basecoat vendor copy is current (basecoat-css@${readManifest().version})`)
  } else {
    const m = sync()
    console.log(`synced basecoat-css@${m.version} (tailwind ${m.tailwind}) → ${path.relative(root, VENDOR_DIR)}`)
    // The token layer is generated from the vendored base.css; keep it in step.
    const gen = path.join(root, 'scripts', 'theme-build.mjs')
    if (fs.existsSync(gen)) {
      const { execFileSync } = await import('node:child_process')
      execFileSync(process.execPath, [gen], { stdio: 'inherit' })
    }
  }
}
