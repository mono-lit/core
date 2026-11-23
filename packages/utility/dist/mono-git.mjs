/**
 * Git transport for `mono sync`.
 *
 * `mono sync` historically reached GitHub only through a shared personal access
 * token (REST `/repos/{o}/{r}/commits/{ref}` + an archive ZIP download), which
 * burns REST rate limit for every app on every machine. Teammates who have been
 * invited as collaborators can already reach those repos with their OWN machine
 * credentials (Git Credential Manager / `gh auth`) over plain git transport,
 * which has no REST rate limit at all. This module is the git half of that: a
 * cheap access probe that doubles as the change-detection SHA, plus a shallow
 * fetch to materialize the tree.
 *
 * Deliberately side-effect-free and importable so `tests/mono-git.test.ts` can
 * cover it — `bin/mono-clone.mjs` is a top-level script that takes the lock and
 * reads `mono.config.ts` at import time, so it cannot be unit tested. Every
 * function that shells out accepts an injectable `run` for the same reason.
 *
 * HTTPS only, by design. If the machine's HTTPS git credentials do not reach the
 * repo we fall straight back to the existing token behaviour rather than also
 * probing `git@github.com` — see `probeGitAccess`.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * Applied to EVERY git invocation. Each one is load-bearing:
 *
 * - `credential.interactive` / `credential.guiPrompt`: stop Git Credential
 *   Manager popping a GUI dialog. `GIT_TERMINAL_PROMPT=0` alone does NOT stop
 *   GCM — a probe with GCM active was measured hanging for >2 minutes on an
 *   invisible dialog. The env vars in `gitEnv()` and the `timeoutMs` in
 *   `runGit()` are the other two layers of that same defence.
 * - `core.autocrlf=false` / `core.eol=lf`: Git for Windows defaults
 *   `autocrlf=true`, which would rewrite every LF to CRLF and make the git path
 *   produce a DIFFERENT tree than the ZIP path. Both transports must yield
 *   byte-identical files or the commit-sha cache silently lies.
 * - `core.symlinks=false`: a GitHub archive ZIP cannot carry symlinks either;
 *   avoids "unable to create symlink" without Windows Developer Mode.
 * - `submodule.recurse=false`: archives never contain submodules — parity.
 * - `core.longpaths`: Windows paths over 260 chars.
 * - `gc.auto=0`: the staging repo is deleted seconds later; never pay for gc.
 */
const BASE_ARGS = [
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

/** Environment for every git child process. See BASE_ARGS for why. */
export function gitEnv(extra = {}) {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'never',
    // Pointer files, exactly like the ZIP path. Neither transport ships LFS content.
    GIT_LFS_SKIP_SMUDGE: '1',
    ...extra,
  }
}

/**
 * Run git. NEVER throws — returns a record for the caller to classify.
 *
 * `shell: false` is deliberate: the token path's `execSync('unzip -q "..."')` is
 * a shell string, which is exactly the Windows quoting hazard not to repeat for
 * paths like `C:\Program Files\...`.
 */
export function runGit(args, { cwd, timeoutMs = 20000, env } = {}) {
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

  const timedOut = res.error?.code === 'ETIMEDOUT' || res.signal === 'SIGKILL'

  return {
    ok: res.status === 0 && !timedOut,
    code: res.status,
    signal: res.signal,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error, // ENOENT => git is not installed
    timedOut,
  }
}

// Order matters in `classifyGitFailure`: network is tested BEFORE auth, because a
// proxy or TLS failure can itself mention "403".
const RE_NETWORK = /Could not resolve host|Failed to connect|Connection (timed out|refused|reset)|Operation timed out|network is unreachable|unable to access '[^']*': (Proxy|SSL|OpenSSL|GnuTLS|Recv failure|send failure)|SSL certificate problem/i
const RE_NOTFOUND = /remote: Repository not found|repository '[^']*' not found|remote: Not Found/i
const RE_BADCRED = /Authentication failed|Invalid username or (password|token)|Support for password authentication|The requested URL returned error: 40[13]|403 Forbidden/i
const RE_NOCRED = /could not read (Username|Password)|unable to get (password|username) from user|terminal prompts disabled|no supported authentication methods/i

