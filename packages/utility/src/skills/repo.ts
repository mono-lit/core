// src/skills/repo.ts
//
// The skills repository as a local git clone: how we reach it, keep it fresh,
// and push a session into it.
//
// TRANSPORT ("git first, token second")
//   1. Probe `skill.url` with this machine's OWN git credentials (Git Credential
//      Manager / `gh auth` / ssh keys). A collaborator needs nothing else.
//   2. If — and only if — that fails with `no-access` (not invited, no or stale
//      credential) and `skill.envToken` names a variable that is set, probe
//      again with the token on the URL. Network/timeout/"git not installed" are
//      not retried with a token: a token cannot fix them.
//   The tokenized URL is passed as the POSITIONAL remote argument of `ls-remote`
//   / `fetch` / `push` only. `.git/config` holds the plain URL, and every
//   stderr line goes through `redactUrl` before it can reach a result.
//
// CLONE  `.mono/skills/repo/` — single branch, full history (the repo is
//   append-only, so the blobs ARE the current tree; commit objects are tiny).
//   Rebuilt from scratch when missing or corrupt.
//
// PUSH   one commit per session, `push <url> HEAD:refs/heads/<ref>`. A rejected
//   (non-fast-forward) push means someone else saved first: fetch, hard-reset to
//   their tip, RE-APPLY the files, re-commit, push again. That replay can never
//   conflict, because the layout is folder-per-user-per-session
//   (`<app>/history/<actor>/<date>/<time>_<id>/`) and the only shared files
//   (`app.json`, `user.json`) are create-once. It never leaves the clone mid-
//   rebase, and the immutability check runs again on the fresh tip.

import fs from 'node:fs'
import path from 'node:path'
import { SKILLS_DEFAULTS, type SkillTarget } from './config'
import {
  classifyGitFailure,
  firstFatal,
  isNonFastForward,
  parseHeadSha,
  parseLsRemote,
  parseSymref,
  redactUrl,
  refDirCandidates,
  refPatterns,
  runGit,
  tokenRemote,
  type GitFailure,
  type GitNoAccessWhy,
  type GitFailureKind,
  type GitRunner,
} from './git'
import type { Actor } from './types'

export type SkillTransport = 'git' | 'token'

/** `skill.url` resolved against the live remote: which URL works, which branch, which folder. */
export interface ResolvedRemote {
  target: SkillTarget
  transport: SkillTransport
  /** The URL that reached the remote. MAY CARRY THE TOKEN — never log or store; `redactUrl()` it. */
  fetchUrl: string
  /** Resolved branch. */
  ref: string
  /** Resolved subfolder (`''` = repo root). */
  dir: string
  /** Tip of `ref` at probe time; `null` when the remote is empty. */
  headSha: string | null
  /** The remote has no refs at all — the first push creates `ref`. */
  emptyRemote: boolean
}

/** The remote could not be reached with any transport we were allowed to try. */
export class SkillsAccessError extends Error {
  kind: GitFailureKind
  why?: GitNoAccessWhy
  transportTried: SkillTransport[]
  constructor(message: string, failure: GitFailure, transportTried: SkillTransport[]) {
    super(message)
    this.name = 'SkillsAccessError'
    this.kind = failure.kind
    this.why = failure.why
    this.transportTried = transportTried
  }
}

interface ProbeOk {
  ok: true
  ref: string
  dir: string
  headSha: string | null
  emptyRemote: boolean
}
interface ProbeFail {
  ok: false
  failure: GitFailure
}

