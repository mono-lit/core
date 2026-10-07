// @vitest-environment jsdom
//
// `<mono-card>` renders its Basecoat styling ATTRIBUTES: the root carries
// `mono-card` plus one `mono-<prop>` per prop that is off its default, the states
// `mono-bordered` / `mono-hoverable` / `mono-clickable` / `mono-selected` /
// `mono-disabled` / `mono-loading`, and the NEGATIVES `mono-no-header-divider` /
// `mono-no-footer-divider` (both dividers default on). Regions are `mono-media`,
// `mono-header` > `mono-icon` / `mono-header-content` > `mono-title` /
// `mono-subtitle`, `mono-body`, `mono-actions`, `mono-footer`, `mono-loading`.
// card.css keys on these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-card> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/card.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-card') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-card]') as HTMLElement

  it('a default card emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ heading: 'Title', subheading: 'Sub' })
    const r = root(el)
    for (const a of [
      'mono-size',
      'mono-variant',
      'mono-color',
      'mono-rounded',
      'mono-bordered',
      'mono-clickable',
      'mono-selected',
      'mono-disabled',
      'mono-loading',
      'mono-no-header-divider',
      'mono-no-footer-divider',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector('[mono-header] [mono-header-content] [mono-title]')?.textContent?.trim()).toBe(
      'Title',
    )
    expect(r.querySelector('[mono-header] [mono-header-content] [mono-subtitle]')?.textContent?.trim()).toBe(
      'Sub',
    )
    expect(r.querySelector(':scope > [mono-body]')).not.toBeNull()
    expect(r.classList.contains('mono-card')).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({
      size: 'lg',
      variant: 'outlined',
      color: 'primary',
      rounded: 'sm',
      bordered: true,
      clickable: true,
      selected: true,
      heading: 'T',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-variant')).toBe('outlined')
    expect(r.getAttribute('mono-color')).toBe('primary')
    expect(r.getAttribute('mono-rounded')).toBe('sm')
    expect(r.hasAttribute('mono-bordered')).toBe(true)
    expect(r.hasAttribute('mono-clickable')).toBe(true)
    expect(r.hasAttribute('mono-selected')).toBe(true)
    el.loading = true
    await tick()
    expect(r.hasAttribute('mono-loading')).toBe(true)
    expect(r.querySelector('[mono-loading] [mono-spinner]')).not.toBeNull()
    el.remove()
  })

  const text = (el: any, sel: string) => root(el).querySelector(sel)?.textContent?.trim()

  it('title / subtitle are the canonical props; heading / subheading alias them', async () => {
    const el = await mount({ title: 'T', subtitle: 'S' })
    expect(text(el, '[mono-title]')).toBe('T')
    expect(text(el, '[mono-subtitle]')).toBe('S')
    // the old names read and write the same storage
    expect(el.heading).toBe('T')
    el.subheading = 'S2'
    await tick()
    expect(el.subtitle).toBe('S2')
    expect(text(el, '[mono-subtitle]')).toBe('S2')
    el.remove()
  })

  it('maps the old heading / subheading ATTRIBUTES too', async () => {
    const el = document.createElement('mono-card') as any
    el.setAttribute('heading', 'From attr')
    el.setAttribute('subheading', 'Sub attr')
    document.body.appendChild(el)
    await tick()
    expect(el.title).toBe('From attr')
    expect(text(el, '[mono-subtitle]')).toBe('Sub attr')
    el.remove()
  })

  it('stops a host title attribute from becoming a native tooltip', async () => {
    const el = document.createElement('mono-card') as any
    el.setAttribute('title', 'Hello')
    document.body.appendChild(el)
    await tick()
    expect(text(el, '[mono-title]')).toBe('Hello')
    expect(root(el).getAttribute('title')).toBe('')
    el.remove()
  })

  it('slot precedence: header > title/subtitle slots > props', async () => {
    const withSlots = document.createElement('mono-card') as any
    withSlots.title = 'prop'
    withSlots.innerHTML = '<b slot="title">slot title</b><i slot="subtitle">slot sub</i><p>body</p>'
    document.body.appendChild(withSlots)
    await tick()
    expect(text(withSlots, '[mono-title]')).toBe('slot title')
    expect(text(withSlots, '[mono-subtitle]')).toBe('slot sub')
    withSlots.remove()

    const withHeader = document.createElement('mono-card') as any
    withHeader.title = 'prop'
    withHeader.innerHTML =
      '<span slot="icon">★</span><b slot="title">slot title</b><div slot="header">Custom</div><p>body</p>'
    const loser = withHeader.querySelector('b')
    document.body.appendChild(withHeader)
    await tick()
    const content = root(withHeader).querySelector('[mono-header-content]')!
    expect(content.textContent?.trim()).toBe('Custom')
    expect(root(withHeader).querySelector('[mono-title]')).toBeNull()
    // the header replaces the icon too
    expect(root(withHeader).querySelector('[mono-header] [mono-icon]')).toBeNull()
    expect(root(withHeader).textContent).not.toContain('★')
    // the losing title slot node is parked (hidden), never left detached
    expect(loser.parentNode).not.toBeNull()
    expect(root(withHeader).contains(loser)).toBe(false)
    withHeader.remove()
  })

  it('a divider turned OFF is what carries an attribute', async () => {
    const el = await mount({ heading: 'T', headerDivider: false, footerDivider: false })
    const r = root(el)
    expect(r.hasAttribute('mono-no-header-divider')).toBe(true)
    expect(r.hasAttribute('mono-no-footer-divider')).toBe(true)
    el.remove()
  })
})
