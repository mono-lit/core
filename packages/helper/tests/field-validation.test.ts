// @vitest-environment jsdom
//
// `validation-position` on the six field controls: `bottom` (default) keeps
// the message row; `icon` draws a state icon inside the box whose hover opens
// a state-coloured bubble; `float` shows the message in a bubble under the box
// only while the field is hovered / focused. In both moved modes the row keeps
// the helper text and the validation text stays sr-only (role="alert" intact).
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'

const TAGS = ['mono-input', 'mono-date', 'mono-textarea', 'mono-select', 'mono-tag-input', 'mono-dropdown-table', 'mono-otp'] as const

beforeAll(async () => {
  for (const t of TAGS) await import(`../dist/ui/${t.slice(5)}.js`)
  await import('../dist/ui/shadow/input.js')
})

afterEach(() => {
  document.body.innerHTML = ''
})

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

async function mount(tag: string, props: Record<string, unknown>): Promise<any> {
  const el = document.createElement(tag) as any
  document.body.appendChild(el)
  for (const [k, v] of Object.entries(props)) el[k] = v
  await tick()
  return el
}

const root = (el: any): ParentNode => el.shadowRoot ?? el
const icon = (el: any) => root(el).querySelector<HTMLElement>('[mono-validation-icon]')
const tip = (el: any) => root(el).querySelector<HTMLElement>('[mono-validation-tip]')
const float = (el: any) => root(el).querySelector<HTMLElement>('[mono-validation-float]')
const messages = (el: any) => [...root(el).querySelectorAll<HTMLElement>('[mono-message], [mono-dd-message]')]

/** date names its states error / success; the others invalid / valid. */
const invalid = (tag: string) => (tag === 'mono-date' ? 'error' : 'invalid')

describe.each(TAGS)('<%s validation-position>', (tag) => {
  const base = () => ({ label: 'Name', helperText: 'Helper text', validationState: invalid(tag), validationMessage: 'Broken value' })

  it('bottom (default): the message replaces the helper in the row, nothing else', async () => {
    const el = await mount(tag, base())
    expect(icon(el)).toBeNull()
    expect(float(el)).toBeNull()
    const visible = messages(el).filter((m) => !m.hasAttribute('mono-sr-only'))
    expect(visible.map((m) => m.textContent!.trim())).toEqual(['Broken value'])
  })

  it('icon: a red icon in the box; hover opens the bubble; the row keeps the helper', async () => {
    const el = await mount(tag, { ...base(), validationPosition: 'icon' })
    const i = icon(el)!
    expect(i).not.toBeNull()
    expect(i.getAttribute('mono-state')).toBe('invalid')
    expect(i.querySelector('.i-mdi-alert-circle-outline')).not.toBeNull()
    expect(root(el).querySelector('[mono-validation-position="icon"]')).not.toBeNull()

    const visible = messages(el).filter((m) => !m.hasAttribute('mono-sr-only'))
    expect(visible.map((m) => m.textContent!.trim())).toEqual(['Helper text'])
    const sr = messages(el).find((m) => m.hasAttribute('mono-sr-only'))!
    expect(sr.textContent!.trim()).toBe('Broken value')

    expect(tip(el)!.hasAttribute('mono-open')).toBe(false)
    i.dispatchEvent(new Event('pointerenter'))
    expect(tip(el)!.hasAttribute('mono-open')).toBe(true)
    expect(tip(el)!.textContent).toBe('Broken value')
    expect(tip(el)!.getAttribute('mono-state')).toBe('invalid')
  })

  it('float: appears on focus / hover of the field, gone when it leaves', async () => {
    const el = await mount(tag, { ...base(), validationPosition: 'float' })
    const f = float(el)!
    expect(f).not.toBeNull()
    expect(f.hasAttribute('mono-open')).toBe(false)
    el.dispatchEvent(new FocusEvent('focusin'))
    expect(f.hasAttribute('mono-open')).toBe(true)
    el.dispatchEvent(new FocusEvent('focusout'))
    await tick(200)
    expect(f.hasAttribute('mono-open')).toBe(false)
    el.dispatchEvent(new Event('pointerenter'))
    expect(f.hasAttribute('mono-open')).toBe(true)
  })

  it('no message → no icon and no bubble, whatever the position', async () => {
    const el = await mount(tag, { label: 'Name', validationState: invalid(tag), validationPosition: 'icon' })
    expect(icon(el)).toBeNull()
    el.validationPosition = 'float'
    await tick()
    expect(float(el)).toBeNull()
  })
})

describe('validation-position details', () => {
  it('warning / valid states paint their own colour and glyph', async () => {
    const el = await mount('mono-input', { validationState: 'warning', validationMessage: 'Careful', validationPosition: 'icon' })
    expect(icon(el)!.getAttribute('mono-state')).toBe('warning')
    el.validationState = 'valid'
    el.validationMessage = 'Looks good'
    await tick()
    expect(icon(el)!.getAttribute('mono-state')).toBe('valid')
    expect(icon(el)!.querySelector('.i-mdi-check-circle-outline')).not.toBeNull()
  })

  it('a click on the icon neither focuses nor opens the control', async () => {
    const el = await mount('mono-select', { validationState: 'invalid', validationMessage: 'Pick one', validationPosition: 'icon', items: [{ label: 'A', value: 'a' }] })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    icon(el)!.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    await tick()
    expect(root(el).querySelector('[mono-select][mono-open]')).toBeNull()
  })

  it('mono-date takes invalid / valid (what controlMonoForm writes) as error / success', async () => {
    const el = await mount('mono-date', { label: 'When', validationState: 'invalid', validationMessage: 'Required' })
    expect(root(el).querySelector('[mono-date]')!.getAttribute('mono-validation-state')).toBe('error')
    expect(messages(el).map((m) => m.textContent!.trim())).toEqual(['Required'])
    el.validationState = 'valid'
    await tick()
    expect(root(el).querySelector('[mono-date]')!.getAttribute('mono-validation-state')).toBe('success')
  })

  it('the shadow build draws the icon as inline SVG', async () => {
    const el = await mount('mono-shadow-input', { validationState: 'invalid', validationMessage: 'Shadow', validationPosition: 'icon' })
    expect(icon(el)!.querySelector('svg[mono-icon]')).not.toBeNull()
  })
})
