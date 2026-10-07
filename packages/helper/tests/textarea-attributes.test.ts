// @vitest-environment jsdom
//
// `<mono-textarea>` renders its Basecoat styling ATTRIBUTES: the root carries
// `mono-textarea` plus one `mono-<prop>` per prop that is off its default, the
// states `mono-disabled` / `mono-readonly` / `mono-required` / `mono-auto-resize`
// and `mono-validation-state`; the parts are `mono-label` (+ `mono-required-mark`),
// `mono-native`, `mono-footer` > `mono-message-wrap` > `mono-message="…"` /
// `mono-counter`. textarea.css keys on these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-textarea> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/textarea.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-textarea') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-textarea]') as HTMLElement

  it('a default textarea emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Notes', helperText: 'A few sentences' })
    const r = root(el)
    for (const a of [
      'mono-size',
      'mono-color',
      'mono-variant',
      'mono-validation-state',
      'mono-disabled',
      'mono-readonly',
      'mono-required',
      'mono-auto-resize',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-label]')?.textContent?.trim()).toContain('Notes')
    expect(r.querySelector('textarea[mono-native]')).not.toBeNull()
    expect(r.querySelector('[mono-footer] [mono-message-wrap] [mono-message="helper"]')?.textContent?.trim()).toBe(
      'A few sentences',
    )
    expect(r.classList.contains('mono-textarea')).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({
      size: 'lg',
      color: 'success',
      variant: 'filled',
      required: true,
      readonly: true,
      autoResize: true,
      label: 'L',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.hasAttribute('mono-required')).toBe(true)
    expect(r.hasAttribute('mono-readonly')).toBe(true)
    expect(r.hasAttribute('mono-auto-resize')).toBe(true)
    expect(r.querySelector('[mono-label] [mono-required-mark]')).not.toBeNull()
    el.disabled = true
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    el.remove()
  })

  it('validation drives mono-validation-state and the message kind', async () => {
    const el = await mount({ label: 'L', errorMessage: 'Too short' })
    const r = root(el)
    expect(r.getAttribute('mono-validation-state')).toBe('invalid')
    expect(r.querySelector('[mono-message="invalid"]')?.textContent?.trim()).toBe('Too short')
    el.remove()
  })

  it('the counter marks near and over', async () => {
    const el = await mount({ showCounter: true, maxLength: 10, value: '123456789' })
    const r = root(el)
    const counter = r.querySelector('[mono-counter]') as HTMLElement
    expect(counter).not.toBeNull()
    expect(counter.hasAttribute('mono-near')).toBe(true)
    expect(counter.hasAttribute('mono-over')).toBe(false)
    el.value = '12345678901'
    await tick()
    expect(r.querySelector('[mono-counter]')?.hasAttribute('mono-over')).toBe(true)
    el.remove()
  })
})