/** One `ls-remote` round-trip (or a few, for a deep URL) against one URL. */
function probe(target: SkillTarget, url: string, run: GitRunner, timeoutMs: number): ProbeOk | ProbeFail {
  // Deep GitHub URL: find which split of `/tree/<refAndDir>` names a real ref.
  if (target.refAndDir) {
    const candidates = refDirCandidates(target.refAndDir)
    let sawRepo = false
    for (const c of candidates) {
      const real = run(['ls-remote', '--exit-code', url, ...refPatterns(c.ref)], { timeoutMs })
      if (real.ok) {
        const sha = parseLsRemote(real.stdout, c.ref)
        if (sha) return { ok: true, ref: c.ref, dir: c.dir, headSha: sha, emptyRemote: false }
      }
      const failure = classifyGitFailure(real)
      if (failure.kind !== 'ref-missing') return { ok: false, failure }
      sawRepo = true
    }
    // Access is fine, no candidate ref exists. An EMPTY remote may legitimately
    // be told "branch <first segment>, folder <rest>" — the first push creates
    // it. A populated remote without that branch is a typo we must not paper over.
    if (sawRepo) {
      const head = run(['ls-remote', '--symref', url, 'HEAD'], { timeoutMs })
      if (head.ok && !head.stdout.trim()) {
        const first = candidates[candidates.length - 1]
        return { ok: true, ref: first.ref, dir: first.dir, headSha: null, emptyRemote: true }
      }
    }
    return {
      ok: false,
      failure: {
        kind: 'ref-missing',
        detail: `none of these branches exist on the remote: ${candidates.map((c) => c.ref).join(', ')}`,
      },
    }
  }

  // Explicit ref (reserved for future config forms) — probe just that.
  if (target.ref) {
    const res = run(['ls-remote', '--exit-code', url, ...refPatterns(target.ref)], { timeoutMs })
    if (res.ok) {
      const sha = parseLsRemote(res.stdout, target.ref)
      if (sha) return { ok: true, ref: target.ref, dir: target.dir, headSha: sha, emptyRemote: false }
    }
    return { ok: false, failure: classifyGitFailure(res) }
  }

  // Default branch of the remote.
  const res = run(['ls-remote', '--symref', url, 'HEAD'], { timeoutMs })
  if (!res.ok) return { ok: false, failure: classifyGitFailure(res) }
  const ref = parseSymref(res.stdout)
  if (!ref) {
    // Exit 0 with no rows: an empty repository. `main` is what GitHub/GitLab
    // initialise, and the first push creates it either way.
    return { ok: true, ref: 'main', dir: target.dir, headSha: null, emptyRemote: true }
  }
  return { ok: true, ref, dir: target.dir, headSha: parseHeadSha(res.stdout), emptyRemote: false }
}

/**
 * Work out how to reach `skill.url` and what branch/folder it names.
 * Throws {@link SkillsAccessError} (message already redacted) when neither the
 * machine's credentials nor the configured token get through.
 */
export function resolveRemote({
  target,
  env = process.env,
  run = runGit,
  timeoutMs = SKILLS_DEFAULTS.gitTimeoutMs,
}: {
  target: SkillTarget
  env?: NodeJS.ProcessEnv
  run?: GitRunner
  timeoutMs?: number
}): ResolvedRemote {
  const token = target.tokenEnv ? env[target.tokenEnv]?.trim() || undefined : undefined

  const attempts: Array<{ transport: SkillTransport; url: string }> = [
    { transport: 'git', url: target.remoteUrl },
  ]
  if (token && target.tokenSupported) {
    attempts.push({ transport: 'token', url: tokenRemote(target.remoteUrl, token) })
  }

  const tried: SkillTransport[] = []
  let last: GitFailure = { kind: 'unknown' }

  for (const attempt of attempts) {
    tried.push(attempt.transport)
    const res = probe(target, attempt.url, run, timeoutMs)
    if (res.ok) {
      return {
        target,
        transport: attempt.transport,
        fetchUrl: attempt.url,
        ref: res.ref,
        dir: res.dir,
        headSha: res.headSha,
        emptyRemote: res.emptyRemote,
      }
    }
    last = res.failure
    // Only a credential problem can be fixed by a token. Anything else is final.
    if (last.kind !== 'no-access') break
  }

  throw new SkillsAccessError(describeFailure(target, last, tried, !!token), last, tried)
}

