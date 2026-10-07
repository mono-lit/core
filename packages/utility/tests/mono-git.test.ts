import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
    classifyGitFailure,
    firstFatal,
    parseLsRemote,
    refPatterns,
    isSha40,
    isShortSha,
    probeGitAccess,
    resolveRefDir,
    refDirCandidates,
    pickSubtree,
    materializeGitTree,
    swapIntoPlace,
    sweepStrayStages,
    parseGithubUrl,
    validateAppEntry,
    resolveAppSource,
    resolveTransport,
    resolveGitMethod,
    parseSyncArgv,
    accessCacheGet,
    accessCacheSet,
    ago,
    orphanAppDirs,
    staleCacheKeys,
    staleAccessKeys,
    pruneMonoTsconfigPaths,
    resolvePrune,
    MONO_APPS_DIR,
    // @ts-expect-error — plain .mjs shipped as-is by tsdown's `copy`, no types
} from '../bin/mono-git.mjs'

/**
 * `bin/mono-git.mjs` exists as a separate module precisely so this file can
 * exist: `bin/mono-clone.mjs` takes the `.mono/clone.lock` and reads
 * `mono.config.ts` at import time, so it can never be imported from a test.
 * Importing mono-git must stay free of side effects — if that ever regresses,
 * this file is where it shows up.
 *
 * The stderr strings below are real output captured from git 2.49 on Windows,
 * not invented — they are the contract `classifyGitFailure` is written against.
 */

const ok = (stdout = '') => ({ ok: true, code: 0, stdout, stderr: '', timedOut: false })
const fail = (stderr: string, code = 128) => ({ ok: false, code, stdout: '', stderr, timedOut: false })

describe('classifyGitFailure', () => {
    it('reports a missing git binary before looking at stderr', () => {
        expect(classifyGitFailure({ ok: false, error: { code: 'ENOENT' }, stderr: '' }))
            .toEqual({ kind: 'no-git' })
    })

    it('reports a timeout before looking at stderr', () => {
        expect(classifyGitFailure({ ok: false, timedOut: true, signal: 'SIGKILL', stderr: '' }))
            .toEqual({ kind: 'timeout' })
    })

    it('reads `ls-remote --exit-code` exit 2 with no output as a missing ref', () => {
        expect(classifyGitFailure({ ok: false, code: 2, stderr: '' })).toEqual({ kind: 'ref-missing' })
    })

    it('separates "not invited" from "stale credential"', () => {
        // GitHub answers 404 for a private repo you cannot see...
        const notInvited = classifyGitFailure(
            fail("remote: Repository not found.\nfatal: repository 'https://github.com/your-org/nope/' not found"),
        )
        expect(notInvited).toMatchObject({ kind: 'no-access', why: 'not-invited' })

        // ...but a rejected credential is a different problem with a different fix.
        const badCred = classifyGitFailure(
            fail("remote: Invalid username or token. Password authentication is not supported.\n" +
                "fatal: Authentication failed for 'https://github.com/your-org/foo/'"),
        )
        expect(badCred).toMatchObject({ kind: 'no-access', why: 'bad-credential' })
    })

    it('recognises "no credential at all" across git versions', () => {
        // git 2.49
        expect(classifyGitFailure(fail('fatal: unable to get password from user')))
            .toMatchObject({ kind: 'no-access', why: 'no-credential' })
        // older git
        expect(classifyGitFailure(fail(
            "fatal: could not read Username for 'https://github.com': terminal prompts disabled",
        ))).toMatchObject({ kind: 'no-access', why: 'no-credential' })
    })

    it('classifies network failures as network, not auth', () => {
        expect(classifyGitFailure(fail(
            "fatal: unable to access 'https://github.com/a/b/': Could not resolve host: github.com",
        ))).toMatchObject({ kind: 'network' })
    })

    it('prefers network over auth when a proxy failure mentions 403', () => {
        // A corporate proxy rejecting CONNECT reads as both; caching this as
        // "no access" would pin the user to the token for the whole TTL.
        expect(classifyGitFailure(fail(
            "fatal: unable to access 'https://github.com/a/b/': Proxy CONNECT aborted: 403 Forbidden",
        ))).toMatchObject({ kind: 'network' })
    })

    it('falls back to unknown with a usable detail', () => {
        const res = classifyGitFailure(fail('fatal: something nobody predicted'))
        expect(res.kind).toBe('unknown')
        expect(res.detail).toBe('something nobody predicted')
    })
})

