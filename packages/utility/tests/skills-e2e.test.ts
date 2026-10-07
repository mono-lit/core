import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { runGit } from '../src/skills/git'
import { loadSkillConfig, resolveSkillTarget } from '../src/skills/config'
import { commitAndPush, ensureRepo, repoDir, resolveRemote } from '../src/skills/repo'
import { applyPlan, buildSavePlan, runSave } from '../src/skills/save'
import { runRead, runSearch } from '../src/skills/read'
import { runSessionShow } from '../src/skills/session'
import { runCheck } from '../src/skills/check'
import { detectActor } from '../src/skills/actor'

/**
 * The whole save pipeline against a REAL git remote — a bare repository in a
 * temp dir, no network — so what is pinned here is git behaviour, not stubs:
 * the commit that lands, the create-once bootstrap files, session immutability,
 * and the replay when someone else pushed first.
 */

const hasGit = spawnSync('git', ['--version'], { encoding: 'utf8', windowsHide: true }).status === 0

let root: string
let bare: string
let helper: string
let app: string
const ID = () => `git-e2e-${Math.random().toString(16).slice(2, 8)}`

/** git in the helper clone (a second "teammate"). Throws on failure. */
function helperGit(...args: string[]): string {
    const r = runGit(['-c', 'user.name=Teammate', '-c', 'user.email=t@x', ...args], { cwd: helper, timeoutMs: 30000 })
    if (!r.ok) throw new Error(`helper git ${args[0]}: ${r.stderr}`)
    return r.stdout.trim()
}
/** Files on `main` in the bare remote. */
const remoteFiles = () =>
    runGit(['--git-dir', bare, 'ls-tree', '-r', '--name-only', 'main'], { timeoutMs: 15000 }).stdout.trim().split('\n').filter(Boolean)
const remoteLog = () =>
    runGit(['--git-dir', bare, 'log', '--format=%s', 'main'], { timeoutMs: 15000 }).stdout.trim().split('\n')

/** Stage a session under the app's pending dir. */
function stage(id: string, extra: Record<string, string> = {}): string {
    const dir = path.join(app, '.mono', 'skills', 'pending', id)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({
        schemaVersion: 1, sessionId: id, status: 'completed',
        finishedAt: '2026-09-17T10:20:30.000Z', topics: ['lightbox'],
    }))
    fs.writeFileSync(path.join(dir, 'summary.md'), `# ${id}\n\nAdded an image lightbox to the gallery.\n`)
    fs.writeFileSync(path.join(dir, 'decisions.json'), JSON.stringify({ decisions: [{ title: 'Teleport', decision: 'custom overlay' }] }))
    fs.writeFileSync(path.join(dir, 'conversation.jsonl'), '{"role":"user","text":"token ghp_abcdefghijklmnopqrstuvwxyz0123456789"}\n')
    for (const [name, text] of Object.entries(extra)) fs.writeFileSync(path.join(dir, name), text)
    return dir
}

beforeAll(() => {
    if (!hasGit) return
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-e2e-'))
    bare = path.join(root, 'bare.git')
    helper = path.join(root, 'helper')
    app = path.join(root, 'app')
    fs.mkdirSync(helper)
    fs.mkdirSync(app)

    // A populated remote with a `main` branch, made by a "teammate".
    expect(runGit(['init', '--quiet', '--bare', bare], { timeoutMs: 15000 }).ok).toBe(true)
    expect(runGit(['--git-dir', bare, 'symbolic-ref', 'HEAD', 'refs/heads/main'], { timeoutMs: 15000 }).ok).toBe(true)
    helperGit('init', '--quiet')
    helperGit('symbolic-ref', 'HEAD', 'refs/heads/main')
    fs.writeFileSync(path.join(helper, 'README.md'), '# skills\n')
    helperGit('add', '-A')
    helperGit('commit', '--quiet', '-m', 'init')
    helperGit('push', '--quiet', bare, 'HEAD:refs/heads/main')

    fs.writeFileSync(path.join(app, 'mono.config.ts'),
        `export default { name: 'e2e-app', type: 'vue', apps: [], skill: { url: '${pathToFileURL(bare).href}' } }\n`)
})
afterAll(() => { if (root) fs.rmSync(root, { recursive: true, force: true }) })

