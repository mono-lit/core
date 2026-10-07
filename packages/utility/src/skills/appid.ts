// src/skills/appid.ts
//
// Resolve and normalize the "current app id" (spec §7).
//
// Precedence:
//   1. An explicit `--app` always wins.
//   2. Else, if the cwd sits inside `.mono/apps/<name>`, use that folder name
//      (a synced sub-app).
//   3. Else, derive the host's own id from `mono.config.ts` `name` (so a renamed
//      app keeps correct attribution — see the app-naming rule), falling back to
//      the project directory name, then to `mono-host`.

import path from 'node:path'
import { extractConfig } from '../composables/mono-alias'

/**
 * Normalize an app id: lowercase, keep only `[a-z0-9_-]`, collapse the rest to
 * `-`, trim separators. Rejects path-traversal / separators outright.
 */
export function normalizeAppId(raw: string): string {
  if (/[\\/]|\.\./.test(raw)) {
    throw new Error(`Invalid app id '${raw}': must not contain '..', '/', or '\\'`)
  }
  const id = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
  if (!id) throw new Error(`Invalid app id '${raw}': empty after normalization`)
  return id
}

/** If `cwd` is inside a `.mono/apps/<name>/...` tree, return `<name>`. */
function appNameFromMonoApps(cwd: string): string | null {
  const parts = cwd.replace(/\\/g, '/').split('/')
  const i = parts.lastIndexOf('apps')
  if (i > 0 && parts[i - 1] === '.mono' && parts[i + 1]) return parts[i + 1]
  return null
}

/**
 * Resolve the effective app id for a command. `app` is the explicit `--app`
 * value (if any); `cwd` is the working directory.
 */
export function resolveAppId({ app, cwd = process.cwd() }: { app?: string; cwd?: string }): string {
  if (app && app.trim()) return normalizeAppId(app)

  const sub = appNameFromMonoApps(cwd)
  if (sub) return normalizeAppId(sub)

  const fromConfig = extractConfig(cwd).name
  const fallback = fromConfig || path.basename(cwd) || 'mono-host'
  return normalizeAppId(fallback)
}
