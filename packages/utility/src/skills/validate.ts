// src/skills/validate.ts
//
// Validate a staged session against the template standard (the same contract
// printed by `mono skills template`). This runs inside `loadStagedSession`, i.e.
// BEFORE `save`/`retry` touch GitHub — so a session that doesn't match the
// standard fails in the CLI and nothing is uploaded.
//
// Only structural/shape checks live here (the CLI has no schema engine); the
// goal is to catch the common drifts — a bad `status`, or sidecars that don't
// use the `{ decisions: [...] }` / `{ files: [...] }` wrappers with the right
// element fields.

import fs from 'node:fs'
import path from 'node:path'
import type { SessionMetadata } from './types'

/** Canonical enums, mirrored from `types.ts` (SessionStatus / ChangedFile.operation). */
const STATUSES = ['completed', 'partial', 'failed']
const OPERATIONS = ['added', 'modified', 'deleted', 'renamed']

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

function readIfExists(dir: string, name: string): string | null {
  const f = path.join(dir, name)
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null
}

/** Collect metadata.json shape problems. */
function checkMetadata(metadata: SessionMetadata, errors: string[]): void {
  const m = metadata as Record<string, unknown>
  if (!isObject(m)) {
    errors.push('metadata.json: expected a JSON object')
    return
  }
  if (typeof m.schemaVersion !== 'number') errors.push('metadata.json: `schemaVersion` must be a number')
  if (!isNonEmptyString(m.sessionId)) errors.push('metadata.json: `sessionId` must be a non-empty string')
  if (!STATUSES.includes(m.status as string)) {
    errors.push(`metadata.json: \`status\` must be one of ${STATUSES.join(' | ')}`)
  }
  for (const key of ['startedAt', 'finishedAt']) {
    if (m[key] !== undefined && typeof m[key] !== 'string') {
      errors.push(`metadata.json: \`${key}\` must be an ISO 8601 string when present`)
    }
  }
  for (const key of ['topics', 'userRequests', 'commandsRun']) {
    if (m[key] !== undefined && !isStringArray(m[key])) {
      errors.push(`metadata.json: \`${key}\` must be a string[] when present`)
    }
  }
  if (m.validation !== undefined && !isObject(m.validation)) {
    errors.push('metadata.json: `validation` must be an object when present')
  }
  if (m.outcome !== undefined && !isObject(m.outcome)) {
    errors.push('metadata.json: `outcome` must be an object when present')
  }
}

/** Parse a sidecar JSON file, pushing a clear error and returning null on failure. */
function parseSidecar(dir: string, name: string, errors: string[]): unknown | undefined {
  const text = readIfExists(dir, name)
  if (text == null) return undefined // optional + absent → nothing to check
  try {
    return JSON.parse(text)
  } catch (e: any) {
    errors.push(`${name}: invalid JSON (${e.message})`)
    return null
  }
}

/** Collect decisions.json shape problems (optional file). */
function checkDecisions(dir: string, errors: string[]): void {
  const data = parseSidecar(dir, 'decisions.json', errors)
  if (data === undefined || data === null) return
  if (!isObject(data) || !Array.isArray((data as any).decisions)) {
    errors.push('decisions.json: expected `{ "decisions": [ { title, decision, reason } ] }`')
    return
  }
  ;(data as any).decisions.forEach((d: unknown, i: number) => {
    if (!isObject(d)) {
      errors.push(`decisions.json: decisions[${i}] must be an object`)
      return
    }
    if (!isNonEmptyString(d.title)) errors.push(`decisions.json: decisions[${i}].title is required (non-empty string)`)
    if (!isNonEmptyString(d.decision)) errors.push(`decisions.json: decisions[${i}].decision is required (non-empty string)`)
    if (d.reason !== undefined && typeof d.reason !== 'string') {
      errors.push(`decisions.json: decisions[${i}].reason must be a string when present`)
    }
  })
}

/** Collect files-changed.json shape problems (optional file). */
function checkFilesChanged(dir: string, errors: string[]): void {
  const data = parseSidecar(dir, 'files-changed.json', errors)
  if (data === undefined || data === null) return
  if (!isObject(data) || !Array.isArray((data as any).files)) {
    errors.push('files-changed.json: expected `{ "files": [ { path, operation, note? } ] }`')
    return
  }
  ;(data as any).files.forEach((f: unknown, i: number) => {
    if (!isObject(f)) {
      errors.push(`files-changed.json: files[${i}] must be an object`)
      return
    }
    if (!isNonEmptyString(f.path)) errors.push(`files-changed.json: files[${i}].path is required (non-empty string)`)
    if (!OPERATIONS.includes(f.operation as string)) {
      errors.push(`files-changed.json: files[${i}].operation must be one of ${OPERATIONS.join(' | ')}`)
    }
    if (f.note !== undefined && typeof f.note !== 'string') {
      errors.push(`files-changed.json: files[${i}].note must be a string when present`)
    }
  })
}

/** Collect conversation.jsonl problems (optional file): every non-blank line must be a JSON object. */
function checkConversation(dir: string, errors: string[]): void {
  const text = readIfExists(dir, 'conversation.jsonl')
  if (text == null) return
  const lines = text.split(/\r?\n/)
  let reported = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (reported >= 5) {
      errors.push('conversation.jsonl: …more invalid lines (showing first 5)')
      break
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch (e: any) {
      errors.push(`conversation.jsonl: line ${i + 1} is not valid JSON (${e.message})`)
      reported++
      continue
    }
    if (!isObject(parsed)) {
      errors.push(`conversation.jsonl: line ${i + 1} must be a JSON object`)
      reported++
    }
  }
}

/**
 * Validate a staged session's files against the template standard. Throws a
 * single error listing every problem when the session doesn't conform, so
 * `save`/`retry` refuse to upload it. A conforming session returns silently.
 */
export function validateStagedSession(dir: string, metadata: SessionMetadata): void {
  const errors: string[] = []
  checkMetadata(metadata, errors)
  checkDecisions(dir, errors)
  checkFilesChanged(dir, errors)
  checkConversation(dir, errors)

  if (errors.length > 0) {
    throw new Error(
      `Staged session '${dir}' does not match the template standard:\n` +
        errors.map((e) => `  - ${e}`).join('\n') +
        `\nRun \`mono skills template\` to see the expected file shapes. Nothing was uploaded.`,
    )
  }
}
