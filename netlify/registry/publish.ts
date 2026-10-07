// Parsing + validation of the npm `PUT /:package` publish payload.
//
// The payload pnpm/npm sends looks like:
// {
//   "_id": "@mono-lit/helper",
//   "name": "@mono-lit/helper",
//   "description": "...",
//   "dist-tags": { "latest": "1.2.0" },
//   "versions": { "1.2.0": { ...manifest... } },
//   "readme": "...",
//   "_attachments": {
//     "mono-helper-1.2.0.tgz": {
//       "content_type": "application/octet-stream",
//       "data": "<base64>",
//       "length": 12345
//     }
//   }
// }

import { decodeBase64 } from './crypto.ts'

export interface ParsedPublish {
  name: string
  version: string
  manifest: Record<string, unknown>
  tags: Record<string, string>
  readme: string | null
  attachmentName: string
  contentType: string
  tarball: Uint8Array
}

// Optional `@scope/` prefix, then an npm package name.
const NAME_RE = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
const VERSION_RE = /^[0-9A-Za-z.+-]+$/

export class PublishError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function parsePublishPayload(raw: unknown): ParsedPublish {
  if (typeof raw !== 'object' || raw === null) {
    throw new PublishError(400, 'invalid_payload', 'publish payload must be a JSON object')
  }
  const body = raw as Record<string, unknown>

  const name = typeof body.name === 'string' ? body.name : typeof body._id === 'string' ? body._id : ''
  if (!name || !NAME_RE.test(name)) {
    throw new PublishError(400, 'invalid_name', 'publish payload has no valid package name')
  }

  const versions = body.versions
  if (typeof versions !== 'object' || versions === null) {
    throw new PublishError(400, 'invalid_payload', 'publish payload has no versions object')
  }
  const versionKeys = Object.keys(versions)
  if (versionKeys.length === 0) {
    throw new PublishError(400, 'invalid_payload', 'publish payload has no versions')
  }

  // The version being published: dist-tags.latest when present (what pnpm
  // sends), otherwise the single version entry.
  const tags = readTags(body['dist-tags'])
  const version = tags.latest && versionKeys.includes(tags.latest) ? tags.latest : versionKeys[0]

  const manifestRaw = (versions as Record<string, unknown>)[version]
  if (typeof manifestRaw !== 'object' || manifestRaw === null) {
    throw new PublishError(400, 'invalid_payload', `version manifest for ${version} is invalid`)
  }
  if (!VERSION_RE.test(version)) {
    throw new PublishError(400, 'invalid_version', `invalid version "${version}"`)
  }

  // Strip npm-internal underscore fields from the stored manifest; everything
  // else (dependencies, exports, bin, engines, ...) is preserved verbatim.
  const manifest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(manifestRaw)) {
    if (!key.startsWith('_')) manifest[key] = value
  }
  if (typeof manifest.name !== 'string' || manifest.name !== name) {
    throw new PublishError(400, 'invalid_name', `manifest name does not match "${name}"`)
  }

  const attachments = body._attachments
  if (typeof attachments !== 'object' || attachments === null) {
    throw new PublishError(400, 'invalid_payload', 'publish payload has no _attachments')
  }
  const attachmentNames = Object.keys(attachments)
  if (attachmentNames.length !== 1) {
    throw new PublishError(400, 'invalid_payload', 'expected exactly one tarball attachment')
  }
  const attachmentName = attachmentNames[0]
  const expectedName = `${name}-${version}.tgz`
  if (attachmentName !== expectedName) {
    throw new PublishError(
      400,
      'invalid_attachment',
      `attachment must be named "${expectedName}", got "${attachmentName}"`,
    )
  }

  const attachment = (attachments as Record<string, Record<string, unknown>>)[attachmentName]
  const data = attachment?.data
  if (typeof data !== 'string' || data.length === 0) {
    throw new PublishError(400, 'invalid_attachment', 'attachment has no base64 data')
  }

  let tarball: Uint8Array
  try {
    tarball = decodeBase64(data)
  } catch (err) {
    throw new PublishError(400, 'invalid_attachment', `attachment is not valid base64: ${(err as Error).message}`)
  }

  const length = attachment.length
  if (typeof length === 'number' && length !== tarball.byteLength) {
    throw new PublishError(
      400,
      'invalid_attachment',
      `attachment length mismatch: declared ${length}, decoded ${tarball.byteLength}`,
    )
  }

  const contentType =
    typeof attachment.content_type === 'string' ? attachment.content_type : 'application/octet-stream'

  const readme = typeof body.readme === 'string' ? body.readme : null

  return { name, version, manifest, tags, readme, attachmentName, contentType, tarball }
}

function readTags(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {}
  const tags: Record<string, string> = {}
  for (const [tag, ver] of Object.entries(value as Record<string, unknown>)) {
    if (typeof ver === 'string' && VERSION_RE.test(ver)) tags[tag] = ver
  }
  return tags
}
