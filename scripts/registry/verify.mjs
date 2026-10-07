// End-to-end verification of the Blobs-based registry against a local
// in-process server, using the REAL pnpm CLI:
//
//   ping → publish the three mono fixture packages (real `pnpm publish` with
//   token) → packuments + dist fields + tarball SHA-1/SHA-512 → duplicate
//   publish 409 → unsupported package 403 → missing/invalid token 401 →
//   npmjs redirect (plain + scoped) → clean consumer install + imports
//   (including the @mono-lit/helper/ui/button subpath export).
//
//   node scripts/registry/verify.mjs [--skip-install]

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startLocalRegistry } from './local-server.mjs'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const fixturesDir = join(repoRoot, 'scripts', 'registry', 'fixtures')

const PORT = 8873
const REGISTRY = `http://127.0.0.1:${PORT}/npm/`
const TOKEN = 'verify-token'
const DOWNLOAD_TOKEN = 'verify-download-token'
const VERSION = `0.0.${Math.floor(Date.now() / 1000)}`

process.env.REGISTRY_PUBLISH_TOKEN = TOKEN
process.env.REGISTRY_DOWNLOAD_TOKEN = DOWNLOAD_TOKEN

const SKIP_INSTALL = process.argv.includes('--skip-install')
let failures = 0

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

// Async spawn — spawnSync would block the event loop and freeze the
// in-process registry server while pnpm talks to it.
//
// The child gets a SCRUBBED environment. When this script runs as
// `pnpm registry:verify`, `pnpm run` exports `npm_config_registry=
// https://registry.npmjs.org/` into it, and env config outranks the throwaway
// consumer's own `.npmrc` — so the `pnpm add` under test silently resolved
// against npmjs, where the fixtures do not exist, and the e2e failed in a way
// that looked like a registry bug. Run with `node` directly it passed. Neither
// launcher should matter.
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^npm_config_/i.test(key)),
)

function run(cmd, args, { cwd } = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, {
      cwd,
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d) => (stdout += d))
    child.stderr?.on('data', (d) => (stderr += d))
    child.on('error', (err) => resolvePromise({ status: 1, stdout, stderr: String(err) }))
    child.on('close', (status) => resolvePromise({ status: status ?? 1, stdout, stderr }))
  })
}

async function fetchRetry(url, init, attempts = 5) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init)
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 400 * (i + 1)))
    }
  }
  throw lastErr
}

async function httpJson(path, init) {
  const res = await fetchRetry(new URL(path, REGISTRY), init)
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {}
  return { status: res.status, json, text }
}

const withDownloadAuth = {
  'content-type': 'application/json',
  authorization: `Bearer ${DOWNLOAD_TOKEN}`,
}

const work = join(tmpdir(), `mono-blobs-e2e-${Date.now()}`)
const fixtures = join(work, 'fixtures')

const server = await startLocalRegistry({ port: PORT })