/** First `fatal:`/`error:`/`remote:` line of stderr, tag stripped. */
export function firstFatal(stderr) {
  const lines = String(stderr).split('\n').map((s) => s.trim())
  const line = lines.find((s) => /^(fatal|error|remote):/i.test(s)) || lines.find(Boolean) || ''
  return line.replace(/^(fatal|error|remote):\s*/i, '')
}

/**
 * Turn a `runGit` result into an actionable cause.
 *
 * The `not-invited` vs `bad-credential` split is the point of this function:
 * GitHub answers 404 ("Repository not found") for private repos you cannot see,
 * but a STALE cached credential answers "Authentication failed". Telling that
 * second user "you are not invited" would be actively misleading, and expired
 * PATs sitting in Windows Credential Manager are common.
 *
 * @returns {{kind:'no-git'|'timeout'|'ref-missing'|'network'|'no-access'|'unknown',
 *            why?:'not-invited'|'bad-credential'|'no-credential', detail?:string}}
 */
export function classifyGitFailure(res) {
  // Structural causes first — they carry no useful stderr.
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

export const httpsRemote = (owner, repo) => `https://github.com/${owner}/${repo}.git`

export const isSha40 = (s) => /^[0-9a-f]{40}$/i.test(String(s))
/** 7..39 hex — resolvable by the REST API but NOT fetchable by git. */
export const isShortSha = (s) => /^[0-9a-f]{7,39}$/i.test(String(s))

/**
 * Refs to ask `ls-remote` about. `^{}` peels an annotated tag to its COMMIT,
 * which is what REST `/commits/<ref>` returns — without it the SHA recorded in
 * `.mono/apps-commit-cache.json` would differ between the two transports and
 * every transport flip would force a redundant re-download.
 */
export function refPatterns(ref) {
  return [`refs/heads/${ref}`, `refs/tags/${ref}`, `refs/tags/${ref}^{}`]
}

/** Pick the SHA for `ref` out of `ls-remote` output. Branch beats tag. */
export function parseLsRemote(stdout, ref) {
  const rows = String(stdout)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [sha, name] = l.split('\t')
      return { sha, name }
    })

  const pick = (name) => rows.find((r) => r.name === name)?.sha || null

  return (
    pick(`refs/heads/${ref}`) ?? // branch
    pick(`refs/tags/${ref}^{}`) ?? // annotated tag -> the commit it points at
    pick(`refs/tags/${ref}`) ?? // lightweight tag
    null
  )
}

/**
 * Can this machine reach `owner/repo` with its own git credentials, and if so
 * what is the head SHA of `ref`?
 *
 * ONE `ls-remote` answers both, so on the git path the REST call disappears
 * entirely rather than merely being supplemented — which is the whole point of
 * this change.
 *
 * @returns {{ok:true, sha:string, remoteUrl:string, viaSha?:boolean}
 *         | {ok:false, kind:string, why?:string, detail?:string, remoteUrl:string}}
 */
export function probeGitAccess({ owner, repo, ref, timeoutMs = 60000, run = runGit }) {
  const remoteUrl = httpsRemote(owner, repo)
  const res = run(['ls-remote', '--exit-code', remoteUrl, ...refPatterns(ref)], { timeoutMs })

  if (res.ok) {
    const sha = parseLsRemote(res.stdout, ref)
    if (sha) return { ok: true, sha, remoteUrl }
    // Exit 0 but nothing we recognise — treat as a missing ref.
    return { ok: false, kind: 'ref-missing', remoteUrl }
  }

  const cls = classifyGitFailure(res)

  // Access is proven, the ref just isn't a branch or tag. A full 40-hex ref is a
  // pinned commit: legitimate, and GitHub allows fetching an arbitrary SHA.
  if (cls.kind === 'ref-missing' && isSha40(ref)) {
    return { ok: true, sha: String(ref).toLowerCase(), remoteUrl, viaSha: true }
  }

  return { ...cls, ok: false, remoteUrl }
}

