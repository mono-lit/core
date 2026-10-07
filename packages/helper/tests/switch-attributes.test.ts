// @vitest-environment jsdom
//
// `<mono-switch>` renders its Basecoat styling ATTRIBUTES: the root <label>
// carries `mono-switch` plus one `mono-<prop>` per prop that is off its default
// and the states `mono-checked` / `mono-disabled` / `mono-loading`; the parts are
// `mono-input`, `mono-track` > `mono-thumb`, `mono-label` > `mono-label-text` /
// `mono-description`. switch.css keys on these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-switch> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/switch.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-switch') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-switch]') as HTMLElement

  it('a default switch emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Wi-Fi', description: 'Connect automatically' })
    const r = root(el)
    expect(r.tagName).toBe('LABEL')
    for (const a of ['mono-size', 'mono-color', 'mono-checked', 'mono-disabled', 'mono-loading']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    const input = r.querySelector(':scope > [mono-input][type="checkbox"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.getAttribute('role')).toBe('switch')
    expect(r.querySelector(':scope > [mono-track] > [mono-thumb]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-label] > [mono-label-text]')?.textContent?.trim()).toBe('Wi-Fi')
    expect(r.querySelector(':scope > [mono-label] > [mono-description]')?.textContent?.trim()).toBe(
      'Connect automatically',
    )
    expect(r.classList.contains('mono-switch')).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'success', modelValue: true, label: 'L' })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.hasAttribute('mono-checked')).toBe(true)
    el.modelValue = false
    await tick()
    expect(r.hasAttribute('mono-checked')).toBe(false)
    el.loading = true
    await tick()
    expect(r.hasAttribute('mono-loading')).toBe(true)
    el.disabled = true
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    el.remove()
  })
})