function describeFailure(target: SkillTarget, f: GitFailure, tried: SkillTransport[], hadToken: boolean): string {
  const url = redactUrl(target.remoteUrl)
  const detail = f.detail ? ` (${f.detail})` : ''
  switch (f.kind) {
    case 'no-git':
      return 'git is not installed or not on PATH — mono skills needs git.'
    case 'timeout':
      return `Timed out reaching ${url}${detail}.`
    case 'network':
      return `Cannot reach ${url} — network/proxy/TLS problem${detail}.`
    case 'ref-missing':
      return `${url}: ${f.detail ?? 'branch not found'}.`
    case 'no-access': {
      const why =
        f.why === 'not-invited'
          ? 'this machine is not a collaborator on the repository'
          : f.why === 'bad-credential'
            ? 'the stored git credential was rejected'
            : 'git found no credential for the host'
      const fix = tried.includes('token')
        ? `The token in ${target.tokenEnv} was rejected too — check its scope / SSO authorization.`
        : target.tokenEnv
          ? hadToken
            ? `A token can only be used with an https URL.`
            : `Set ${target.tokenEnv} (a PAT with read/write access) to fall back to token access.`
          : `Ask for access, or add \`envToken\` to \`skill\` in mono.config.ts and set that variable.`
      return `No access to ${url}: ${why}${detail}. ${fix}`
    }
    default:
      return `git failed against ${url}${detail}.`
  }
}

/** Absolute path of the working clone: `<cwd>/.mono/skills/repo`. */
export function repoDir(cwd: string = process.cwd()): string {
  return path.resolve(cwd, SKILLS_DEFAULTS.stagingDir, SKILLS_DEFAULTS.repoDir)
}

export type RepoRefresh = 'always' | 'if-stale' | 'never'

export interface EnsureRepoResult {
  repoDir: string
  /** A fetch ran and the working tree now matches the remote tip. */
  refreshed: boolean
  /** A refresh was wanted but failed; the clone is being served as-is. */
  stale: boolean
  /** Local HEAD after the call (`null` on an unborn branch — empty remote). */
  headSha: string | null
  /** Age of the last successful fetch, ms (`null` if never fetched). */
  lastFetchMs: number | null
}

function fetchHeadAge(dir: string): number | null {
  try {
    return Date.now() - fs.statSync(path.join(dir, '.git', 'FETCH_HEAD')).mtimeMs
  } catch {
    return null
  }
}

function localHead(dir: string, run: GitRunner): string | null {
  const r = run(['rev-parse', '--verify', '-q', 'HEAD'], { cwd: dir, timeoutMs: 15000 })
  return r.ok ? r.stdout.trim() : null
}

/** `fetch` the branch and hard-reset the working tree onto it. Returns the failure line, or null. */
function refreshClone(dir: string, remote: ResolvedRemote, run: GitRunner, timeoutMs: number): string | null {
  const spec = `+refs/heads/${remote.ref}:refs/remotes/origin/${remote.ref}`
  const f = run(['fetch', '--quiet', '--no-tags', '--no-recurse-submodules', remote.fetchUrl, spec], {
    cwd: dir,
    timeoutMs,
  })
  if (!f.ok) return firstFatal(f.stderr) || f.error?.message || `fetch exited ${f.code}`
  const r = run(['reset', '--quiet', '--hard', `refs/remotes/origin/${remote.ref}`], { cwd: dir, timeoutMs: 60000 })
  if (!r.ok) return firstFatal(r.stderr) || `reset exited ${r.code}`
  run(['clean', '--quiet', '-fdx'], { cwd: dir, timeoutMs: 60000 })
  return null
}

/**
 * Make `.mono/skills/repo` a valid clone of the resolved remote on `ref`, and
 * bring it up to date according to `refresh`:
 *
 * - `always`   — fetch now (before a save).
 * - `if-stale` — fetch when the last fetch is older than `refreshTtlMs`, or the
 *                branch was never fetched (before a read).
 * - `never`    — serve whatever is there (diagnostics), fetching only if the
 *                branch has never been fetched at all.
 *
 * A failed refresh of an EXISTING clone degrades to `stale: true` — offline
 * reads still work. A failed FIRST fetch throws, since there is nothing to serve.
 */
