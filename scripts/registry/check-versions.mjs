// Version-bump validation. Two guards:
//
// 1. version.json LEDGER — every package's current version MUST be listed in
//    the root version.json ({"@mono-lit/helper": ["1.0.0"], ...}). Adding a
//    release is an explicit act: bump package.json AND append the version to
//    version.json in the same commit. Unlisted version → FAIL.
//
// 2. SOURCE-CHANGE GUARD — if the version is already published, the package's
//    source must be unchanged since the release commit (manifest gitHead).
//    Changed source + same version → FAIL (the change would never ship).
//
// Exit code 1 on violations in strict mode. Strict mode is the default
// locally and on Netlify production deploys; Netlify previews/branch builds
// warn only (set via CONTEXT), unless --strict is passed.
//
//   node scripts/registry/check-versions.mjs [--registry=...] [--warn|--strict]

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)

const registryArg = args.find((a) => a.startsWith('--registry='))
const REGISTRY = registryArg ? registryArg.slice('--registry='.length) : 'https://mono-libs.netlify.app/npm/'

const forceWarn = args.includes('--warn')
const forceStrict = args.includes('--strict')
const strict = forceStrict || (!forceWarn && (process.env.CONTEXT ? process.env.CONTEXT === 'production' : true))

// `exclude`: paths inside a package dir that are not library code and must not count as
// "the package changed". (The VitePress docs used to live in packages/helper/demo; they
// are now the top-level docs/ folder, outside every package.)
const PACKAGES = [
  { name: '@mono-lit/devextreme', dir: 'packages/devextreme', exclude: [] },
  { name: '@mono-lit/utility', dir: 'packages/utility', exclude: [] },
  { name: '@mono-lit/helper', dir: 'packages/helper', exclude: [] },
]

const violations = []
const warnings = []

function fail(message) {
  violations.push(message)
}

// ---------------------------------------------------------------- ledger
let ledger = null
try {
  ledger = JSON.parse(readFileSync(join(repoRoot, 'version.json'), 'utf8'))
} catch (err) {
  fail(`cannot read version.json (${err.message}) — it must exist and list every released version`)
}
if (ledger !== null) {
  if (typeof ledger !== 'object' || ledger === null || Array.isArray(ledger)) {
    fail('version.json must be an object like {"@mono-lit/helper": ["1.0.0"], ...}')
    ledger = null
  } else {
    for (const [name, versions] of Object.entries(ledger)) {
      if (!PACKAGES.some((p) => p.name === name)) {
        warnings.push(`version.json lists unknown package "${name}" — ignored`)
      } else if (!Array.isArray(versions) || versions.some((v) => typeof v !== 'string')) {
        fail(`version.json entry for "${name}" must be an array of version strings`)
      }
    }
  }
}

// ------------------------------------------------- per-package checks
for (const pkg of PACKAGES) {
  const version = JSON.parse(readFileSync(join(repoRoot, pkg.dir, 'package.json'), 'utf8')).version
  const entries = ledger?.[pkg.name] ?? []
  const listed = entries.map((e) => e.replace(/^!/, ''))
  const forced = entries.includes(`!${version}`)

  // 1. ledger check
  if (ledger !== null) {
    if (!Array.isArray(ledger[pkg.name])) {
      fail(`${pkg.name}@${version}: not listed in version.json — add "${pkg.name}": [..., "${version}"]`)
    } else if (!listed.includes(version)) {
      fail(
        `${pkg.name}@${version} is missing from version.json — append "${version}" to the ` +
          `"${pkg.name}" array to acknowledge the release`,
      )
    } else {
      console.log(`[check] ${pkg.name}@${version} listed in version.json — OK`)
    }
  }

  // 2. source-change guard ("!version" in version.json forces a re-release
  //    and skips this guard)
  if (forced) {
    console.log(`[check] ${pkg.name}@${version} marked with "!" — forced re-release, guard skipped`)
    continue
  }
  let doc = null
  try {
    const headers = {}
    if (process.env.REGISTRY_PUBLISH_TOKEN) {
      headers.authorization = `Bearer ${process.env.REGISTRY_PUBLISH_TOKEN}` // publish token is accepted for reads too
    }
    const res = await fetch(`${REGISTRY}${pkg.name.replace('/', '%2f')}`, { headers })
    if (res.ok) doc = await res.json()
  } catch {
    // fall through
  }
  if (!doc) {
    warnings.push(`${pkg.name}: registry unreachable or empty — source-change validation skipped`)
    continue
  }

  const published = doc.versions?.[version]
  if (!published) {
    console.log(`[check] ${pkg.name}@${version} not published yet — will publish on deploy`)
    continue
  }

  const gitHead = published.gitHead
  if (!gitHead) {
    warnings.push(
      `${pkg.name}@${version} was published without gitHead (older release) — validation skipped; ` +
        'bump the version once to enable validation',
    )
    continue
  }

  const diff = spawnSync(
    'git',
    ['diff', '--quiet', `${gitHead}..HEAD`, '--', pkg.dir, ...pkg.exclude.map((e) => `:(exclude)${e}`)],
    { cwd: repoRoot, stdio: 'pipe', encoding: 'utf8' },
  )
  if (diff.status === 0) {
    console.log(`[check] ${pkg.name}@${version} unchanged since release ${gitHead.slice(0, 8)} — OK`)
  } else if (diff.status === 1) {
    fail(
      `${pkg.name}@${version} is already published, but ${pkg.dir} changed since release commit ` +
        `${gitHead.slice(0, 8)}. Bump "version" (and version.json), or prefix the entry with "!" ` +
        `in version.json (e.g. "!${version}") to force a re-release.`,
    )
  } else {
    warnings.push(`${pkg.name}: could not diff against ${gitHead.slice(0, 8)} (commit not available) — skipped`)
  }
}

for (const warning of warnings) console.warn(`[check] WARN  ${warning}`)

if (violations.length > 0) {
  for (const violation of violations) console.error(`[check] FAIL  ${violation}`)
  if (strict) {
    console.error('\n[check] version check FAILED — fix the issues above; the production deploy will fail.')
    process.exit(1)
  }
  console.warn('\n[check] version check failed (warn-only mode).')
  process.exit(0)
}

console.log('[check] version check passed.')
