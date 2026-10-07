// Publishes the mono packages to the Netlify registry (idempotent).
//
// Flow per package (@mono-lit/devextreme → @mono-lit/utility → @mono-lit/helper):
//   1. skip if this version is already on the registry (versions immutable)
//   2. `pnpm pack`  (prepack rebuilds dist/ — a real npm tarball)
//   3. PUT an npm-protocol publish payload: the tarball as a base64
//      attachment + the version manifest read from INSIDE the tarball
//      (workspace:* ranges already resolved), annotated with `gitHead`
//
// `gitHead` is what makes `pnpm registry:check` (and the Netlify build
// validation) able to detect "source changed but version not bumped".
//
// Requires REGISTRY_PUBLISH_TOKEN in the environment (same value as the
// Netlify env var).
//
//   node scripts/registry/publish.mjs [--registry=https://mono-libs.netlify.app/npm/]

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const registryArg = args.find((a) => a.startsWith('--registry='))
const REGISTRY = registryArg ? registryArg.slice('--registry='.length) : 'https://mono-libs.netlify.app/npm/'
const TOKEN = process.env.REGISTRY_PUBLISH_TOKEN

// Dependency order. Package names are scoped, so each folder is listed explicitly.
const PACKAGES = [
  { name: '@mono-lit/devextreme', dir: 'packages/devextreme' },
  { name: '@mono-lit/utility', dir: 'packages/utility' },
  { name: '@mono-lit/helper', dir: 'packages/helper' },
]

/** Registry URL for a package — a scoped name is sent encoded (`@mono-lit%2fhelper`), as npm does. */
const pkgUrl = (name) => `${REGISTRY}${name.replace('/', '%2f')}`

if (!TOKEN) {
  console.error('[publish] REGISTRY_PUBLISH_TOKEN is not set — set it to the registry publish secret first.')
  process.exit(1)
}

// version.json ledger — the DESIRED STATE of the registry. Entries may be
// prefixed with "!" to force a re-release (purge + republish of that version).
let ledger = null
try {
  ledger = JSON.parse(readFileSync(join(repoRoot, 'version.json'), 'utf8'))
} catch (err) {
  console.error(`[publish] cannot read version.json (${err.message}) — every release must be listed there.`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Sync phase: purge anything on the registry that version.json does not
// declare (and force-purge "!"-prefixed entries so they republish fresh).
// ---------------------------------------------------------------------------
const syncPackages = {}
for (const { name } of PACKAGES) {
  if (Array.isArray(ledger?.[name])) {
    syncPackages[name] = ledger[name]
  } else {
    console.warn(`[sync] ${name}: no entry in version.json — nothing purged, nothing published`)
  }
}

try {
  const res = await fetch(`${REGISTRY}-/admin/sync`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ packages: syncPackages }),
  })
  const body = await res.json().catch(() => null)
  if (res.ok && body?.report) {
    for (const [name, r] of Object.entries(body.report)) {
      if (r.purged?.length) console.log(`[sync] ${name}: purged ${r.purged.join(', ')}`)
    }
  } else {
    console.warn(`[sync] registry sync skipped: ${res.status} ${JSON.stringify(body ?? '')}`.slice(0, 200))
  }
} catch (err) {
  console.warn(`[sync] registry sync failed (${err.cause?.code ?? err.message}) — continuing with publish`)
}

function sh(cmd, argv, { cwd = repoRoot, stdio = 'pipe' } = {}) {
  return spawnSync(cmd, argv, { cwd, stdio, encoding: 'utf8', shell: process.platform === 'win32' })
}

async function getPackument(name) {
  try {
    const res = await fetch(pkgUrl(name), {
      headers: { authorization: `Bearer ${TOKEN}` }, // publish token is accepted for reads too
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

let failed = false

for (const { name, dir: relDir } of PACKAGES) {
  const dir = join(repoRoot, relDir)
  const version = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version

  // "!" entries mean "listed with force" — strip the prefix for membership.
  const listed = (ledger?.[name] ?? []).map((e) => e.replace(/^!/, ''))
  if (!listed.includes(version)) {
    console.error(
      `[publish] FAILED ${name}@${version}: version is not listed in version.json — ` +
        `append "${version}" to the "${name}" array to acknowledge the release.`,
    )
    failed = true
    continue
  }

  const doc = await getPackument(name)
  if (doc?.versions?.[version]) {
    console.log(`[publish] ${name}@${version} already published — skipping`)
    continue
  }

  console.log(`[publish] publishing ${name}@${version} -> ${REGISTRY}`)

  // 1. real npm tarball via pnpm pack (runs prepack → fresh dist/)
  const tmp = mkdtempSync(join(tmpdir(), 'mono-publish-'))
  const pack = sh('pnpm', ['pack', '--pack-destination', tmp], { cwd: dir, stdio: 'inherit' })
  if (pack.status !== 0) {
    console.error(`[publish] FAILED to pack ${name}@${version}`)
    failed = true
    rmSync(tmp, { recursive: true, force: true })
    continue
  }
  const tarballFile = readdirSync(tmp).find((f) => f.endsWith('.tgz'))
  const tarballPath = join(tmp, tarballFile)
  const bytes = readFileSync(tarballPath)

  // 2. manifest from inside the tarball — exactly what consumers install
  const xof = sh('tar', ['-xOf', tarballPath, 'package/package.json'])
  if (xof.status !== 0) {
    console.error(`[publish] FAILED to read manifest from ${tarballFile}`)
    failed = true
    rmSync(tmp, { recursive: true, force: true })
    continue
  }
  const manifest = JSON.parse(xof.stdout)
  manifest.gitHead = sh('git', ['rev-parse', 'HEAD']).stdout.trim()

  const payload = {
    _id: name,
    name,
    'dist-tags': { latest: version },
    versions: { [version]: manifest },
    _attachments: {
      [`${name}-${version}.tgz`]: {
        content_type: 'application/octet-stream',
        data: bytes.toString('base64'),
        length: bytes.byteLength,
      },
    },
  }

  // 3. npm-protocol PUT (retry — large uploads occasionally hit dropped
  //    connections on the function gateway)
  let put = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      put = await fetch(pkgUrl(name), {
        method: 'PUT',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify(payload),
      })
      break
    } catch (err) {
      console.warn(`[publish] upload attempt ${attempt} failed (${err.cause?.code ?? err.message}) — retrying`)
      if (attempt === 3) {
        console.error(`[publish] FAILED ${name}@${version}: upload error after 3 attempts`)
        failed = true
      }
    }
  }
  if (!put) {
    rmSync(tmp, { recursive: true, force: true })
    continue
  }
  const body = await put.text()
  if (put.ok) {
    console.log(`[publish] published ${name}@${version}`)
  } else {
    console.error(`[publish] FAILED ${name}@${version}: ${put.status} ${body.slice(0, 300)}`)
    failed = true
  }
  rmSync(tmp, { recursive: true, force: true })
}

process.exit(failed ? 1 : 0)
