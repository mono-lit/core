import { describe, it, expect } from 'vitest'
import {
    classifyGitFailure,
    firstFatal,
    isNonFastForward,
    parseHeadSha,
    parseSymref,
    redactUrl,
    refDirCandidates,
    tokenRemote,
    type GitResult,
    type GitRunner,
} from '../src/skills/git'
import { resolveRemote, SkillsAccessError } from '../src/skills/repo'
import { resolveSkillTarget } from '../src/skills/config'

/**
 * The git layer of `mono skills`, exercised with canned stderr — the same
 * fixtures `tests/mono-git.test.ts` uses for `mono sync`, so the two ports
 * cannot drift in how they read a failure.
 */

const ok = (stdout = ''): GitResult => ({ ok: true, code: 0, signal: null, stdout, stderr: '', timedOut: false })
const fail = (stderr: string, code = 128): GitResult => ({ ok: false, code, signal: null, stdout: '', stderr, timedOut: false })

const SHA = 'a'.repeat(40)
const TOKEN = 'ghp_SECRETSECRETSECRET'

describe('classifyGitFailure (parity with mono sync)', () => {
    it('separates "not invited" from "stale credential" from "no credential"', () => {
        expect(classifyGitFailure(fail("remote: Repository not found.\nfatal: repository 'https://github.com/o/nope/' not found")))
            .toMatchObject({ kind: 'no-access', why: 'not-invited' })
        expect(classifyGitFailure(fail("remote: Invalid username or token.\nfatal: Authentication failed for 'https://github.com/o/foo/'")))
            .toMatchObject({ kind: 'no-access', why: 'bad-credential' })
        expect(classifyGitFailure(fail('fatal: unable to get password from user')))
            .toMatchObject({ kind: 'no-access', why: 'no-credential' })
        expect(classifyGitFailure(fail("fatal: could not read Username for 'https://github.com': terminal prompts disabled")))
            .toMatchObject({ kind: 'no-access', why: 'no-credential' })
    })

    it('network beats auth, and structural causes beat stderr', () => {
        expect(classifyGitFailure(fail("fatal: unable to access 'https://github.com/a/b/': Proxy CONNECT aborted: 403 Forbidden")))
            .toMatchObject({ kind: 'network' })
        expect(classifyGitFailure({ ...fail(''), error: { code: 'ENOENT' } as any })).toEqual({ kind: 'no-git' })
        expect(classifyGitFailure({ ...fail(''), timedOut: true })).toEqual({ kind: 'timeout' })
        expect(classifyGitFailure(fail('', 2))).toEqual({ kind: 'ref-missing' })
    })

    it('never lets a token through a detail line', () => {
        const res = classifyGitFailure(fail(`fatal: unable to access 'https://x-access-token:${TOKEN}@github.com/o/r.git/': Could not resolve host`))
        expect(res.kind).toBe('network')
        expect(res.detail).not.toContain(TOKEN)
        expect(res.detail).toContain('https://***@github.com')
    })
})

describe('redactUrl / tokenRemote', () => {
    it('strips any userinfo, in a URL or inside a sentence', () => {
        expect(redactUrl(`https://x-access-token:${TOKEN}@github.com/o/r.git`)).toBe('https://***@github.com/o/r.git')
        expect(redactUrl(`push to https://oauth2:${TOKEN}@gitlab.x/g/r.git failed`)).toBe('push to https://***@gitlab.x/g/r.git failed')
        expect(redactUrl('https://github.com/o/r.git')).toBe('https://github.com/o/r.git')
    })

    it('uses x-access-token on github.com and oauth2 elsewhere; refuses non-https', () => {
        expect(tokenRemote('https://github.com/o/r.git', TOKEN)).toBe(`https://x-access-token:${TOKEN}@github.com/o/r.git`)
        expect(tokenRemote('https://gitlab.x/g/r.git', TOKEN)).toBe(`https://oauth2:${TOKEN}@gitlab.x/g/r.git`)
        expect(() => tokenRemote('git@github.com:o/r.git', TOKEN)).toThrow(/https/)
        expect(() => tokenRemote('ssh://git@github.com/o/r.git', TOKEN)).toThrow(/https/)
    })
})

describe('ls-remote parsing', () => {
    it('reads the default branch and its sha from --symref HEAD', () => {
        const out = `ref: refs/heads/develop\tHEAD\n${SHA}\tHEAD\n`
        expect(parseSymref(out)).toBe('develop')
        expect(parseHeadSha(out)).toBe(SHA)
        expect(parseSymref('')).toBeNull()
    })

    it('recognises a rejected push', () => {
        expect(isNonFastForward(" ! [rejected]        HEAD -> main (fetch first)\nerror: failed to push some refs")).toBe(true)
        expect(isNonFastForward(" ! [rejected]        HEAD -> main (non-fast-forward)")).toBe(true)
        expect(isNonFastForward('fatal: Authentication failed')).toBe(false)
    })

    it('splits a deep URL longest-ref-first', () => {
        expect(refDirCandidates('mono/deep-folder')).toEqual([
            { ref: 'mono/deep-folder', dir: '' },
            { ref: 'mono', dir: 'deep-folder' },
        ])
    })

    it('firstFatal redacts', () => {
        expect(firstFatal(`fatal: repository 'https://oauth2:${TOKEN}@h/x' not found`)).toBe("repository 'https://***@h/x' not found")
    })
})