export function ensureRepo({
  cwd = process.cwd(),
  remote,
  refresh,
  run = runGit,
  timeoutMs = SKILLS_DEFAULTS.gitTimeoutMs,
}: {
  cwd?: string
  remote: ResolvedRemote
  refresh: RepoRefresh
  run?: GitRunner
  timeoutMs?: number
}): EnsureRepoResult {
  const dir = repoDir(cwd)
  const plainUrl = remote.target.remoteUrl

  const valid =
    fs.existsSync(path.join(dir, '.git')) && run(['rev-parse', '--git-dir'], { cwd: dir, timeoutMs: 15000 }).ok

  if (!valid) {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const step = (args: string[], what: string) => {
      const r = run(args, { cwd: dir, timeoutMs: 30000 })
      if (!r.ok) throw new Error(`git ${what} failed: ${firstFatal(r.stderr) || r.error?.message || r.code}`)
    }
    step(['init', '--quiet'], 'init')
    step(['symbolic-ref', 'HEAD', `refs/heads/${remote.ref}`], 'symbolic-ref')
    // The PLAIN url only — the token never lands in .git/config.
    step(['remote', 'add', 'origin', plainUrl], 'remote add')
  } else {
    // Keep origin honest if `skill.url` was edited, and keep HEAD on the branch.
    const cur = run(['remote', 'get-url', 'origin'], { cwd: dir, timeoutMs: 15000 })
    if (!cur.ok || cur.stdout.trim() !== plainUrl) {
      run(cur.ok ? ['remote', 'set-url', 'origin', plainUrl] : ['remote', 'add', 'origin', plainUrl], {
        cwd: dir,
        timeoutMs: 15000,
      })
    }
    const head = run(['symbolic-ref', '-q', 'HEAD'], { cwd: dir, timeoutMs: 15000 })
    if (!head.ok || head.stdout.trim() !== `refs/heads/${remote.ref}`) {
      run(['symbolic-ref', 'HEAD', `refs/heads/${remote.ref}`], { cwd: dir, timeoutMs: 15000 })
    }
  }

  if (remote.emptyRemote) {
    // Nothing to fetch; an unborn branch is exactly what the first commit wants.
    // Drop any leftovers from an earlier failed attempt so the tree is clean.
    if (localHead(dir, run)) {
      run(['update-ref', '-d', `refs/heads/${remote.ref}`], { cwd: dir, timeoutMs: 15000 })
    }
    run(['clean', '--quiet', '-fdx'], { cwd: dir, timeoutMs: 60000 })
    return { repoDir: dir, refreshed: false, stale: false, headSha: null, lastFetchMs: null }
  }

  const hasTip = run(['rev-parse', '--verify', '-q', `refs/remotes/origin/${remote.ref}`], {
    cwd: dir,
    timeoutMs: 15000,
  }).ok
  const age = fetchHeadAge(dir)
  const isStale = age == null || age > SKILLS_DEFAULTS.refreshTtlMs
  const needFetch = !hasTip || refresh === 'always' || (refresh === 'if-stale' && isStale)

  if (!needFetch) {
    return { repoDir: dir, refreshed: false, stale: false, headSha: localHead(dir, run), lastFetchMs: age }
  }

  const failed = refreshClone(dir, remote, run, timeoutMs)
  if (failed) {
    if (!hasTip) throw new Error(`Cannot fetch ${redactUrl(plainUrl)}: ${failed}`)
    return { repoDir: dir, refreshed: false, stale: true, headSha: localHead(dir, run), lastFetchMs: age }
  }
  return { repoDir: dir, refreshed: true, stale: false, headSha: localHead(dir, run), lastFetchMs: 0 }
}

export interface CommitAndPushResult {
  /** SHA of the commit that landed on the remote. */
  sha: string
  /** 1 = pushed first time; 2+ = replayed after someone else pushed first. */
  attempts: number
}

/**
 * Write files (via `apply`), commit them as `actor`, push to `ref`. On a
 * non-fast-forward rejection: fetch, hard-reset to the new remote tip, run
 * `apply` again (it re-checks immutability on the fresh tree), commit, push —
 * up to `attempts` times.
 */