describe.skipIf(!hasGit)('mono skills against a bare repository', { timeout: 60000 }, () => {
    it('resolves the remote over plain git and builds the clone', () => {
        const target = resolveSkillTarget(loadSkillConfig(app)!)
        expect(target.kind).toBe('local')
        const remote = resolveRemote({ target })
        expect(remote).toMatchObject({ transport: 'git', ref: 'main', dir: '', emptyRemote: false })
        expect(remote.headSha).toMatch(/^[0-9a-f]{40}$/)

        const repo = ensureRepo({ cwd: app, remote, refresh: 'always' })
        expect(repo.repoDir).toBe(repoDir(app))
        expect(repo.refreshed).toBe(true)
        expect(fs.existsSync(path.join(repo.repoDir, 'README.md'))).toBe(true)
        // Plain URL in .git/config — this is where a token must never land.
        expect(runGit(['remote', 'get-url', 'origin'], { cwd: repo.repoDir }).stdout.trim()).toBe(target.remoteUrl)
    })

    it('saves a session as ONE commit with the bootstrap files, redacted, immutable path', () => {
        const id = ID()
        const dir = stage(id)
        const actor = detectActor(app)
        const result = runSave({ cwd: app, dir })

        expect(result).toMatchObject({ success: true, sessionId: id, ref: 'main', dir: '', transport: 'git', pushAttempts: 1 })
        expect(result.savedPath).toBe(`e2e-app/history/${actor.actorFolder}/2026-09-17/${expectedTime()}_${id}`)
        expect(result.repoPath).toBe(result.savedPath)
        expect(result.commit).toMatch(/^[0-9a-f]{40}$/)

        const files = remoteFiles()
        expect(files).toContain('e2e-app/app.json')
        expect(files).toContain(`e2e-app/history/${actor.actorFolder}/user.json`)
        for (const f of ['metadata.json', 'summary.md', 'decisions.json', 'index.json', 'conversation/part-0001.jsonl']) {
            expect(files).toContain(`${result.savedPath}/${f}`)
        }
        expect(remoteLog()[0]).toBe(`feat(e2e-app): session ${id}`)

        // Redaction happened before the commit.
        const convo = runGit(['--git-dir', bare, 'show', `main:${result.savedPath}/conversation/part-0001.jsonl`]).stdout
        expect(convo).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz')
        expect(convo).toContain('[REDACTED]')
        // metadata carries the plain configured url
        const meta = JSON.parse(runGit(['--git-dir', bare, 'show', `main:${result.savedPath}/metadata.json`]).stdout)
        expect(meta.repository).toBe(pathToFileURL(bare).href)

        // Local staging is gone on success.
        expect(fs.existsSync(dir)).toBe(false)
    })

    it('refuses to overwrite an existing session and parks it under failed/', () => {
        const id = ID()
        runSave({ cwd: app, dir: stage(id) })
        const again = stage(id)
        expect(() => runSave({ cwd: app, dir: again })).toThrow(/Refusing to overwrite/)
        expect(fs.existsSync(again)).toBe(false)
        expect(fs.existsSync(path.join(app, '.mono', 'skills', 'failed', id))).toBe(true)
    })

    it('never rewrites app.json / user.json once they exist', () => {
        const before = runGit(['--git-dir', bare, 'show', 'main:e2e-app/app.json']).stdout
        runSave({ cwd: app, dir: stage(ID()) })
        expect(runGit(['--git-dir', bare, 'show', 'main:e2e-app/app.json']).stdout).toBe(before)
    })

    it('replays onto a newer tip when someone pushed first', () => {
        const target = resolveSkillTarget(loadSkillConfig(app)!)
        const remote = resolveRemote({ target })
        const repo = ensureRepo({ cwd: app, remote, refresh: 'always' })

        // Teammate saves something in between our fetch and our push.
        helperGit('pull', '--quiet', '--rebase', bare, 'main')
        fs.mkdirSync(path.join(helper, 'other-app', 'knowledge'), { recursive: true })
        fs.writeFileSync(path.join(helper, 'other-app', 'knowledge', 'rules.md'), '# rules\n')
        helperGit('add', '-A')
        helperGit('commit', '--quiet', '-m', 'feat(other-app): knowledge')
        helperGit('push', '--quiet', bare, 'HEAD:refs/heads/main')

        const id = ID()
        const plan = buildSavePlan({ cwd: app, dir: stage(id), target })
        let applied = 0
        const pushed = commitAndPush({
            repoDir: repo.repoDir, remote, actor: plan.actor, message: `feat(e2e-app): session ${id}`,
            apply: (dir) => { applied++; applyPlan(plan, dir) },
        })
        expect(pushed.attempts).toBe(2)
        expect(applied).toBe(2)
        const log = remoteLog()
        expect(log[0]).toBe(`feat(e2e-app): session ${id}`)
        expect(log[1]).toBe('feat(other-app): knowledge')
        expect(remoteFiles()).toContain('other-app/knowledge/rules.md')
        expect(remoteFiles()).toContain(`${plan.savedPath}/summary.md`)
    })

    it('read / search / session show are served from the clone', () => {
        const target = resolveSkillTarget(loadSkillConfig(app)!)
        const remote = resolveRemote({ target })

        // Teammate adds knowledge for OUR app.
        helperGit('pull', '--quiet', '--rebase', bare, 'main')
        fs.mkdirSync(path.join(helper, 'e2e-app', 'knowledge'), { recursive: true })
        fs.writeFileSync(path.join(helper, 'e2e-app', 'knowledge', 'business-rules.md'), '# Rules\n\nInvoices are immutable after posting.\n')
        helperGit('add', '-A')
        helperGit('commit', '--quiet', '-m', 'docs(e2e-app): rules')
        helperGit('push', '--quiet', bare, 'HEAD:refs/heads/main')
        ensureRepo({ cwd: app, remote, refresh: 'always' })

        const read = runRead({ cwd: app, remote, type: 'knowledge' })
        expect(read).toMatchObject({ app: 'e2e-app', type: 'knowledge', source: 'local-clone', stale: false, ref: 'main' })
        expect(read.files.map((f) => f.path)).toEqual(['e2e-app/knowledge/business-rules.md'])

        const one = runRead({ cwd: app, remote, path: 'knowledge/business-rules.md' })
        expect(one.files[0].text).toContain('Invoices are immutable')
        expect(() => runRead({ cwd: app, remote, path: '../other-app/knowledge/rules.md' })).toThrow(/traversal/)

        const search = runSearch({ cwd: app, remote, query: 'lightbox gallery' })
        expect(search.hits.length).toBeGreaterThan(0)
        expect(search.hits[0].path).toMatch(/summary\.md$/)

        const id = ID()
        runSave({ cwd: app, dir: stage(id) })
        ensureRepo({ cwd: app, remote, refresh: 'always' })
        const shown = runSessionShow({ cwd: app, remote, sessionId: id })
        expect(shown.path).toMatch(new RegExp(`_${id}$`))
        expect(shown.summary).toContain('image lightbox')
        expect((shown.metadata as any).sessionId).toBe(id)
    })

    it('check reports the configured, reachable, pushable state without throwing', () => {
        const report = runCheck({ cwd: app })
        expect(report).toMatchObject({ configured: true, kind: 'local', ref: 'main', transport: 'git', canRead: true, canPush: true, currentApp: 'e2e-app' })
        expect(report.localClone.exists).toBe(true)

        const bareApp = fs.mkdtempSync(path.join(root, 'noskill-'))
        fs.writeFileSync(path.join(bareApp, 'mono.config.ts'), `export default { name: 'x', type: 'vue', apps: [] }`)
        expect(runCheck({ cwd: bareApp })).toMatchObject({ configured: false, canRead: null })
    })

    it('an empty remote gets its first commit on a fresh branch', () => {
        const emptyBare = path.join(root, 'empty.git')
        expect(runGit(['init', '--quiet', '--bare', emptyBare]).ok).toBe(true)
        const app2 = path.join(root, 'app2')
        fs.mkdirSync(app2)
        fs.writeFileSync(path.join(app2, 'mono.config.ts'),
            `export default { name: 'fresh-app', type: 'vue', apps: [], skill: { url: '${pathToFileURL(emptyBare).href}' } }\n`)
        const dir = path.join(app2, '.mono', 'skills', 'pending', 's1')
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({ schemaVersion: 1, sessionId: 's1', status: 'completed' }))
        fs.writeFileSync(path.join(dir, 'summary.md'), '# s1\n')

        const result = runSave({ cwd: app2, dir })
        expect(result).toMatchObject({ ref: 'main', pushAttempts: 1 })
        const files = runGit(['--git-dir', emptyBare, 'ls-tree', '-r', '--name-only', 'main']).stdout
        expect(files).toContain('fresh-app/app.json')
        expect(files).toContain(`${result.savedPath}/summary.md`)
    })
})

/** `HH-mm-ss` of the staged `finishedAt`, in local time (what `save` uses). */
function expectedTime(): string {
    const d = new Date('2026-09-17T10:20:30.000Z')
    const p2 = (n: number) => String(n).padStart(2, '0')
    return `${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`
}