describe('firstFatal', () => {
    it('picks the first tagged line and strips the tag', () => {
        expect(firstFatal('Cloning...\nremote: Repository not found.\nfatal: repository not found'))
            .toBe('Repository not found.')
    })

    it('falls back to the first non-empty line', () => {
        expect(firstFatal('\n  weird output  \n')).toBe('weird output')
    })
})

describe('parseLsRemote', () => {
    const out = [
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/heads/main',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\trefs/tags/main',
        'cccccccccccccccccccccccccccccccccccccccc\trefs/tags/main^{}',
    ].join('\n')

    it('prefers a branch over a same-named tag', () => {
        expect(parseLsRemote(out, 'main')).toBe('a'.repeat(40))
    })

    it('peels an annotated tag to its commit', () => {
        // Without `^{}` we would record the TAG object sha, which never equals
        // the sha REST `/commits/<ref>` returns — every transport flip would
        // then look like a change and force a redundant re-download.
        const tagOnly = [
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\trefs/tags/v1',
            'cccccccccccccccccccccccccccccccccccccccc\trefs/tags/v1^{}',
        ].join('\n')
        expect(parseLsRemote(tagOnly, 'v1')).toBe('c'.repeat(40))
    })

    it('takes a lightweight tag when there is no peeled entry', () => {
        expect(parseLsRemote('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\trefs/tags/v2', 'v2')).toBe('b'.repeat(40))
    })

    it('returns null for no match and for empty output', () => {
        expect(parseLsRemote(out, 'nope')).toBeNull()
        expect(parseLsRemote('', 'main')).toBeNull()
    })
})

describe('refPatterns / sha helpers', () => {
    it('asks for branch, tag and peeled tag', () => {
        expect(refPatterns('main')).toEqual(['refs/heads/main', 'refs/tags/main', 'refs/tags/main^{}'])
    })

    it('distinguishes a full sha from a short one', () => {
        expect(isSha40('a'.repeat(40))).toBe(true)
        expect(isSha40('a'.repeat(39))).toBe(false)
        expect(isShortSha('a1b2c3d')).toBe(true)
        expect(isShortSha('a'.repeat(40))).toBe(false)
        expect(isShortSha('main')).toBe(false)
    })
})

describe('probeGitAccess', () => {
    const args = { owner: 'your-org', repo: 'foo' }

    it('returns the sha from the same call that proved access', () => {
        const run = () => ok(`${'a'.repeat(40)}\trefs/heads/main`)
        expect(probeGitAccess({ ...args, ref: 'main', run })).toEqual({
            ok: true,
            sha: 'a'.repeat(40),
            remoteUrl: 'https://github.com/your-org/foo.git',
        })
    })

    it('surfaces "not invited"', () => {
        const run = () => fail("remote: Repository not found.\nfatal: repository 'x' not found")
        expect(probeGitAccess({ ...args, ref: 'main', run })).toMatchObject({
            ok: false,
            kind: 'no-access',
            why: 'not-invited',
        })
    })

    it('treats a pinned 40-hex ref as reachable once access is proven', () => {
        // ls-remote finds no branch/tag, but exit 2 means we DID reach the repo,
        // and GitHub allows fetching an arbitrary sha.
        const sha = 'f'.repeat(40)
        const run = () => fail('', 2)
        expect(probeGitAccess({ ...args, ref: sha, run })).toEqual({
            ok: true,
            sha,
            remoteUrl: 'https://github.com/your-org/foo.git',
            viaSha: true,
        })
    })

    it('reports a genuinely missing branch as ref-missing', () => {
        const run = () => fail('', 2)
        expect(probeGitAccess({ ...args, ref: 'nope', run })).toMatchObject({ ok: false, kind: 'ref-missing' })
    })

    it('reports ref-missing when git exits 0 but matched nothing', () => {
        const run = () => ok('')
        expect(probeGitAccess({ ...args, ref: 'main', run })).toMatchObject({ ok: false, kind: 'ref-missing' })
    })

    it('probes HTTPS only — no ssh fallback', () => {
        const seen: string[][] = []
        const run = (a: string[]) => { seen.push(a); return fail('fatal: Authentication failed') }
        probeGitAccess({ ...args, ref: 'main', run })
        expect(seen).toHaveLength(1)
        expect(seen[0]).toContain('https://github.com/your-org/foo.git')
        expect(seen.flat().join(' ')).not.toContain('git@github.com')
    })
})

