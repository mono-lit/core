// Registry request handler — mounted by netlify/functions/npm.ts (production)
// and by scripts/registry/local-server.mjs (local dev / tests).
//
// Routes (after stripping the optional /npm prefix):
//   GET  /-/ping                     → {"ok":true}
//   GET  /<name>                     → packument (mono) | npmjs proxy
//   GET  /<name>/<version|tag>       → version manifest (mono) | proxy
//   GET  /<name>/-/<name>-<v>.tgz    → tarball from Blobs | proxy
//   PUT  /<name>                     → pnpm/npm publish (mono only, token)
//   everything else                  → 403/404

import { sha1Hex, sha512Sri } from './crypto.ts'
import { compareSemver, emptyDoc, isExistingVersion, mergeVersion, withTarballUrls, type RegistryDoc, type VersionManifest } from './metadata.ts'
import { bareName, isMonoPackage, MONO_PACKAGES } from './packages.ts'
import { parsePublishPayload, PublishError } from './publish.ts'
import { getRegistryStores, type RegistryStores } from './storage.ts'

const NPMJS_ORIGIN = 'https://registry.npmjs.org'
const VERSION_RE = /^[0-9A-Za-z.+-]+$/

export async function handleRegistryRequest(request: Request): Promise<Response> {
  try {
    return await route(request)
  } catch (err) {
    // Include the message (not the stack) — this is a private registry, and
    // hidden errors cost hours of debugging.
    return jsonError(500, 'internal_error', `unexpected registry failure: ${(err as Error).message}`)
  }
}

async function route(request: Request): Promise<Response> {
  const url = new URL(request.url)
  let path = url.pathname.replace(/^\/(\.netlify\/functions\/)?npm/, '')
  if (path === '') path = '/'
  const method = request.method.toUpperCase()

  if (path === '/') {
    if (method !== 'GET' && method !== 'HEAD') return jsonError(405, 'method_not_allowed', 'unsupported method')
    return jsonResponse({
      'mono-registry': true,
      packages: [...MONO_PACKAGES],
    })
  }

  if (path === '/-/ping') {
    if (method !== 'GET' && method !== 'HEAD') return jsonError(405, 'method_not_allowed', 'unsupported method')
    return jsonResponse({ ok: true })
  }

  // Admin: desired-state sync. version.json is the source of truth — versions
  // missing from the submitted lists are purged (tarball + metadata), and
  // entries prefixed with "!" are purged even though listed, enabling a
  // forced re-release of the same version. Requires the publish token.
  if (path === '/-/admin/sync') {
    if (method !== 'POST') return jsonError(405, 'method_not_allowed', 'use POST')
    const token = process.env.REGISTRY_PUBLISH_TOKEN
    if (!token || !matchesToken(request, token)) {
      return jsonError(401, 'unauthorized', 'admin sync requires the publish token')
    }
    return adminSync(request, await getRegistryStores())
  }

  const segments = path.slice(1).split('/')
  // A scoped name arrives encoded as ONE segment (`@mono-lit%2fhelper`, what
  // npm/pnpm send for packuments and publishes) or as TWO (`@mono-lit/helper`,
  // what tarball URLs use). `rest` is whatever follows the name.
  let name: string
  let rest: string[]
  try {
    const first = decodeURIComponent(segments[0])
    if (first.startsWith('@') && !first.includes('/') && segments.length > 1) {
      name = `${first}/${decodeURIComponent(segments[1])}`
      rest = segments.slice(2)
    } else {
      name = first
      rest = segments.slice(1)
    }
  } catch {
    return jsonError(400, 'invalid_name', 'package name is not valid URL encoding')
  }
  if (!name || name.startsWith('-')) {
    return jsonError(404, 'not_found', `unsupported registry path: ${path}`)
  }

  const stores = await getRegistryStores()

  // Tarball: /:name/-/:bare-:version.tgz
  if (rest[0] === '-') {
    if (rest.length !== 2) return jsonError(404, 'not_found', `unsupported registry path: ${path}`)
    if (method !== 'GET' && method !== 'HEAD') return jsonError(403, 'forbidden', 'tarball writes are not supported')
    if (isMonoPackage(name)) return serveTarball(request, stores, name, rest[1])
    return redirectToNpmjs(request, path)
  }

  // Packument: /:name
  if (rest.length === 0) {
    if (method === 'GET' || method === 'HEAD') {
      if (isMonoPackage(name)) return servePackument(stores, name, request)
      return redirectToNpmjs(request, path)
    }
    if (method === 'PUT') return publish(request, stores, name)
    return jsonError(403, 'forbidden', `"${name}" is served read-only from this registry`)
  }

  // Single version / dist-tag: /:name/:spec
  if (rest.length === 1) {
    if (method !== 'GET' && method !== 'HEAD') {
      return jsonError(403, 'forbidden', `"${name}" is served read-only from this registry`)
    }
    if (isMonoPackage(name)) {
      let spec: string
      try {
        spec = decodeURIComponent(rest[0])
      } catch {
        return jsonError(400, 'invalid_version', 'version spec is not valid URL encoding')
      }
      return serveVersion(stores, name, spec, request)
    }
    return redirectToNpmjs(request, path)
  }

  return jsonError(404, 'not_found', `unsupported registry path: ${path}`)
}

