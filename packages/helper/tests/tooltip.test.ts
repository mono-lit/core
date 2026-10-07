import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  controlMonoTooltip,
  createMonoTooltip,
  destroyAllMonoTooltips,
  resetMonoTooltip,
  readTooltipAttributes,
  resolveTooltipOptions,
} from '../src/components/tooltip'

// jsdom has no PointerEvent; a MouseEvent under the same name is all the
// delegated listeners read (`composedPath()` + `pointerType`).
function hover(el: Element): void {
  el.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, composed: true }))
}

const bubble = () => document.querySelector<HTMLElement>('[mono-tooltip][role="tooltip"][id]')

afterEach(() => {
  destroyAllMonoTooltips()
  resetMonoTooltip()
  document.body.innerHTML = ''
})

describe('resolveTooltipOptions', () => {
  it('layers defaults ← local ← global, global winning', () => {
    expect(resolveTooltipOptions({}).placement).toBe('top')
    expect(resolveTooltipOptions({ placement: 'left' }).placement).toBe('left')

    createMonoTooltip({ placement: 'bottom', delay: 300 })
    const o = resolveTooltipOptions({ placement: 'left', offset: 12 })
    expect(o.placement).toBe('bottom') // global beats local
    expect(o.delay).toBe(300)
    expect(o.offset).toBe(12) // local still fills what global leaves out
  })

  it('skips undefined and resets', () => {
    createMonoTooltip({ placement: undefined })
    expect(resolveTooltipOptions({ placement: 'right' }).placement).toBe('right')
    createMonoTooltip({ placement: 'bottom' })
    resetMonoTooltip()
    expect(resolveTooltipOptions({}).placement).toBe('top')
  })

  it("lets the anchor's own attributes beat the global options", () => {
    createMonoTooltip({ placement: 'bottom' })
    expect(resolveTooltipOptions({ placement: 'top' }, { placement: 'left' }).placement).toBe('left')
    expect(resolveTooltipOptions({}, { placement: undefined }).placement).toBe('bottom')
  })

  it('createMonoTooltip doubles as a Vue plugin', () => {
    const plugin = createMonoTooltip({ variant: 'popover' })
    expect(typeof plugin.install).toBe('function')
    expect(plugin.options.variant).toBe('popover')
  })
})

describe('controlMonoTooltip', () => {
  it('matches a selector registered BEFORE the element exists', async () => {
    controlMonoTooltip('.save', { content: 'Save changes', delay: 0 })

    const btn = document.createElement('button')
    btn.className = 'save'
    btn.title = 'native'
    document.body.append(btn)
    hover(btn)

    await vi.waitFor(() => expect(bubble()).toBeTruthy())
    expect(bubble()!.textContent).toBe('Save changes')
    expect(btn.getAttribute('aria-describedby')).toBe(bubble()!.id)
    // the native title is moved aside while open
    expect(btn.hasAttribute('title')).toBe(false)
  })

  it('falls back to the anchor text and restores it on hide', async () => {
    const tip = controlMonoTooltip('[data-tip]', { delay: 0 })
    const a = document.createElement('a')
    a.setAttribute('data-tip', '')
    a.title = 'From title'
    const other = document.createElement('span')
    document.body.append(a, other)

    hover(a)
    await vi.waitFor(() => expect(tip.isOpen).toBe(true))
    expect(bubble()!.textContent).toBe('From title')

    hover(other) // pointer moved off the anchor
    expect(tip.isOpen).toBe(false)
    expect(a.getAttribute('title')).toBe('From title')
    expect(a.hasAttribute('aria-describedby')).toBe(false)
  })

  it('reaches into an open shadow root', async () => {
    const host = document.createElement('div')
    const root = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('button')
    inner.className = 'inner'
    root.append(inner)
    document.body.append(host)

    const tip = controlMonoTooltip('.inner', { content: 'Inside', delay: 0 })
    hover(inner)
    await vi.waitFor(() => expect(tip.isOpen).toBe(true))
    expect(tip.anchor).toBe(inner)
    // the bubble itself is body-level, outside the shadow root
    expect(tip.tooltip!.parentElement).toBe(document.body)
  })

  it('accepts element refs, resolved lazily', async () => {
    const ref: { value: Element | null } = { value: null }
    const tip = controlMonoTooltip(ref, { content: 'Ref', delay: 0 })

    const el = document.createElement('div')
    document.body.append(el)
    hover(el)
    expect(tip.isOpen).toBe(false) // ref still empty

    ref.value = el
    hover(el)
    await vi.waitFor(() => expect(tip.isOpen).toBe(true))
  })

  it('show()/hide() and a content function per anchor', async () => {
    const tip = controlMonoTooltip('.row', { content: (el) => `Row ${el.getAttribute('data-id')}` })
    document.body.innerHTML = '<div class="row" data-id="7"></div>'
    await tip.show()
    expect(bubble()!.textContent).toBe('Row 7')
    tip.hide()
    expect(tip.isOpen).toBe(false)
  })

  it('global options win over the call', async () => {
    createMonoTooltip({ variant: 'popover', color: 'danger' })
    const tip = controlMonoTooltip('.x', { content: 'x', variant: 'inverted' })
    document.body.innerHTML = '<i class="x"></i>'
    await tip.show()
    expect(tip.tooltip!.getAttribute('mono-variant')).toBe('popover')
    expect(tip.tooltip!.getAttribute('mono-color')).toBe('danger')
  })

  it('mirrors a scoped theme wrapper onto the body-level bubble', async () => {
    document.body.innerHTML = '<section class="mono-theme dark theme-color-rose"><b class="t"></b></section>'
    const tip = controlMonoTooltip('.t', { content: 't' })
    await tip.show()
    expect(tip.tooltip!.classList.contains('dark')).toBe(true)
    expect(tip.tooltip!.classList.contains('theme-color-rose')).toBe(true)
  })

  it('does not read the old data-tooltip / tooltip fallbacks', async () => {
    const tip = controlMonoTooltip('.old')
    document.body.innerHTML = '<b class="old" data-tooltip="x" tooltip="y"></b>'
    await tip.show()
    expect(tip.isOpen).toBe(false)
  })

  it('disabled / destroyed controllers never open', async () => {
    document.body.innerHTML = '<b class="d"></b>'
    const tip = controlMonoTooltip('.d', { content: 'd', delay: 0, disabled: true })
    hover(document.querySelector('.d')!)
    await new Promise((r) => setTimeout(r, 10))
    expect(tip.isOpen).toBe(false)

    tip.enable()
    tip.destroy()
    hover(document.querySelector('.d')!)
    await new Promise((r) => setTimeout(r, 10))
    expect(tip.isOpen).toBe(false)
  })
})