/**
 * Every legal split of a `/tree/<refAndDir>` URL remainder into ref + folder.
 *
 * A deep GitHub URL like `.../templates/tree/main/nuxt-remote` names the FOLDER
 * `nuxt-remote` on branch `main` — not a branch called `main/nuxt-remote`. But
 * the URL alone cannot tell that: `.../tree/release/v2` is a branch `release/v2`
 * (no folder), while `.../tree/release/v2/app` could be branch `release` with
 * folder `v2/app`. Only the remote knows. So we offer EVERY split, longest ref
 * first, so a genuinely slashed branch keeps resolving exactly as it did before
 * deep URLs existed, and the shorter splits are only consulted when the longer
 * one turned out not to be a ref at all.
 *
 * Order is therefore load-bearing: candidate 0 is the pre-deep-URL behaviour.
 */
export function refDirCandidates(refAndDir) {
  const segs = String(refAndDir).split('/').filter(Boolean)
  const out = []
  for (let i = segs.length; i >= 1; i--) {
    out.push({ ref: segs.slice(0, i).join('/'), dir: segs.slice(i).join('/') })
  }
  return out
}

/**
 * Which candidate split of a deep URL is real? Probes longest-ref-first until
 * one resolves; ONE extra `ls-remote` per candidate beyond the first, and only
 * when the URL really is deep.
 *
 * A non-ref failure (no access, network) is the same for every candidate, so it
 * is returned immediately rather than burning probes that cannot succeed.
 *
 * @returns {{ok:true, sha:string, remoteUrl:string, ref:string, dir:string, viaSha?:boolean}
 *         | {ok:false, kind:string, why?:string, detail?:string, tried?:string[]}}
 *         `tried` lists every ref asked about, for the all-missing error message.
 */
export function resolveRefDir({ owner, repo, refAndDir, timeoutMs = 60000, run = runGit }) {
  const candidates = refDirCandidates(refAndDir)

  for (const c of candidates) {
    const probe = probeGitAccess({ owner, repo, ref: c.ref, timeoutMs, run })
    if (probe.ok) return { ...probe, ref: c.ref, dir: c.dir }
    if (probe.kind !== 'ref-missing') return probe
  }

  return { ok: false, kind: 'ref-missing', tried: candidates.map((c) => c.ref) }
}

/**
 * Which git method to materialize the tree with. Precedence: CLI > env > auto.
 *
 * `auto` = try `clone`, fall back to `init`+`fetch`. The escape hatch exists for
 * locked-down corporate git setups where one of the two misbehaves; there is no
 * reason to reach for it otherwise.
 *
 * @returns {'auto'|'clone'|'fetch'}
 */
export function resolveGitMethod({ env = process.env, argv = {} } = {}) {
  const raw = String(argv.gitMethod || env.MONO_SYNC_GIT_METHOD || 'auto').toLowerCase()
  return raw === 'clone' || raw === 'fetch' ? raw : 'auto'
}

/** `clone` refuses a non-empty target, and a failed attempt can leave debris. */
function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

/**
 * One shallow `clone`. Measurably the fastest way to get a tree — see
 * `materializeGitTree`. Handles a branch, a lightweight tag or an annotated tag
 * via `--branch`, but NOT a raw commit SHA, which is why `fetchIntoDir` exists.
 */
function cloneIntoDir({ remoteUrl, ref, destDir, timeoutMs, run }) {
  resetDir(destDir)
  const r = run(
    ['clone', '--quiet', '--depth=1', '--no-tags', '--single-branch', '--branch', ref, remoteUrl, destDir],
    { timeoutMs },
  )
  return r.ok ? { ok: true } : { ok: false, detail: firstFatal(r.stderr) || r.error?.message || `exit ${r.code}` }
}

