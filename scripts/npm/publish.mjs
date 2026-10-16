// Publishes the @mono-lit packages to the public npm registry.
//
// DRY RUN by default — nothing leaves the machine until `--yes` is passed:
//
//   pnpm npm:publish:dry                 # checks + build + `pnpm publish --dry-run`
//   pnpm npm:publish -- --otp=123456     # the real thing (2FA code if the account has one)
//
// Flow, in dependency order (@mono-lit/devextreme → @mono-lit/utility → @mono-lit/helper):
//   1. preflight: logged in to npm (`npm whoami`); each version is listed in
//      version.json; versions already on npm are skipped (npm versions are immutable)
//   2. build ONCE with `vp run lib:all` — the only order that is right for this repo
//      (utility's .d.ts inlines helper's types, so utility builds again after helper).
//      Each package's own `prepack` would rebuild it alone, so publishing runs with
//      `--ignore-scripts`. `--skip-build` reuses the dist/ already on disk.
//   3. verify: every path in each package.json `exports`/`types`/`bin` exists in dist/
//   4. `pnpm publish --access public` (pnpm, never npm: it rewrites `workspace:*`
//      ranges to real versions; `npm publish` would ship the literal string)
//
// Options: --yes  --otp=<code>  --tag=<dist-tag>  --skip-build  --only=<name>[,<name>]

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const REGISTRY = 'https://registry.npmjs.org/'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)

const LIVE = flag('yes')
const OTP = option('otp')
const TAG = option('tag')
const ONLY = option('only')?.split(',').map((s) => s.trim())

// Dependency order. Package names are scoped, so each folder is listed explicitly.
const PACKAGES = [
  { name: '@mono-lit/devextreme', dir: 'packages/devextreme' },
  { name: '@mono-lit/utility', dir: 'packages/utility' },
  { name: '@mono-lit/helper', dir: 'packages/helper' },
].filter((p) => !ONLY || ONLY.includes(p.name))

const log = (msg) => console.log(`[npm-publish] ${msg}`)
const die = (msg) => {
  console.error(`[npm-publish] ${msg}`)
  process.exit(1)
}

function sh(cmd, argv, { cwd = repoRoot, inherit = false } = {}) {
  return spawnSync(cmd, argv, {
    cwd,
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
}

/* ------------------------------------------------------------- preflight */

if (PACKAGES.length === 0) die(`--only matched no package (${ONLY.join(', ')})`)

const whoami = sh('npm', ['whoami', '--registry', REGISTRY])
if (whoami.status !== 0) die(`not logged in to ${REGISTRY} — run \`npm login\` first.`)
log(`npm user: ${whoami.stdout.trim()}  ·  mode: ${LIVE ? 'LIVE PUBLISH' : 'dry run (pass --yes to publish)'}`)

let ledger
try {
  ledger = JSON.parse(readFileSync(join(repoRoot, 'version.json'), 'utf8'))
} catch (err) {
  die(`cannot read version.json (${err.message}) — every release must be listed there.`)
}

/** Is `name@version` already on npm? */
function isPublished(name, version) {
  const res = sh('npm', ['view', `${name}@${version}`, 'version', '--registry', REGISTRY])
  return res.status === 0 && res.stdout.trim() === version
}

const queue = []
for (const pkg of PACKAGES) {
  const manifest = JSON.parse(readFileSync(join(repoRoot, pkg.dir, 'package.json'), 'utf8'))
  if (manifest.name !== pkg.name) die(`${pkg.dir}/package.json is named ${manifest.name}, expected ${pkg.name}`)
  const { version } = manifest
  const listed = (ledger[pkg.name] ?? []).map((v) => v.replace(/^!/, ''))
  if (!listed.includes(version)) {
    die(`${pkg.name}@${version} is not in version.json — append "${version}" to its array to acknowledge the release.`)
  }
  if (isPublished(pkg.name, version)) {
    log(`${pkg.name}@${version} is already on npm — skipping`)
    continue
  }
  queue.push({ ...pkg, version, manifest })
}

if (queue.length === 0) {
  log('nothing to publish.')
  process.exit(0)
}
log(`to publish: ${queue.map((p) => `${p.name}@${p.version}`).join(', ')}`)

const dirty = sh('git', ['status', '--porcelain', '--', ...queue.map((p) => p.dir)]).stdout.trim()
if (dirty) log(`note: uncommitted changes in the packages being published (${dirty.split('\n').length} paths) — they ship as-is.`)

/* ----------------------------------------------------------------- build */

if (flag('skip-build')) {
  log('--skip-build: using the dist/ already on disk')
} else {
  log('building: vp run lib:all')
  if (sh('pnpm', ['exec', 'vp', 'run', 'lib:all'], { inherit: true }).status !== 0) die('build failed — nothing published.')
}

/* ---------------------------------------------------------------- verify */

/** Every file path a manifest points at (exports targets, types, bin), wildcard patterns kept. */
function manifestTargets(m) {
  const out = new Set()
  const walk = (v) => {
    if (typeof v === 'string') out.add(v)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(m.exports)
  for (const key of ['main', 'module', 'types']) if (m[key]) out.add(m[key])
  walk(typeof m.bin === 'string' ? { bin: m.bin } : m.bin)
  return [...out]
}

/** `./dist/ui/font/*` → at least one file under dist/ui/font/. */
function targetExists(dir, target) {
  if (!target.includes('*')) return existsSync(join(dir, target))
  const base = join(dir, target.slice(0, target.indexOf('*')))
  return existsSync(base) && readdirSync(base).length > 0
}

let missing = 0
for (const pkg of queue) {
  const dir = join(repoRoot, pkg.dir)
  const targets = manifestTargets(pkg.manifest)
  for (const t of targets.filter((t) => !targetExists(dir, t))) {
    console.error(`[npm-publish] ${pkg.name}: "${t}" is referenced by package.json but missing from disk`)
    missing++
  }
  log(`${pkg.name}: ${targets.length} manifest paths checked`)
}
if (missing) die(`${missing} missing file(s) — nothing published.`)

/* --------------------------------------------------------------- publish */

for (const pkg of queue) {
  const argv = ['publish', '--access', 'public', '--registry', REGISTRY, '--no-git-checks', '--ignore-scripts']
  if (!LIVE) argv.push('--dry-run')
  if (OTP) argv.push('--otp', OTP)
  if (TAG) argv.push('--tag', TAG)
  log(`${LIVE ? 'publishing' : 'dry run'}: ${pkg.name}@${pkg.version}`)
  const res = sh('pnpm', argv, { cwd: join(repoRoot, pkg.dir), inherit: true })
  if (res.status !== 0) {
    die(`${pkg.name}@${pkg.version} failed — packages after it were NOT published (fix and re-run; done ones are skipped).`)
  }
  if (LIVE && !isPublished(pkg.name, pkg.version)) {
    log(`warning: ${pkg.name}@${pkg.version} not visible on npm yet (registry propagation can take a minute)`)
  }
}

log(LIVE ? 'done — published.' : 'dry run complete. Re-run with --yes to publish.')
