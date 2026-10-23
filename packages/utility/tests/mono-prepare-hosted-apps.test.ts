import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runMonoPrepare } from '../src/composables/mono-tsconfig'
import { isHostedApp, hostedAppRoots } from '../src/composables/app-roots'

/**
 * Hosted (mini) remotes: a source-only sibling with NO `package.json`, read in
 * place through `apps[].path`. It cannot install or prepare itself, so the
 * host's `mono prepare` links its `node_modules` to the host's and writes its
 * `.mono/tsconfig.json`.
 */

let base: string
let host: string
let mini: string

function scaffold(opts: { hostType?: 'vue' | 'nuxt'; miniType?: 'vue' | 'nuxt'; hostModules?: boolean } = {}) {
  const { hostType = 'vue', miniType = hostType, hostModules = true } = opts
  host = path.join(base, 'host')
  mini = path.join(base, 'remote-mini')
  fs.mkdirSync(host, { recursive: true })
  fs.mkdirSync(path.join(mini, miniType === 'nuxt' ? 'app' : 'src', 'pages'), { recursive: true })

  fs.writeFileSync(
    path.join(host, 'mono.config.ts'),
    `export default { name: 'host', type: '${hostType}', template: 'host', apps: [{ name: 'remote-mini', type: '${miniType}', path: '../remote-mini' }] }\n`,
  )
  fs.writeFileSync(path.join(host, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }))
  fs.writeFileSync(path.join(host, 'package.json'), '{}')
  if (hostModules) fs.mkdirSync(path.join(host, 'node_modules', 'vue'), { recursive: true })

  // No tsconfig.json: a mini commits none — the host generates it.
  fs.writeFileSync(path.join(mini, 'mono.config.ts'), `export default { name: 'remote-mini', type: '${miniType}' }\n`)
}

const readMiniTsconfig = () =>
  JSON.parse(fs.readFileSync(path.join(mini, '.mono', 'tsconfig.json'), 'utf8'))

beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-hosted-'))
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(base, { recursive: true, force: true })
})

describe('isHostedApp', () => {
  it('is true only for an existing folder without package.json', () => {
    scaffold()
    expect(isHostedApp(mini)).toBe(true)
    expect(isHostedApp(host)).toBe(false)
    expect(isHostedApp(path.join(base, 'missing'))).toBe(false)
    expect(
      hostedAppRoots([
        { name: 'remote-mini', root: mini, source: 'path' },
        { name: 'host', root: host, source: 'path' },
      ]).map((r) => r.name),
    ).toEqual(['remote-mini'])
  })
})

describe('runMonoPrepare — hosted (mini) path apps', () => {
  it('links the mini node_modules to the host and writes its tsconfig', async () => {
    scaffold()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await runMonoPrepare({ dirname: host })

    expect(result.hostedApps).toEqual([
      { name: 'remote-mini', link: 'created', tsconfig: path.join(mini, '.mono', 'tsconfig.json') },
    ])
    // Bare imports from the mini now resolve into the host's tree.
    expect(fs.existsSync(path.join(mini, 'node_modules', 'vue'))).toBe(true)
    expect(fs.realpathSync(path.join(mini, 'node_modules'))).toBe(
      fs.realpathSync(path.join(host, 'node_modules')),
    )

    const ts = readMiniTsconfig()
    expect(ts.extends).toBe('../../host/tsconfig.json')
    expect(ts.include).toContain('../src/**/*')
    expect(ts.include).toContain('../mono.config.ts')
    expect(ts.compilerOptions.rootDir).toBe('../..')

    // The editor entry is generated, pointing at the generated config.
    expect(JSON.parse(fs.readFileSync(path.join(mini, 'tsconfig.json'), 'utf8'))).toEqual({
      extends: './.mono/tsconfig.json',
    })
    expect(result.unpreparedApps).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  it('is idempotent', async () => {
    scaffold()
    await runMonoPrepare({ dirname: host })
    const before = fs.statSync(path.join(mini, '.mono', 'tsconfig.json')).mtimeMs

    const again = await runMonoPrepare({ dirname: host })

    expect(again.hostedApps[0]!.link).toBe('kept')
    expect(fs.statSync(path.join(mini, '.mono', 'tsconfig.json')).mtimeMs).toBe(before)
  })

  it('extends the Nuxt host’s generated app tsconfig and includes nuxt.d.ts', async () => {
    scaffold({ hostType: 'nuxt' })

    await runMonoPrepare({ dirname: host })

    const ts = readMiniTsconfig()
    expect(ts.extends).toBe('../../host/.nuxt/tsconfig.app.json')
    expect(ts.include).toContain('../app/**/*')
    expect(ts.include).toContain('../../host/.nuxt/nuxt.d.ts')
  })

  it('keeps a tsconfig.json the mini already has', async () => {
    scaffold()
    const own = JSON.stringify({ extends: './.mono/tsconfig.json', compilerOptions: { strict: false } })
    fs.writeFileSync(path.join(mini, 'tsconfig.json'), own)

    await runMonoPrepare({ dirname: host })

    expect(fs.readFileSync(path.join(mini, 'tsconfig.json'), 'utf8')).toBe(own)
  })

  it('never replaces a real node_modules directory in the mini', async () => {
    scaffold()
    fs.mkdirSync(path.join(mini, 'node_modules', 'own'), { recursive: true })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await runMonoPrepare({ dirname: host })

    expect(result.hostedApps[0]!.link).toBe('skipped')
    expect(fs.lstatSync(path.join(mini, 'node_modules')).isSymbolicLink()).toBe(false)
    expect(fs.existsSync(path.join(mini, 'node_modules', 'own'))).toBe(true)
    expect(warn.mock.calls.join(' ')).toContain('real directory')
  })

  it('skips the link (with a warning) until the host is installed', async () => {
    scaffold({ hostModules: false })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await runMonoPrepare({ dirname: host })

    expect(result.hostedApps[0]!.link).toBe('skipped')
    expect(fs.existsSync(path.join(mini, 'node_modules'))).toBe(false)
    expect(warn.mock.calls.join(' ')).toContain('install the host first')
  })

  it('leaves a full path app (with package.json) untouched', async () => {
    scaffold()
    fs.writeFileSync(path.join(mini, 'package.json'), '{}')
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await runMonoPrepare({ dirname: host })

    expect(result.hostedApps).toEqual([])
    expect(fs.existsSync(path.join(mini, 'node_modules'))).toBe(false)
    expect(fs.existsSync(path.join(mini, '.mono'))).toBe(false)
  })
})
