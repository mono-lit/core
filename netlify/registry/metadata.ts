// Packument (package metadata document) construction and merging.

import { bareName } from './packages.ts'

export interface VersionManifest {
  name: string
  version: string
  dist?: {
    tarball?: string
    shasum?: string
    integrity?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface RegistryDoc {
  name: string
  'dist-tags': Record<string, string>
  versions: Record<string, VersionManifest>
  time: Record<string, string>
  readme?: string
}

export function emptyDoc(name: string, now: string): RegistryDoc {
  return {
    name,
    'dist-tags': {},
    versions: {},
    time: { created: now },
  }
}

export function isExistingVersion(doc: RegistryDoc, version: string): boolean {
  return Object.prototype.hasOwnProperty.call(doc.versions, version)
}

/**
 * Merge one published version into a registry document.
 *
 * Tag semantics follow npm: the payload's dist-tags (set by `pnpm publish`,
 * default `{ latest: version }`, or e.g. `{ next: version }` with `--tag`)
 * win. If the payload carries no tags at all, `latest` is only moved when the
 * published version compares greater than the current latest — publishing a
 * `next`-tagged older version must not hijack `latest`.
 */
export function mergeVersion(
  doc: RegistryDoc,
  version: string,
  manifest: VersionManifest,
  tags: Record<string, string>,
  now: string,
): RegistryDoc {
  doc.versions[version] = manifest
  doc.time[version] = now
  doc.time.modified = now

  if (tags && Object.keys(tags).length > 0) {
    for (const [tag, value] of Object.entries(tags)) {
      doc['dist-tags'][tag] = value
    }
  } else {
    const latest = doc['dist-tags'].latest
    if (!latest || compareSemver(version, latest) > 0) {
      doc['dist-tags'].latest = version
    }
  }
  return doc
}

/**
 * Compare two semver strings. Returns >0 when a > b, 0 when equal, <0 when a < b.
 * Handles `major.minor.patch[-prerelease]`; a release outranks any prerelease.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  if (!pa || !pb) return a === b ? 0 : a > b ? 1 : -1

  for (let i = 0; i < 3; i++) {
    if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] - pb.nums[i]
  }
  if (!pa.pre && !pb.pre) return 0
  if (!pa.pre) return 1
  if (!pb.pre) return -1
  return comparePrerelease(pa.pre, pb.pre)
}

function comparePrerelease(a: string, b: string): number {
  const as = a.split('.')
  const bs = b.split('.')
  const len = Math.max(as.length, bs.length)
  for (let i = 0; i < len; i++) {
    const x = as[i]
    const y = bs[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x === y) continue
    const xn = /^\d+$/.test(x)
    const yn = /^\d+$/.test(y)
    if (xn && yn) return Number(x) - Number(y)
    if (xn) return -1 // numeric identifiers sort lower than alphanumeric
    if (yn) return 1
    return x < y ? -1 : 1
  }
  return 0
}

function parseSemver(v: string): { nums: [number, number, number]; pre: string | null } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v)
  if (!m) return null
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null }
}

/** Inject environment-correct tarball URLs into a stored packument. */
export function withTarballUrls(doc: RegistryDoc, base: string): RegistryDoc {
  for (const manifest of Object.values(doc.versions)) {
    if (manifest.dist) {
      // npm convention: `/@scope/name/-/name-<v>.tgz` — the filename uses the bare name.
      manifest.dist.tarball = `${base}/${doc.name}/-/${bareName(doc.name)}-${manifest.version}.tgz`
    }
  }
  return doc
}