/**
 * Download guard for mono packages. When REGISTRY_DOWNLOAD_TOKEN is set on
 * the site, reads (packuments, versions, tarballs) of mono packages require
 * `Authorization: Bearer <token>` — npm/pnpm send this automatically from the
 * consumer's .npmrc (`//host/npm/:_authToken=...`). The publish token is also
 * accepted so internal tooling keeps working. Public package reads (vue, …)
 * stay open. When the env var is unset, reads stay open (migration grace).
 */
function isDownloadAuthorized(request: Request): boolean {
  const downloadToken = process.env.REGISTRY_DOWNLOAD_TOKEN
  if (!downloadToken) return true
  return matchesToken(request, downloadToken) || matchesToken(request, process.env.REGISTRY_PUBLISH_TOKEN ?? '')
}

function matchesToken(request: Request, token: string): boolean {
  if (!token) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${token}` || auth === 'Basic ' + btoa(`${token}:`)
}

function registryBase(request: Request): string {
  return new URL(request.url).origin + '/npm'
}

async function servePackument(stores: RegistryStores, name: string, request: Request): Promise<Response> {
  if (!isDownloadAuthorized(request)) {
    return jsonError(401, 'unauthorized', 'a valid download token is required to access mono packages')
  }
  const doc = (await stores.metadata.get(`${name}.json`, { type: 'json' })) as RegistryDoc | null
  if (!doc) return jsonError(404, 'not_found', `package not found: ${name}`)
  withTarballUrls(doc, registryBase(request))
  return jsonResponse(doc, 200, 'no-cache')
}

async function serveVersion(stores: RegistryStores, name: string, spec: string, request: Request): Promise<Response> {
  if (!isDownloadAuthorized(request)) {
    return jsonError(401, 'unauthorized', 'a valid download token is required to access mono packages')
  }
  const doc = (await stores.metadata.get(`${name}.json`, { type: 'json' })) as RegistryDoc | null
  if (!doc) return jsonError(404, 'not_found', `package not found: ${name}`)
  const resolved = doc.versions[spec] ?? doc.versions[doc['dist-tags']?.[spec] ?? '']
  if (!resolved) return jsonError(404, 'not_found', `version not found: ${name}@${spec}`)
  withTarballUrls(doc, registryBase(request))
  return jsonResponse(resolved, 200, 'no-cache')
}

async function serveTarball(request: Request, stores: RegistryStores, name: string, filename: string): Promise<Response> {
  if (!isDownloadAuthorized(request)) {
    return jsonError(401, 'unauthorized', 'a valid download token is required to access mono packages')
  }
  // npm names a scoped tarball after the bare name: `helper-0.0.1.tgz`.
  const prefix = `${bareName(name)}-`
  if (!filename.endsWith('.tgz') || !filename.startsWith(prefix)) {
    return jsonError(404, 'not_found', `tarball not found: ${filename}`)
  }
  const version = filename.slice(prefix.length, -'.tgz'.length)
  if (!version || !VERSION_RE.test(version)) {
    return jsonError(404, 'not_found', `tarball not found: ${filename}`)
  }

  const bytes = (await stores.tarballs.get(`${name}/${version}.tgz`, { type: 'arrayBuffer' })) as ArrayBuffer | null
  if (!bytes) return jsonError(404, 'not_found', `tarball not found: ${filename}`)

  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': String(bytes.byteLength),
      // Versioned tarballs are immutable — cache hard.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}

async function publish(request: Request, stores: RegistryStores, routeName: string): Promise<Response> {
  // Optional shared-secret auth: npm/pnpm send `_authToken` as a Bearer
  // header. When REGISTRY_PUBLISH_TOKEN is set, publishes must match it.
  // Reads stay open — consumers never need a token.
  const expected = process.env.REGISTRY_PUBLISH_TOKEN
  if (expected) {
    const auth = request.headers.get('authorization') ?? ''
    const basic = 'Basic ' + btoa(`${expected}:`)
    if (auth !== `Bearer ${expected}` && auth !== basic) {
      return jsonError(401, 'unauthorized', 'invalid or missing publish token')
    }
  }

  // Defense in depth: only the mono packages may be published here.
  if (!isMonoPackage(routeName)) {
    return jsonError(
      403,
      'forbidden',
      `publishing "${routeName}" is not allowed; only ${[...MONO_PACKAGES].join(', ')} may be published to this registry`,
    )
  }

  let payload: ReturnType<typeof parsePublishPayload>
  try {
    payload = parsePublishPayload(await request.json())
  } catch (err) {
    if (err instanceof PublishError) return jsonError(err.status, err.code, err.message)
    return jsonError(400, 'invalid_payload', `could not parse publish payload: ${(err as Error).message}`)
  }
  if (payload.name !== routeName) {
    return jsonError(400, 'invalid_name', `payload is for "${payload.name}" but was sent to "${routeName}"`)
  }

  const { name, version, manifest, tags, readme, tarball } = payload

  // Hash the exact tarball bytes we are about to store.
  const shasum = await sha1Hex(tarball)
  const integrity = await sha512Sri(tarball)

  // Immutability: onlyIfNew fails atomically if this version was published
  // before (this is the 409 gate — Blobs' compare-and-set).
  const tarballKey = `${name}/${version}.tgz`
  let put = await stores.tarballs.set(tarballKey, toArrayBuffer(tarball), {
    onlyIfNew: true,
    metadata: { version, shasum, integrity },
  })
  if (!put.modified) {
    // Self-heal orphan tarballs: a blob may exist WITHOUT the packument
    // referencing it (e.g. a publish that crashed between the tarball write
    // and the metadata write). If the metadata does not list this version,
    // the blob is unreferenced — remove it and retry once.
    const doc = (await stores.metadata.get(`${name}.json`, { type: 'json' })) as RegistryDoc | null
    if (!doc || !isExistingVersion(doc, version)) {
      await stores.tarballs.delete(tarballKey)
      put = await stores.tarballs.set(tarballKey, toArrayBuffer(tarball), {
        onlyIfNew: true,
        metadata: { version, shasum, integrity },
      })
    }
  }
  if (!put.modified) {
    return jsonError(409, 'version_conflict', `${name}@${version} already exists`)
  }

  // Merge the new version into the packument with ETag-based optimistic
  // concurrency; retry on concurrent publishes of DIFFERENT versions.
  const now = new Date().toISOString()
  const versionManifest = manifest as unknown as VersionManifest
  versionManifest.dist = { ...(versionManifest.dist ?? {}), shasum, integrity }

  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await stores.metadata.getWithMetadata(`${name}.json`, { type: 'json' })
    const doc = (existing?.data as RegistryDoc | undefined) ?? emptyDoc(name, now)
    if (isExistingVersion(doc, version)) {
      // Someone published this exact version between our tarball write and
      // now — undo our orphan tarball and report the conflict.
      await stores.tarballs.delete(tarballKey)
      return jsonError(409, 'version_conflict', `${name}@${version} already exists`)
    }
    if (readme !== null) doc.readme = readme
    mergeVersion(doc, version, versionManifest, tags, now)

    const result = await stores.metadata.setJSON(
      `${name}.json`,
      doc,
      existing ? { onlyIfMatch: existing.etag } : { onlyIfNew: true },
    )
    if (result.modified) {
      return jsonResponse({ ok: true, success: true, id: name, version, dist: { shasum, integrity } }, 201)
    }
  }

  // Lost the CAS race repeatedly — undo the orphan tarball and let the
  // client retry (onlyIfNew must not be blocked by an unreferenced blob).
  await stores.tarballs.delete(tarballKey)
  return jsonError(409, 'conflict', 'concurrent publish detected — please retry')
}

/**
 * POST /-/admin/sync   body: {"packages": {"@mono-lit/utility": ["0.0.3", "!0.0.2"]}}
 *
 * Reconciles the registry with the desired state (version.json):
 *   - versions on the registry but NOT listed → purged (tarball blob deleted,
 *     version stripped from the packument; empty packuments are deleted)
 *   - entries prefixed with "!" → purged even though listed (force re-release)
 */
async function adminSync(request: Request, stores: RegistryStores): Promise<Response> {
  let body: { packages?: Record<string, string[]> }
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'invalid_payload', 'body must be JSON: {"packages": {name: [versions]}}')
  }
  const packages = body?.packages
  if (typeof packages !== 'object' || packages === null || Array.isArray(packages)) {
    return jsonError(400, 'invalid_payload', 'body must be {"packages": {name: [versions]}}')
  }

  const report: Record<string, { kept: string[]; purged: string[] }> = {}

  for (const [name, entries] of Object.entries(packages)) {
    if (!isMonoPackage(name)) {
      return jsonError(400, 'invalid_name', `"${name}" is not a mono package`)
    }
    if (!Array.isArray(entries) || entries.some((e) => typeof e !== 'string')) {
      return jsonError(400, 'invalid_payload', `versions for "${name}" must be an array of strings`)
    }

    const keep = new Set(entries.map((e) => e.replace(/^!/, '')))
    const force = new Set(entries.filter((e) => e.startsWith('!')).map((e) => e.slice(1)))

    // Force entries: delete the tarball blob DIRECTLY, even when the
    // packument doesn't reference it (handles orphaned blobs).
    for (const version of force) {
      await stores.tarballs.delete(`${name}/${version}.tgz`)
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await stores.metadata.getWithMetadata(`${name}.json`, { type: 'json' })
      if (!existing) break
      const doc = existing.data as RegistryDoc

      const kept: string[] = []
      const purged: string[] = []
      for (const version of Object.keys(doc.versions)) {
        if (keep.has(version) && !force.has(version)) {
          kept.push(version)
          continue
        }
        await stores.tarballs.delete(`${name}/${version}.tgz`)
        delete doc.versions[version]
        delete doc.time[version]
        purged.push(version)
      }

      // Drop dist-tags pointing at purged versions; recompute `latest`.
      for (const [tag, version] of Object.entries(doc['dist-tags'] ?? {})) {
        if (!doc.versions[version]) delete doc['dist-tags'][tag]
      }
      const remaining = Object.keys(doc.versions)
      if (remaining.length === 0) {
        await stores.metadata.delete(`${name}.json`)
      } else {
        if (!doc['dist-tags'].latest) {
          const releases = remaining.filter((v) => !v.includes('-'))
          doc['dist-tags'].latest = (releases.length ? releases : remaining).sort(compareSemver).at(-1)!
        }
        await stores.metadata.setJSON(`${name}.json`, doc, { onlyIfMatch: existing.etag })
      }

      report[name] = { kept, purged }
      break
    }

    if (!report[name]) report[name] = { kept: [], purged: [] }
  }

  return jsonResponse({ ok: true, report })
}

/**
 * A package this registry does not own: send the client to npmjs itself.
 *
 * A 302, not a proxy. The function used to fetch registry.npmjs.org live for
 * every foreign name — no timeout, no cache — and a consumer whose global
 * `registry=` points here sends every public package in their tree through it,
 * hundreds of invocations per install. In production this branch is rarely
 * even reached (the function is mounted on the owned names only and the edge
 * redirects the rest — see netlify.toml), but the local dev server shares this
 * handler, and a request that does land here must be just as cheap.
 *
 * pnpm follows a cross-host redirect and strips this host's `_authToken` on
 * the way (node-fetch's CVE-2022-0235 behaviour) — verified against a local
 * two-host setup before this was written. The RAW path is reused so an encoded
 * scoped name (`/@types%2Fnode`) reaches npmjs exactly as the client sent it.
 */
function redirectToNpmjs(request: Request, strippedPath: string): Response {
  const url = new URL(request.url)
  return new Response(null, {
    status: 302,
    headers: {
      location: NPMJS_ORIGIN + strippedPath + url.search,
      'cache-control': 'public, max-age=3600',
    },
  })
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function jsonResponse(body: unknown, status = 200, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Metadata must revalidate so consumers see new versions immediately;
      // tarballs are immutable and cached hard elsewhere.
      'cache-control': cacheControl,
    },
  })
}

function jsonError(status: number, code: string, reason: string): Response {
  return jsonResponse({ error: code, reason }, status)
}