describe('resolveTransport', () => {
    it('defaults to auto and ignores garbage', () => {
        expect(resolveTransport({ app: {}, env: {} })).toBe('auto')
        expect(resolveTransport({ app: { transport: 'nonsense' }, env: {} })).toBe('auto')
    })

    it('lets the env override the app, and a flag override the env', () => {
        expect(resolveTransport({ app: { transport: 'git' }, env: {} })).toBe('git')
        expect(resolveTransport({ app: { transport: 'git' }, env: { MONO_SYNC_TRANSPORT: 'token' } })).toBe('token')
        expect(resolveTransport({
            app: { transport: 'git' },
            env: { MONO_SYNC_TRANSPORT: 'token' },
            argv: { transport: 'auto' },
        })).toBe('auto')
    })
})

describe('parseSyncArgv', () => {
    it('reads the two flags and ignores everything else', () => {
        expect(parseSyncArgv(['--transport=git', '--recheck-access', '--whatever']))
            .toEqual({ transport: 'git', recheckAccess: true })
        expect(parseSyncArgv([])).toEqual({})
    })
})

describe('access cache', () => {
    const TTL = 6 * 60 * 60 * 1000
    const now = 1_000_000_000_000

    it('returns a fresh negative and drops an expired one', () => {
        const cache = accessCacheSet({}, 'o/r', { why: 'not-invited', now })
        expect(accessCacheGet(cache, 'o/r', { now: now + 60_000, ttlMs: TTL })).toMatchObject({ why: 'not-invited' })
        expect(accessCacheGet(cache, 'o/r', { now: now + TTL + 1, ttlMs: TTL })).toBeNull()
    })

    it('ignores anything that is not a well-formed negative', () => {
        // Positives are never cached — the probe doubles as change detection, so
        // skipping it would put the REST call back.
        expect(accessCacheGet({ 'o/r': { access: 'ok', checkedAt: now } }, 'o/r', { now, ttlMs: TTL })).toBeNull()
        expect(accessCacheGet({ 'o/r': { access: 'none' } }, 'o/r', { now, ttlMs: TTL })).toBeNull()
        expect(accessCacheGet({}, 'o/r', { now, ttlMs: TTL })).toBeNull()
    })
})

describe('ago', () => {
    it('reads in minutes then hours', () => {
        const now = 1_000_000_000_000
        expect(ago(now - 5 * 60_000, now)).toBe('5m ago')
        expect(ago(now - 3 * 3_600_000, now)).toBe('3h ago')
    })
})

describe('parseGithubUrl', () => {
    it('defaults to main and strips .git', () => {
        expect(parseGithubUrl('https://github.com/your-org/foo.git')).toEqual({
            owner: 'your-org', repo: 'foo', ref: 'main',
        })
    })

    it('reads a /tree/ ref, including a slashed branch name', () => {
        expect(parseGithubUrl('https://github.com/your-org/foo/tree/release/v2')).toMatchObject({ ref: 'release/v2' })
    })

    it('rejects non-github hosts and junk', () => {
        expect(() => parseGithubUrl('https://gitlab.com/a/b')).toThrow(/Only github.com/)
        expect(() => parseGithubUrl('not a url')).toThrow(/Invalid URL/)
        expect(() => parseGithubUrl('https://github.com/onlyowner')).toThrow(/Invalid GitHub url/)
    })
})

/**
 * Deep /tree/ URLs: `tree/main/nuxt-remote` means branch `main`, folder
 * `nuxt-remote` — but the URL alone cannot know that (a branch `main/nuxt-remote`
 * would be legal too), so the split is resolved against the remote. The
 * candidate ORDER is the compat contract: the whole remainder is offered first,
 * so a slashed branch keeps resolving exactly as it did before deep URLs.
 */
describe('refDirCandidates', () => {
    it('is just the ref itself when there is no folder part', () => {
        expect(refDirCandidates('main')).toEqual([{ ref: 'main', dir: '' }])
        expect(refDirCandidates('v2')).toEqual([{ ref: 'v2', dir: '' }])
    })

    it('offers every split of a deep URL, longest ref first', () => {
        expect(refDirCandidates('main/nuxt-remote')).toEqual([
            { ref: 'main/nuxt-remote', dir: '' },
            { ref: 'main', dir: 'nuxt-remote' },
        ])
        expect(refDirCandidates('main/apps/web')).toEqual([
            { ref: 'main/apps/web', dir: '' },
            { ref: 'main/apps', dir: 'web' },
            { ref: 'main', dir: 'apps/web' },
        ])
    })
})

