// src/skills/read.ts
//
// Read centralized knowledge / skills and search history — served from the
// local clone under `.mono/skills/repo/` (refreshed when stale), so reads are
// plain filesystem work and keep working offline.
//
// `search` discovers an app's files in the clone, reads the relevant text
// (knowledge / skills / history summaries + decisions + indexes), ranks locally
// by query term overlap, and returns the top matches — it deliberately does NOT
// bulk-load every conversation chunk.

import { ensureRepo, listRepoFiles, readRepoFile, type ResolvedRemote } from './repo'
import { resolveAppId, normalizeAppId } from './appid'
import type { GitRunner } from './git'

/** Reject path traversal in a `--path` value. */
function assertSafeRelPath(rel: string): void {
  const norm = rel.replace(/\\/g, '/')
  if (norm.startsWith('/') || norm.includes('../') || norm.includes('..\\') || norm.includes('\0')) {
    throw new Error(`Unsafe path '${rel}': path traversal is not allowed`)
  }
}

/** Where the answer came from — every read result carries this. */
export interface ReadSource {
  source: 'local-clone'
  /** The clone could not be refreshed and may be behind the remote. */
  stale: boolean
  ref: string
  dir: string
}

export interface ReadResult extends ReadSource {
  app: string
  type?: 'knowledge' | 'skills'
  /** Files returned: skills-root-relative path + text. */
  files: Array<{ path: string; text: string }>
}

interface RepoAccess {
  cwd?: string
  remote: ResolvedRemote
  run?: GitRunner
}

/** Refresh-if-stale, then hand back the clone root + `dir` + provenance. */
function openRepo({ cwd = process.cwd(), remote, run }: RepoAccess) {
  const repo = ensureRepo({ cwd, remote, refresh: 'if-stale', run })
  const source: ReadSource = { source: 'local-clone', stale: repo.stale, ref: remote.ref, dir: remote.dir }
  return { repoDir: repo.repoDir, dir: remote.dir, source }
}

/**
 * Read either a whole `--type knowledge|skills` folder for an app, or a single
 * safe `--path` under that app. Returns the matched files' text.
 */
export function runRead({
  cwd = process.cwd(),
  app,
  type,
  path: relPath,
  remote,
  run,
}: RepoAccess & {
  app?: string
  type?: 'knowledge' | 'skills'
  path?: string
}): ReadResult {
  const appId = app ? normalizeAppId(app) : resolveAppId({ cwd })
  const { repoDir, dir, source } = openRepo({ cwd, remote, run })

  // Single explicit file.
  if (relPath) {
    assertSafeRelPath(relPath)
    const full = `${appId}/${relPath}`
    const text = readRepoFile(repoDir, dir, full)
    if (text == null) throw new Error(`Not found: ${full}`)
    return { ...source, app: appId, files: [{ path: full, text }] }
  }

  // A whole folder (`knowledge` or `skills`).
  if (type !== 'knowledge' && type !== 'skills') {
    throw new Error(`--type must be 'knowledge' or 'skills' (or pass --path)`)
  }
  const files: Array<{ path: string; text: string }> = []
  for (const p of listRepoFiles(repoDir, dir, `${appId}/${type}`)) {
    const text = readRepoFile(repoDir, dir, p)
    if (text != null) files.push({ path: p, text })
  }
  return { ...source, app: appId, type, files }
}

export interface SearchHit {
  path: string
  score: number
  /** A short snippet around the first match. */
  snippet: string
}

/** Lowercase word tokens for naive relevance scoring. */
function terms(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
}

function scoreText(text: string, queryTerms: string[]): number {
  const lower = text.toLowerCase()
  let score = 0
  for (const t of queryTerms) {
    let idx = lower.indexOf(t)
    while (idx !== -1) {
      score++
      idx = lower.indexOf(t, idx + t.length)
    }
  }
  return score
}

function makeSnippet(text: string, queryTerms: string[]): string {
  const lower = text.toLowerCase()
  let at = -1
  for (const t of queryTerms) {
    const i = lower.indexOf(t)
    if (i !== -1 && (at === -1 || i < at)) at = i
  }
  if (at === -1) at = 0
  const start = Math.max(0, at - 80)
  return text.slice(start, start + 240).replace(/\s+/g, ' ').trim()
}

export interface SearchResult extends ReadSource {
  app: string
  query: string
  hits: SearchHit[]
}

/**
 * Search an app's knowledge/skills + history summaries/decisions/index for a
 * query. Returns the top `limit` matches with snippets. Conversation chunks are
 * intentionally excluded from the scan (too large / low signal).
 */
export function runSearch({
  cwd = process.cwd(),
  app,
  query,
  limit = 10,
  remote,
  run,
}: RepoAccess & {
  app?: string
  query: string
  limit?: number
}): SearchResult {
  const appId = app ? normalizeAppId(app) : resolveAppId({ cwd })
  const queryTerms = terms(query)
  if (queryTerms.length === 0) throw new Error('Empty --query')

  const { repoDir, dir, source } = openRepo({ cwd, remote, run })

  // Candidate files: knowledge, skills, and history sidecars (NOT conversation parts).
  const candidates = listRepoFiles(repoDir, dir, appId).filter(
    (p) =>
      p.startsWith(`${appId}/knowledge/`) ||
      p.startsWith(`${appId}/skills/`) ||
      /\/(summary\.md|decisions\.json|index\.json|metadata\.json)$/.test(p),
  )

  const hits: SearchHit[] = []
  for (const p of candidates) {
    const text = readRepoFile(repoDir, dir, p)
    if (text == null) continue
    const score = scoreText(text, queryTerms)
    if (score > 0) hits.push({ path: p, score, snippet: makeSnippet(text, queryTerms) })
  }
  hits.sort((a, b) => b.score - a.score)
  return { ...source, app: appId, query, hits: hits.slice(0, Math.max(1, limit)) }
}
