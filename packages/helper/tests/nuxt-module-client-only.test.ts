// `@mono-lit/helper/nuxt` — the <ClientOnly>/<LitWrapper> wrap follows the app's `ssr` flag.
//
// The wrap exists so an SSR host neither evaluates `@mono-lit/helper/ui/*` on the server
// nor renders a light custom element there. In a client-only app (`ssr: false`) it
// only costs: Nuxt's <ClientOnly> renders its slot one tick after it mounts, so a
// page binding `controlMonoTable(ref)` in `onMounted` sees `null`. So the module
// must register the `monoSsr()` Vite plugins (and the Lit SSR bridge) only when
// the app server-renders, unless `clientOnly` says otherwise explicitly.
//
// Drives the SOURCE module with `@nuxt/kit` mocked — no Nuxt instance is booted;
// the assertions are on which kit calls the module makes for a given `nuxt.options`.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const kit = vi.hoisted(() => ({
  addVitePlugin: vi.fn(),
  extendViteConfig: vi.fn(),
  // The vendored Lit SSR bridge (src/nuxt/ssr-lit) registers through these three.
  addComponent: vi.fn(async () => {}),
  addPlugin: vi.fn(),
  createResolver: () => ({ resolve: (...p: string[]) => p.join('/') }),
  hasNuxtModule: vi.fn(() => false),
  addPluginTemplate: vi.fn(),
  // `null` = "not resolvable from the app", so optimizeDeps.include stays empty.
  tryResolveModule: vi.fn(async () => null),
  useLogger: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn() }),
}))

vi.mock('@nuxt/kit', () => ({
  ...kit,
  // Hand the definition back so the test can call its `setup` directly.
  defineNuxtModule: (def: unknown) => def,
}))

type Setup = (options: Record<string, unknown>, nuxt: { options: Record<string, any> }) => Promise<void>

async function run(ssr: boolean, helper: Record<string, unknown> = {}) {
  const mod = (await import('../src/nuxt/index')).default as unknown as { setup: Setup }
  const nuxt = {
    options: { ssr, css: [] as string[], rootDir: process.cwd(), vue: {}, build: { transpile: [] as string[] }, nitro: {}, vite: {} },
  }
  await mod.setup({ helper }, nuxt)
  return nuxt
}

/** Components the Lit SSR bridge registered in this run (empty = bridge not installed). */
const litWrappers = () => kit.addComponent.mock.calls.map(([c]) => (c as { name: string }).name)

/** Names of the Vite plugins the module registered in this run. */
const registeredPlugins = () =>
  kit.addVitePlugin.mock.calls.map(([plugin]) => (plugin as { name: string }).name)

beforeEach(() => {
  for (const fn of Object.values(kit)) if (typeof fn === 'function' && 'mockClear' in fn) fn.mockClear()
})

describe('@mono-lit/helper/nuxt — client-only wrap follows `ssr`', () => {
  it('ssr: true (default) — registers the SSR stub + the <ClientOnly> wrap and the Lit SSR bridge', async () => {
    const nuxt = await run(true)
    expect(registeredPlugins()).toEqual([
      '@mono-lit/helper:mono-ssr-stub',
      '@mono-lit/helper:mono-client-only',
    ])
    expect(litWrappers()).toEqual(['LitWrapper', 'LitWrapperClient', 'LitWrapperServer'])
    expect(kit.addPlugin).toHaveBeenCalledTimes(3)
    expect(nuxt.options.nitro.moduleSideEffects).toContain('@lit-labs/ssr/lib/render-lit-html.js')
    expect(nuxt.options.vite.ssr.external).toContain('@vue/server-renderer')
  })

  it('ssr: true with the upstream nuxt-ssr-lit module configured by the host — leaves SSR to it', async () => {
    kit.hasNuxtModule.mockImplementationOnce(() => true)
    await run(true)
    expect(litWrappers()).toEqual([])
  })

  it('ssr: false — registers NO transform and does not install the Lit SSR bridge', async () => {
    await run(false)
    expect(registeredPlugins()).toEqual([])
    expect(litWrappers()).toEqual([])
  })

  it('ssr: false — the non-SSR parts still apply (css, isCustomElement, dedupe)', async () => {
    const nuxt = await run(false)
    expect(nuxt.options.css).toContain('@mono-lit/helper/ui/index.css')
    const isCustomElement = nuxt.options.vue.compilerOptions.isCustomElement as (t: string) => boolean
    expect(isCustomElement('mono-button')).toBe(true)
    expect(isCustomElement('div')).toBe(false)
    expect(kit.extendViteConfig).toHaveBeenCalledTimes(1)
  })

  it('clientOnly: true forces the wrap in an ssr: false app', async () => {
    await run(false, { clientOnly: true })
    expect(registeredPlugins()).toEqual([
      '@mono-lit/helper:mono-ssr-stub',
      '@mono-lit/helper:mono-client-only',
    ])
    // Still no Lit SSR bridge: there is no server render for <LitWrapper> to feed.
    expect(litWrappers()).toEqual([])
  })

  it('clientOnly: false in an ssr: true app keeps the stub + transform, but stops wrapping light tags', async () => {
    await run(true, { clientOnly: false })
    // Both plugins stay: the stub (light builds must not evaluate on the server) and the
    // transform (shadow tags still get <LitWrapper>) — only the light <ClientOnly> wrap is off.
    expect(registeredPlugins()).toEqual([
      '@mono-lit/helper:mono-ssr-stub',
      '@mono-lit/helper:mono-client-only',
    ])
    expect(litWrappers()).toEqual(['LitWrapper', 'LitWrapperClient', 'LitWrapperServer'])
    const light = '<script setup lang="ts">\nimport "@mono-lit/helper/ui/button"\n</script>\n<template><div><mono-button>Save</mono-button></div></template>\n'
    const transform = (kit.addVitePlugin.mock.calls[1]?.[0] as any).transform as (code: string, id: string) => any
    expect(transform(light, '/app/pages/x.vue')).toBeNull()
  })

  it('ssr: true (default) wraps a light tag in <ClientOnly>', async () => {
    await run(true)
    const light = '<script setup lang="ts">\nimport "@mono-lit/helper/ui/button"\n</script>\n<template><div><mono-button>Save</mono-button></div></template>\n'
    const transform = (kit.addVitePlugin.mock.calls[1]?.[0] as any).transform as (code: string, id: string) => any
    const out = transform(light, '/app/pages/x.vue')
    expect(String(out?.code ?? out)).toContain('<ClientOnly')
  })
})
