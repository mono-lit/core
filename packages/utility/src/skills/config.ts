// src/skills/config.ts
//
// Central configuration for the `mono skills` workflow.
//
// The repository is chosen by the USER, in `mono.config.ts`:
//
//   skill: { url: 'https://github.com/org/repo.git', envToken: 'MY_TOKEN_ENV' }
//   skill: { url: 'https://github.com/org/repo/tree/<ref>/<dir>' }   // deep URL
//
// Two guarantees this module enforces:
//   1. The target comes from `mono.config.ts` ONLY. No flag, no env var, no
//      argument can retarget it (`ALLOWED_FLAGS` + the argument guard).
//   2. The feature is OFF unless `skill` is present. When absent, every remote
//      command is a no-op that reports `skipped: true`.
//
// The token (if any) is read from `process.env[skill.envToken]`, used solely on
// the git fetch/push URL, and is never printed, logged, or written to disk.

import { config as loadDotenvFile } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { extractSkill } from '../composables/mono-alias'
import type { MonoSkillConfig } from '../composables/create-config'

export type { MonoSkillConfig }

/**
 * Built-in behavioural defaults. Users never configure these — they only set
 * `skill.url` / `skill.envToken`.
 */
export const SKILLS_DEFAULTS = Object.freeze({
  /** Local staging + clone directory (under the already-gitignored `.mono/`). */
  stagingDir: '.mono/skills',
  /** Subfolder of `stagingDir` holding the working clone of the skills repo. */
  repoDir: 'repo',
  /** Conversation chunk size before splitting into `part-NNNN.jsonl`. 750 KB. */
  chunkSizeBytes: 750 * 1024,
  /** Remove the local staging dir after a successful upload. */
  cleanupAfterSuccess: true,
  /** Move a failed session from `pending/` to `failed/`. */
  moveFailedSessions: true,
  /** `read`/`search` re-fetch the clone when its last fetch is older than this. */
  refreshTtlMs: 10 * 60 * 1000,
  /** How many times a rejected (non-fast-forward) push is replayed on a fresh tip. */
  pushAttempts: 3,
  /** Timeout for a single remote git operation (probe, fetch, push). */
  gitTimeoutMs: 120 * 1000,
})

/**
 * The ONLY CLI flags any `mono skills` subcommand may accept. The argument guard
 * rejects everything else — in particular `--token`, `--owner`, `--repo`,
 * `--branch`, `--url`, `--destination`, etc. — so the AI can never (accidentally
 * or otherwise) retarget the repo or leak a token via argv.
 */
export const ALLOWED_FLAGS = Object.freeze([
  'app',
  'dir',
  'type',
  'path',
  'query',
  'limit',
  'session-id',
  'dry-run',
])

/**
 * Default/generic template app names. While an app still carries one of these
 * placeholder names, `save`/`retry` are skipped — we don't want session history
 * filed under a non-specific id. The user is expected to rename the app first
 * (see Template Rule 1 — "confirm the app name"). Comparison is case-insensitive
 * against the normalized app id.
 */
export const GENERIC_APP_NAMES = Object.freeze([
  'mono-host',
  'mono-vue',
  'mono-vue-host',
  'mono-nuxt-host',
  'mono-vue-remote',
])

/** True when `id` is still a default/generic template name. */
export function isGenericAppName(id: string): boolean {
  return GENERIC_APP_NAMES.includes(String(id).trim().toLowerCase())
}

/**
 * Load `.env` (and `.env.dev` if present) from `cwd` into `process.env` without
 * overriding values already set in the real environment, so `skill.envToken`
 * can name a variable kept in a dotenv file — exactly like `apps[].envToken`
 * for `mono sync`. Missing files are ignored silently.
 */
export function loadSkillsEnv(cwd: string = process.cwd()): void {
  for (const name of ['.env', '.env.dev']) {
    const file = path.resolve(cwd, name)
    if (fs.existsSync(file)) {
      // `override: false` → real env wins over the dotenv file.
      // `quiet: true` → suppress dotenv's banner so stdout stays pure JSON.
      loadDotenvFile({ path: file, override: false, quiet: true })
    }
  }
}

/**
 * Read `skill` from the `mono.config.ts` in `cwd`. `null` = not configured (the
 * feature is off). Throws when the key is present but malformed.
 */
export function loadSkillConfig(cwd: string = process.cwd()): MonoSkillConfig | null {
  return extractSkill(cwd)
}

/** How `skill.url` was recognised. Decides token support and probing. */
export type SkillUrlKind = 'github' | 'https' | 'ssh' | 'local'

