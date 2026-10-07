import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { extractSkill } from '../src/composables/mono-alias'
import { resolveMonoConfig, type MonoConfig } from '../src/composables/create-config'
import { loadSkillConfig, resolveSkillTarget } from '../src/skills/config'

/**
 * `skill` in mono.config.ts is THE switch for `mono skills`, and the CLI reads
 * it by text-parsing the config (like `apps[]`). These tests pin the parse
 * (where the key may sit, what counts as malformed) and the URL grammar.
 */

let dir: string
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-config-')) })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

const write = (body: string) => fs.writeFileSync(path.join(dir, 'mono.config.ts'), body)

describe('extractSkill', () => {
    it('returns null when there is no config file or no `skill` key', () => {
        expect(extractSkill(dir)).toBeNull()
        write(`export default { name: 'a', type: 'vue', apps: [] }`)
        expect(extractSkill(dir)).toBeNull()
    })

    it('reads the literal wherever it sits — before or after apps', () => {
        write(`import { defineConfig } from '@mono-lit/utility/config'
export default defineConfig({
  name: 'a', type: 'vue',
  skill: { url: 'https://github.com/o/r.git', envToken: 'MY_TOKEN' },
  apps: [{ name: 'x', url: 'https://github.com/o/x', type: 'vue', envToken: 'OTHER' }],
})`)
        expect(extractSkill(dir)).toEqual({ url: 'https://github.com/o/r.git', envToken: 'MY_TOKEN' })

        write(`export default { name: 'a', type: 'vue', apps: [], skill: { url: "https://gitlab.x/g/r.git" } }`)
        expect(extractSkill(dir)).toEqual({ url: 'https://gitlab.x/g/r.git' })
    })

    it('ignores a `skill:` mention inside a comment and braces inside the url string', () => {
        write(`// skill: { url: 'nope' }
/* skill: { url: 'also nope' } */
export default { name: 'a', type: 'vue', apps: [],
  skill: { url: 'https://github.com/o/r/tree/main/a{b}c' } }`)
        expect(extractSkill(dir)).toEqual({ url: 'https://github.com/o/r/tree/main/a{b}c' })
    })

    it('throws when present but malformed — a broken switch must not read as "off"', () => {
        write(`export default { name: 'a', type: 'vue', apps: [], skill: { envToken: 'T' } }`)
        expect(() => extractSkill(dir)).toThrow(/skill\.url/)

        write(`const u = 'x'\nexport default { name: 'a', type: 'vue', apps: [], skill: { url: u } }`)
        expect(() => extractSkill(dir)).toThrow(/static object literal/)

        write(`export default { name: 'a', type: 'vue', apps: [], skill: { url: 'https://x/y', envToken: 3 } }`)
        expect(() => extractSkill(dir)).toThrow(/envToken/)
    })

    it('is what loadSkillConfig uses', () => {
        write(`export default { name: 'a', type: 'vue', apps: [], skill: { url: 'https://github.com/o/r' } }`)
        expect(loadSkillConfig(dir)).toEqual({ url: 'https://github.com/o/r' })
    })
})

describe('resolveSkillTarget', () => {
    const t = (url: string, envToken?: string) => resolveSkillTarget({ url, envToken })

    it('github: .git, bare, and deep /tree/ URLs', () => {
        expect(t('https://github.com/o/r.git')).toMatchObject({
            kind: 'github', owner: 'o', repo: 'r', remoteUrl: 'https://github.com/o/r.git',
            ref: null, refAndDir: null, dir: '', tokenSupported: true,
        })
        expect(t('https://github.com/o/r')).toMatchObject({ remoteUrl: 'https://github.com/o/r.git', refAndDir: null })
        expect(t('https://github.com/o/r/tree/main')).toMatchObject({ refAndDir: 'main' })
        expect(t('https://github.com/EJI-ICT/esw-host/tree/mono/deep-folder')).toMatchObject({
            owner: 'EJI-ICT', repo: 'esw-host', remoteUrl: 'https://github.com/EJI-ICT/esw-host.git',
            refAndDir: 'mono/deep-folder',
        })
        expect(t('https://github.com/o/r.git', 'TOK').tokenEnv).toBe('TOK')
    })

    it('other https hosts keep the URL as the clone URL and support a token', () => {
        expect(t('https://gitlab.example.com/group/sub/repo.git')).toMatchObject({
            kind: 'https', host: 'gitlab.example.com',
            remoteUrl: 'https://gitlab.example.com/group/sub/repo.git', tokenSupported: true,
        })
    })

    it('ssh forms are machine-credentials only', () => {
        expect(t('git@github.com:o/r.git')).toMatchObject({ kind: 'ssh', host: 'github.com', tokenSupported: false })
        expect(t('ssh://git@gitlab.x/g/r.git')).toMatchObject({ kind: 'ssh', tokenSupported: false })
    })

    it('local paths and file:// URLs are allowed (tests / offline)', () => {
        expect(t('file:///tmp/bare.git')).toMatchObject({ kind: 'local', tokenSupported: false })
        expect(t('C:\\repos\\bare.git')).toMatchObject({ kind: 'local' })
        expect(t('/srv/git/bare.git')).toMatchObject({ kind: 'local' })
    })

    it('rejects what is not a repository', () => {
        expect(() => t('https://github.com/o')).toThrow(/Invalid skill\.url/)
        expect(() => t('https://github.com/o/r/blob/main/README.md')).toThrow(/tree/)
        expect(() => t('not a url')).toThrow(/not a URL/)
        expect(() => t('ftp://x/y')).toThrow(/protocol/)
        expect(() => t('https://user:pw@github.com/o/r')).toThrow(/credentials/)
    })
})

describe('skill never crosses an extends boundary', () => {
    it('is stripped from a layer and kept from the current config only', () => {
        const host: MonoConfig = {
            name: 'host', type: 'vue', apps: [],
            skill: { url: 'https://github.com/o/host-skills.git' },
        }
        const remote: MonoConfig = { name: 'remote', type: 'vue', apps: [], extends: [() => host] }
        expect(resolveMonoConfig(remote).skill).toBeUndefined()

        const own: MonoConfig = {
            ...remote,
            skill: { url: 'https://github.com/o/remote-skills.git' },
        }
        expect(resolveMonoConfig(own).skill).toEqual({ url: 'https://github.com/o/remote-skills.git' })
    })
})
