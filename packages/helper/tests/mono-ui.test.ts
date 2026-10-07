// @vitest-environment jsdom
//
// createMonoUI — app-wide default props for every mono element, light and shadow.
// PRECEDENCE: built-in default < createMonoUI < the element's own attribute/prop.
// The store is shared through `globalThis`, so the shadow bundle (a separate
// build with its own copy of the module) reads the same config as `@mono-lit/helper`.
//
// Drives the BUILT artifacts, like the other attribute tests.
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

let api: typeof import('../dist/index.node.js')

beforeAll(async () => {
  api = await import('../dist/index.node.js')
  await import('../dist/ui/button.js')
  await import('../dist/ui/shadow/button.js')
  await import('../dist/ui/input.js')
  await import('../dist/ui/card.js')
  await import('../dist/ui/chip.js')
  await import('../dist/ui/menu.js')
})

beforeEach(() => {
  api.resetMonoUI()
  document.body.innerHTML = ''
})

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

async function mount<T = any>(markup: string): Promise<T> {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.appendChild(host)
  await tick()
  return host.firstElementChild as T
}

describe('createMonoUI', () => {
  it('without a config, nothing changes (built-in defaults)', async () => {
    const el = await mount('<mono-button>B</mono-button>')
    expect(el.size).toBe('md')
    expect(api.getMonoUIStatus().configured).toBe(false)
  })

  it('applies to the light AND the shadow build from one key', async () => {
    api.createMonoUI({ 'mono-button': { size: 'xs', variant: 'outline' } })
    const light = await mount('<mono-button>L</mono-button>')
    expect(light.size).toBe('xs')
    expect(light.variant).toBe('outline')
    expect(light.querySelector('[mono-button]')?.getAttribute('mono-size')).toBe('xs')

    const shadow = await mount('<mono-shadow-button>S</mono-shadow-button>')
    expect(shadow.size).toBe('xs')
    expect(shadow.variant).toBe('outline')
  })

  it('an explicit mono-shadow-* key is merged on top for the shadow build', async () => {
    api.createMonoUI({ 'mono-button': { size: 'xs' }, 'mono-shadow-button': { size: 'lg' } })
    expect((await mount('<mono-button>L</mono-button>')).size).toBe('xs')
    expect((await mount('<mono-shadow-button>S</mono-shadow-button>')).size).toBe('lg')
  })

  it("the element's own attribute and prop win over the global default", async () => {
    api.createMonoUI({ 'mono-button': { size: 'xs' } })
    expect((await mount('<mono-button size="lg">A</mono-button>')).size).toBe('lg')

    const el = document.createElement('mono-button') as any
    el.size = 'sm' // what Vue does after createElement
    document.body.appendChild(el)
    await tick()
    expect(el.size).toBe('sm')
  })

  it('accepts kebab-case prop keys', async () => {
    api.createMonoUI({ 'mono-button': { 'icon-position': 'right' } as any })
    expect((await mount('<mono-button>A</mono-button>')).iconPosition).toBe('right')
  })

  it('gives each element its own copy of object / array values', async () => {
    api.createMonoUI({ 'mono-card': { cssClass: { root: 'shared' } } as any })
    const a = await mount<any>('<mono-card>A</mono-card>')
    const b = await mount<any>('<mono-card>B</mono-card>')
    expect(a.cssClass).toEqual({ root: 'shared' })
    expect(a.cssClass).not.toBe(b.cssClass)
    a.cssClass.root = 'mutated'
    expect(b.cssClass.root).toBe('shared')
    expect((api.getMonoUI() as any)['mono-card'].cssClass.root).toBe('shared')
  })

  it('the default is in place for the FIRST (synchronous) light render', async () => {
    api.createMonoUI({ 'mono-input': { size: 'sm' } })
    const el = document.createElement('mono-input') as any
    document.body.appendChild(el) // light build renders synchronously on connect
    expect(el.querySelector('[mono-input]')?.getAttribute('mono-size')).toBe('sm')
  })

  it('reaches hand-registered and core-less elements too', async () => {
    api.createMonoUI({ 'mono-status-dot': { pulse: true } as any, 'mono-menu-list': { disabled: true } as any })
    const dot = await mount<any>('<mono-status-dot></mono-status-dot>')
    expect(dot.pulse).toBe(true)
    const list = await mount<any>('<mono-menu-list></mono-menu-list>')
    expect(list.disabled).toBe(true)
  })

  it('warns — once — when called AFTER mono elements were created', async () => {
    await mount('<mono-button>early</mono-button>')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.createMonoUI({ 'mono-button': { size: 'xs' } })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toMatch(/ran after 1 mono element was created \(mono-button\)/)
    const status = api.getMonoUIStatus()
    expect(status.configured).toBe(true)
    expect(status.createdBefore).toBe(1)
    expect(status.createdBeforeTags).toEqual(['mono-button'])
    warn.mockRestore()
  })

  it('does not warn when called first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.createMonoUI({ 'mono-button': { size: 'xs' } })
    expect(warn).not.toHaveBeenCalled()
    expect(api.getMonoUIStatus().createdBefore).toBe(0)
    warn.mockRestore()
  })

  it('warns about an unknown prop and a non-mono tag, and ignores them', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.createMonoUI({ 'mono-button': { nope: 1 } as any, 'my-button': { size: 'xs' } as any })
    const el = await mount<any>('<mono-button>B</mono-button>')
    expect(el.nope).toBeUndefined()
    const text = warn.mock.calls.map((c) => String(c[0])).join('\n')
    expect(text).toMatch(/"my-button" is not a mono component tag/)
    expect(text).toMatch(/<mono-button> has no prop "nope"/)
    warn.mockRestore()
  })

  it('resetMonoUI restores built-in defaults for elements created afterwards', async () => {
    api.createMonoUI({ 'mono-button': { size: 'xs' } })
    api.resetMonoUI()
    expect((await mount('<mono-button>B</mono-button>')).size).toBe('md')
  })

  it('returns a Vue-plugin-shaped object', () => {
    const ui = api.createMonoUI({ 'mono-button': { size: 'xs' } })
    expect(typeof ui.install).toBe('function')
    expect((ui.config as any)['mono-button'].size).toBe('xs')
  })

  it('the registered class is still the exported class (instanceof holds)', async () => {
    const mod = await import('../dist/ui/button.js')
    const el = await mount('<mono-button>B</mono-button>')
    expect(el instanceof (mod as any).MonoButton).toBe(true)
    expect(customElements.get('mono-button')).toBe((mod as any).MonoButton)
  })
})
