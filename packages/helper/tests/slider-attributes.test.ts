// @vitest-environment jsdom
//
// `<mono-slider>`: the rendered DOM (attributes slider.css keys on), the value model (number vs
// array, sorting, coercion), ARIA, the readout, keyboard, hidden form inputs and form binding.
// Pointer geometry is browser-only (jsdom has no layout) and is covered by the Playwright check.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-slider>', () => {
  beforeAll(async () => {
    await import('../dist/ui/slider.js')
  })

  const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}, attrs: Record<string, string> = {}): Promise<any> {
    const el = document.createElement('mono-slider') as any
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    for (const [k, v] of Object.entries(props)) el[k] = v
    document.body.appendChild(el)
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-slider]') as HTMLElement
  const thumbs = (el: any) => [...el.querySelectorAll('[mono-slider-thumb]')] as HTMLElement[]
  const pieces = (el: any) => [...el.querySelectorAll('[mono-slider-piece]')] as HTMLElement[]
  const readout = (el: any) => el.querySelector('[mono-slider-value]')?.textContent?.trim()
  const key = (t: HTMLElement, k: string) => t.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))

  it('a number is one thumb; the default emits no prop attributes', async () => {
    const el = await mount({ modelValue: 40, label: 'Volume' })
    const r = root(el)
    for (const a of ['mono-size', 'mono-color', 'mono-type', 'mono-validation-state', 'mono-value-tooltip', 'mono-track-gap', 'mono-disabled']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(thumbs(el)).toHaveLength(1)
    expect(thumbs(el)[0].getAttribute('role')).toBe('slider')
    expect(thumbs(el)[0].style.getPropertyValue('--p').trim()).toBe('0.4')
    expect(readout(el)).toBe('40')
    el.remove()
  })

  it('an array is N thumbs, sorted, with neighbour-aware aria bounds', async () => {
    const el = await mount({ modelValue: [80, 20], label: 'Price' })
    const t = thumbs(el)
    expect(t).toHaveLength(2)
    expect(el.values).toEqual([20, 80])
    expect(t[0].getAttribute('aria-valuenow')).toBe('20')
    expect(t[0].getAttribute('aria-valuemax')).toBe('80')
    expect(t[1].getAttribute('aria-valuemin')).toBe('20')
    expect(t[0].getAttribute('aria-label')).toBe('Price (minimum)')
    expect(t[1].getAttribute('aria-label')).toBe('Price (maximum)')
    expect(readout(el)).toBe('20 – 80')
    el.remove()
  })

  it('three thumbs from markup JSON, stacked thumbs kept', async () => {
    const el = await mount({}, { 'model-value': '[2, 2, 3]', max: '10', label: 'x' })
    expect(thumbs(el)).toHaveLength(3)
    expect(el.values).toEqual([2, 2, 3])
    expect(thumbs(el)[2].getAttribute('aria-label')).toBe('x (3 of 3)')
    el.remove()
  })

  it('the track is cut into pieces at every thumb; fill flags follow the mode', async () => {
    const el = await mount({ modelValue: [20, 80] })
    expect(pieces(el).map((p) => p.hasAttribute('mono-filled'))).toEqual([false, true, false])
    el.fill = 'start'
    await tick()
    expect(pieces(el).map((p) => p.hasAttribute('mono-filled'))).toEqual([true, false, false])
    el.trackGap = 4
    await tick()
    expect(root(el).hasAttribute('mono-track-gap')).toBe(true)
    el.remove()
  })

  it('type="vertical" mirrors to the root and the thumbs\' aria-orientation', async () => {
    const el = await mount({}, { type: 'vertical', 'model-value': '30', height: '160' })
    expect(root(el).getAttribute('mono-type')).toBe('vertical')
    expect(thumbs(el)[0].getAttribute('aria-orientation')).toBe('vertical')
    expect(root(el).style.getPropertyValue('--_mono-slider-length')).toBe('160px')
    el.remove()
  })

  it('stops snap the value; marks render (labels only for an explicit list)', async () => {
    const el = await mount({}, { stops: '[0, 10, 25, 50, 100]', 'model-value': '18', marks: '' })
    expect(el.values).toEqual([25])
    expect(el.querySelectorAll('[mono-slider-mark]')).toHaveLength(5)
    expect(el.querySelector('[mono-slider-mark-label]')).toBeNull()
    el.marks = [0, { value: 50, label: 'Mid' }, 100]
    await tick()
    expect([...el.querySelectorAll('[mono-slider-mark-label]')].map((n: any) => n.textContent.trim())).toEqual(['0', 'Mid', '100'])
    expect(root(el).hasAttribute('mono-marks-labelled')).toBe(true)
    el.remove()
  })

  it('format-display shapes the readout, bubbles and aria-valuetext; the model stays numeric', async () => {
    const el = await mount({ modelValue: [20, 80], formatDisplay: '{}%', label: 'Range' })
    expect(readout(el)).toBe('20% – 80%')
    expect(el.querySelector('[mono-slider-tooltip]').textContent.trim()).toBe('20%')
    expect(thumbs(el)[0].getAttribute('aria-valuetext')).toBe('20%')
    expect(el.modelValue).toEqual([20, 80])
    el.valueTooltip = 'never'
    await tick()
    expect(el.querySelector('[mono-slider-tooltip]')).toBeNull()
    el.remove()
  })

  it('no label: the readout follows the control; show-value="false" hides it', async () => {
    const el = await mount({ modelValue: 35 })
    expect(el.querySelector('[mono-slider-field] > [mono-slider-value]')?.textContent?.trim()).toBe('35')
    el.setAttribute('show-value', 'false')
    await tick()
    expect(readout(el)).toBeUndefined()
    el.remove()
  })

  it('keyboard: arrows step, PageUp ten steps, Home/End to the thumb\'s own bounds; input + change fire', async () => {
    const el = await mount({ modelValue: [20, 50], minGap: 5 })
    const seen: string[] = []
    el.addEventListener('input', (e: any) => seen.push('input:' + JSON.stringify(e.detail.modelValue)))
    el.addEventListener('change', (e: any) => seen.push('change:' + e.detail.index))
    const t0 = thumbs(el)[0]
    key(t0, 'ArrowRight')
    await tick()
    expect(el.modelValue).toEqual([21, 50])
    expect(seen).toEqual(['input:[21,50]', 'change:0'])
    key(thumbs(el)[0], 'PageUp')
    await tick()
    expect(el.modelValue).toEqual([31, 50])
    key(thumbs(el)[0], 'End')
    await tick()
    expect(el.modelValue).toEqual([45, 50]) // blocked at 50 - min-gap
    key(thumbs(el)[0], 'Home')
    await tick()
    expect(el.modelValue).toEqual([0, 50])
    el.remove()
  })

  it('a single-number model comes back as a number', async () => {
    const el = await mount({ modelValue: 10 })
    key(thumbs(el)[0], 'ArrowUp')
    await tick()
    expect(el.modelValue).toBe(11)
    el.remove()
  })

  it('a stacked thumb moving up hands over to the top of the stack', async () => {
    const el = await mount({ modelValue: [2, 2, 3], max: 10 })
    key(thumbs(el)[0], 'ArrowLeft')
    await tick()
    expect(el.modelValue).toEqual([1, 2, 3])
    el.modelValue = [2, 2, 5]
    await tick()
    key(thumbs(el)[0], 'ArrowRight')
    await tick()
    expect(el.modelValue).toEqual([2, 3, 5])
    el.remove()
  })

  it('readonly and disabled ignore keys; disabled takes the thumbs out of the tab order', async () => {
    const el = await mount({ modelValue: 40, readonly: true })
    key(thumbs(el)[0], 'ArrowRight')
    await tick()
    expect(el.modelValue).toBe(40)
    expect(thumbs(el)[0].getAttribute('aria-readonly')).toBe('true')
    el.readonly = false
    el.disabled = true
    await tick()
    key(thumbs(el)[0], 'ArrowRight')
    await tick()
    expect(el.modelValue).toBe(40)
    expect(thumbs(el)[0].getAttribute('tabindex')).toBe('-1')
    expect(root(el).hasAttribute('mono-disabled')).toBe(true)
    el.remove()
  })

  it('name writes one hidden input per thumb (name[] for several)', async () => {
    const el = await mount({ modelValue: [10, 60], name: 'price' })
    const hidden = [...el.querySelectorAll('input[type="hidden"][mono-slider-hidden]')] as HTMLInputElement[]
    expect(hidden.map((h) => [h.name, h.value])).toEqual([['price[]', '10'], ['price[]', '60']])
    el.remove()
  })

  it('validation state mirrors to the root and shows the message', async () => {
    const el = await mount({ modelValue: 50, validationState: 'invalid', validationMessage: 'Too high' })
    expect(root(el).getAttribute('mono-validation-state')).toBe('invalid')
    expect(el.querySelector('[mono-message="invalid"]')?.textContent?.trim()).toBe('Too high')
    expect(thumbs(el)[0].getAttribute('aria-invalid')).toBe('true')
    el.remove()
  })

  it('an equal array from outside (Vue re-sending) is not a change', async () => {
    const el = await mount({ modelValue: [20, 80] })
    const before = el.querySelector('[mono-slider-thumb]')
    // Lit's setter always calls requestUpdate; `hasChanged` decides whether an update is scheduled.
    el.modelValue = [20, 80]
    expect(el.isUpdatePending).toBe(false)
    el.modelValue = [20, 81]
    expect(el.isUpdatePending).toBe(true)
    await tick()
    expect(el.querySelector('[mono-slider-thumb]')).toBe(before)
    el.remove()
  })
})
