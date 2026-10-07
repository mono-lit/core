// `@mono-lit/helper/nuxt` — the automatic skeleton is wired from the PEER'S PRESENCE alone.
//
// When `@aejkatappaja/phantom-ui` resolves from the app the module must (1) add a client
// plugin that imports it (so `<phantom-ui>` is defined before anything mounts), (2) tell
// mono whether the app renders on the server through ONE `createMonoUI` call carrying the
// `skeleton.ssr` flag (merged with any `ui` config), and (3) pre-bundle the peer. When it
// does not resolve, or `skeleton: false`, none of that happens.
//
// Same harness as nuxt-module-client-only.test.ts: `@nuxt/kit` mocked, no Nuxt booted.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const PEER = '@aejkatappaja/phantom-ui'

const kit = vi.hoisted(() => ({
  addVitePlugin: vi.fn(),
  extendViteConfig: vi.fn(),
  installModule: vi.fn(async () => {}),
  hasNuxtModule: vi.fn(() => false),
  addPluginTemplate: vi.fn(),
  tryResolveModule: vi.fn(async (_id: string) => null as string | null),
  useLogger: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn() }),
}))

vi.mock('@nuxt/kit', () => ({
  ...kit,
  defineNuxtModule: (def: unknown) => def,
}))

type Setup = (options: Record<string, unknown>, nuxt: { options: Record<string, any> }) => Promise<void>

async function run(ssr: boolean, helper: Record<string, unknown> = {}) {
  const mod = (await import('../src/nuxt/index')).default as unknown as { setup: Setup }
  const nuxt = { options: { ssr, css: [] as string[], rootDir: process.cwd(), vue: {} } }
  await mod.setup({ helper }, nuxt)
  return nuxt
}

const peerInstalled = () =>
  kit.tryResolveModule.mockImplementation(async (id: string) =>
    id === PEER ? `/app/node_modules/${PEER}/dist/phantom-ui.js` : null,
  )

const templates = () =>
  Object.fromEntries(
    kit.addPluginTemplate.mock.calls.map(([t]) => [
      (t as { filename: string }).filename,
      (t as { getContents: () => string }).getContents(),
    ]),
  ) as Record<string, string>

/** Run the registered `extendViteConfig` callbacks over an empty config. */
const viteConfig = () => {
  const config: Record<string, any> = {}
  for (const [cb] of kit.extendViteConfig.mock.calls) (cb as (c: unknown) => void)(config)
  return config
}

beforeEach(() => {
  for (const fn of Object.values(kit)) if (typeof fn === 'function' && 'mockReset' in fn) fn.mockReset()
  kit.installModule.mockImplementation(async () => {})
  kit.hasNuxtModule.mockImplementation(() => false)
  kit.tryResolveModule.mockImplementation(async () => null)
})

describe('@mono-lit/helper/nuxt — automatic skeleton wiring', () => {
  it('peer installed, ssr app: loads it client-side and flags ssr:true through createMonoUI', async () => {
    peerInstalled()
    await run(true)
    const t = templates()
    // a DYNAMIC import in setup — a static one would evaluate lit-element before
    // nuxt-ssr-lit's hydrate-support hook and break `defer-hydration` for shadow elements
    expect(t['mono-skeleton.client.mjs']).toContain(`await import('${PEER}')`)
    expect(t['mono-skeleton.client.mjs']).not.toMatch(/^import /m)
    expect(t['mono-ui.mjs']).toContain('"skeleton":{"ssr":true')
    // served as source (one lit instance), never pre-bundled
    expect(viteConfig().optimizeDeps.exclude).toContain(PEER)
    expect(viteConfig().optimizeDeps.include ?? []).not.toContain(PEER)
  })

  it('peer installed, ssr:false app: still loads it, flags ssr:false', async () => {
    peerInstalled()
    await run(false)
    const t = templates()
    expect(t['mono-skeleton.client.mjs']).toBeDefined()
    expect(t['mono-ui.mjs']).toContain('"skeleton":{"ssr":false')
  })

  it('merges the flag into ONE createMonoUI call next to the `ui` config and the global defaults', async () => {
    peerInstalled()
    await run(true, { ui: { 'mono-button': { size: 'xs' } }, skeleton: { animation: 'pulse', duration: 1.2 } })
    const t = templates()
    const uiPlugins = kit.addPluginTemplate.mock.calls.filter(
      ([x]) => (x as { filename: string }).filename === 'mono-ui.mjs',
    )
    expect(uiPlugins).toHaveLength(1)
    expect(t['mono-ui.mjs']).toContain('"mono-button":{"size":"xs"}')
    expect(t['mono-ui.mjs']).toContain('"skeleton":{"ssr":true,"animation":"pulse","duration":1.2}')
  })

  it('peer NOT installed: no plugin, no flag, no exclude (nothing to activate)', async () => {
    await run(true)
    const t = templates()
    expect(t['mono-skeleton.client.mjs']).toBeUndefined()
    expect(t['mono-ui.mjs']).toBeUndefined()
    expect(viteConfig().optimizeDeps?.exclude ?? []).not.toContain(PEER)
  })

  it('skeleton:false: nothing is wired even though the peer is installed', async () => {
    peerInstalled()
    await run(true, { skeleton: false })
    const t = templates()
    expect(t['mono-skeleton.client.mjs']).toBeUndefined()
    expect(t['mono-ui.mjs']).toBeUndefined()
    // and the module never even asked for the peer
    expect(kit.tryResolveModule.mock.calls.map(([id]) => id)).not.toContain(PEER)
  })
})
