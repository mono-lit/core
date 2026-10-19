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

describe('<mono-input type="file">', () => {
  beforeAll(async () => {
    await import('../dist/ui/input.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-input') as any
    el.type = 'file'
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const picker = (el: any) => el.querySelector('[mono-file-input]') as HTMLInputElement
  const text = (el: any) => el.querySelector('[mono-native][mono-file]') as HTMLInputElement

  /** jsdom has no DataTransfer: plant `files` on the picker and fire its change. */
  function pick(el: any, files: File[]): void {
    const input = picker(el)
    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const file = (name: string, size = 3) => new File(['x'.repeat(size)], name, { type: 'text/plain' })

  it('renders a hidden native picker, a read-only name field and the upload icon', async () => {
    const el = await mount({ accept: '.pdf', multiple: true, name: 'doc' })
    const r = el.querySelector('[mono-input]') as HTMLElement
    expect(r.getAttribute('mono-type')).toBe('file')
    const p = picker(el)
    expect(p.type).toBe('file')
    expect(p.hidden).toBe(true)
    expect(p.accept).toBe('.pdf')
    expect(p.multiple).toBe(true)
    expect(p.name).toBe('doc')
    expect(text(el).readOnly).toBe(true)
    expect(text(el).type).toBe('text')
    const icon = r.querySelector('[mono-field] > [mono-file-icon]') as HTMLElement
    expect(icon.querySelector('.i-mdi-cloud-upload-outline')).not.toBeNull()
    el.remove()
  })

  it('a pick sets modelValue to the File and shows its name', async () => {
    const el = await mount()
    const changes: any[] = []
    const inputs: any[] = []
    el.addEventListener('change', (e: any) => changes.push(e.detail))
    el.addEventListener('input', (e: any) => inputs.push(e.detail))
    const f = file('report.pdf')
    pick(el, [f])
    await tick()
    expect(el.modelValue).toBe(f)
    expect(text(el).value).toBe('report.pdf')
    expect(changes).toHaveLength(1)
    expect(changes[0].modelValue).toBe(f)
    expect(changes[0].files).toEqual([f])
    // the picker's native `input` (no detail, fired before the value lands) never reaches the host
    expect(inputs).toHaveLength(1)
    expect(inputs[0].modelValue).toBe(f)
    el.remove()
  })

  it('multiple: modelValue is File[] and the names are joined', async () => {
    const el = await mount({ multiple: true })
    const a = file('a.png')
    const b = file('b.png')
    pick(el, [a, b])
    await tick()
    expect(el.modelValue).toEqual([a, b])
    expect(text(el).value).toBe('a.png, b.png')
    el.remove()
  })

  it('max-file-size drops oversized files and emits error', async () => {
    const el = await mount({ maxFileSize: 5 })
    const errors: any[] = []
    el.addEventListener('error', (e: any) => errors.push(e.detail))
    const prev = file('ok.txt', 2)
    pick(el, [prev])
    await tick()
    pick(el, [file('big.txt', 10)])
    await tick()
    expect(errors).toHaveLength(1)
    expect(errors[0].reason).toBe('max-file-size')
    expect(errors[0].file.name).toBe('big.txt')
    // the previous pick survives a fully rejected one
    expect(el.modelValue).toBe(prev)
    el.remove()
  })

  it('the max-file-size attribute is read', async () => {
    const el = document.createElement('mono-input') as any
    el.setAttribute('type', 'file')
    el.setAttribute('max-file-size', '1024')
    document.body.appendChild(el)
    await tick()
    expect(el.maxFileSize).toBe(1024)
    el.remove()
  })

  it('clear resets to null (or [] with multiple)', async () => {
    const el = await mount({ clearable: true })
    pick(el, [file('a.txt')])
    await tick()
    const clears: any[] = []
    el.addEventListener('clear', (e: any) => clears.push(e.detail))
    ;(el.querySelector('[mono-clear]') as HTMLElement).click()
    await tick()
    expect(el.modelValue).toBeNull()
    expect(text(el).value).toBe('')
    expect(clears).toHaveLength(1)

    el.multiple = true
    pick(el, [file('b.txt')])
    await tick()
    ;(el.querySelector('[mono-clear]') as HTMLElement).click()
    await tick()
    expect(el.modelValue).toEqual([])
    el.remove()
  })

  it('an outside modelValue write updates the shown name; File never reflects as an attribute', async () => {
    const el = await mount()
    el.modelValue = file('given.csv')
    await tick()
    expect(text(el).value).toBe('given.csv')
    expect(el.hasAttribute('model-value')).toBe(false)
    el.modelValue = null
    await tick()
    expect(text(el).value).toBe('')
    el.remove()
  })

  it('clicking the field or the icon opens the picker, unless disabled', async () => {
    const el = await mount()
    let opened = 0
    picker(el).click = () => { opened++ }
    text(el).click()
    ;(el.querySelector('[mono-file-icon]') as HTMLElement).click()
    text(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(opened).toBe(3)
    el.disabled = true
    await tick()
    picker(el).click = () => { opened++ }
    ;(el.querySelector('[mono-file-icon]') as HTMLElement).click()
    expect(opened).toBe(3)
    el.remove()
  })
})

describe('<mono-input type="range">', () => {
  beforeAll(async () => {
    await import('../dist/ui/input.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-input') as any
    el.type = 'range'
    for (const [k, v] of Object.entries(props)) el[k] = v
    document.body.appendChild(el)
    await tick()
    return el
  }

  const native = (el: any) => el.querySelector('[mono-native][mono-range]') as HTMLInputElement
  const readout = (el: any) => el.querySelector('[mono-range-value]') as HTMLElement | null

  it('renders a native range with mono-type, bounds and the fill position', async () => {
    const el = await mount({ min: 0, max: 20, step: 0.5, modelValue: '5', label: 'Limit' })
    expect(el.querySelector('[mono-input]').getAttribute('mono-type')).toBe('range')
    const n = native(el)
    expect(n.type).toBe('range')
    expect(n.min).toBe('0')
    expect(n.max).toBe('20')
    expect(n.step).toBe('0.5')
    expect(n.value).toBe('5')
    expect(n.style.getPropertyValue('--mono-input-range-value').trim()).toBe('25%')
    // no clear button, ever
    el.clearable = true
    await tick()
    expect(el.querySelector('[mono-clear]')).toBeNull()
    el.remove()
  })

  it('a value above 100 survives the first render (bounds are bound before the value)', async () => {
    const el = await mount({ max: 1000, modelValue: '750' })
    expect(native(el).value).toBe('750')
    el.remove()
  })

  it('the readout sits in the label row, or after the slider without a label', async () => {
    const el = await mount({ label: 'Volume', modelValue: '30' })
    expect(el.querySelector('[mono-label] > [mono-range-value]')?.textContent?.trim()).toBe('30')
    expect(el.querySelector('[mono-field] > [mono-range-value]')).toBeNull()
    el.label = ''
    await tick()
    expect(el.querySelector('[mono-field] > [mono-range-value]')?.textContent?.trim()).toBe('30')
    el.showValue = false
    await tick()
    expect(readout(el)).toBeNull()
    el.remove()
  })

  it('show-value="false" from markup hides the readout; absent keeps it', async () => {
    const el = document.createElement('mono-input') as any
    el.setAttribute('type', 'range')
    el.setAttribute('label', 'x')
    document.body.appendChild(el)
    await tick()
    expect(readout(el)).not.toBeNull()
    el.setAttribute('show-value', 'false')
    await tick()
    expect(readout(el)).toBeNull()
    el.remove()
  })

  it('format-display shapes the readout and aria-valuetext, never the native value', async () => {
    const el = await mount({ label: 'Pencapaian', modelValue: '80', formatDisplay: '{}%' })
    expect(readout(el)?.textContent?.trim()).toBe('80%')
    expect(native(el).value).toBe('80')
    expect(native(el).getAttribute('aria-valuetext')).toBe('80%')
    el.remove()
  })

  it('dragging emits input/change with the bare number and moves fill + readout', async () => {
    const el = await mount({ label: 'v', modelValue: '10', formatDisplay: '{} pts' })
    const seen: string[] = []
    el.addEventListener('input', (e: any) => seen.push('input:' + e.detail.modelValue))
    el.addEventListener('change', (e: any) => seen.push('change:' + e.detail.modelValue))
    const n = native(el)
    n.value = '60'
    n.dispatchEvent(new Event('input', { bubbles: true }))
    n.dispatchEvent(new Event('change', { bubbles: true }))
    await tick()
    expect(seen).toEqual(['input:60', 'change:60'])
    expect(el.modelValue).toBe('60')
    expect(readout(el)?.textContent?.trim()).toBe('60 pts')
    expect(n.style.getPropertyValue('--mono-input-range-value').trim()).toBe('60%')
    el.remove()
  })

  it('an empty value reads as the native midpoint, without rewriting the model', async () => {
    const el = await mount({ label: 'v', min: 0, max: 10 })
    expect(readout(el)?.textContent?.trim()).toBe('5')
    expect(el.modelValue).toBe('')
    el.remove()
  })

  it('readonly puts the thumb back and emits nothing', async () => {
    const el = await mount({ modelValue: '40', readonly: true })
    let events = 0
    el.addEventListener('input', () => events++)
    const n = native(el)
    n.value = '90'
    n.dispatchEvent(new Event('input', { bubbles: true }))
    await tick()
    expect(n.value).toBe('40')
    expect(el.modelValue).toBe('40')
    expect(events).toBe(0)
    el.remove()
  })
})
