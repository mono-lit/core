// @vitest-environment jsdom
//
// `<mono-nav>` renders its Basecoat styling ATTRIBUTES on the `<header>` root:
// one `mono-<prop>` per prop that is off its default (`mono-density`,
// `mono-color`, `mono-variant`) plus the two states. `sticky` is the odd one —
// it defaults to TRUE, so the NEGATIVE carries the information and a bar that
// does not stick says `mono-static`. Parts are `mono-inner` > `mono-start` /
// `mono-center` / `mono-end`, and `mono-extension`. nav.css reads these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'

describe('<mono-nav> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/nav.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []

  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
  })

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-nav') as any
    el.innerHTML = '<span slot="start">Brand</span><span slot="end">Me</span>'
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    hosts.push(el)
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-nav]') as HTMLElement

  it('a default bar emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount()
    const r = root(el)
    expect(r).not.toBeNull()
    expect(r.tagName).toBe('HEADER')
    expect(r.getAttribute('role')).toBe('banner')
    for (const a of [
      'mono-density',
      'mono-color',
      'mono-variant',
      'mono-static',
      'mono-has-extension',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.classList.contains('mono-nav'), 'the pre-Basecoat class stays as a hook').toBe(true)
  })

  it('the parts render as attributes', async () => {
    const el = await mount()
    const r = root(el)
    const inner = r.querySelector(':scope > [mono-inner]') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.querySelector(':scope > [mono-start]')).not.toBeNull()
    expect(inner.querySelector(':scope > [mono-center]')).not.toBeNull()
    expect(inner.querySelector(':scope > [mono-end]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-extension]')).not.toBeNull()
  })

  it('props mirror onto the root', async () => {
    const el = await mount({ density: 'compact', color: 'danger', variant: 'outlined' })
    const r = root(el)
    expect(r.getAttribute('mono-density')).toBe('compact')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-variant')).toBe('outlined')

    el.density = 'comfortable'
    el.color = 'surface'
    el.variant = 'elevated'
    await tick()
    expect(r.hasAttribute('mono-density'), 'comfortable is the default').toBe(false)
    expect(r.hasAttribute('mono-color'), 'surface is the default').toBe(false)
    expect(r.hasAttribute('mono-variant'), 'elevated is the default').toBe(false)
  })

  it('`sticky` is on by default, so it is the NEGATIVE that says something', async () => {
    const el = await mount()
    expect(root(el).hasAttribute('mono-static')).toBe(false)

    el.sticky = false
    await tick()
    expect(root(el).hasAttribute('mono-static')).toBe(true)
  })

  it('`extension` turns the second row on', async () => {
    const el = await mount({ extension: true })
    expect(root(el).hasAttribute('mono-has-extension')).toBe(true)

    el.extension = false
    await tick()
    expect(root(el).hasAttribute('mono-has-extension')).toBe(false)
  })

  it('a literal colour collapses to `custom` and arrives inline', async () => {
    // A colour cannot be an attribute VALUE any more than it could be a class
    // token — `rgb(1, 2, 3)` would split on the spaces.
    const el = await mount({ color: '#7c3aed' })
    const r = root(el)
    expect(r.getAttribute('mono-color')).toBe('custom')
    expect(r.getAttribute('style')).toContain('#7c3aed')
  })

  it('writes its resolved height to the layout var', async () => {
    const el = await mount({ density: 'compact' })
    expect(el.getHeight()).toBe(48)
    expect(document.documentElement.style.getPropertyValue('--mono-nav-height')).toBe('48px')

    el.extension = true
    await tick()
    expect(el.getHeight()).toBe(48 + 36)
  })
})