/**
 * `init` + `remote add` + `fetch --depth=1 <want>` + `reset --hard`. Slower than
 * `clone` (five git processes instead of one) but it is the only path that can
 * take a raw 40-hex commit SHA as the want. `reset` rather than `checkout`
 * because a fresh `init` leaves an unborn HEAD.
 */
function fetchIntoDir({ remoteUrl, ref, destDir, timeoutMs, run }) {
  resetDir(destDir)

  const step = (args, what) => {
    const r = run(args, { cwd: destDir, timeoutMs })
    return r.ok ? null : { ok: false, detail: `${what}: ${firstFatal(r.stderr) || r.error?.message || `exit ${r.code}`}` }
  }

  const want = isSha40(ref) ? String(ref).toLowerCase() : ref

  return (
    step(['init', '--quiet'], 'init') ??
    step(['remote', 'add', 'origin', remoteUrl], 'remote add') ??
    step(['fetch', '--quiet', '--depth=1', '--no-tags', '--no-recurse-submodules', 'origin', want], 'fetch') ??
    step(['reset', '--quiet', '--hard', 'FETCH_HEAD'], 'checkout') ?? { ok: true }
  )
}

/**
 * Populate `destDir` with the tree at `ref` (or a 40-hex SHA). No `unzip`, no
 * tarball, no REST call.
 *
 * Tries `clone` first, then `init`+`fetch`. Both speak the identical wire
 * protocol and fetch the identical pack — the gap is process spawns, which are
 * expensive on Windows. Measured on this machine against a 1.8 MB / 55-file app
 * repo, three runs each:
 *
 *   clone --depth=1        3.7 / 3.8 / 3.8 s
 *   init + fetch + reset   7.0 / 7.1 / 7.2 s
 *   one bare git process   ~0.44 s   <- x5 for init/remote/fetch/reset/rev-parse
 *
 * So `clone` roughly halves it, and the four extra spawns account for nearly the
 * whole difference. Keeping `fetch` as the fallback costs nothing when `clone`
 * works and is REQUIRED anyway when `ref` is a pinned commit SHA, which
 * `clone --branch` cannot express.
 *
 * A persistent local repo that `pull`s incrementally was measured too: 3.2 s,
 * only ~0.6 s better than a cold clone, because these app repos are single-digit
 * MB. That does not pay for keeping a live `.git` (and its shallow grafts, stale
 * worktree metadata and corruption modes) between runs, so it is not built.
 * (`git archive --remote` is not an option at all — GitHub disables
 * `upload-archive`.)
 *
 * @returns {{sha: string, method: 'clone'|'fetch'}} `sha` is what actually
 *   landed. It may differ from the probe SHA if the branch advanced in between,
 *   and it is THIS one the commit cache must record.
 */
export function materializeGitTree({
  remoteUrl,
  ref,
  sha,
  destDir,
  timeoutMs = 180000,
  run = runGit,
  method = 'auto',
}) {
  // A raw commit SHA can only be a fetch `want`; `--branch` will not take one.
  // That beats an explicit `method: 'clone'`, rather than failing an app that is
  // legitimately pinned to a commit.
  const order = isSha40(ref) ? ['fetch'] : method === 'auto' ? ['clone', 'fetch'] : [method]

  const failures = []
  let used = null

  for (const attempt of order) {
    const fn = attempt === 'clone' ? cloneIntoDir : fetchIntoDir
    const res = fn({ remoteUrl, ref, destDir, timeoutMs, run })
    if (res.ok) {
      used = attempt
      break
    }
    // `init+fetch` rather than `fetch`, because fetchIntoDir's detail already
    // names which of its four steps broke — otherwise this reads "fetch failed:
    // fetch: ...".
    failures.push(`${attempt === 'clone' ? 'clone' : 'init+fetch'} failed: ${res.detail}`)
  }

  if (!used) {
    fs.rmSync(destDir, { recursive: true, force: true })
    throw new Error(`git could not materialize ${ref} (${failures.join('; ')})`)
  }

  const rev = run(['rev-parse', 'HEAD'], { cwd: destDir, timeoutMs: 15000 })
  return { sha: rev.ok ? rev.stdout.trim() : sha, method: used }
}

