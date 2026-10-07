#!/usr/bin/env node
// Purge EVERY version of the given packages from the registry (tarballs + packument).
//
//   REGISTRY_PUBLISH_TOKEN=… node scripts/registry/purge.mjs [--registry=<url>] [--yes] [name …]
//
// With no names it purges the pre-scope names (mono-helper, mono-utils,
// mono-devextreme). It must run against a deployed registry that still lists
// those names in MONO_PACKAGES: admin sync rejects names it does not own, so
// once the scoped-only registry is live the old blobs can no longer be reached.
//
// Without --yes it only prints what it would send.

const args = process.argv.slice(2)
const registryArg = args.find((a) => a.startsWith('--registry='))
const REGISTRY = registryArg ? registryArg.slice('--registry='.length) : 'https://mono-libs.netlify.app/npm/'
const TOKEN = process.env.REGISTRY_PUBLISH_TOKEN
const confirmed = args.includes('--yes')
const names = args.filter((a) => !a.startsWith('--'))
const targets = names.length ? names : ['mono-helper', 'mono-utils', 'mono-devextreme']

// An empty list = "no versions should exist" → every version is purged.
const packages = Object.fromEntries(targets.map((n) => [n, []]))

console.log(`[purge] ${REGISTRY}-/admin/sync`)
console.log(`[purge] body: ${JSON.stringify({ packages })}`)

if (!confirmed) {
  console.log('[purge] dry run — pass --yes to send it.')
  process.exit(0)
}
if (!TOKEN) {
  console.error('[purge] REGISTRY_PUBLISH_TOKEN is not set.')
  process.exit(1)
}

const res = await fetch(`${REGISTRY}-/admin/sync`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify({ packages }),
})
const text = await res.text()
console.log(`[purge] ${res.status} ${text.slice(0, 1000)}`)
process.exit(res.ok ? 0 : 1)