describe('declarative mono-tooltip-* attributes', () => {
  it('do nothing until createMonoTooltip() switches them on', async () => {
    document.body.innerHTML = '<button mono-tooltip-content="Hi">b</button>'
    hover(document.querySelector('button')!)
    await new Promise((r) => setTimeout(r, 150))
    expect(bubble()).toBeNull()

    createMonoTooltip({ delay: 0 })
    hover(document.querySelector('button')!)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('Hi'))
  })

  it('work on elements added later, with message as an alias, and inside shadow roots', async () => {
    createMonoTooltip({ delay: 0 })

    const span = document.createElement('span')
    span.setAttribute('mono-tooltip-message', 'Later')
    document.body.append(span)
    hover(span)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('Later'))

    const host = document.createElement('div')
    const inner = document.createElement('i')
    inner.setAttribute('mono-tooltip-content', 'Shadow')
    host.attachShadow({ mode: 'open' }).append(inner)
    document.body.append(host)
    hover(inner)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('Shadow'))
  })

  it('read per-element options, beating the global ones', async () => {
    createMonoTooltip({ delay: 0, color: 'primary', size: 'sm' })
    document.body.innerHTML =
      '<b mono-tooltip-content="x" mono-tooltip-color="danger" mono-tooltip-variant="popover" mono-tooltip-arrow="false"></b>'
    hover(document.querySelector('b')!)
    await vi.waitFor(() => expect(bubble()).toBeTruthy())
    const el = bubble()!
    expect(el.getAttribute('mono-color')).toBe('danger') // attribute beat global
    expect(el.getAttribute('mono-size')).toBe('sm') // global fills the rest
    expect(el.getAttribute('mono-variant')).toBe('popover')
    expect(el.hasAttribute('mono-arrow')).toBe(false)
  })

  it('re-render when the bound attribute changes while open', async () => {
    createMonoTooltip({ delay: 0 })
    document.body.innerHTML = '<b mono-tooltip-content="one"></b>'
    const b = document.querySelector('b')!
    hover(b)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('one'))
    b.setAttribute('mono-tooltip-content', 'two')
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('two'))
  })

  it('parses the attribute options', () => {
    const el = document.createElement('b')
    el.setAttribute('mono-tooltip-trigger', 'hover, click')
    el.setAttribute('mono-tooltip-delay', '300 50')
    el.setAttribute('mono-tooltip-offset', '10')
    el.setAttribute('mono-tooltip-interactive', '')
    const o = readTooltipAttributes(el)
    expect(o.trigger).toEqual(['hover', 'click'])
    expect(o.delay).toEqual([300, 50])
    expect(o.offset).toBe(10)
    expect(o.interactive).toBe(true)
    expect(o.placement).toBeUndefined()
  })

  it('attributes: false keeps the options but turns the attributes off', async () => {
    createMonoTooltip({ delay: 0, attributes: false })
    document.body.innerHTML = '<b mono-tooltip-content="x"></b>'
    hover(document.querySelector('b')!)
    await new Promise((r) => setTimeout(r, 20))
    expect(bubble()).toBeNull()
  })
})
