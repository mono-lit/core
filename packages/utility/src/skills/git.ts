// src/skills/git.ts
//
// Git primitives for the `mono skills` workflow — a TypeScript port of the parts
// of `bin/mono-git.mjs` this workflow needs, plus the two things `mono sync`
// never had to do: put a token ON a URL and take it OFF again before anything
// is logged.
//
// Why a port and not an import: `bin/mono-git.mjs` is `{owner, repo}`-shaped and
// hard-codes `https://github.com/…`, while `skill.url` may be any git host, a
// deep GitHub URL, or a local path. It also stays the single owner of the
// `mono sync` transport; nothing here is used by `mono sync`.
//
// Every function that shells out accepts an injectable `run` so the resolver
// and the push loop can be unit-tested with canned stderr.

import { spawnSync } from 'node:child_process'

/**
 * Applied to EVERY git invocation (same list as `mono sync`, same reasons):
 * stop Git Credential Manager from popping a dialog, keep LF so the tree is
 * byte-identical across machines, no symlinks/submodules, long paths, no gc.
 */
export const BASE_ARGS = [
  '-c', 'credential.interactive=false',
  '-c', 'credential.guiPrompt=false',
  '-c', 'core.longpaths=true',
  '-c', 'core.autocrlf=false',
  '-c', 'core.eol=lf',
  '-c', 'core.symlinks=false',
  '-c', 'submodule.recurse=false',
  '-c', 'gc.auto=0',
  '-c', 'advice.detachedHead=false',
  '--no-pager',
]

/** Environment for every git child process. */
export function gitEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'never',
    GIT_LFS_SKIP_SMUDGE: '1',
    ...extra,
  }
}

export interface GitResult {
  ok: boolean
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  error?: NodeJS.ErrnoException
  timedOut: boolean
}

export interface RunGitOptions {
  cwd?: string
  timeoutMs?: number
  env?: NodeJS.ProcessEnv
}

export type GitRunner = (args: string[], opts?: RunGitOptions) => GitResult

/**
 * Run git. NEVER throws — returns a record for the caller to classify.
 * `shell: false` so a path like `C:\Program Files\…` needs no quoting.
 */
