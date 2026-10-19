// @vitest-environment jsdom
//
// The `tooltip` prop of the six form controls: an info icon at the END of the
// label (after the required `*`). Plain text opens the BUILT-IN bubble (no
// floating-ui); full tooltip options open a `mono-tooltip`. Nothing without a
// label or without content. The no-peer case (floating-ui missing → plain text
// still works, the object form draws no icon) lives in
// `field-tooltip-no-peer.test.ts`, since it needs a module mock.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

const TAGS = ['mono-input', 'mono-date', 'mono-textarea', 'mono-select', 'mono-tag-input', 'mono-dropdown-table', 'mono-otp'] as const

beforeAll(async () => {
  for (const t of TAGS) await import(`../dist/ui/${t.slice(5)}.js`)
  await import('../dist/ui/shadow/input.js')
  await import('../dist/ui/shadow/select.js')
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
const label = (el: any) => root(el).querySelector('[mono-label], [mono-dd-label]') as HTMLElement | null
const icon = (el: any) => label(el)?.querySelector(':scope > [mono-label-tooltip]') as HTMLElement | null
const bubble = () => document.querySelector<HTMLElement>('[mono-tooltip][role="tooltip"]')
const builtIn = (el: any) => icon(el)?.querySelector(':scope > [mono-label-tooltip-bubble]') as HTMLElement | null

function hover(el: Element): void {
  el.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, composed: true }))
}

describe.each(TAGS)('<%s tooltip>', (tag) => {
  it('draws the info icon as the label row\'s last child, after the required mark', async () => {
    const el = await mount(tag, { label: 'Name', required: true, tooltip: 'More about this field' })
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    const i = icon(el)!
    expect(label(el)!.lastElementChild).toBe(i)
    expect(i.previousElementSibling?.matches('[mono-required-mark], [mono-dd-required-mark]')).toBe(true)
    expect(i.querySelector('.i-mdi-information-outline')).not.toBeNull()
    expect(i.getAttribute('tabindex')).toBe('0')
  })

  it('plain text shows the built-in bubble on hover — no mono-tooltip', async () => {
    const el = await mount(tag, { label: 'Name', tooltip: 'Readable only' })
    const i = icon(el)!
    expect(i).not.toBeNull()
    const b = builtIn(el)!
    expect(b.textContent).toBe('Readable only')
    expect(b.getAttribute('role')).toBe('tooltip')
    expect(i.getAttribute('aria-describedby')).toBe(b.id)
    expect(b.hasAttribute('mono-open')).toBe(false)
    i.dispatchEvent(new Event('pointerenter'))
    expect(b.hasAttribute('mono-open')).toBe(true)
    await tick()
    expect(bubble()).toBeNull()
  })

  it('takes full tooltip options as an object', async () => {
    const el = await mount(tag, { label: 'Name', tooltip: { content: 'Disabled for now', delay: 0, color: 'danger' } })
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    hover(icon(el)!)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('Disabled for now'))
    expect(bubble()!.getAttribute('mono-color')).toBe('danger')
  })

  it('follows prop changes, and drops the icon when cleared', async () => {
    const el = await mount(tag, { label: 'Name', tooltip: 'First' })
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    el.tooltip = { content: 'Second', delay: 0 }
    await tick()
    hover(icon(el)!)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('Second'))
    el.tooltip = ''
    await tick()
    expect(icon(el)).toBeNull()
  })

  it('renders nothing without content or without a label', async () => {
    const empty = await mount(tag, { label: 'Name', tooltip: { placement: 'right' } })
    await tick(80)
    expect(icon(empty)).toBeNull()
    const noLabel = await mount(tag, { tooltip: 'Orphan' })
    await tick(80)
    expect(root(noLabel).querySelector('[mono-label-tooltip]')).toBeNull()
  })
})

describe('tooltip icon behaviour', () => {
  it('a click on the icon does not activate the label (no focus jump into the field)', async () => {
    const el = await mount('mono-input', { label: 'Name', tooltip: 'Info' })
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    icon(el)!.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(document.activeElement).not.toBe(el.querySelector('input'))
  })

  it('reads the `tooltip` HTML attribute as plain text', async () => {
    const el = document.createElement('mono-input') as any
    el.setAttribute('label', 'Name')
    el.setAttribute('tooltip', 'From the attribute')
    document.body.appendChild(el)
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    expect(el.tooltip).toBe('From the attribute')
  })

  it('the built-in bubble opens on focus, closes on Escape and on blur', async () => {
    const el = await mount('mono-input', { label: 'Name', tooltip: 'Info' })
    const i = icon(el)!
    const b = builtIn(el)!
    i.focus()
    expect(b.hasAttribute('mono-open')).toBe(true)
    i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(b.hasAttribute('mono-open')).toBe(false)
    i.dispatchEvent(new Event('pointerenter'))
    expect(b.hasAttribute('mono-open')).toBe(true)
    i.blur()
    expect(b.hasAttribute('mono-open')).toBe(false)
  })

  it('a tap opens the built-in bubble; a touch lift does not close it', async () => {
    const el = await mount('mono-input', { label: 'Name', tooltip: 'Info' })
    const i = icon(el)!
    const b = builtIn(el)!
    i.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(b.hasAttribute('mono-open')).toBe(true)
    const lift = new Event('pointerleave') as any
    lift.pointerType = 'touch'
    i.dispatchEvent(lift)
    await tick(200)
    expect(b.hasAttribute('mono-open')).toBe(true)
  })

  it.each(['mono-shadow-input', 'mono-shadow-select'])('%s draws the icon as inline SVG inside its shadow root', async (tag) => {
    const el = await mount(tag, { label: 'Name', tooltip: 'Shadow info' })
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    expect(icon(el)!.querySelector('svg[mono-icon]')).not.toBeNull()
    expect(builtIn(el)?.textContent).toBe('Shadow info')
    el.tooltip = { content: 'Shadow object', delay: 0 }
    await tick()
    await vi.waitFor(() => expect(icon(el)).not.toBeNull())
    hover(icon(el)!)
    await vi.waitFor(() => expect(bubble()?.textContent).toBe('Shadow object'))
  })
})