try {
  // ---------------------------------------------------------------- ping
  {
    const { status, json } = await httpJson('-/ping')
    check('GET /npm/-/ping', status === 200 && json?.ok === true)
  }

  // ---------------------------------------------------- publish all three
  for (const name of ['@mono-lit/helper', '@mono-lit/utility', '@mono-lit/devextreme']) {
    // Fixture folders are named after the bare package name (`helper`, …).
    const bare = name.split('/').pop()
    const target = join(fixtures, bare)
    cpSync(join(fixturesDir, bare), target, { recursive: true })
    const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'))
    manifest.version = VERSION
    writeFileSync(join(target, 'package.json'), JSON.stringify(manifest, null, 2))
    writeFileSync(
      join(target, '.npmrc'),
      `registry=${REGISTRY}\n//127.0.0.1:${PORT}/npm/:_authToken=${TOKEN}\n`,
    )
    const res = await run('pnpm', ['publish', '--registry', REGISTRY, '--no-git-checks'], { cwd: target })
    check(`pnpm publish ${name}@${VERSION}`, res.status === 0, (res.stderr || res.stdout || '').slice(-300))
  }

  // ------------------------------------- metadata, hashes, tarball checks
  for (const name of ['@mono-lit/helper', '@mono-lit/utility', '@mono-lit/devextreme']) {
    const { status, json } = await httpJson(name, { headers: withDownloadAuth })
    check(`GET /npm/${name} packument`, status === 200 && json?.name === name)
    // npm/pnpm request a scoped packument with the slash encoded.
    const encoded = await httpJson(name.replace('/', '%2f'), { headers: withDownloadAuth })
    check(`GET /npm/${name.replace('/', '%2f')} packument (encoded)`, encoded.status === 200 && encoded.json?.name === name)
    check(`${name} dist-tags.latest`, json?.['dist-tags']?.latest === VERSION, JSON.stringify(json?.['dist-tags'] ?? {}))

    const dist = json?.versions?.[VERSION]?.dist
    check(`${name} dist.shasum + dist.integrity`, Boolean(dist?.shasum && dist?.integrity?.startsWith('sha512-')))
    check(
      `${name} tarball URL under registry host`,
      typeof dist?.tarball === 'string' && dist.tarball.startsWith(`http://127.0.0.1:${PORT}/npm/`),
      String(dist?.tarball),
    )

    if (dist?.tarball) {
      const tar = await fetchRetry(dist.tarball, { headers: { authorization: `Bearer ${DOWNLOAD_TOKEN}` } })
      const bytes = new Uint8Array(await tar.arrayBuffer())
      const sha1 = createHash('sha1').update(bytes).digest('hex')
      const sha512 = 'sha512-' + createHash('sha512').update(bytes).digest('base64')
      check(`${name} tarball SHA-1/SHA-512`, tar.status === 200 && sha1 === dist.shasum && sha512 === dist.integrity, `${bytes.byteLength} bytes`)
    }
  }

  // ------------------------------------------------ download-token guard
  {
    const noAuth = await httpJson('@mono-lit/helper')
    check('mono read WITHOUT token → 401', noAuth.status === 401 && noAuth.json?.error === 'unauthorized')

    const wrong = await httpJson('@mono-lit/helper', {
      headers: { authorization: 'Bearer wrong-download-token' },
    })
    check('mono read with WRONG token → 401', wrong.status === 401 && wrong.json?.error === 'unauthorized')

    const publishTokenRead = await httpJson('@mono-lit/helper', {
      headers: { authorization: `Bearer ${TOKEN}` },
    })
    check('mono read with publish token → 200 (internal tooling)', publishTokenRead.status === 200)

    const publicNoAuth = await httpJson('vue', { redirect: 'manual' })
    check('public package read WITHOUT token → 302 to npmjs (never gated by the token)', publicNoAuth.status === 302)

    const tarballNoAuth = await fetchRetry(`${REGISTRY}@mono-lit/helper/-/helper-${VERSION}.tgz`)
    check('tarball WITHOUT token → 401', tarballNoAuth.status === 401)
  }

  // ------------------------------------------------ protocol-level cases
  const publishBody = (name, version) => ({
    _id: name,
    name,
    'dist-tags': { latest: version },
    versions: { [version]: { name, version } },
    _attachments: {
      [`${name}-${version}.tgz`]: {
        content_type: 'application/octet-stream',
        data: Buffer.from('tarball-bytes').toString('base64'),
        length: 13,
      },
    },
  })

  {
    const dup = await httpJson('@mono-lit/helper', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(publishBody('@mono-lit/helper', VERSION)),
    })
    check('duplicate publish → 409 version_conflict', dup.status === 409 && dup.json?.error === 'version_conflict', `${dup.status} ${dup.text.slice(0, 100)}`)
  }
  {
    const next = await httpJson('@mono-lit/helper', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(publishBody('@mono-lit/helper', '9.9.9')),
    })
    check('new version publish succeeds (201)', next.status === 201 && next.json?.ok === true)
  }
  {
    const foreign = await httpJson('vue', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(publishBody('vue', '1.0.0')),
    })
    check('publishing vue → 403 forbidden', foreign.status === 403 && foreign.json?.error === 'forbidden')
  }
  {
    const noAuth = await httpJson('@mono-lit/utility', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(publishBody('@mono-lit/utility', '9.9.9')),
    })
    check('publish without token → 401', noAuth.status === 401 && noAuth.json?.error === 'unauthorized')
  }
  {
    const badAuth = await httpJson('@mono-lit/utility', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: 'Bearer wrong-token' },
      body: JSON.stringify(publishBody('@mono-lit/utility', '9.9.9')),
    })
    check('publish with wrong token → 401', badAuth.status === 401 && badAuth.json?.error === 'unauthorized')
  }

  // --------------------------------------------------- npmjs redirect
  // A foreign package is a 302 to registry.npmjs.org, not a proxied fetch: the
  // registry must answer these without touching the network at all (it used
  // to fetch npmjs live per request, with no timeout and no cache). Asserted
  // with `redirect: 'manual'` so a slow link cannot turn this into a SKIP.
  {
    const vue = await fetchRetry(new URL('vue', REGISTRY), { redirect: 'manual' })
    check(
      'foreign package → 302 to npmjs, no upstream fetch',
      vue.status === 302 && vue.headers.get('location') === 'https://registry.npmjs.org/vue',
      `${vue.status} ${vue.headers.get('location')}`,
    )
    const scoped = await fetchRetry(new URL('@vitejs%2Fplugin-vue?write=true', REGISTRY), { redirect: 'manual' })
    check(
      'scoped name keeps its raw encoding and the query string on the way to npmjs',
      scoped.status === 302 && scoped.headers.get('location') === 'https://registry.npmjs.org/@vitejs%2Fplugin-vue?write=true',
      `${scoped.status} ${scoped.headers.get('location')}`,
    )
    const tgz = await fetchRetry(new URL('vue/-/vue-3.5.0.tgz', REGISTRY), { redirect: 'manual' })
    check(
      'a foreign tarball redirects too',
      tgz.status === 302 && tgz.headers.get('location') === 'https://registry.npmjs.org/vue/-/vue-3.5.0.tgz',
      `${tgz.status} ${tgz.headers.get('location')}`,
    )
  }

  // --------------------------------------- clean consumer install + imports
  if (!SKIP_INSTALL) {
    const consumer = join(work, 'consumer')
    mkdirSync(consumer, { recursive: true })
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true }, null, 2))
    // Mirrors a real consumer: registry + download token in .npmrc.
    writeFileSync(
      join(consumer, '.npmrc'),
      `registry=${REGISTRY}\n//127.0.0.1:${PORT}/npm/:_authToken=${DOWNLOAD_TOKEN}\n`,
    )

    const add = await run(
      'pnpm',
      ['add', `@mono-lit/helper@${VERSION}`, `@mono-lit/utility@${VERSION}`, `@mono-lit/devextreme@${VERSION}`, 'vue'],
      { cwd: consumer },
    )
    check('pnpm add all mono packages + vue (clean project)', add.status === 0, (add.stderr || add.stdout || '').slice(-400))

    if (add.status === 0) {
      writeFileSync(
        join(consumer, 'verify.mjs'),
        `const results = []
async function tryImport(label, spec, expectKey) {
  try {
    const mod = await import(spec)
    const ok = expectKey ? mod[expectKey] !== undefined : true
    results.push([ok ? 'ok' : 'FAIL', label, ok ? '' : 'missing export ' + expectKey])
  } catch (err) {
    results.push(['FAIL', label, err.message.slice(0, 120)])
  }
}
await tryImport('@mono-lit/helper', '@mono-lit/helper', 'greeting')
await tryImport('@mono-lit/helper/ui/button', '@mono-lit/helper/ui/button', 'isButtonFixture')
await tryImport('@mono-lit/utility', '@mono-lit/utility', 'answer')
await tryImport('@mono-lit/devextreme', '@mono-lit/devextreme', 'dx')
await tryImport('vue', 'vue')
let failed = 0
for (const [status, label, detail] of results) {
  console.log(status.padEnd(4), label, detail)
  if (status === 'FAIL') failed++
}
process.exit(failed ? 1 : 0)
`,
      )
      const verify = await run('node', ['verify.mjs'], { cwd: consumer })
      check('imports from clean install (incl. ui/button subpath)', verify.status === 0, verify.stdout.trim())
    }
  }

  // ------------------------------------- desired-state sync + force release
  {
    // purge the stray 9.9.9 from @mono-lit/helper (not listed)
    const sync = await httpJson('-/admin/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ packages: { '@mono-lit/helper': [VERSION] } }),
    })
    check(
      'admin sync purges unlisted versions',
      sync.status === 200 && sync.json?.report?.['@mono-lit/helper']?.purged?.includes('9.9.9'),
      sync.text.slice(0, 140),
    )

    const after = await httpJson('@mono-lit/helper', { headers: withDownloadAuth })
    check(
      'purged version gone from packument',
      after.status === 200 && !after.json.versions['9.9.9'] && Boolean(after.json.versions[VERSION]),
    )

    const oldTarball = await fetchRetry(`${REGISTRY}@mono-lit/helper/-/helper-9.9.9.tgz`, {
      headers: { authorization: `Bearer ${DOWNLOAD_TOKEN}` },
    })
    check('purged tarball → 404', oldTarball.status === 404)

    // force re-release: "!VERSION" purges VERSION, then the same version can
    // be published again (this is the mistake-bypass)
    const force = await httpJson('-/admin/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ packages: { '@mono-lit/helper': [`!${VERSION}`] } }),
    })
    const blocked = await httpJson('@mono-lit/helper', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(publishBody('@mono-lit/helper', VERSION)),
    })
    check(
      'force purge allows same-version republish',
      force.status === 200 && blocked.status === 201,
      `sync ${force.status}, republish ${blocked.status}`,
    )
  }
} finally {
  server.close()
  rmSync(work, { recursive: true, force: true })
}

console.log(failures === 0 ? '\ne2e: all checks passed.' : `\ne2e: ${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