/**
 * Move `repoDir/<dir>` to `destDir` — the folder-picking half of a deep-URL sync.
 *
 * Both dirs are staging dirs under `.mono/apps`, so the same volume: a rename,
 * not a copy. A missing folder is a user error naming the URL's folder, not a
 * git failure — the ref resolved fine, the path just isn't in the tree.
 */
export function pickSubtree(repoDir, dir, destDir) {
  const sub = path.join(repoDir, ...String(dir).split('/').filter(Boolean))

  let st = null
  try { st = fs.statSync(sub) } catch { /* not there — reported below */ }

  if (!st?.isDirectory()) {
    throw new Error(`Folder "${dir}" not found in the repository (from the /tree/ URL).`)
  }

  fs.mkdirSync(path.dirname(destDir), { recursive: true })
  fs.renameSync(sub, destDir)
}

/**
 * Move a fully-built staging dir into place, keeping the old tree until the new
 * one is committed.
 *
 * The previous code did `rmrf(outDir)` BEFORE downloading, so any failure left
 * the app directory gone and the next `mono prepare` / dev server broken. Both
 * transports now build into a stage and swap.
 */
/**
 * EPERM/EBUSY: Windows, something holds a handle on the directory (editor,
 * indexer, antivirus, dev server). EXDEV: different volume. ENOTEMPTY/EACCES:
 * races. All mean "try the slower path", never "give up".
 */
const LOCKISH = ['EPERM', 'EBUSY', 'ENOTEMPTY', 'EXDEV', 'EACCES']
const isLockish = (e) => LOCKISH.includes(e?.code)

/**
 * Refill `outDir` from `stageDir` without renaming or deleting `outDir` itself.
 *
 * On Windows a directory some process is watching cannot be RENAMED, but its
 * contents can still be created, overwritten and deleted — measured on a
 * developer machine where `rename` on every source directory failed while file
 * writes and recursive subdirectory deletes both succeeded. When the swap cannot
 * park the old tree, replacing the contents in place is the only move left.
 *
 * The cost is atomicity: for the duration of this call `outDir` is neither the
 * old tree nor the new one. That beats the alternative, which was to abort and
 * leave the app un-syncable on such a machine.
 */
function replaceContents(outDir, stageDir) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const entry of fs.readdirSync(outDir)) {
    fs.rmSync(path.join(outDir, entry), { recursive: true, force: true })
  }
  for (const entry of fs.readdirSync(stageDir)) {
    fs.cpSync(path.join(stageDir, entry), path.join(outDir, entry), { recursive: true })
  }
}

export function swapIntoPlace(stageDir, outDir) {
  fs.mkdirSync(path.dirname(outDir), { recursive: true })

  const backup = `${outDir}.old-${process.pid}-${Date.now().toString(36)}`
  let parked = false

  if (fs.existsSync(outDir)) {
    try {
      fs.renameSync(outDir, backup)
      parked = true
    } catch (e) {
      // BOTH renames can fail this way and both must degrade — guarding only the
      // second one (as this did) meant a machine that denies directory renames
      // could clone an app once and then never update it: every later sync threw
      // EPERM here, before any fallback ran.
      if (!isLockish(e)) throw e
      replaceContents(outDir, stageDir)
      return
    }
  }

  try {
    fs.renameSync(stageDir, outDir)
  } catch (e) {
    if (!isLockish(e)) {
      if (parked) {
        try { fs.renameSync(backup, outDir) } catch { }
      }
      throw e
    }
    replaceContents(outDir, stageDir)
  }

  if (parked) fs.rmSync(backup, { recursive: true, force: true })
}

