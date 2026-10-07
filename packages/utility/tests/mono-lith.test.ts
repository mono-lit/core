/**
 * The mono-lith Vite half: a sibling read through `apps[].path` is served,
 * watched, and reachable through `virtual:mono-apps`; a config change restarts.
 *
 * Hooks are called directly on a fake server — the same scaffold style as
 * mono-repo-stub-alias.test.ts — because what matters is WHICH paths reach
 * `fs.allow`, the watcher and the generated module, not Vite's plumbing.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { monoLith, createMonoLithHooks, MONO_APPS_VIRTUAL_ID } from '../src/vite/mono-lith'
import { monoRepo } from '../src/vite/mono-repo'

let tmp: string
let own: string

const write = (rel: string, body: string): void => {
  const file = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, body)
}

/** own/ federates sibling/ by path and clone/ through .mono/apps. */
function scaffold(): void {
  write(
    'own/mono.config.ts',
    `export default { name: 'own', type: 'vue', apps: [` +
      `{ name: 'sibling', type: 'vue', path: '../sibling' },` +
      `{ name: 'clone', type: 'vue', url: 'https://github.com/x/clone' },` +
      `{ name: 'bare', type: 'vue', path: '../bare' }` +
      `] }\n`,
  )
  write('sibling/mono.config.ts', `export default { name: 'sibling', type: 'vue', apps: [] }\n`)
  write('sibling/src/pages/index.vue', '<template/>')
  write('own/.mono/apps/clone/mono.config.ts', `export default { name: 'clone', type: 'vue', apps: [] }\n`)
  // `bare` has a directory but no mono.config — it must not appear in the module.
  fs.mkdirSync(path.join(tmp, 'bare'), { recursive: true })
}

function fakeServer() {
  const listeners: Record<string, ((file: string) => void)[]> = {}
  const server = {
    watcher: {
      add: vi.fn(),
      on: vi.fn((event: string, cb: (file: string) => void) => {
        ;(listeners[event] ??= []).push(cb)
      }),
    },
    restart: vi.fn(() => Promise.resolve()),
    config: { logger: { info: vi.fn() } },
  }
  const emit = (event: string, file: string) => listeners[event]?.forEach((cb) => cb(file))
  return { server, emit }
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-lith-'))
  own = path.join(tmp, 'own')
  scaffold()
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('virtual:mono-apps', () => {
  it('resolves the bare id to a \\0-prefixed one and nothing else', () => {
    const hooks = createMonoLithHooks({ dirname: own })
    expect(hooks.resolveId(MONO_APPS_VIRTUAL_ID)).toBe('\0virtual:mono-apps')
    expect(hooks.resolveId('virtual:something-else')).toBeUndefined()
    expect(hooks.load('other')).toBeUndefined()
  })

  it('exports one lazy import per app that has a mono.config — sibling AND clone, forward slashes', () => {
    const hooks = createMonoLithHooks({ dirname: own })
    const code = hooks.load('\0virtual:mono-apps')!

    const sibling = path.join(tmp, 'sibling', 'mono.config.ts').replace(/\\/g, '/')
    const clone = path.join(own, '.mono', 'apps', 'clone', 'mono.config.ts').replace(/\\/g, '/')

    expect(code).toContain(`"sibling": () => import(${JSON.stringify(sibling)})`)
    expect(code).toContain(`"clone": () => import(${JSON.stringify(clone)})`)
    expect(code).not.toContain('"bare"')
    expect(code).not.toContain('\\\\')
  })

  it('narrows to activeNames', () => {
    const hooks = createMonoLithHooks({ dirname: own, activeNames: ['clone'] })
    const code = hooks.load('\0virtual:mono-apps')!
    expect(code).toContain('"clone"')
    expect(code).not.toContain('"sibling"')
  })
})

describe('serving and watching a sibling', () => {
  it('lists the path roots (not the clone) for fs.allow', () => {
    const hooks = createMonoLithHooks({ dirname: own })
    expect(hooks.fsAllow).toEqual([path.join(tmp, 'sibling'), path.join(tmp, 'bare')])
  })

  it('the standalone plugin restates the project root alongside the siblings', () => {
    const plugin = monoLith({ dirname: own })
    const config = (plugin.config as () => any).call(plugin)
    expect(config.server.fs.allow[0]).toBe(own)
    expect(config.server.fs.allow).toContain(path.join(tmp, 'sibling'))
  })

  it('adds every sibling source dir and every config file to the watcher', () => {
    const { server } = fakeServer()
    createMonoLithHooks({ dirname: own }).configureServer(server as any)

    const added = server.watcher.add.mock.calls.map((c) => c[0])
    expect(added).toContain(path.join(tmp, 'sibling', 'src'))
    expect(added).toContain(path.join(own, 'mono.config.ts'))
    expect(added).toContain(path.join(tmp, 'sibling', 'mono.config.ts'))
    expect(added).toContain(path.join(own, '.mono', 'apps', 'clone', 'mono.config.ts'))
  })

  it('restarts on a change to an active mono.config — whatever the separators or case', () => {
    const { server, emit } = fakeServer()
    createMonoLithHooks({ dirname: own }).configureServer(server as any)

    const siblingConfig = path.join(tmp, 'sibling', 'mono.config.ts')
    const mangled =
      process.platform === 'win32'
        ? siblingConfig.replace(/\\/g, '/').toUpperCase()
        : siblingConfig
    emit('change', mangled)

    expect(server.restart).toHaveBeenCalledOnce()
    expect(server.config.logger.info.mock.calls[0]![0]).toContain('sibling')
  })

  it('does not restart for an ordinary file, and can be switched off', () => {
    const { server, emit } = fakeServer()
    createMonoLithHooks({ dirname: own }).configureServer(server as any)
    emit('change', path.join(tmp, 'sibling', 'src', 'pages', 'index.vue'))
    expect(server.restart).not.toHaveBeenCalled()

    const off = fakeServer()
    createMonoLithHooks({ dirname: own, restartOnConfigChange: false }).configureServer(off.server as any)
    off.emit('change', path.join(own, 'mono.config.ts'))
    expect(off.server.restart).not.toHaveBeenCalled()
  })
})

describe('monoRepo carries the lith hooks on its own plugin', () => {
  it('exposes appRoots with their source, and the virtual module through mono.plugin', async () => {
    const mono = await monoRepo({ dirname: own, warnMissing: false })

    expect(mono.appRoots.map((r) => [r.name, r.source])).toEqual([
      ['sibling', 'path'],
      ['bare', 'path'],
      ['clone', 'clone'],
    ])

    const plugin = mono.plugin
    expect((plugin.resolveId as any).call(plugin, MONO_APPS_VIRTUAL_ID)).toBe('\0virtual:mono-apps')
    const code = (plugin.load as any).call(plugin, '\0virtual:mono-apps') as string
    expect(code).toContain('"sibling"')

    const config = (plugin.config as any).call(plugin, {}, { command: 'build', mode: 'production' })
    // A BUILD sees the sibling too — no dev-only split.
    expect(config.resolve.alias['@sibling']).toBe(path.join(tmp, 'sibling', 'src'))
    expect(config.server.fs.allow).toContain(path.join(tmp, 'sibling'))
  })

  it('rejects an app with neither url nor path before anything else runs', async () => {
    write('bad/mono.config.ts', `export default { name: 'bad', type: 'vue', apps: [{ name: 'ghost', type: 'vue' }] }\n`)
    await expect(monoRepo({ dirname: path.join(tmp, 'bad') })).rejects.toThrow(/ghost.*neither url nor path/)
  })
})