/** A `run` stub: dispatch on the URL the command was given. */
function runner(behaviour: (args: string[]) => GitResult): { run: GitRunner; calls: string[][] } {
    const calls: string[][] = []
    const run: GitRunner = (args) => { calls.push(args); return behaviour(args) }
    return { run, calls }
}
const urlOf = (args: string[]) => args.find((a) => /^(https?:|ssh:|file:|git@)/.test(a)) ?? ''

describe('resolveRemote — git first, token second', () => {
    const target = resolveSkillTarget({ url: 'https://github.com/o/r.git', envToken: 'T' })

    it('uses the plain URL when the machine already has access', () => {
        const { run, calls } = runner(() => ok(`ref: refs/heads/main\tHEAD\n${SHA}\tHEAD\n`))
        const r = resolveRemote({ target, env: { T: TOKEN }, run })
        expect(r).toMatchObject({ transport: 'git', ref: 'main', dir: '', headSha: SHA, emptyRemote: false })
        expect(r.fetchUrl).toBe('https://github.com/o/r.git')
        expect(calls).toHaveLength(1)
    })

    it('falls back to the token ONLY on no-access, and keeps it out of every message', () => {
        const { run, calls } = runner((args) =>
            urlOf(args).includes(TOKEN)
                ? ok(`ref: refs/heads/main\tHEAD\n${SHA}\tHEAD\n`)
                : fail("remote: Repository not found.\nfatal: repository 'https://github.com/o/r.git/' not found"),
        )
        const r = resolveRemote({ target, env: { T: TOKEN }, run })
        expect(r.transport).toBe('token')
        expect(r.fetchUrl).toContain(TOKEN)
        expect(calls).toHaveLength(2)
        expect(urlOf(calls[0])).toBe('https://github.com/o/r.git')
    })

    it('reports both failures when the token is rejected too', () => {
        const { run } = runner(() => fail("fatal: Authentication failed for 'https://github.com/o/r.git/'"))
        let err: any
        try { resolveRemote({ target, env: { T: TOKEN }, run }) } catch (e) { err = e }
        expect(err).toBeInstanceOf(SkillsAccessError)
        expect(err.transportTried).toEqual(['git', 'token'])
        expect(err.why).toBe('bad-credential')
        expect(err.message).not.toContain(TOKEN)
        expect(err.message).toMatch(/token in T was rejected/)
    })

    it('does not try the token when it is not set, and says how to set it', () => {
        const { run, calls } = runner(() => fail('fatal: unable to get password from user'))
        expect(() => resolveRemote({ target, env: {}, run })).toThrow(/Set T \(a PAT/)
        expect(calls).toHaveLength(1)
    })

    it('never retries a network failure with a token', () => {
        const { run, calls } = runner(() => fail("fatal: unable to access 'https://github.com/o/r.git/': Could not resolve host: github.com"))
        expect(() => resolveRemote({ target, env: { T: TOKEN }, run })).toThrow(/Cannot reach/)
        expect(calls).toHaveLength(1)
    })

    it('never puts a token on an ssh URL', () => {
        const ssh = resolveSkillTarget({ url: 'git@github.com:o/r.git', envToken: 'T' })
        const { run, calls } = runner(() => fail('git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository.'))
        expect(() => resolveRemote({ target: ssh, env: { T: TOKEN }, run })).toThrow(/https URL/)
        expect(calls).toHaveLength(1)
    })

    it('treats an empty remote as "main, first push creates it"', () => {
        const { run } = runner(() => ok(''))
        expect(resolveRemote({ target, env: {}, run })).toMatchObject({ ref: 'main', headSha: null, emptyRemote: true })
    })
})

describe('resolveRemote — deep GitHub URL', () => {
    const deep = resolveSkillTarget({ url: 'https://github.com/o/r/tree/mono/deep-folder' })

    it('probes longest-ref-first and stops at the split that exists', () => {
        const { run, calls } = runner((args) =>
            args.includes('refs/heads/mono/deep-folder') ? fail('', 2)
                : args.includes('refs/heads/mono') ? ok(`${SHA}\trefs/heads/mono\n`)
                    : fail('unexpected'),
        )
        const r = resolveRemote({ target: deep, run })
        expect(r).toMatchObject({ ref: 'mono', dir: 'deep-folder', headSha: SHA })
        expect(calls.filter((c) => c[0] === 'ls-remote')).toHaveLength(2)
    })

    it('a slashed branch with no folder still resolves', () => {
        const { run } = runner((args) =>
            args.includes('refs/heads/mono/deep-folder') ? ok(`${SHA}\trefs/heads/mono/deep-folder\n`) : fail('', 2),
        )
        expect(resolveRemote({ target: deep, run })).toMatchObject({ ref: 'mono/deep-folder', dir: '' })
    })

    it('a populated remote without that branch is an error, not a silent new branch', () => {
        const { run } = runner((args) => (args.includes('HEAD') ? ok(`ref: refs/heads/main\tHEAD\n${SHA}\tHEAD\n`) : fail('', 2)))
        expect(() => resolveRemote({ target: deep, run })).toThrow(/none of these branches exist.*mono\/deep-folder, mono/)
    })

    it('an EMPTY remote accepts "branch <first>, folder <rest>"', () => {
        const { run } = runner((args) => (args.includes('HEAD') ? ok('') : fail('', 2)))
        expect(resolveRemote({ target: deep, run })).toMatchObject({ ref: 'mono', dir: 'deep-folder', emptyRemote: true })
    })
})