/** Delete `.tmp-*` / `*.old-*` left behind by a crashed run. The `.mono/clone.lock` guarantees no live run owns them. */
export function sweepStrayStages(baseDir) {
  let entries
  try {
    entries = fs.readdirSync(baseDir)
  } catch {
    return 0
  }

  let removed = 0
  for (const name of entries) {
    if (!isStageDebris(name)) continue
    try {
      fs.rmSync(path.join(baseDir, name), { recursive: true, force: true })
      removed++
    } catch { }
  }
  return removed
}

/**
 * Parse a GitHub app URL. Moved here from `bin/mono-clone.mjs` — one caller, and
 * it gains test coverage for free.
 */
export function parseGithubUrl(input) {
  let u
  try {
    u = new URL(String(input))
  } catch {
    throw new Error(`Invalid URL: ${input}`)
  }
  if (u.hostname !== 'github.com') {
    throw new Error(`Only github.com URLs are supported: ${input}`)
  }

  const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (parts.length < 2) throw new Error(`Invalid GitHub url: ${input}`)

  const owner = parts[0]
  const repo = parts[1].replace(/\.git$/, '')

  let ref = 'main'
  if (parts[2] === 'tree' && parts.length >= 4) {
    ref = parts.slice(3).join('/')
  }

  return { owner, repo, ref }
}

/**
 * Which transport to use for an app. Precedence: CLI flag > env > per-app > auto.
 *
 * A global knob inside `mono.config.ts` would NOT work: `extractAppsArrayText`
 * in mono-clone slices out only the `apps:` array, so a sibling top-level key is
 * invisible to it. Hence the env var. The per-app key needs no parser change —
 * `parseAppsArray` `Function()`-evals the whole app object literal.
 *
 * @returns {'auto'|'git'|'token'}
 */
export function resolveTransport({ app = {}, env = process.env, argv = {} } = {}) {
  const raw = String(argv.transport || env.MONO_SYNC_TRANSPORT || app.transport || 'auto').toLowerCase()
  return raw === 'git' || raw === 'token' ? raw : 'auto'
}

/**
 * Read a cached NEGATIVE access result, so a non-collaborator does not pay a
 * failing probe on every single run. Positives are never cached — the same
 * `ls-remote` is also our change-detection SHA, so skipping it would put the
 * REST call back.
 */
export function accessCacheGet(cache, slug, { now = Date.now(), ttlMs } = {}) {
  const entry = cache?.[slug]
  if (!entry || entry.access !== 'none' || !Number.isFinite(entry.checkedAt)) return null
  if (now - entry.checkedAt > ttlMs) return null
  return entry
}

export function accessCacheSet(cache, slug, { why, detail, now = Date.now() } = {}) {
  cache[slug] = { access: 'none', why, detail, checkedAt: now }
  return cache
}

/** Minimal argv reader for `--transport=<x>` / `--git-method=<x>` / `--recheck-access` / `--no-prune`. */
export function parseSyncArgv(argv = []) {
  const out = {}
  for (const raw of argv) {
    const arg = String(raw)
    if (arg === '--recheck-access') out.recheckAccess = true
    else if (arg === '--no-prune') out.prune = false
    else if (arg === '--prune') out.prune = true
    else if (arg.startsWith('--transport=')) out.transport = arg.slice('--transport='.length)
    else if (arg.startsWith('--git-method=')) out.gitMethod = arg.slice('--git-method='.length)
  }
  return out
}

