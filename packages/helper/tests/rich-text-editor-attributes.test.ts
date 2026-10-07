// @vitest-environment jsdom
//
// `<mono-rich-text-editor>` renders its Basecoat styling ATTRIBUTES: the root
// carries `mono-rich-text-editor` plus one `mono-<prop>` per prop that is off
// its default (and the states), and every chrome part is named by a
// FAMILY-UNIQUE `mono-rte-*` attribute — the frame holds SunEditor's whole
// DOM. rich-text-editor.css keys on these alone — the old classes are inert
// hooks — so a prop that stops emitting its attribute silently unstyles the
// element. Under jsdom the optional peer cannot build an editor (no layout, no
// contenteditable), so the frame stays in its loading / unavailable state; the
// chrome attributes are what this covers.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-rich-text-editor> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/rich-text-editor.js')
  })

  const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-rich-text-editor') as any
    el.loadCss = false
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-rich-text-editor]') as HTMLElement

  it('a default field emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Body', helperText: 'hint' })
    const r = root(el)
    expect(r).not.toBeNull()
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-validation-state', 'mono-mode', 'mono-disabled', 'mono-readonly', 'mono-required', 'mono-has-value']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.querySelector(':scope > [mono-rte-label]')?.textContent?.trim()).toBe('Body')
    expect(r.querySelector(':scope > [mono-rte-field]')).not.toBeNull()
    expect(r.querySelector('[mono-rte-message-outlet] [mono-rte-footer] > [mono-rte-message-wrap] > [mono-rte-message="helper"]')?.textContent?.trim()).toBe('hint')
    expect(r.classList.contains('mono-rich-text-editor')).toBe(true)
    el.remove()
  })

  it('every prop mirrors onto the root by name; the label carries the required mark', async () => {
    const el = await mount({
      size: 'sm', color: 'danger', variant: 'filled', validationState: 'warning', mode: 'inline',
      disabled: true, readonly: true, required: true, label: 'L', modelValue: '<p>x</p>',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('sm')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.getAttribute('mono-validation-state')).toBe('warning')
    expect(r.getAttribute('mono-mode')).toBe('inline')
    for (const a of ['mono-disabled', 'mono-readonly', 'mono-required', 'mono-has-value']) {
      expect(r.hasAttribute(a), a).toBe(true)
    }
    expect(r.querySelector('[mono-rte-label] > [mono-rte-required-mark]')?.textContent?.trim()).toBe('*')
    el.remove()
  })

  it('an error message resolves the state and renders the alert part', async () => {
    const el = await mount({ errorMessage: 'Bad' })
    const r = root(el)
    expect(r.getAttribute('mono-validation-state')).toBe('invalid')
    const msg = r.querySelector('[mono-rte-message="invalid"]') as HTMLElement
    expect(msg?.textContent?.trim()).toBe('Bad')
    expect(msg.getAttribute('role')).toBe('alert')
    el.remove()
  })

  // The mount (`[mono-rte-mount]`, the light-DOM node SunEditor builds into) is
  // placed on the first client update, which lit's node build under vitest
  // never runs; tests/perf/rich-text-editor-attributes.spec.mjs covers it in a
  // browser, in both builds.
})