/** `skill.url` parsed into what the git layer needs. Pure data, no I/O. */
export interface SkillTarget {
  kind: SkillUrlKind
  /** Plain, credential-free clone URL — the ONLY form that is ever logged or stored. */
  remoteUrl: string
  /** Hostname (`null` for a local path). */
  host: string | null
  /** GitHub only. */
  owner?: string
  repo?: string
  /**
   * Branch to use. `null` = the remote's default branch (resolved by probing
   * `HEAD`). For a GitHub deep URL this is filled in AFTER the probe splits
   * `refAndDir`, so it stays `null` here.
   */
  ref: string | null
  /**
   * Raw remainder of a GitHub `/tree/<…>` URL. `release/v2/app` could be branch
   * `release/v2` + folder `app` or branch `release` + folder `v2/app`; only the
   * remote knows, so the split happens in `resolveRemote`, not here.
   */
  refAndDir: string | null
  /** Subfolder inside the repo everything is written under. `''` = repo root. */
  dir: string
  /** Env var NAME holding the PAT, when configured. */
  tokenEnv?: string
  /** HTTPS only: a token can ride the URL. `ssh`/`local` = machine access only. */
  tokenSupported: boolean
}

const RE_SCP_SSH = /^([A-Za-z0-9_.-]+)@([^:/]+):(.+)$/

/**
 * Parse `skill.url` into a {@link SkillTarget}. Throws `Invalid skill.url: …`
 * for anything that is not a repository (`/blob/` file links, an owner with no
 * repo, garbage).
 */
export function resolveSkillTarget(cfg: MonoSkillConfig): SkillTarget {
  const raw = String(cfg.url ?? '').trim()
  const tokenEnv = cfg.envToken?.trim() || undefined
  const bad = (why: string): never => {
    throw new Error(`Invalid skill.url '${raw}': ${why}`)
  }
  if (!raw) bad('empty')

  // scp-like ssh: git@github.com:org/repo.git
  const scp = RE_SCP_SSH.exec(raw)
  if (scp) {
    return {
      kind: 'ssh',
      remoteUrl: raw,
      host: scp[2],
      ref: null,
      refAndDir: null,
      dir: '',
      tokenEnv,
      tokenSupported: false,
    }
  }

  // Absolute local path (tests, offline usage): C:\… or /…
  if (/^([A-Za-z]:[\\/]|\/)/.test(raw)) {
    return {
      kind: 'local',
      remoteUrl: raw,
      host: null,
      ref: null,
      refAndDir: null,
      dir: '',
      tokenEnv,
      tokenSupported: false,
    }
  }

  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return bad('not a URL (expected https://…, ssh://…, git@host:…, or file://…)')
  }

  if (u.protocol === 'file:') {
    return {
      kind: 'local',
      remoteUrl: raw,
      host: null,
      ref: null,
      refAndDir: null,
      dir: '',
      tokenEnv,
      tokenSupported: false,
    }
  }
  if (u.protocol === 'ssh:' || u.protocol === 'git:') {
    return {
      kind: 'ssh',
      remoteUrl: raw,
      host: u.hostname,
      ref: null,
      refAndDir: null,
      dir: '',
      tokenEnv,
      tokenSupported: false,
    }
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return bad(`unsupported protocol '${u.protocol}'`)
  }
  if (u.username || u.password) bad('must not embed credentials — use `envToken` instead')

  const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)

  if (u.hostname.toLowerCase() === 'github.com') {
    if (parts.length < 2) return bad('expected https://github.com/<owner>/<repo>')
    const owner = parts[0]
    const repo = parts[1].replace(/\.git$/i, '')
    if (!repo) return bad('missing repository name')
    let refAndDir: string | null = null
    if (parts.length > 2) {
      if (parts[2] !== 'tree' || parts.length < 4) {
        return bad('only `/tree/<ref>[/<dir>]` deep URLs are supported (not /blob/, /commit/, …)')
      }
      refAndDir = parts.slice(3).join('/')
    }
    return {
      kind: 'github',
      remoteUrl: `https://github.com/${owner}/${repo}.git`,
      host: 'github.com',
      owner,
      repo,
      ref: null,
      refAndDir,
      dir: '',
      tokenEnv,
      tokenSupported: true,
    }
  }

  // Any other https git host: the URL is the clone URL as-is (GitLab groups,
  // Azure DevOps `_git`, Gitea, …). No deep-URL grammar — hosts disagree.
  if (parts.length < 1) return bad('missing repository path')
  return {
    kind: 'https',
    remoteUrl: `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/g, '')}`,
    host: u.hostname,
    ref: null,
    refAndDir: null,
    dir: '',
    tokenEnv,
    tokenSupported: true,
  }
}