/** Human "5m ago" / "3h ago" for the cached-negative message. */
export function ago(ts, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - ts) / 60000))
  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`
}

/** Unique-ish staging dir name, kept on the SAME volume as `outDir` so the swap can rename. */
export function stagePathFor(baseDir, name) {
  return path.join(baseDir, `.tmp-${name}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`)
}

// Re-exported for tests that want a temp root without importing `node:os`.
export const tmpRoot = () => os.tmpdir()

// --- pruning apps removed from mono.config -----------------------------------
//
// `mono sync` used to only ever ADD. Deleting an app from `mono.config.ts`'s
// `apps[]` left its clone on disk, and that clone is NOT inert: `monoAlias`,
// `monoEcosystem` and `monoMissingApps` all discover remotes by SCANNING the
// `.mono/apps/` directory listing, so a removed app kept producing `@<name>`
// aliases and kept contributing routes/layouts/stores — from a snapshot sync
// would never refresh again. These helpers are the delete half of that.

/** The one place clones live. Not per-app configurable: everything in `src/` (the vite `'/.mono/apps/'` markers, `MONO_APPS_DIR` in mono-tsconfig) hardcodes it. */
export const MONO_APPS_DIR = '.mono/apps'

/** Staging debris owned by `sweepStrayStages` — never an app, never pruned as one. */
const isStageDebris = (name) => /^\.tmp-/.test(name) || /\.old-\d+-[a-z0-9]+$/.test(name)

/**
 * Directories under `appsDir` that no configured app owns.
 *
 * Keyed on the app NAME only. `parseGithubUrl` can throw on a malformed `url`,
 * and a config typo must never be able to delete a tree — so the URL plays no
 * part in deciding what survives here (it only prunes cache entries below).
 *
 * @param {string} appsDir absolute `.mono/apps`
 * @param {Iterable<string>} keepNames configured `apps[].name`
 * @returns {string[]} directory names to delete
 */
export function orphanAppDirs(appsDir, keepNames) {
  let entries
  try {
    entries = fs.readdirSync(appsDir, { withFileTypes: true })
  } catch {
    return []
  }

  const keep = new Set(keepNames)

  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !keep.has(name) && !isStageDebris(name))
}

/**
 * Assert a prune target really sits inside `.mono/apps`, and hand back the path.
 *
 * `orphanAppDirs` already decides WHAT to delete, and every app in `apps[]` —
 * including one pointed at a local checkout by `path` — keeps its directory. So
 * this is not the correctness guard; it is the one that survives a refactor.
 *
 * The history is the reason it exists. `MonoAppConfig.path` used to feed the
 * clone destination, which fed this prune root, so a config typo could aim
 * `rmrf` at any folder on the machine. `path` is now read-only — the directory
 * an app is READ from, in every command — and never reaches here; but the blast
 * radius should be bounded by something stronger than that remaining true.
 *
 * Rejects `..` traversal, an absolute path elsewhere, and the apps dir itself.
 *
 * @param {string} appsDir absolute `.mono/apps`
 * @param {string} name directory name from {@link orphanAppDirs}
 * @returns {string} absolute path safe to delete
 * @throws if the target resolves outside `appsDir`
 */
export function appDirToPrune(appsDir, name) {
  const root = path.resolve(appsDir)
  const target = path.resolve(root, name)
  const rel = path.relative(root, target)

  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(
      `[mono] refusing to prune '${name}': ${target} is not inside ${root}. ` +
        'Only directories under .mono/apps are ever deleted.',
    )
  }

  return target
}

/** Commit-cache keys (`owner/repo@ref`) no configured app produces. */
export function staleCacheKeys(commitCache, keepKeys) {
  const keep = new Set(keepKeys)
  return Object.keys(commitCache ?? {}).filter((key) => !keep.has(key))
}

/** Access-cache keys (`owner/repo`) no configured app references. Access is repo-level, so this is keyed on the slug, not the ref. */
export function staleAccessKeys(accessCache, keepSlugs) {
  const keep = new Set(keepSlugs)
  return Object.keys(accessCache ?? {}).filter((slug) => !keep.has(slug))
}

/**
 * Drop `@<name>/*` + `@<name>-root/*` from the generated `.mono/tsconfig.json`.
 *
 * `mono prepare` rebuilds that file wholesale from the directory scan, so this
 * only covers the window between `mono sync` and the next `mono prepare` — but
 * in that window a stale mapping points TypeScript at a directory that no longer
 * exists, which is worse than having no mapping at all.
 *
 * Plain JSON on purpose: the file is emitted by `pkg-types`' `writeTSConfig`, so
 * it is never JSONC, and this `.mjs` cannot import `pkg-types`. A missing or
 * malformed file is a silent no-op — `mono prepare` regenerates it either way.
 *
 * @returns {string[]} the path keys that were removed
 */
