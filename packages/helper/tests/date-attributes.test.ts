// @vitest-environment jsdom
//
// `<mono-date>` renders its Basecoat styling ATTRIBUTES: the wrapper carries
// `mono-date` plus one `mono-<prop>` per prop that is off its default, and every
// inner part is named by attribute (`mono-label`, `mono-field`, `mono-prefix` >
// `mono-icon`, `mono-native`, `mono-clear`, `mono-message="…"`). date.css keys on
// these alone — the old classes are inert hooks — so a prop that stops emitting
// its attribute silently unstyles the element.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-date> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/date.js')
  })

  const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-date') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-date]') as HTMLElement

  it('a default date emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'When', placeholder: 'Pick', helperText: 'hint' })
    const r = root(el)
    expect(r).not.toBeNull()
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-validation-state', 'mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-label]')?.textContent?.trim()).toBe('When')
    expect(r.querySelector(':scope > [mono-field] > [mono-prefix] > [mono-icon]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-field] > [mono-native]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-message-wrap] > [mono-message="helper"]')?.textContent?.trim()).toBe('hint')
    expect(r.classList.contains('mono-date')).toBe(true)
    el.remove()
  })

  it('every prop mirrors onto the wrapper by name; error resolves to the state attribute and role=alert', async () => {
    const el = await mount({
      size: 'sm', color: 'danger', variant: 'filled', validationState: 'error', validationMessage: 'Bad',
      disabled: true, readonly: true, required: true, clearable: true, label: 'L',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('sm')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.getAttribute('mono-validation-state')).toBe('error')
    for (const a of ['mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable']) {
      expect(r.hasAttribute(a), a).toBe(true)
    }
    expect(r.querySelector('[mono-label] > [mono-required-mark]')?.textContent?.trim()).toBe('*')
    const msg = r.querySelector('[mono-message]') as HTMLElement
    expect(msg.getAttribute('mono-message')).toBe('error')
    expect(msg.getAttribute('role')).toBe('alert')
    el.remove()
  })

  it('the success state and its message', async () => {
    const el = await mount({ success: true, successMessage: 'Good' })
    const r = root(el)
    expect(r.getAttribute('mono-validation-state')).toBe('success')
    expect(r.querySelector('[mono-message]')?.getAttribute('mono-message')).toBe('success')
    el.remove()
  })
})
