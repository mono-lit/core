/**
 * Provenance tooling for the Basecoat port.
 *
 * Every component rule ported from Basecoat opens with a citation comment:
 *
 *   /* basecoat@1.0.2 styles/vega.css .btn[data-size='sm'] *\/
 *   /* basecoat@1.0.2 components/button.css .btn — mono: dark variants via --mono-mode-* *\/
 *
 * Grammar:  basecoat@<version> <vendor-relative file> <selector as written upstream>[ — note]
 * The selector is the key in `vendor/basecoat/blocks.json` (whitespace-collapsed;
 * nested rules are `parent >> &child`). Anything without a citation is, by
 * definition, a mono extension.
 *
 *   node scripts/basecoat-cite.mjs list                 every citation, grouped by vendor block
 *   node scripts/basecoat-cite.mjs verify               every citation resolves + is pinned to the manifest version
 *   node scripts/basecoat-cite.mjs changed [--since X]  citations whose vendor block moved since git ref X (default HEAD)
 *
 * `verify` is run by tests/basecoat-vendor.test.ts. `changed` is the bump checklist.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readBlocks, readManifest, VENDOR_DIR } from './basecoat-sync.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCAN_DIRS = [path.join(root, 'src', 'components'), path.join(root, 'src', 'data', 'theme')]

const CITE_RE = /\/\*\s*basecoat@([\w.\-]+)\s+(\S+\.css)\s+([\s\S]*?)(?:\s+—[\s\S]*?)?\s*\*\//g

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (full.startsWith(VENDOR_DIR)) continue
      walk(full, out)
    } else if (entry.name.endsWith('.css')) out.push(full)
  }
  return out
}

/** @returns {{ file, line, version, vendorFile, selector }[]} */
export function collect() {
  const cites = []
  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue
    for (const file of walk(dir)) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(CITE_RE)) {
        const line = text.slice(0, m.index).split('\n').length
        cites.push({
          file: path.relative(root, file).replace(/\\/g, '/'),
          line,
          version: m[1],
          vendorFile: m[2],
          selector: m[3].replace(/\s+/g, ' ').trim(),
        })
      }
    }
  }
  return cites
}

export function verify() {
  const manifest = readManifest()
  const blocks = readBlocks()
  const problems = []
  for (const c of collect()) {
    const where = `${c.file}:${c.line}`
    if (c.version !== manifest.version) problems.push(`${where}: pinned to basecoat@${c.version}, vendored is ${manifest.version}`)
    if (!blocks[c.vendorFile]) problems.push(`${where}: unknown vendor file ${c.vendorFile}`)
    else if (!blocks[c.vendorFile][c.selector]) problems.push(`${where}: no block "${c.selector}" in ${c.vendorFile}`)
  }
  return problems
}

export function changed(since = 'HEAD') {
  const blocksFile = path.join(VENDOR_DIR, 'blocks.json')
  const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim()
  const repoRel = path.relative(top, blocksFile).replace(/\\/g, '/')
  const before = JSON.parse(execFileSync('git', ['show', `${since}:${repoRel}`], { cwd: root, encoding: 'utf8' }))
  const after = readBlocks()
  const manifest = readManifest()
  const out = []
  for (const c of collect()) {
    const where = `${c.file}:${c.line}`
    const was = before[c.vendorFile]?.[c.selector]
    const now = after[c.vendorFile]?.[c.selector]
    if (!now) out.push(`${where}: "${c.selector}" DISAPPEARED from ${c.vendorFile}`)
    else if (was && was !== now) out.push(`${where}: "${c.selector}" in ${c.vendorFile} CHANGED`)
    if (c.version !== manifest.version) out.push(`${where}: still pinned to basecoat@${c.version} (now ${manifest.version})`)
  }
  return out
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [cmd = 'list', ...rest] = process.argv.slice(2)
  if (cmd === 'list') {
    const groups = new Map()
    for (const c of collect()) {
      const key = `${c.vendorFile} ${c.selector}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(`${c.file}:${c.line}`)
    }
    for (const [key, refs] of [...groups].sort()) console.log(`${key}\n  ${refs.join('\n  ')}`)
    console.log(`\n${groups.size} vendor blocks cited, ${[...groups.values()].flat().length} citations`)
  } else if (cmd === 'verify') {
    const problems = verify()
    if (problems.length) {
      console.error('basecoat citations have problems:\n  ' + problems.join('\n  '))
      process.exit(1)
    }
    console.log(`all ${collect().length} basecoat citations resolve against basecoat-css@${readManifest().version}`)
  } else if (cmd === 'changed') {
    const i = rest.indexOf('--since')
    const since = i >= 0 ? rest[i + 1] : 'HEAD'
    const out = changed(since)
    if (out.length) {
      console.error(`ported rules to revisit (vendor blocks changed since ${since}):\n  ` + out.join('\n  '))
      process.exit(1)
    }
    console.log(`no cited vendor block changed since ${since}`)
  } else {
    console.error(`unknown command ${cmd}; use list | verify | changed [--since <ref>]`)
    process.exit(2)
  }
}
