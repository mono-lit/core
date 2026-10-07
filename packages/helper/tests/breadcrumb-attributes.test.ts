// @vitest-environment jsdom
//
// `<mono-breadcrumb>` renders its Basecoat styling ATTRIBUTES on the `<nav>`
// root — one `mono-<prop>` per prop that is off its default (`mono-size`,
// `mono-color`, `mono-variant`) plus `mono-truncate` / `mono-disabled`. Parts
// are `mono-list` > `mono-item` (+ `mono-current`, `mono-disabled`) >
// `mono-action` > `mono-icon` / `mono-content` > `mono-title` / `mono-badge`,
// with `mono-separator` between the rows. breadcrumb.css reads these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'

describe('<mono-breadcrumb> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/breadcrumb.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []

  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
  })

  const ITEMS = [
    { id: 'home', title: 'Home', href: '#' },
    { id: 'docs', title: 'Docs', href: '#', badge: 3, badgeColor: 'info' },
    { id: 'now', title: 'Now' },
  ]

  async function mount(props: Record<string, unknown> = {}, tag = 'mono-breadcrumb'): Promise<any> {
    const el = document.createElement(tag) as any
    document.body.appendChild(el)
    el.items = ITEMS
    for (const [k, v] of Object.entries(props)) el[k] = v
    hosts.push(el)
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-breadcrumb]') as HTMLElement

  it('a default breadcrumb emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount()
    const r = root(el)
    expect(r).not.toBeNull()
    expect(r.tagName).toBe('NAV')
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-truncate', 'mono-disabled']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.classList.contains('mono-breadcrumb'), 'the pre-Basecoat class stays as a hook').toBe(
      true,
    )
  })

  it('the parts render as attributes', async () => {
    const el = await mount()
    const list = root(el).querySelector(':scope > [mono-list]') as HTMLElement
    expect(list).not.toBeNull()
    expect(list.tagName).toBe('OL')

    const items = list.querySelectorAll(':scope > [mono-item]')
    expect(items).toHaveLength(3)
    expect(list.querySelectorAll(':scope > [mono-separator]')).toHaveLength(2)

    const first = items[0] as HTMLElement
    const action = first.querySelector(':scope > [mono-action]') as HTMLElement
    expect(action.tagName).toBe('A')
    expect(action.querySelector(':scope > [mono-content] > [mono-title]')?.textContent?.trim()).toBe(
      'Home',
    )
  })

  it('the last item is the current one, and it renders as a span', async () => {
    const el = await mount()
    const items = root(el).querySelectorAll('[mono-item]')
    const last = items[items.length - 1] as HTMLElement
    expect(last.hasAttribute('mono-current')).toBe(true)
    expect(last.getAttribute('aria-current')).toBe('page')
    expect((last.querySelector('[mono-action]') as HTMLElement).tagName).toBe('SPAN')
    expect((items[0] as HTMLElement).hasAttribute('mono-current')).toBe(false)
  })

  it('the badge carries its colour as the attribute VALUE', async () => {
    const el = await mount()
    const badge = root(el).querySelector('[mono-badge]') as HTMLElement
    expect(badge).not.toBeNull()
    expect(badge.getAttribute('mono-badge')).toBe('info')
    expect(badge.textContent?.trim()).toBe('3')
  })

  it('props mirror onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'success', variant: 'contained', truncate: true })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.getAttribute('mono-variant')).toBe('contained')
    expect(r.hasAttribute('mono-truncate')).toBe(true)

    el.size = 'md'
    el.color = 'primary'
    el.variant = 'default'
    el.truncate = false
    await tick()
    expect(r.hasAttribute('mono-size'), 'md is the default').toBe(false)
    expect(r.hasAttribute('mono-color'), 'primary is the default').toBe(false)
    expect(r.hasAttribute('mono-variant'), 'default is the default').toBe(false)
    expect(r.hasAttribute('mono-truncate')).toBe(false)
  })

  it('a disabled item is marked on its row', async () => {
    const el = await mount()
    el.items = [{ id: 'a', title: 'A', href: '#', disabled: true }, ...ITEMS]
    await tick()
    const first = root(el).querySelector('[mono-item]') as HTMLElement
    expect(first.hasAttribute('mono-disabled')).toBe(true)
  })

  it('a standalone <mono-breadcrumb-list> renders the same root', async () => {
    const el = await mount({ color: 'info' }, 'mono-breadcrumb-list')
    const r = root(el)
    expect(r).not.toBeNull()
    expect(r.getAttribute('mono-color')).toBe('info')
    expect(r.querySelector(':scope > [mono-list] > [mono-item] > [mono-action]')).not.toBeNull()
  })
})
