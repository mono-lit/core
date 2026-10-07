// @vitest-environment jsdom
//
// `<mono-tabs>` renders its Basecoat styling ATTRIBUTES: the root carries
// `mono-tabs` plus one `mono-<prop>` per prop that is off its default, the state
// `mono-disabled`, and `aria-orientation` — which is NOT a `mono-` attribute,
// because upstream styles the vertical strip from the ARIA state and a tablist
// is supposed to carry it either way. Parts are `mono-tab` > `mono-icon` /
// `mono-label` / `mono-badge`, and the selected tab is `aria-selected="true"`,
// again what upstream keys on. tabs.css reads these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-tabs> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/tabs.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  const ITEMS = [
    { id: 'a', label: 'Overview' },
    { id: 'b', label: 'Details', badge: 3 },
    { id: 'c', label: 'History', disabled: true },
  ]

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-tabs') as any
    document.body.appendChild(el)
    el.items = ITEMS
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-tabs]') as HTMLElement

  it('a default strip emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ modelValue: 'a' })
    const r = root(el)
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-disabled']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.getAttribute('role')).toBe('tablist')
    expect(r.getAttribute('aria-orientation')).toBe('horizontal')
    expect(r.classList.contains('mono-tabs'), 'the pre-Basecoat class stays as a hook').toBe(true)
    el.remove()
  })

  it('the parts render as attributes, and the state is ARIA', async () => {
    const el = await mount({ modelValue: 'b' })
    const r = root(el)
    const tabs = [...r.querySelectorAll(':scope > [mono-tab]')]
    expect(tabs).toHaveLength(3)
    expect(tabs[0].querySelector(':scope > [mono-label]')?.textContent?.trim()).toBe('Overview')
    expect(tabs[1].querySelector(':scope > [mono-badge]')?.textContent?.trim()).toBe('3')

    // selection is `aria-selected`, not a class the CSS has to learn
    expect(tabs[0].getAttribute('aria-selected')).toBe('false')
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    // …and a disabled item is a disabled BUTTON
    expect((tabs[2] as HTMLButtonElement).disabled).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ modelValue: 'a', size: 'lg', color: 'success', variant: 'pill' })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.getAttribute('mono-variant')).toBe('pill')

    el.disabled = true
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    el.remove()
  })

  it('`orientation` writes the tablist ARIA, not a `mono-` twin of it', async () => {
    const el = await mount({ modelValue: 'a', orientation: 'vertical' })
    const r = root(el)
    expect(r.getAttribute('aria-orientation')).toBe('vertical')
    expect(r.hasAttribute('mono-orientation')).toBe(false)

    el.orientation = 'horizontal'
    await tick()
    expect(r.getAttribute('aria-orientation')).toBe('horizontal')
    el.remove()
  })

  it('selecting a tab moves `aria-selected`', async () => {
    const el = await mount({ modelValue: 'a' })
    el.select('b')
    await tick()
    const tabs = [...root(el).querySelectorAll(':scope > [mono-tab]')]
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
    el.remove()
  })
})
