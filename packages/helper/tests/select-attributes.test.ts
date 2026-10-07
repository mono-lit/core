// @vitest-environment jsdom
//
// `<mono-select>` renders its Basecoat styling ATTRIBUTES: the wrapper carries
// `mono-select` plus one `mono-<prop>` per prop that is off its default (and
// `mono-open` for the open state), and every inner part is named by attribute
// (`mono-trigger`, `mono-value`, `mono-item`, `mono-dropdown`, …). select.css keys
// on these alone — the old classes are inert hooks — so a prop that stops emitting
// its attribute silently unstyles the element. The light build portals the panel
// into <body> while open, so the portal must mirror the attributes too, or the
// options lose every rule scoped under `[mono-select]`.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

const ITEMS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
  { value: 'c', label: 'Cherry' },
]

describe('<mono-select> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/select.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-select') as any
    document.body.appendChild(el)
    el.items = ITEMS
    el.keyValue = 'value'
    el.displayValue = 'label'
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-select]') as HTMLElement

  it('a default select emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Fruit', placeholder: 'Pick', helperText: 'hint' })
    const r = root(el)
    expect(r).not.toBeNull()
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-validation-state', 'mono-open', 'mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable', 'mono-searchable']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-label]')?.textContent?.trim()).toBe('Fruit')
    const trigger = r.querySelector(':scope > [mono-trigger]') as HTMLElement
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.querySelector('[mono-value][mono-placeholder]')?.textContent?.trim()).toBe('Pick')
    expect(trigger.querySelector('[mono-actions] > [mono-arrow] > [mono-icon]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-dropdown] > [mono-dropdown-body]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-message-wrap] > [mono-message="helper"]')?.textContent?.trim()).toBe('hint')
    expect(r.classList.contains('mono-select')).toBe(true)
    el.remove()
  })

  it('every prop mirrors onto the wrapper by name; searchable swaps the trigger for a combobox box', async () => {
    const el = await mount({
      size: 'sm', color: 'danger', variant: 'filled', validationState: 'warning',
      disabled: true, readonly: true, required: true, clearable: true, searchable: true, label: 'L',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('sm')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.getAttribute('mono-validation-state')).toBe('warning')
    for (const a of ['mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable', 'mono-searchable']) {
      expect(r.hasAttribute(a), a).toBe(true)
    }
    expect(r.querySelector('[mono-label] > [mono-required-mark]')?.textContent?.trim()).toBe('*')
    const trigger = r.querySelector(':scope > [mono-trigger]') as HTMLElement
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.querySelector('[mono-search-field][role="combobox"]')).not.toBeNull()
    el.remove()
  })

  it('opening sets mono-open, renders [mono-item] rows with their state attributes, and the portal mirrors the wrapper', async () => {
    const el = await mount({ value: 'c', placeholder: 'Pick' })
    const r = root(el)
    el.open()
    await tick()
    expect(r.hasAttribute('mono-open')).toBe(true)
    // In a browser the panel is moved into a body portal that mirrors the wrapper's
    // mono-* attributes (tests/perf/select-portal.spec.mjs covers that in a browser); under
    // vitest lit resolves to its node build (isServer = true) and the panel stays
    // in the host, so accept either home.
    const portal = document.querySelector('[data-mono-popup-portal]') as HTMLElement | null
    if (portal) {
      expect(portal.hasAttribute('mono-select')).toBe(true)
      expect(portal.hasAttribute('mono-open')).toBe(true)
    }
    const scope = portal ?? r
    const items = [...scope.querySelectorAll('[mono-item]')] as HTMLElement[]
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry'])
    expect(items[1].hasAttribute('mono-disabled')).toBe(true)
    expect(items[2].hasAttribute('mono-selected')).toBe(true)
    expect(items[2].getAttribute('aria-selected')).toBe('true')
    el.close()
    await tick()
    expect(r.hasAttribute('mono-open')).toBe(false)
    if (portal) expect(portal.hasAttribute('mono-open')).toBe(false)
    el.remove()
  })

  it('a value shows [mono-clear] in place of the chevron when clearable; validation resolves to the state attribute', async () => {
    const el = await mount({ value: 'a', clearable: true, errorMessage: 'Bad' })
    const r = root(el)
    expect(r.getAttribute('mono-validation-state')).toBe('invalid')
    expect(r.querySelector('[mono-message="invalid"]')?.getAttribute('role')).toBe('alert')
    expect(r.querySelector('[mono-actions] > [mono-clear] > [mono-icon]')).not.toBeNull()
    expect(r.querySelector('[mono-actions] > [mono-arrow]')).toBeNull()
    el.remove()
  })
})
