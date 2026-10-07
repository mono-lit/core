// src/skills/session.ts
//
// `mono skills session show` — a saved session's summary + metadata for a given
// app + session id, from the local clone, without touching the conversation.

import { ensureRepo, listRepoFiles, readRepoFile, type ResolvedRemote } from './repo'
import { normalizeAppId, resolveAppId } from './appid'
import type { GitRunner } from './git'
import type { ReadSource } from './read'

export interface SessionShowResult extends ReadSource {
  app: string
  sessionId: string
  /** Skills-root-relative session folder, if found. */
  path: string | null
  metadata: unknown | null
  summary: string | null
}

/**
 * Locate `<app>/history/**​/HH-mm-ss_<sessionId>/` in the clone, then return its
 * `metadata.json` + `summary.md`. Returns nulls when the session isn't found.
 */
export function runSessionShow({
  cwd = process.cwd(),
  app,
  sessionId,
  remote,
  run,
}: {
  cwd?: string
  app?: string
  sessionId: string
  remote: ResolvedRemote
  run?: GitRunner
}): SessionShowResult {
  const appId = app ? normalizeAppId(app) : resolveAppId({ cwd })
  const repo = ensureRepo({ cwd, remote, refresh: 'if-stale', run })
  const source: ReadSource = { source: 'local-clone', stale: repo.stale, ref: remote.ref, dir: remote.dir }

  // Find the metadata.json whose folder ends with `_<sessionId>`.
  const suffix = `_${sessionId}/metadata.json`
  const metaPath = listRepoFiles(repo.repoDir, remote.dir, `${appId}/history`).find((p) => p.endsWith(suffix))

  if (!metaPath) return { ...source, app: appId, sessionId, path: null, metadata: null, summary: null }

  const folder = metaPath.replace(/\/metadata\.json$/, '')
  const metaText = readRepoFile(repo.repoDir, remote.dir, metaPath)
  const summary = readRepoFile(repo.repoDir, remote.dir, `${folder}/summary.md`)

  let metadata: unknown = null
  try {
    metadata = metaText ? JSON.parse(metaText) : null
  } catch {
    metadata = null
  }

  return { ...source, app: appId, sessionId, path: folder, metadata, summary }
}
