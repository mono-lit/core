// @vitest-environment jsdom
//
// `<mono-drawer>` renders its Basecoat styling ATTRIBUTES on the ROOT — the
// `<body>` portal in the light build — plus one `mono-<prop>` per prop that is
// off its default (`mono-size`, `mono-color`, `mono-position`) and every state
// (`mono-open`, `mono-no-overlay`, `mono-persistent`, `mono-no-dismiss`,
// `mono-has-drawer-above`, `mono-resizeable`, `mono-resizing`,
// `mono-auto-fullscreen`). Parts are `mono-overlay` and `mono-panel` >
// `mono-resizer` / `mono-header` (> `mono-title`, `mono-close`) / `mono-body` /
// `mono-footer`. drawer.css reads these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'

describe('<mono-drawer> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/drawer.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []

  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
    // the portals the light build parks on <body>
    for (const p of document.querySelectorAll('[data-mono-drawer-portal]')) p.remove()
  })

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-drawer') as any
    el.title = 'Drawer title'
    el.innerHTML = '<div>Body</div>'
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    hosts.push(el)
    await tick()
    return el
  }

  const root = () => document.querySelector('[data-mono-drawer-portal]') as HTMLElement

  it('a default drawer emits the root attribute and nothing for default-valued props', async () => {
    await mount()
    const r = root()
    expect(r.hasAttribute('mono-drawer')).toBe(true)
    for (const a of [
      'mono-size',
      'mono-color',
      'mono-position',
      'mono-open',
      'mono-no-overlay',
      'mono-persistent',
      'mono-no-dismiss',
      'mono-has-drawer-above',
      'mono-resizeable',
      'mono-resizing',
      'mono-auto-fullscreen',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.classList.contains('mono-drawer'), 'the pre-Basecoat class stays as a hook').toBe(true)
    expect(r.getAttribute('role')).toBe('dialog')
  })

  it('`right` is the default side, so it emits no attribute — upstream\'s is `bottom`', async () => {
    await mount({ position: 'right' })
    expect(root().hasAttribute('mono-position')).toBe(false)

    hosts.splice(0).forEach((el) => el.remove())
    root()?.remove()

    await mount({ position: 'left' })
    expect(root().getAttribute('mono-position')).toBe('left')
  })

  it('the parts render as attributes', async () => {
    await mount({ modelValue: true })
    const r = root()
    expect(r.querySelector(':scope > [mono-overlay]')).not.toBeNull()
    const panel = r.querySelector(':scope > [mono-panel]') as HTMLElement
    expect(panel).not.toBeNull()
    expect(
      panel.querySelector(':scope > [mono-header] > [mono-heading] > [mono-title]')?.textContent?.trim(),
    ).toBe(
      'Drawer title',
    )
    expect(panel.querySelector(':scope > [mono-header] [mono-close]')).not.toBeNull()
    expect(panel.querySelector(':scope > [mono-body]')).not.toBeNull()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'danger', position: 'top', modelValue: true })
    const r = root()
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-position')).toBe('top')
    expect(r.hasAttribute('mono-open')).toBe(true)

    el.overlay = false
    el.persistent = true
    el.dismissible = false
    el.resizeable = true
    await tick()
    expect(r.hasAttribute('mono-no-overlay')).toBe(true)
    expect(r.hasAttribute('mono-persistent')).toBe(true)
    expect(r.hasAttribute('mono-no-dismiss')).toBe(true)
    expect(r.hasAttribute('mono-resizeable')).toBe(true)
    expect(r.querySelector(':scope > [mono-panel] > [mono-resizer]')).not.toBeNull()

    el.modelValue = false
    await tick()
    expect(r.hasAttribute('mono-open')).toBe(false)
  })

  it('`auto-fullscreen` carries the breakpoint as the attribute VALUE', async () => {
    // It was five classes (`auto-fullscreen-sm` …); one attribute with a value
    // is what an attribute-styled component should say.
    await mount({ autoFullscreen: 'md' })
    expect(root().getAttribute('mono-auto-fullscreen')).toBe('md')
  })

  it('an empty footer is marked so the CSS can collapse it', async () => {
    await mount({ modelValue: true })
    const footer = root().querySelector('[mono-footer]') as HTMLElement | null
    if (footer) expect(footer.hasAttribute('mono-empty')).toBe(true)
  })
})

describe('<mono-drawer> header: title / subtitle / header slots', () => {
  beforeAll(async () => {
    await import('../dist/ui/drawer.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []

  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
    for (const p of document.querySelectorAll('[data-mono-drawer-portal]')) p.remove()
  })

  async function mount(inner: string, props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-drawer') as any
    for (const [k, v] of Object.entries(props)) el[k] = v
    el.innerHTML = inner
    document.body.appendChild(el)
    hosts.push(el)
    await tick()
    return el
  }

  const root = () => document.querySelector('[data-mono-drawer-portal]') as HTMLElement
  const head = () => root().querySelector(':scope > [mono-panel] > [mono-header]') as HTMLElement
  const text = (sel: string) => head().querySelector(sel)?.textContent?.trim()

  it('the `subtitle` prop renders a subtitle line under the title', async () => {
    await mount('<div>Body</div>', { title: 'T', subtitle: 'Sub', modelValue: true })
    expect(text('[mono-heading] > [mono-title]')).toBe('T')
    expect(text('[mono-heading] > [mono-subtitle]')).toBe('Sub')
    const r = root()
    expect(r.getAttribute('aria-labelledby')).toBe(head().querySelector('[mono-title]')!.id)
    expect(r.getAttribute('aria-describedby')).toBe(head().querySelector('[mono-subtitle]')!.id)
    expect(r.getAttribute('title')).toBe('')
  })

  it('a subtitle alone still shows the header', async () => {
    await mount('<div>Body</div>', { subtitle: 'Only sub', dismissible: false, modelValue: true })
    expect(head()).not.toBeNull()
    expect(text('[mono-subtitle]')).toBe('Only sub')
  })

  it('`slot="title"` is the TITLE (it used to mean the whole header) and beats the prop', async () => {
    await mount(
      '<b slot="title">Slot title</b><i slot="subtitle">Slot sub</i><div>Body</div>',
      { title: 'Prop title', subtitle: 'Prop sub', modelValue: true },
    )
    expect(text('[mono-title]')).toBe('Slot title')
    expect(text('[mono-subtitle]')).toBe('Slot sub')
  })

  it('`slot="header"` replaces title + subtitle and keeps the ✕', async () => {
    await mount(
      '<div slot="header">Custom</div><b slot="title">Slot title</b><div>Body</div>',
      { title: 'Prop title', subtitle: 'Prop sub', modelValue: true },
    )
    const h = head()
    expect(text('[mono-heading]')).toBe('Custom')
    expect(h.querySelector('[mono-title]')).toBeNull()
    expect(h.querySelector('[mono-subtitle]')).toBeNull()
    expect(h.textContent).not.toContain('Slot title')
    expect(h.querySelector(':scope > [mono-close]')).not.toBeNull()
  })
})
