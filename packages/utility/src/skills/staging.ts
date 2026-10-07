// src/skills/staging.ts
//
// Local staging + cache under `.mono/skills/` (spec §8). One session = one
// directory under `pending/`. On a failed upload it moves to `failed/`. The
// `.mono/` root is already gitignored in every template, so nothing here is
// ever committed into the application repo.
//
//   .mono/skills/
//   ├─ pending/<session-id>/   metadata.json, summary.md, conversation.jsonl, ...
//   ├─ failed/<session-id>/
//   └─ cache/                  knowledge/ skills/ search/ (read caches)

import fs from 'node:fs'
import path from 'node:path'
import { SKILLS_DEFAULTS } from './config'
import { validateStagedSession } from './validate'
import type { SessionMetadata } from './types'

/** Absolute `.mono/skills` for a given project root. */
export function stagingRoot(cwd: string = process.cwd()): string {
  return path.resolve(cwd, SKILLS_DEFAULTS.stagingDir)
}

export const REQUIRED_FILES = ['metadata.json', 'summary.md'] as const

/** A single staged session on disk. */
export interface StagedSession {
  sessionId: string
  dir: string
  files: string[]
  metadata: SessionMetadata
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T
}

/**
 * Load + validate a staged session directory. Throws a clear error when a
 * required file is missing, `metadata.json` is malformed, or any staged file
 * doesn't match the template standard — so the caller (save/retry) refuses to
 * upload a session that doesn't conform, and nothing reaches GitHub.
 */
export function loadStagedSession(dir: string): StagedSession {
  const abs = path.resolve(dir)
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Staging directory not found: ${dir}`)
  }
  for (const req of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(abs, req))) {
      throw new Error(`Staging directory '${dir}' is missing required file '${req}'`)
    }
  }
  let metadata: SessionMetadata
  try {
    metadata = readJson<SessionMetadata>(path.join(abs, 'metadata.json'))
  } catch (e: any) {
    throw new Error(`Invalid metadata.json in '${dir}': ${e.message}`)
  }
  // Enforce the template standard (metadata + sidecar shapes) before any upload.
  validateStagedSession(abs, metadata)
  const sessionId = String(metadata.sessionId || path.basename(abs))
  const files = fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
  return { sessionId, dir: abs, files, metadata }
}

/** List session ids under `pending/` (or `failed/`). */
export function listSessions(cwd: string, kind: 'pending' | 'failed'): string[] {
  const base = path.join(stagingRoot(cwd), kind)
  if (!fs.existsSync(base)) return []
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

/** Move a session directory from `pending/` to `failed/` (spec §22). Returns the new path. */
export function moveToFailed(cwd: string, sessionId: string): string {
  const from = path.join(stagingRoot(cwd), 'pending', sessionId)
  const to = path.join(stagingRoot(cwd), 'failed', sessionId)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true })
  if (fs.existsSync(from)) fs.renameSync(from, to)
  return to
}

/** Remove a staged session directory after a successful upload (spec §20 cleanup). */
export function removeSession(dir: string): void {
  fs.rmSync(path.resolve(dir), { recursive: true, force: true })
}

/** Cache directory for remote reads (`knowledge` / `skills` / `search`). */
export function cacheDir(cwd: string, kind: 'knowledge' | 'skills' | 'search'): string {
  const dir = path.join(stagingRoot(cwd), 'cache', kind)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}