describe('resolveRefDir', () => {
    const args = { owner: 'your-org', repo: 'foo' }

    /** ls-remote stub that only knows the given refs as branches. */
    const knows = (...refs: string[]) => {
        const run = (a: string[]) => {
            const pat = a.find((x) => x.startsWith('refs/heads/'))!
            const ref = pat.slice('refs/heads/'.length)
            return refs.includes(ref)
                ? ok(`${'a'.repeat(40)}\trefs/heads/${ref}`)
                : fail('', 2)
        }
        return run
    }

    it('resolves a deep URL to branch + folder once the whole path is not a ref', () => {
        // The URL that motivated deep-URL support: a repo folder, not a branch.
        const res = resolveRefDir({ ...args, refAndDir: 'main/nuxt-remote', run: knows('main') })
        expect(res).toMatchObject({
            ok: true,
            ref: 'main',
            dir: 'nuxt-remote',
            sha: 'a'.repeat(40),
            remoteUrl: 'https://github.com/your-org/foo.git',
        })
    })

    it('resolves a deep URL at any depth — the folder keeps its slashes', () => {
        const res = resolveRefDir({ ...args, refAndDir: 'main/apps/web', run: knows('main') })
        expect(res).toMatchObject({ ok: true, ref: 'main', dir: 'apps/web' })
    })

    it('still prefers a genuinely slashed branch — candidate order is the compat contract', () => {
        const res = resolveRefDir({ ...args, refAndDir: 'release/v2', run: knows('release/v2') })
        expect(res).toMatchObject({ ok: true, ref: 'release/v2', dir: '' })
    })

    it('stops at the first non-ref failure — access problems need no second probe', () => {
        let calls = 0
        const run = () => {
            calls++
            return fail("remote: Repository not found.\nfatal: repository 'x' not found")
        }
        const res = resolveRefDir({ ...args, refAndDir: 'main/nuxt-remote', run })
        expect(res).toMatchObject({ ok: false, kind: 'no-access' })
        expect(calls).toBe(1)
    })

    it('lists every ref it tried when nothing matched', () => {
        const res = resolveRefDir({ ...args, refAndDir: 'main/nuxt-remote', run: knows() })
        expect(res).toMatchObject({
            ok: false,
            kind: 'ref-missing',
            tried: ['main/nuxt-remote', 'main'],
        })
    })
})

describe('pickSubtree', () => {
    let dir: string

    beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-sub-')) })
    afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

    it('moves the URL folder out of the clone as the app tree', () => {
        const repoDir = path.join(dir, 'repo')
        const sub = path.join(repoDir, 'templates', 'nuxt-remote')
        fs.mkdirSync(sub, { recursive: true })
        fs.writeFileSync(path.join(sub, 'package.json'), '{}')

        const dest = path.join(dir, 'stage')
        pickSubtree(repoDir, 'templates/nuxt-remote', dest)

        expect(fs.existsSync(path.join(dest, 'package.json'))).toBe(true)
        // Moved, not copied — the clone is discarded right after anyway.
        expect(fs.existsSync(sub)).toBe(false)
    })

    it('throws naming the folder when it is not in the tree', () => {
        fs.mkdirSync(path.join(dir, 'repo'), { recursive: true })
        expect(() => pickSubtree(path.join(dir, 'repo'), 'nope/deeper', path.join(dir, 'stage')))
            .toThrow(/Folder "nope\/deeper" not found/)
    })
})