export function pruneMonoTsconfigPaths(monoTsconfigFile, removedNames, { rootSuffix = '-root' } = {}) {
  let json
  try {
    json = JSON.parse(fs.readFileSync(monoTsconfigFile, 'utf8'))
  } catch {
    return []
  }

  const paths = json?.compilerOptions?.paths
  if (!paths || typeof paths !== 'object') return []

  const removed = []
  for (const name of removedNames) {
    for (const key of [`@${name}/*`, `@${name}${rootSuffix}/*`]) {
      if (key in paths) {
        delete paths[key]
        removed.push(key)
      }
    }
  }

  if (!removed.length) return []

  if (!Object.keys(paths).length) delete json.compilerOptions.paths

  try {
    fs.writeFileSync(monoTsconfigFile, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  } catch {
    return []
  }

  return removed
}

/**
 * Whether to prune apps that left the config. Precedence: CLI > env > default on.
 *
 * The escape hatch exists for a host whose `.mono/apps/` holds a clone placed
 * there by hand, or one federated only by a CLONED app's config (`mono sync`
 * reads the ROOT config's `apps[]` and nothing else, so such a directory looks
 * orphaned to it).
 */
export function resolvePrune({ env = process.env, argv = {} } = {}) {
  if (argv.prune === false) return false
  if (argv.prune === true) return true
  const raw = env.MONO_SYNC_PRUNE
  if (raw === undefined || raw === '') return true
  return !/^(0|false|no|off)$/i.test(String(raw))
}

// --- app sources -------------------------------------------------------------
// An app comes from a clone (`url`) or is read in place (`path`, a sibling in a
// mono-lith). `mono sync` only has work for the first kind, and only falls back
// to the `url` when the `path` directory is absent (an app lifted out of the
// lith into a standalone checkout). Pure helpers; `isDir` is injectable for
// tests.

/**
 * Why an `apps[]` entry is unusable, or `null` when it is fine.
 *
 * @param {any} app
 * @returns {string | null}
 */
export function validateAppEntry(app) {
  if (!app || typeof app !== 'object') return 'not an object'
  if (typeof app.name !== 'string' || !app.name.trim()) return 'missing "name"'
  const hasUrl = typeof app.url === 'string' && app.url.trim().length > 0
  const hasPath = app.path != null
  if (hasPath && (typeof app.path !== 'string' || !app.path.trim())) {
    return '"path" must be a non-empty string'
  }
  if (!hasUrl && !hasPath) return 'needs at least one of "url" / "path"'
  return null
}

/**
 * Where `mono sync` should take this app from.
 *
 * - `{ kind: 'path', dir }` — `path` names an existing directory: nothing to clone.
 * - `{ kind: 'clone' }` — no `path`: clone from `url` as always.
 * - `{ kind: 'path-missing', dir }` — `path` declared but absent: clone from
 *   `url` if there is one, otherwise the caller fails the app.
 *
 * @param {{ path?: string }} app
 * @param {{ cwd?: string, isDir?: (dir: string) => boolean }} [opts]
 */
export function resolveAppSource(app, { cwd = process.cwd(), isDir = isDirectory } = {}) {
  const declared = typeof app?.path === 'string' ? app.path.trim() : ''
  if (!declared) return { kind: 'clone' }
  const dir = path.isAbsolute(declared) ? declared : path.resolve(cwd, declared)
  return isDir(dir) ? { kind: 'path', dir } : { kind: 'path-missing', dir }
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}
