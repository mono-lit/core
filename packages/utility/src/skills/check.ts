// src/skills/check.ts
//
// `mono skills check` — a non-destructive diagnostic. It NEVER prints a token;
// it reports booleans and names. Push capability is tested with `push --dry-run`
// (the server-side auth handshake runs, nothing is written).

import fs from 'node:fs'
import path from 'node:path'
import {
  isGenericAppName,
  loadSkillConfig,
  resolveSkillTarget,
  SKILLS_DEFAULTS,
  type SkillTarget,
  type SkillUrlKind,
} from './config'
import { ensureRepo, repoDir, resolveRemote, SkillsAccessError, type ResolvedRemote, type SkillTransport } from './repo'
import { classifyGitFailure, firstFatal, redactUrl, runGit, type GitRunner } from './git'
import { detectActor } from './actor'
import { resolveAppId } from './appid'
import type { Actor } from './types'

export interface CheckReport {
  /** `skill` is present (and parseable) in mono.config.ts. */
  configured: boolean
  /** Plain repository URL, never a token. */
  url: string | null
  kind: SkillUrlKind | null
  /** Resolved branch / subfolder (after probing). */
  ref: string | null
  dir: string | null
  /** The env var NAME from `skill.envToken`, and whether it is set. */
  tokenEnv: string | null
  tokenPresent: boolean
  tokenSupported: boolean
  /** Which credentials reached the remote. */
  transport: SkillTransport | null
  canRead: boolean | null
  canPush: boolean | null
  remoteHead: string | null
  emptyRemote: boolean | null
  localClone: {
    path: string
    exists: boolean
    headSha: string | null
    /** ISO time of the last successful fetch, if any. */
    lastFetchAt: string | null
  }
  /** The resolved current app id, and whether it's still a generic template name. */
  currentApp: string | null
  genericAppName: boolean
  actor: Actor
  gitIdentityConfigured: boolean
  notes: string[]
}

/**
 * Run every check that is possible given the current config. Never throws:
 * an absent `skill` reports `configured: false`; an unreachable remote reports
 * `null`s plus a note.
 */
export function runCheck({
  cwd = process.cwd(),
  env = process.env,
  run = runGit,
}: { cwd?: string; env?: NodeJS.ProcessEnv; run?: GitRunner } = {}): CheckReport {
  const actor = detectActor(cwd)
  const gitIdentityConfigured = actor.name !== 'unknown' && actor.email !== 'unknown@unknown'

  let currentApp: string | null = null
  try {
    currentApp = resolveAppId({ cwd })
  } catch {
    currentApp = null
  }
  const genericAppName = currentApp != null && isGenericAppName(currentApp)

  const clonePath = repoDir(cwd)
  const report: CheckReport = {
    configured: false,
    url: null,
    kind: null,
    ref: null,
    dir: null,
    tokenEnv: null,
    tokenPresent: false,
    tokenSupported: false,
    transport: null,
    canRead: null,
    canPush: null,
    remoteHead: null,
    emptyRemote: null,
    localClone: { path: clonePath, exists: fs.existsSync(path.join(clonePath, '.git')), headSha: null, lastFetchAt: null },
    currentApp,
    genericAppName,
    actor,
    gitIdentityConfigured,
    notes: [],
  }

  if (genericAppName)
    report.notes.push(
      `App '${currentApp}' still uses a default template name — save/retry are skipped until you rename it (Template Rule 1).`,
    )
  if (!gitIdentityConfigured)
    report.notes.push('git user.name / user.email are not set — attribution will be "unknown".')

  // 1. Config.
  let target: SkillTarget
  try {
    const cfg = loadSkillConfig(cwd)
    if (!cfg) {
      report.notes.push('`skill` is not configured in mono.config.ts — the workflow is a no-op.')
      return report
    }
    target = resolveSkillTarget(cfg)
  } catch (e: any) {
    report.notes.push(`Invalid \`skill\` in mono.config.ts: ${e.message}`)
    return report
  }

  report.configured = true
  report.url = redactUrl(target.remoteUrl)
  report.kind = target.kind
  report.dir = target.dir
  report.tokenEnv = target.tokenEnv ?? null
  report.tokenSupported = target.tokenSupported
  report.tokenPresent = !!(target.tokenEnv && env[target.tokenEnv]?.trim())
  if (target.tokenEnv && !report.tokenPresent)
    report.notes.push(`${target.tokenEnv} is not set — only this machine's own git credentials will be tried.`)
  if (target.tokenEnv && !target.tokenSupported)
    report.notes.push(`envToken is ignored for ${target.kind} URLs — a token can only ride an https URL.`)

  // 2. Remote access (git first, token second).
  let remote: ResolvedRemote
  try {
    remote = resolveRemote({ target, env, run })
  } catch (e: any) {
    report.canRead = false
    report.canPush = false
    if (e instanceof SkillsAccessError) report.transport = e.transportTried[e.transportTried.length - 1] ?? null
    report.notes.push(e.message)
    return report
  }
  report.transport = remote.transport
  report.ref = remote.ref
  report.dir = remote.dir
  report.canRead = true
  report.remoteHead = remote.headSha
  report.emptyRemote = remote.emptyRemote

  // 3. Local clone (no refresh unless it has never been fetched).
  try {
    const repo = ensureRepo({ cwd, remote, refresh: 'never', run })
    report.localClone = {
      path: repo.repoDir,
      exists: true,
      headSha: repo.headSha,
      lastFetchAt: repo.lastFetchMs == null ? null : new Date(Date.now() - repo.lastFetchMs).toISOString(),
    }
    if (repo.stale) report.notes.push('The local clone could not be refreshed — reads may be behind the remote.')

    // 4. Push access — dry run from the clone. On an empty remote there is no
    // commit to offer, so fall back to "read worked" and say so.
    if (remote.emptyRemote || !repo.headSha) {
      report.canPush = null
      report.notes.push('Remote is empty — push access is verified on the first save.')
    } else {
      const dry = run(['push', '--dry-run', '--quiet', remote.fetchUrl, `HEAD:refs/heads/${remote.ref}`], {
        cwd: repo.repoDir,
        timeoutMs: SKILLS_DEFAULTS.gitTimeoutMs,
      })
      if (dry.ok) report.canPush = true
      else {
        const cls = classifyGitFailure(dry)
        report.canPush = cls.kind === 'no-access' ? false : null
        report.notes.push(
          cls.kind === 'no-access'
            ? `Can read but NOT push (${cls.detail ?? cls.why}) — saves will fail until write access is granted.`
            : `Push check inconclusive: ${firstFatal(dry.stderr) || cls.kind}.`,
        )
      }
    }
  } catch (e: any) {
    report.notes.push(`Local clone check failed: ${redactUrl(e.message)}`)
  }

  return report
}