describe('swapIntoPlace / sweepStrayStages', () => {
    let dir: string

    beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-swap-')) })
    afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

    const stageWith = (name: string, body: string): string => {
        const stage = path.join(dir, name)
        fs.mkdirSync(stage, { recursive: true })
        fs.writeFileSync(path.join(stage, 'marker.txt'), body)
        return stage
    }

    it('installs a fresh tree', () => {
        const out = path.join(dir, 'app')
        swapIntoPlace(stageWith('.tmp-a', 'new'), out)
        expect(fs.readFileSync(path.join(out, 'marker.txt'), 'utf8')).toBe('new')
    })

    it('replaces an existing tree and leaves no backup behind', () => {
        const out = path.join(dir, 'app')
        fs.mkdirSync(out, { recursive: true })
        fs.writeFileSync(path.join(out, 'marker.txt'), 'old')
        fs.writeFileSync(path.join(out, 'stale.txt'), 'gone')

        swapIntoPlace(stageWith('.tmp-b', 'new'), out)

        expect(fs.readFileSync(path.join(out, 'marker.txt'), 'utf8')).toBe('new')
        expect(fs.existsSync(path.join(out, 'stale.txt'))).toBe(false)
        expect(fs.readdirSync(dir).filter((f) => f.includes('.old-'))).toEqual([])
    })

    it('restores the previous tree when the stage does not exist', () => {
        // The old behaviour deleted outDir before downloading, so a failure here
        // left the app gone. It must survive instead.
        const out = path.join(dir, 'app')
        fs.mkdirSync(out, { recursive: true })
        fs.writeFileSync(path.join(out, 'marker.txt'), 'old')

        expect(() => swapIntoPlace(path.join(dir, 'does-not-exist'), out)).toThrow()
        expect(fs.readFileSync(path.join(out, 'marker.txt'), 'utf8')).toBe('old')
    })

    it('sweeps stray stage and backup dirs, keeping real apps', () => {
        fs.mkdirSync(path.join(dir, '.tmp-app-123-abc'), { recursive: true })
        fs.mkdirSync(path.join(dir, 'app.old-123-lk3j'), { recursive: true })
        fs.mkdirSync(path.join(dir, 'app'), { recursive: true })

        expect(sweepStrayStages(dir)).toBe(2)
        expect(fs.readdirSync(dir)).toEqual(['app'])
    })

    it('is a no-op on a directory that does not exist', () => {
        expect(sweepStrayStages(path.join(dir, 'nope'))).toBe(0)
    })
})

describe('resolveGitMethod', () => {
    it('defaults to auto and rejects garbage', () => {
        expect(resolveGitMethod({ env: {}, argv: {} })).toBe('auto')
        expect(resolveGitMethod({ env: { MONO_SYNC_GIT_METHOD: 'pull' }, argv: {} })).toBe('auto')
    })

    it('takes clone/fetch from env, and lets the CLI flag win', () => {
        expect(resolveGitMethod({ env: { MONO_SYNC_GIT_METHOD: 'fetch' }, argv: {} })).toBe('fetch')
        expect(resolveGitMethod({ env: { MONO_SYNC_GIT_METHOD: 'fetch' }, argv: { gitMethod: 'clone' } }))
            .toBe('clone')
    })
})

/**
 * `clone` is the fast path (measured ~3.8s vs ~7.1s for init+fetch on a 1.8 MB
 * repo — the gap is four extra Windows process spawns, not the wire protocol).
 * These assert the ROUTING between the two; the live block below proves the
 * clone actually produces a tree.
 */