export function runGit(args: string[], { cwd, timeoutMs = 20000, env }: RunGitOptions = {}): GitResult {
  const res = spawnSync('git', [...BASE_ARGS, ...args], {
    cwd,
    env: gitEnv(env),
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const timedOut = (res.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT' || res.signal === 'SIGKILL'

  return {
    ok: res.status === 0 && !timedOut,
    code: res.status,
    signal: res.signal,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error as NodeJS.ErrnoException | undefined,
    timedOut,
  }
}

// Order matters in `classifyGitFailure`: network is tested BEFORE auth, because a
// proxy or TLS failure can itself mention "403".
const RE_NETWORK =
  /Could not resolve host|Failed to connect|Connection (timed out|refused|reset)|Operation timed out|network is unreachable|unable to access '[^']*': (Proxy|SSL|OpenSSL|GnuTLS|Recv failure|send failure)|SSL certificate problem/i
const RE_NOTFOUND = /remote: Repository not found|repository '[^']*' not found|remote: Not Found|does not appear to be a git repository/i
const RE_BADCRED =
  /Authentication failed|Invalid username or (password|token)|Support for password authentication|The requested URL returned error: 40[13]|403 Forbidden|Permission (to [^ ]+ )?denied/i
const RE_NOCRED =
  /could not read (Username|Password)|unable to get (password|username) from user|terminal prompts disabled|no supported authentication methods/i

/** First `fatal:`/`error:`/`remote:` line of stderr, tag stripped — and redacted. */
export function firstFatal(stderr: string): string {
  const lines = String(stderr).split('\n').map((s) => s.trim())
  const line = lines.find((s) => /^(fatal|error|remote):/i.test(s)) || lines.find(Boolean) || ''
  return redactUrl(line.replace(/^(fatal|error|remote):\s*/i, ''))
}

export type GitFailureKind = 'no-git' | 'timeout' | 'ref-missing' | 'network' | 'no-access' | 'unknown'
export type GitNoAccessWhy = 'not-invited' | 'bad-credential' | 'no-credential'

export interface GitFailure {
  kind: GitFailureKind
  why?: GitNoAccessWhy
  detail?: string
}

/**
 * Turn a `runGit` result into an actionable cause. The `not-invited` vs
 * `bad-credential` split matters: GitHub answers 404 for private repos you
 * cannot see, but a STALE cached credential answers "Authentication failed".
 */
export function classifyGitFailure(res: GitResult | undefined): GitFailure {
  if (res?.error?.code === 'ENOENT') return { kind: 'no-git' }
  if (res?.timedOut) return { kind: 'timeout' }

  const err = res?.stderr || ''

  // `ls-remote --exit-code` exits 2 with no output when no ref matched.
  if (res?.code === 2 && !err.trim()) return { kind: 'ref-missing' }

  if (RE_NETWORK.test(err)) return { kind: 'network', detail: firstFatal(err) }
  if (RE_NOTFOUND.test(err)) return { kind: 'no-access', why: 'not-invited', detail: firstFatal(err) }
  if (RE_BADCRED.test(err)) return { kind: 'no-access', why: 'bad-credential', detail: firstFatal(err) }
  if (RE_NOCRED.test(err)) return { kind: 'no-access', why: 'no-credential', detail: firstFatal(err) }

  return { kind: 'unknown', detail: firstFatal(err) || `git exited ${res?.code}` }
}

/** Strip any embedded credential before a URL (or a line containing one) reaches a log or an error. */
export function redactUrl(text: string): string {
  return String(text).replace(/(\w+:)?\/\/[^/@\s]*@/g, '$1//***@')
}

/**
 * Put a token on an https clone URL for ONE fetch/push. GitHub authenticates a
 * PAT as user `x-access-token`; GitLab-style hosts as `oauth2`; Azure DevOps
 * accepts any user name with a PAT password. Never store the result — pass it
 * as the positional remote argument only, so `.git/config` stays clean.
 */
export function tokenRemote(remoteUrl: string, token: string): string {
  let u: URL
  try {
    u = new URL(remoteUrl)
  } catch {
    throw new Error(`A token can only be used with an https URL (${redactUrl(remoteUrl)})`)
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error(`A token can only be used with an https URL (${redactUrl(remoteUrl)})`)
  }
  u.username = u.hostname.toLowerCase() === 'github.com' ? 'x-access-token' : 'oauth2'
  u.password = token
  return u.toString()
}

/**
 * Every legal split of a `/tree/<refAndDir>` URL remainder into ref + folder,
 * longest ref first — `release/v2/app` may be branch `release/v2` + `app` or
 * branch `release` + `v2/app`. Only the remote can tell, so the caller probes
 * each candidate in this order. (Ported from `bin/mono-git.mjs`.)
 */
export function refDirCandidates(refAndDir: string): Array<{ ref: string; dir: string }> {
  const segs = String(refAndDir).split('/').filter(Boolean)
  const out: Array<{ ref: string; dir: string }> = []
  for (let i = segs.length; i >= 1; i--) {
    out.push({ ref: segs.slice(0, i).join('/'), dir: segs.slice(i).join('/') })
  }
  return out
}

/** Refs to ask `ls-remote` about for a branch-or-tag name. */
export function refPatterns(ref: string): string[] {
  return [`refs/heads/${ref}`, `refs/tags/${ref}`, `refs/tags/${ref}^{}`]
}

/** Pick the SHA for `ref` out of `ls-remote` output. Branch beats tag. */
export function parseLsRemote(stdout: string, ref: string): string | null {
  const rows = String(stdout)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [sha, name] = l.split('\t')
      return { sha, name }
    })
  const pick = (name: string) => rows.find((r) => r.name === name)?.sha || null
  return pick(`refs/heads/${ref}`) ?? pick(`refs/tags/${ref}^{}`) ?? pick(`refs/tags/${ref}`) ?? null
}

/**
 * The default branch from `git ls-remote --symref <url> HEAD`:
 * `ref: refs/heads/main\tHEAD` → `main`. `null` for an empty (unborn) remote.
 */
export function parseSymref(stdout: string): string | null {
  const m = /^ref:\s*refs\/heads\/(\S+)\s+HEAD/m.exec(String(stdout))
  return m ? m[1] : null
}

/** The SHA that `ls-remote … HEAD` reports (second line of a `--symref` answer). */
export function parseHeadSha(stdout: string): string | null {
  const m = /^([0-9a-f]{40})\s+HEAD$/m.exec(String(stdout))
  return m ? m[1] : null
}

/** Did a push get rejected because the remote moved on (someone else pushed first)? */
export function isNonFastForward(stderr: string): boolean {
  return /rejected\][^\n]*\((fetch first|non-fast-forward|stale info)\)|Updates were rejected/i.test(
    String(stderr),
  )
}
