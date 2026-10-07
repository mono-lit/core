// src/skills/actor.ts
//
// Detect the effective local git identity. This is ATTRIBUTION METADATA ONLY —
// it labels who staged a session; it is NOT proof of a human's identity, and the
// CLI never lets the caller override it (spec §6).

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import type { Actor } from './types'

/** Read one `git config --get <key>`; returns '' if unset or git is unavailable. */
function gitConfig(key: string, cwd: string): string {
  try {
    return execFileSync('git', ['config', '--get', key], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

/**
 * Slugify a display name into a filesystem-safe folder fragment:
 * lowercase, non-alphanumerics → `_`, collapsed, trimmed.
 */
function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'unknown'
  )
}

/**
 * Resolve the actor from `git config user.name` / `user.email`.
 *
 * `actorFolder` = `<name-slug>__<6 hex>` where the 6 hex come from a sha256 of
 * the email (stable per identity, so the same person always maps to the same
 * folder). Example: `John Doe` / `john.doe@company.com` -> `john_doe__8f219a`.
 */
export function detectActor(cwd: string = process.cwd()): Actor {
  const name = gitConfig('user.name', cwd) || 'unknown'
  const email = gitConfig('user.email', cwd) || 'unknown@unknown'
  const hash = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 6)
  return { name, email, actorFolder: `${slugifyName(name)}__${hash}` }
}