describe('materializeGitTree method routing', () => {
    let dest: string
    beforeEach(() => { dest = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-mat-')) })
    afterEach(() => fs.rmSync(dest, { recursive: true, force: true }))

    const HEAD = 'b'.repeat(40)

    /** Records every git subcommand and lets a test fail `clone` and/or `fetch`. */
    function stubRun({ cloneOk = true, fetchOk = true } = {}) {
        const cmds: string[] = []
        const run = (args: string[]) => {
            cmds.push(args[0])
            if (args[0] === 'rev-parse') return ok(`${HEAD}\n`)
            if (args[0] === 'clone') return cloneOk ? ok() : fail('fatal: clone went wrong')
            if (args[0] === 'fetch') return fetchOk ? ok() : fail('fatal: fetch went wrong')
            return ok() // init / remote add / reset
        }
        return { run, cmds }
    }

    const materialize = (opts: Record<string, unknown>, run: unknown) =>
        materializeGitTree({ remoteUrl: 'https://github.com/o/r.git', sha: 'a'.repeat(40), destDir: dest, run, ...opts })

    it('uses a single clone for a branch, and reports the sha git actually checked out', () => {
        const { run, cmds } = stubRun()
        expect(materialize({ ref: 'main' }, run)).toEqual({ sha: HEAD, method: 'clone' })
        // One network command, not five. That IS the optimisation.
        expect(cmds).toEqual(['clone', 'rev-parse'])
    })

    it('falls back to init+fetch when the clone fails', () => {
        const { run, cmds } = stubRun({ cloneOk: false })
        expect(materialize({ ref: 'main' }, run)).toEqual({ sha: HEAD, method: 'fetch' })
        expect(cmds).toEqual(['clone', 'init', 'remote', 'fetch', 'reset', 'rev-parse'])
    })

    it('never tries to clone a pinned commit sha — `--branch` cannot express one', () => {
        const { run, cmds } = stubRun()
        const pinned = 'c'.repeat(40)
        expect(materialize({ ref: pinned }, run).method).toBe('fetch')
        expect(cmds).not.toContain('clone')
    })

    it('still fetches a pinned sha under an explicit method:clone, rather than failing the app', () => {
        const { run, cmds } = stubRun()
        expect(materialize({ ref: 'd'.repeat(40), method: 'clone' }, run).method).toBe('fetch')
        expect(cmds).not.toContain('clone')
    })

    it('honours an explicit method with no fallback in either direction', () => {
        const a = stubRun({ cloneOk: false })
        expect(() => materialize({ ref: 'main', method: 'clone' }, a.run)).toThrow(/clone failed/)
        expect(a.cmds).not.toContain('init') // did NOT silently retry as fetch

        const b = stubRun({ fetchOk: false })
        expect(() => materialize({ ref: 'main', method: 'fetch' }, b.run)).toThrow(/fetch failed/)
        expect(b.cmds).not.toContain('clone')
    })

    it('reports both causes, and leaves no half-built stage, when everything fails', () => {
        const { run } = stubRun({ cloneOk: false, fetchOk: false })
        expect(() => materialize({ ref: 'main' }, run))
            // Each cause named, and the fetch one says which of its steps broke.
            .toThrow(/clone failed: clone went wrong; init\+fetch failed: fetch: fetch went wrong/)
        // A partial tree here would be swapped into place as if it were the app.
        expect(fs.existsSync(dest)).toBe(false)
    })
})

/**
 * Real network + real git. Off by default so CI stays hermetic; run with
 * `MONO_TEST_NETWORK=1 npx vitest run tests/mono-git.test.ts`.
 */
describe.skipIf(!process.env.MONO_TEST_NETWORK)('live github (MONO_TEST_NETWORK)', () => {
    const owner = process.env.MONO_TEST_OWNER || 'your-org'
    const repo = process.env.MONO_TEST_REPO || 'mono-vue-host'

    // Generous per-test timeouts: a real probe over a slow link was measured at
    // ~22s (≈10s round-trip to github.com plus ≈5s in the `gh` credential
    // helper), well past vitest's 5s default.
    it('probes a repo this machine can reach', () => {
        const res = probeGitAccess({ owner, repo, ref: 'main' })
        expect(res.ok).toBe(true)
        expect(res.sha).toMatch(/^[0-9a-f]{40}$/)
    }, 120_000)

    it('reports a repo that does not exist as no-access, without ever prompting', () => {
        const res = probeGitAccess({ owner, repo: 'definitely-not-a-real-repo-xyz', ref: 'main' })
        expect(res.ok).toBe(false)
        expect(res.kind).toBe('no-access')
    }, 120_000)

    it('materializes the tree at the probed sha, via clone', () => {
        const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-clone-'))
        try {
            const probe = probeGitAccess({ owner, repo, ref: 'main' })
            const got = materializeGitTree({ remoteUrl: probe.remoteUrl, ref: 'main', sha: probe.sha, destDir: dest })
            expect(got.method).toBe('clone')
            expect(got.sha).toMatch(/^[0-9a-f]{40}$/)
            expect(fs.existsSync(path.join(dest, 'package.json'))).toBe(true)
        } finally {
            fs.rmSync(dest, { recursive: true, force: true })
        }
    }, 300_000)

    /**
     * The fallback must produce the SAME tree as the fast path, or which method
     * ran would silently change what lands in `.mono/apps/<name>`.
     */
    it('produces an identical tree whichever method is forced', () => {
        const a = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-a-'))
        const b = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-b-'))
        try {
            const probe = probeGitAccess({ owner, repo, ref: 'main' })
            const args = { remoteUrl: probe.remoteUrl, ref: 'main', sha: probe.sha }
            const viaClone = materializeGitTree({ ...args, destDir: a, method: 'clone' })
            const viaFetch = materializeGitTree({ ...args, destDir: b, method: 'fetch' })

            expect(viaClone.method).toBe('clone')
            expect(viaFetch.method).toBe('fetch')
            expect(viaClone.sha).toBe(viaFetch.sha)

            const list = (d: string) => fs.readdirSync(d, { recursive: true })
                .map(String).filter((f) => !f.startsWith('.git')).sort()
            expect(list(a)).toEqual(list(b))
            // Byte-for-byte, not just same names — `core.autocrlf` drift would show here.
            const pkg = (d: string) => fs.readFileSync(path.join(d, 'package.json'))
            expect(pkg(a).equals(pkg(b))).toBe(true)
        } finally {
            fs.rmSync(a, { recursive: true, force: true })
            fs.rmSync(b, { recursive: true, force: true })
        }
    }, 300_000)
})

/**
 * Pruning apps removed from `mono.config`. The dangerous half of `mono sync`:
 * everything else in this file only downloads, these functions DELETE. The tests
 * that matter most are the ones pinning what must NOT be deleted.
 */
describe('orphanAppDirs', () => {
    let dir: string

    beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-prune-')) })
    afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

    const mk = (...names: string[]) => {
        for (const n of names) fs.mkdirSync(path.join(dir, n), { recursive: true })
    }

    it('returns the dirs no configured app owns', () => {
        mk('kept', 'gone', 'also-gone')
        expect(orphanAppDirs(dir, ['kept']).sort()).toEqual(['also-gone', 'gone'])
    })

    it('keeps every configured app', () => {
        mk('a', 'b')
        expect(orphanAppDirs(dir, ['a', 'b'])).toEqual([])
    })

    it('ignores files, since only a directory is an app', () => {
        mk('app')
        fs.writeFileSync(path.join(dir, 'notes.md'), 'x')
        expect(orphanAppDirs(dir, ['app'])).toEqual([])
    })

    it('leaves staging debris to sweepStrayStages', () => {
        // Both belong to a crashed run mid-swap. Reporting them as orphans would
        // be harmless (they get deleted either way) but would name them in the
        // "removed app" output as if the user had deleted an app.
        mk('.tmp-app-123-abc', 'app.old-4242-k3j9x')
        expect(orphanAppDirs(dir, [])).toEqual([])
    })

    it('is empty for a missing apps dir, i.e. a host that never synced', () => {
        expect(orphanAppDirs(path.join(dir, 'nope'), ['a'])).toEqual([])
    })

    it('prunes everything when the config declares no apps', () => {
        mk('a', 'b')
        expect(orphanAppDirs(dir, []).sort()).toEqual(['a', 'b'])
    })
})

describe('staleCacheKeys / staleAccessKeys', () => {
    it('drops only the unreferenced commit-cache keys', () => {
        const cache = { 'o/keep@main': 'sha1', 'o/gone@main': 'sha2', 'o/keep@v2': 'sha3' }
        expect(staleCacheKeys(cache, ['o/keep@main', 'o/keep@v2'])).toEqual(['o/gone@main'])
    })

    it('keys the access cache on the repo slug, not the ref', () => {
        // Access is repo-level: an app that moved from @main to @v2 keeps its entry.
        const cache = { 'o/keep': { access: 'none' }, 'o/gone': { access: 'none' } }
        expect(staleAccessKeys(cache, ['o/keep'])).toEqual(['o/gone'])
    })

    it('handles an empty or absent cache', () => {
        expect(staleCacheKeys({}, ['a'])).toEqual([])
        expect(staleAccessKeys(undefined, ['a'])).toEqual([])
    })
})

describe('pruneMonoTsconfigPaths', () => {
    let dir: string
    let file: string

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-git-tsconfig-'))
        file = path.join(dir, 'tsconfig.json')
    })
    afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

    const write = (paths: Record<string, string[]>) =>
        fs.writeFileSync(file, JSON.stringify({ compilerOptions: { paths } }, null, 2))

    const read = () => JSON.parse(fs.readFileSync(file, 'utf8'))

    it('removes both alias forms of a pruned app and leaves the rest', () => {
        write({
            '@gone/*': ['./apps/gone/src/*'],
            '@gone-root/*': ['./apps/gone/*'],
            '@kept/*': ['./apps/kept/src/*'],
        })

        expect(pruneMonoTsconfigPaths(file, ['gone']).sort())
            .toEqual(['@gone-root/*', '@gone/*'])
        expect(read().compilerOptions.paths).toEqual({ '@kept/*': ['./apps/kept/src/*'] })
    })

    it('drops a now-empty paths object rather than leaving it behind', () => {
        write({ '@gone/*': ['./apps/gone/src/*'] })
        pruneMonoTsconfigPaths(file, ['gone'])
        expect(read().compilerOptions.paths).toBeUndefined()
    })

    it('does not rewrite the file when nothing matched', () => {
        write({ '@kept/*': ['./apps/kept/src/*'] })
        const before = fs.readFileSync(file, 'utf8')
        expect(pruneMonoTsconfigPaths(file, ['gone'])).toEqual([])
        expect(fs.readFileSync(file, 'utf8')).toBe(before)
    })

    it('is a silent no-op for a missing or malformed file', () => {
        // `mono prepare` regenerates this file wholesale, so failing the sync over
        // it would be pure noise.
        expect(pruneMonoTsconfigPaths(path.join(dir, 'nope.json'), ['gone'])).toEqual([])
        fs.writeFileSync(file, '{ not json')
        expect(pruneMonoTsconfigPaths(file, ['gone'])).toEqual([])
        expect(fs.readFileSync(file, 'utf8')).toBe('{ not json')
    })
})

