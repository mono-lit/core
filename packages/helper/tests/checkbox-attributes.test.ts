// @vitest-environment jsdom
//
// `<mono-checkbox>` renders its Basecoat styling ATTRIBUTES: the root <label>
// carries `mono-checkbox` plus one `mono-<prop>` per prop that is off its default
// and the states `mono-checked` / `mono-indeterminate` / `mono-loading`; the parts
// are `mono-input`, `mono-box`, `mono-icon`, `mono-label` > `mono-label-text` /
// `mono-description`. checkbox.css keys on these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-checkbox> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/checkbox.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}, icon = false): Promise<any> {
    const el = document.createElement('mono-checkbox') as any
    if (icon) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('slot', 'icon')
      el.appendChild(svg)
    }
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-checkbox]') as HTMLElement

  it('a default checkbox emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Agree', description: 'Please' })
    const r = root(el)
    expect(r.tagName).toBe('LABEL')
    for (const a of ['mono-size', 'mono-color', 'mono-checked', 'mono-indeterminate', 'mono-disabled', 'mono-loading']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-input][type="checkbox"]')).not.toBeNull()
    const box = r.querySelector(':scope > [mono-box]') as HTMLElement
    expect(box).not.toBeNull()
    expect(box.hasAttribute('mono-custom-icon')).toBe(false)
    expect(r.querySelector(':scope > [mono-label] > [mono-label-text]')?.textContent?.trim()).toBe('Agree')
    expect(r.querySelector(':scope > [mono-label] > [mono-description]')?.textContent?.trim()).toBe('Please')
    expect(r.classList.contains('mono-checkbox')).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'success', modelValue: true, disabled: true, label: 'L' })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.hasAttribute('mono-checked')).toBe(true)
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    el.indeterminate = true
    await tick()
    expect(r.hasAttribute('mono-indeterminate')).toBe(true)
    el.remove()
  })

  it('a slotted icon lands in [mono-icon] and marks the box custom; loading marks both', async () => {
    const el = await mount({ modelValue: true }, true)
    const r = root(el)
    const box = r.querySelector('[mono-box]') as HTMLElement
    expect(box.hasAttribute('mono-custom-icon')).toBe(true)
    expect(box.querySelector('[mono-icon] > svg')).not.toBeNull()
    el.loading = true
    await tick()
    expect(r.hasAttribute('mono-loading')).toBe(true)
    expect(box.hasAttribute('mono-custom-indeterminate-icon')).toBe(true)
    expect(box.querySelector('[mono-spinner]')).not.toBeNull()
    el.remove()
  })
})
