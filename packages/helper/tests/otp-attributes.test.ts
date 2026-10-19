// @vitest-environment jsdom
//
// `<mono-otp>`: the rendered DOM (attributes otp.css keys on), typing / Backspace / paste, the
// events (input / change / complete / clear), the hidden form input, the shadow twin, and the
// controlMonoForm binding.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { controlMonoForm } from '../src/components/form/mono-form-controller'

describe('<mono-otp>', () => {
  beforeAll(async () => {
    await import('../dist/ui/otp.js')
    await import('../dist/ui/shadow/otp.js')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}, attrs: Record<string, string> = {}, tag = 'mono-otp'): Promise<any> {
    const el = document.createElement(tag) as any
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    for (const [k, v] of Object.entries(props)) el[k] = v
    document.body.appendChild(el)
    await tick()
    return el
  }

  const scope = (el: any): ParentNode => el.shadowRoot ?? el
  const root = (el: any) => scope(el).querySelector('[mono-otp]') as HTMLElement
  const cells = (el: any) => [...scope(el).querySelectorAll('[mono-otp-cell]')] as HTMLInputElement[]
  const shown = (el: any) => cells(el).map((c) => c.value).join('')

  function type(cell: HTMLInputElement, text: string): void {
    cell.value = text
    cell.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }))
  }
  const key = (cell: HTMLElement, k: string) => cell.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  function paste(cell: HTMLElement, text: string): void {
    const event = new Event('paste', { bubbles: true, cancelable: true }) as any
    event.clipboardData = { getData: () => text }
    cell.dispatchEvent(event)
  }

  it('renders `length` boxes; the defaults emit no prop attributes', async () => {
    const el = await mount({ label: 'Code' })
    expect(cells(el)).toHaveLength(6)
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-type', 'mono-label-position', 'mono-validation-state', 'mono-mask', 'mono-disabled']) {
      expect(root(el).hasAttribute(a), a).toBe(false)
    }
    expect(cells(el)[0].getAttribute('autocomplete')).toBe('one-time-code')
    expect(cells(el)[1].getAttribute('autocomplete')).toBe('off')
    expect(cells(el)[0].getAttribute('inputmode')).toBe('numeric')
    expect(cells(el)[0].getAttribute('aria-label')).toBe('Code – Digit 1 of 6')
    expect(scope(el).querySelector('[mono-field]')!.getAttribute('role')).toBe('group')
  })

  it('mirrors size / color / variant / type / mask / label-position onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'success', variant: 'filled', type: 'alphanumeric', mask: true, labelPosition: 'left', label: 'x' })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.getAttribute('mono-type')).toBe('alphanumeric')
    expect(r.hasAttribute('mono-mask')).toBe(true)
    expect(r.getAttribute('mono-label-position')).toBe('left')
    expect(cells(el)[0].type).toBe('password')
    expect(cells(el)[0].getAttribute('inputmode')).toBe('text')
  })

  it('notched falls back to top (no attribute)', async () => {
    const el = await mount({ labelPosition: 'notched', label: 'x' })
    expect(root(el).hasAttribute('mono-label-position')).toBe(false)
  })

  it('groups draw separators between runs of boxes', async () => {
    const el = await mount({ length: 6, groups: 3 })
    expect(scope(el).querySelectorAll('[mono-otp-group]')).toHaveLength(2)
    const sep = scope(el).querySelectorAll('[mono-otp-separator]')
    expect(sep).toHaveLength(1)
    expect(sep[0].textContent).toBe('-')
    const el2 = await mount({}, { length: '6', groups: '2,2,2', separator: '·' })
    expect(scope(el2).querySelectorAll('[mono-otp-separator]')).toHaveLength(2)
    expect(scope(el2).querySelector('[mono-otp-separator]')!.textContent).toBe('·')
  })

  it('modelValue fills the boxes, cleaned and cut', async () => {
    const el = await mount({ modelValue: '12a3456789', length: 4 })
    expect(shown(el)).toBe('1234')
    expect(el.value).toBe('1234')
    el.modelValue = '98'
    await tick()
    expect(shown(el)).toBe('98')
    expect(el.complete).toBe(false)
  })

  it('typing fills a box, fires input and moves focus; a rejected char fires nothing', async () => {
    const el = await mount({})
    const seen: any[] = []
    el.addEventListener('mno-input', (e: CustomEvent) => seen.push(e.detail))
    const [c0, c1] = cells(el)
    c0.focus()
    type(c0, '4')
    await tick()
    expect(el.modelValue).toBe('4')
    expect(seen.at(-1)).toMatchObject({ modelValue: '4', oldValue: '', index: 0, complete: false })
    expect(document.activeElement).toBe(c1)

    const plain: Event[] = []
    el.addEventListener('input', (e: Event) => plain.push(e))
    type(c1, 'x')
    await tick()
    expect(el.modelValue).toBe('4')
    expect(c1.value).toBe('')
    expect(plain).toHaveLength(0)
    expect(seen).toHaveLength(1)
  })

  it('the plain `input` event carries the mono detail', async () => {
    const el = await mount({})
    let detail: any
    el.addEventListener('input', (e: CustomEvent) => (detail = e.detail))
    type(cells(el)[0], '7')
    await tick()
    expect(detail?.modelValue).toBe('7')
  })

  it('paste fills every box and fires complete once', async () => {
    const el = await mount({ length: 6 })
    const done: any[] = []
    el.addEventListener('complete', (e: CustomEvent) => done.push(e.detail))
    paste(cells(el)[0], ' 123 456 ')
    await tick()
    expect(el.modelValue).toBe('123456')
    expect(shown(el)).toBe('123456')
    expect(el.complete).toBe(true)
    expect(root(el).hasAttribute('mono-complete')).toBe(true)
    expect(done).toHaveLength(1)
    expect(done[0].modelValue).toBe('123456')
  })

  it('an SMS autofill (several characters in one box) spreads across the boxes', async () => {
    const el = await mount({ length: 4 })
    type(cells(el)[0], '9876')
    await tick()
    expect(el.modelValue).toBe('9876')
  })

  it('Backspace clears a filled box, then steps back', async () => {
    const el = await mount({ modelValue: '123' })
    const c = cells(el)
    key(c[2], 'Backspace')
    await tick()
    expect(el.modelValue).toBe('12')
    key(c[2], 'Backspace')
    await tick()
    expect(el.modelValue).toBe('1')
    expect(document.activeElement).toBe(c[1])
  })

  it('Delete shifts the rest left', async () => {
    const el = await mount({ modelValue: '1234' })
    key(cells(el)[1], 'Delete')
    await tick()
    expect(el.modelValue).toBe('134')
  })

  it('focus never lands past the first empty box', async () => {
    const el = await mount({ modelValue: '12' })
    cells(el)[5].focus()
    await tick()
    expect(document.activeElement).toBe(cells(el)[2])
  })

  it('change fires when focus leaves the group, only if the code changed', async () => {
    const el = await mount({})
    const changes: any[] = []
    el.addEventListener('mno-change', (e: CustomEvent) => changes.push(e.detail))
    const c = cells(el)
    c[0].dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    type(c[0], '5')
    c[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: c[1] }))
    expect(changes).toHaveLength(0)
    c[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ modelValue: '5', oldValue: '' })
    // the cells' own native change never escapes
    const native: Event[] = []
    el.addEventListener('change', (e: Event) => native.push(e))
    c[0].dispatchEvent(new Event('change', { bubbles: true }))
    expect(native).toHaveLength(0)
  })

  it('readonly blocks edits; disabled disables every box', async () => {
    const el = await mount({ modelValue: '12', readonly: true })
    type(cells(el)[2], '3')
    key(cells(el)[1], 'Backspace')
    await tick()
    expect(el.modelValue).toBe('12')
    el.disabled = true
    await tick()
    expect(cells(el).every((c) => c.disabled)).toBe(true)
  })

  it('clearable: the button empties the code and fires input, change, clear', async () => {
    const el = await mount({ modelValue: '1234', clearable: true })
    const fired: string[] = []
    for (const n of ['mno-input', 'mno-change', 'mno-clear']) el.addEventListener(n, () => fired.push(n))
    ;(scope(el).querySelector('[mono-clear]') as HTMLElement).click()
    await tick()
    expect(el.modelValue).toBe('')
    expect(fired).toEqual(['mno-input', 'mno-change', 'mno-clear'])
    expect(scope(el).querySelector('[mono-clear]')).toBeNull()
  })

  it('name → a hidden input carrying the joined code', async () => {
    const el = await mount({ name: 'otp', modelValue: '42' })
    const hidden = el.querySelector('input[type="hidden"][name="otp"]') as HTMLInputElement
    expect(hidden.value).toBe('42')
  })

  it('validation state + message paint the root and the message row', async () => {
    const el = await mount({ validationState: 'invalid', validationMessage: 'Wrong code' })
    expect(root(el).getAttribute('mono-validation-state')).toBe('invalid')
    expect(cells(el)[0].getAttribute('aria-invalid')).toBe('true')
    const msg = scope(el).querySelector('[mono-message="invalid"]')!
    expect(msg.textContent!.trim()).toBe('Wrong code')
    expect(msg.getAttribute('role')).toBe('alert')
  })

  it('the shadow twin renders the same boxes and edits the same way', async () => {
    const el = await mount({ label: 'Code', length: 4 }, {}, 'mono-shadow-otp')
    expect(el.shadowRoot).not.toBeNull()
    expect(cells(el)).toHaveLength(4)
    paste(cells(el)[0], '1234')
    await tick()
    expect(el.modelValue).toBe('1234')
    expect(scope(el).querySelector('[mono-clear] svg, [mono-label] slot[name="label"]')).not.toBeNull()
  })

  it('controlMonoForm: drives the value and writes validation back', async () => {
    const form = controlMonoForm({
      inputs: {
        Code: {
          component: 'mono-otp',
          value: '',
          validates: [
            { type: 'required', message: 'Enter the code' },
            { type: 'min', value: 6, message: 'The code has 6 digits' },
          ],
        },
      },
    })
    const el = await mount({ label: 'Code' })
    el.dataForm = form
    el.keyForm = 'Code'
    await tick()

    await form.validate()
    await tick()
    expect(el.validationState).toBe('invalid')
    expect(el.validationMessage).toBe('Enter the code')

    paste(cells(el)[0], '123')
    await tick()
    await form.validate()
    await tick()
    expect(form.values().Code).toBe('123')
    expect(el.validationMessage).toBe('The code has 6 digits')

    form.setValue('Code', '654321')
    await tick()
    expect(shown(el)).toBe('654321')
    await form.validate()
    await tick()
    expect(el.validationState).toBe('default')
  })
})