describe('resolvePrune', () => {
    it('prunes by default', () => {
        expect(resolvePrune({ env: {}, argv: {} })).toBe(true)
    })

    it('honours MONO_SYNC_PRUNE=0 / false / off', () => {
        for (const raw of ['0', 'false', 'FALSE', 'no', 'off']) {
            expect(resolvePrune({ env: { MONO_SYNC_PRUNE: raw }, argv: {} })).toBe(false)
        }
        expect(resolvePrune({ env: { MONO_SYNC_PRUNE: '1' }, argv: {} })).toBe(true)
        // An empty var is "unset", not "off": a blank .env line must not disable it.
        expect(resolvePrune({ env: { MONO_SYNC_PRUNE: '' }, argv: {} })).toBe(true)
    })

    it('lets the CLI flag beat the env in both directions', () => {
        expect(resolvePrune({ env: { MONO_SYNC_PRUNE: '1' }, argv: { prune: false } })).toBe(false)
        expect(resolvePrune({ env: { MONO_SYNC_PRUNE: '0' }, argv: { prune: true } })).toBe(true)
    })

    it('reads --no-prune / --prune off argv', () => {
        expect(parseSyncArgv(['--no-prune']).prune).toBe(false)
        expect(parseSyncArgv(['--prune']).prune).toBe(true)
        expect(parseSyncArgv([]).prune).toBeUndefined()
    })
})