export function commitAndPush({
  repoDir: dir,
  remote,
  actor,
  message,
  apply,
  attempts = SKILLS_DEFAULTS.pushAttempts,
  run = runGit,
  timeoutMs = SKILLS_DEFAULTS.gitTimeoutMs,
}: {
  repoDir: string
  remote: ResolvedRemote
  actor: Actor
  message: string
  apply: (repoDir: string) => void
  attempts?: number
  run?: GitRunner
  timeoutMs?: number
}): CommitAndPushResult {
  const identity = ['-c', `user.name=${actor.name}`, '-c', `user.email=${actor.email}`, '-c', 'commit.gpgsign=false']
  let lastReject = ''

  for (let attempt = 1; attempt <= attempts; attempt++) {
    apply(dir)

    const add = run(['add', '-A', '--', '.'], { cwd: dir, timeoutMs: 60000 })
    if (!add.ok) throw new Error(`git add failed: ${firstFatal(add.stderr) || add.code}`)

    const commit = run([...identity, 'commit', '--quiet', '--no-verify', '-m', message], {
      cwd: dir,
      timeoutMs: 60000,
    })
    if (!commit.ok) {
      const why = firstFatal(commit.stderr) || commit.stdout.trim() || `exit ${commit.code}`
      throw new Error(`git commit failed: ${why}`)
    }

    const push = run(['push', '--quiet', remote.fetchUrl, `HEAD:refs/heads/${remote.ref}`], {
      cwd: dir,
      timeoutMs,
    })
    if (push.ok) {
      const sha = localHead(dir, run) ?? ''
      // Keep the tracking ref in step so the next `ensureRepo` sees a tip.
      run(['update-ref', `refs/remotes/origin/${remote.ref}`, 'HEAD'], { cwd: dir, timeoutMs: 15000 })
      return { sha, attempts: attempt }
    }

    if (!isNonFastForward(push.stderr) || attempt === attempts) {
      const cls = classifyGitFailure(push)
      const why = cls.kind === 'no-access' ? `no push access (${cls.detail ?? cls.why})` : firstFatal(push.stderr) || `exit ${push.code}`
      throw new Error(`git push to ${redactUrl(remote.target.remoteUrl)} failed: ${why}`)
    }

    // Someone pushed first. Replay on their tip — our session folder is unique,
    // so re-applying can only ever ADD files.
    lastReject = firstFatal(push.stderr)
    const failed = refreshClone(dir, remote, run, timeoutMs)
    if (failed) throw new Error(`git push was rejected (${lastReject}) and re-fetch failed: ${failed}`)
  }

  throw new Error(`git push kept being rejected after ${attempts} attempts (${lastReject})`)
}

/** Guard a repo-relative path: no absolute, no `..`, no NUL. */
function assertInside(rel: string): void {
  const norm = String(rel).replace(/\\/g, '/')
  if (norm.startsWith('/') || /^[A-Za-z]:/.test(norm) || norm.split('/').includes('..') || norm.includes('\0')) {
    throw new Error(`Unsafe path '${rel}': path traversal is not allowed`)
  }
}

/** Absolute path of the skills root inside the clone (`repoDir/<dir>`). */
export function skillsRoot(dir: string, sub: string): string {
  if (sub) assertInside(sub)
  return sub ? path.join(dir, sub) : dir
}

/** Read one file under `<repoDir>/<dir>/<rel>`; `null` when absent or a directory. */
export function readRepoFile(dir: string, sub: string, rel: string): string | null {
  assertInside(rel)
  const file = path.join(skillsRoot(dir, sub), rel)
  try {
    return fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8') : null
  } catch {
    return null
  }
}

/**
 * List files under `<repoDir>/<dir>/<prefix>` recursively, as forward-slash
 * paths relative to `<repoDir>/<dir>`. `.git` is never entered.
 */
export function listRepoFiles(dir: string, sub: string, prefix = ''): string[] {
  if (prefix) assertInside(prefix)
  const root = skillsRoot(dir, sub)
  const start = prefix ? path.join(root, prefix) : root
  const out: string[] = []
  const walk = (abs: string) => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name === '.git') continue
      const full = path.join(abs, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile()) out.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }
  walk(start)
  return out.sort()
}
