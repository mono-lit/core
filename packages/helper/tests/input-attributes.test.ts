// @vitest-environment jsdom
//
// `<mono-input>` renders its Basecoat styling ATTRIBUTES: the wrapper carries
// `mono-input` plus one `mono-<prop>` per prop that is off its default, and every
// inner part is named by attribute (`mono-label`, `mono-field`, `mono-native`,
// `mono-clear`, `mono-message="…"`). input.css keys on these alone — the old
// classes are inert hooks — so a prop that stops emitting its attribute silently
// unstyles the element. The hand-written CSS-tab demos mirror this DOM exactly.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-input> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/input.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-input') as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-input]') as HTMLElement

  it('a default input emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Name', helperText: 'hint' })
    const r = root(el)
    expect(r).not.toBeNull()
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-validation-state', 'mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-label]')?.textContent?.trim()).toBe('Name')
    expect(r.querySelector(':scope > [mono-field] > [mono-native]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-message-wrap] > [mono-message="helper"]')?.textContent?.trim()).toBe('hint')
    // the legacy classes are still there as inert hooks
    expect(r.classList.contains('mono-input')).toBe(true)
    expect(r.querySelector('.mono-input-field')).toBe(r.querySelector('[mono-field]'))
    el.remove()
  })

  it('every prop mirrors onto the wrapper by name', async () => {
    const el = await mount({
      size: 'sm', color: 'danger', variant: 'filled', validationState: 'warning',
      disabled: true, readonly: true, required: true, clearable: true, label: 'L',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('sm')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.getAttribute('mono-validation-state')).toBe('warning')
    for (const a of ['mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable']) {
      expect(r.hasAttribute(a), a).toBe(true)
    }
    expect(r.querySelector('[mono-label] > [mono-required-mark]')?.textContent).toBe('*')
    el.remove()
  })

  it('error / success resolve to the validation-state attribute, the message and aria-invalid', async () => {
    const el = await mount({ errorMessage: 'Bad' })
    const r = root(el)
    expect(r.getAttribute('mono-validation-state')).toBe('invalid')
    const msg = r.querySelector('[mono-message]') as HTMLElement
    expect(msg.getAttribute('mono-message')).toBe('invalid')
    expect(msg.getAttribute('role')).toBe('alert')
    expect(r.querySelector('[mono-native]')?.getAttribute('aria-invalid')).toBe('true')

    el.errorMessage = ''
    el.successMessage = 'Good'
    await tick()
    expect(r.getAttribute('mono-validation-state')).toBe('valid')
    expect(r.querySelector('[mono-message]')?.getAttribute('mono-message')).toBe('valid')
    expect(r.querySelector('[mono-message]')?.hasAttribute('role')).toBe(false)
    el.remove()
  })

  it('the clear button is a [mono-clear] part with a [mono-icon] glyph, only while there is a value', async () => {
    const el = await mount({ clearable: true, modelValue: 'x' })
    const r = root(el)
    const clear = r.querySelector('[mono-field] > [mono-clear]') as HTMLElement
    expect(clear).not.toBeNull()
    expect(clear.querySelector('[mono-icon]')).not.toBeNull()
    el.modelValue = ''
    await tick()
    expect(r.querySelector('[mono-clear]')).toBeNull()
    el.remove()
  })

  it('slotted prefix / suffix land in [mono-prefix] / [mono-suffix]', async () => {
    const el = document.createElement('mono-input') as any
    const p = document.createElement('span')
    p.setAttribute('slot', 'prefix')
    p.textContent = '$'
    const s = document.createElement('span')
    s.setAttribute('slot', 'suffix')
    s.textContent = 'USD'
    el.append(p, s)
    document.body.appendChild(el)
    await tick()
    const r = root(el)
    expect(r.querySelector('[mono-field] > [mono-prefix]')?.textContent?.trim()).toBe('$')
    expect(r.querySelector('[mono-field] > [mono-suffix]')?.textContent?.trim()).toBe('USD')
    expect(r.querySelector('[mono-field] > [mono-prefix] + [mono-native]')).not.toBeNull()
    el.remove()
  })
})
