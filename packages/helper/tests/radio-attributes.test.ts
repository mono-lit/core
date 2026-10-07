// @vitest-environment jsdom
//
// `<mono-radio>` renders its Basecoat styling ATTRIBUTES: the root <label>
// carries `mono-radio` plus one `mono-<prop>` per prop that is off its default
// and the state `mono-checked`; the parts are `mono-input`, `mono-circle` >
// `mono-dot`, `mono-label` > `mono-label-text` / `mono-description`. radio.css
// keys on these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-radio> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/radio.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-radio') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-radio]') as HTMLElement

  it('a default radio emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Email', description: 'A daily digest', value: 'email' })
    const r = root(el)
    expect(r.tagName).toBe('LABEL')
    for (const a of ['mono-size', 'mono-color', 'mono-checked', 'mono-disabled']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-input][type="radio"]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-circle] > [mono-dot]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-label] > [mono-label-text]')?.textContent?.trim()).toBe('Email')
    expect(r.querySelector(':scope > [mono-label] > [mono-description]')?.textContent?.trim()).toBe(
      'A daily digest',
    )
    expect(r.classList.contains('mono-radio')).toBe(true)
    el.remove()
  })

  it('props and the checked state mirror onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'success', value: 'a', modelValue: 'a', label: 'L' })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.hasAttribute('mono-checked')).toBe(true)
    el.modelValue = 'b'
    await tick()
    expect(r.hasAttribute('mono-checked')).toBe(false)
    el.disabled = true
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    el.remove()
  })

  it('the circle and the box of a checkbox beside it are the same part contract', async () => {
    await import('../dist/ui/checkbox.js')
    const rd = await mount({ label: 'L' })
    const cb = document.createElement('mono-checkbox') as any
    document.body.appendChild(cb)
    cb.label = 'L'
    await tick()
    // both mark the root, the hidden native input and the label parts the same way
    for (const attr of ['mono-input', 'mono-label', 'mono-label-text']) {
      expect(root(rd).querySelector(`[${attr}]`), attr).not.toBeNull()
      expect(cb.querySelector(`[${attr}]`), attr).not.toBeNull()
    }
    rd.remove()
    cb.remove()
  })
})