describe('MONO_APPS_DIR', () => {
    it('is the single, non-configurable clone location', () => {
        // Mirrors MONO_APPS_DIR in src/composables/mono-tsconfig.ts and the
        // '/.mono/apps/' markers the vite transforms gate on.
        expect(MONO_APPS_DIR).toBe('.mono/apps')
    })
})

describe('validateAppEntry / resolveAppSource — path apps in mono sync', () => {
    it('accepts name+url, name+path and both; rejects the rest', () => {
        expect(validateAppEntry({ name: 'a', url: 'x' })).toBeNull()
        expect(validateAppEntry({ name: 'a', path: '../a' })).toBeNull()
        expect(validateAppEntry({ name: 'a', url: 'x', path: '../a' })).toBeNull()
        expect(validateAppEntry({ name: 'a' })).toMatch(/url.*path/)
        expect(validateAppEntry({ url: 'x' })).toMatch(/name/)
        expect(validateAppEntry({ name: 'a', path: '' })).toMatch(/path/)
        expect(validateAppEntry(null)).toMatch(/object/)
    })

    it('resolves to path when the directory exists, clone when there is no path, path-missing otherwise', () => {
        const cwd = path.resolve('/repo/apps/host')
        const slash = (p: string) => p.replace(/\\/g, '/')
        const isDir = (d: string) => slash(d).endsWith('/repo/apps/project')

        const linked = resolveAppSource({ path: '../project' }, { cwd, isDir })
        expect(linked.kind).toBe('path')
        expect(slash(linked.dir!)).toBe(slash(path.resolve(cwd, '../project')))

        expect(resolveAppSource({ url: 'x' }, { cwd, isDir })).toEqual({ kind: 'clone' })

        const missing = resolveAppSource({ path: '../ghost' }, { cwd, isDir })
        expect(missing.kind).toBe('path-missing')
        expect(slash(missing.dir!)).toContain('/repo/apps/ghost')
    })

    it('keeps an absolute path as-is', () => {
        const abs = path.resolve('/elsewhere/app')
        expect(resolveAppSource({ path: abs }, { cwd: '/x', isDir: () => true })).toEqual({ kind: 'path', dir: abs })
    })
})
