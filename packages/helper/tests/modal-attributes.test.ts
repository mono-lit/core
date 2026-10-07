// @vitest-environment jsdom
//
// `<mono-modal>` renders its Basecoat styling ATTRIBUTES on the ROOT — the
// `<body>` portal in the light build — plus one `mono-<prop>` per prop that is
// off its default and every state (`mono-open`, `mono-no-overlay`,
// `mono-persistent`, `mono-no-dismiss`, `mono-fullscreen`,
// `mono-auto-fullscreen`, `mono-draggable`, `mono-dialog`). Parts are
// `mono-overlay`, `mono-panel-wrap` > `mono-panel` > `mono-header`
// (> `mono-title`, `mono-close`) / `mono-body` / `mono-footer`. modal.css reads
// these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'

describe('<mono-modal> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/modal.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []

  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
    // the portals the light build parks on <body>
    for (const p of document.querySelectorAll('[data-mono-modal-portal]')) p.remove()
  })

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-modal') as any
    el.title = 'Title'
    el.innerHTML = '<div>Body</div>'
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    hosts.push(el)
    await tick()
    return el
  }

  const root = () => document.querySelector('[data-mono-modal-portal]') as HTMLElement

  it('a default modal emits the root attribute and nothing for default-valued props', async () => {
    await mount()
    const r = root()
    expect(r.hasAttribute('mono-modal')).toBe(true)
    for (const a of [
      'mono-size',
      'mono-color',
      'mono-open',
      'mono-no-overlay',
      'mono-persistent',
      'mono-no-dismiss',
      'mono-fullscreen',
      'mono-auto-fullscreen',
      'mono-draggable',
      'mono-dialog',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.classList.contains('mono-modal'), 'the pre-Basecoat class stays as a hook').toBe(true)
    expect(r.getAttribute('role')).toBe('dialog')
  })

  it('the parts render as attributes', async () => {
    await mount({ modelValue: true })
    const r = root()
    expect(r.querySelector(':scope > [mono-overlay]')).not.toBeNull()
    const panel = r.querySelector(':scope > [mono-panel-wrap] > [mono-panel]') as HTMLElement
    expect(panel).not.toBeNull()
    expect(
      panel.querySelector(':scope > [mono-header] > [mono-heading] > [mono-title]')?.textContent?.trim(),
    ).toBe(
      'Title',
    )
    expect(panel.querySelector(':scope > [mono-header] [mono-close]')).not.toBeNull()
    expect(panel.querySelector(':scope > [mono-body]')).not.toBeNull()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ size: 'lg', color: 'danger', modelValue: true })
    const r = root()
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.hasAttribute('mono-open')).toBe(true)

    el.overlay = false
    el.persistent = true
    el.dismissible = false
    el.draggable = true
    await tick()
    expect(r.hasAttribute('mono-no-overlay')).toBe(true)
    expect(r.hasAttribute('mono-persistent')).toBe(true)
    expect(r.hasAttribute('mono-no-dismiss')).toBe(true)
    expect(r.hasAttribute('mono-draggable')).toBe(true)

    el.modelValue = false
    await tick()
    expect(r.hasAttribute('mono-open')).toBe(false)
  })

  it('`auto-fullscreen` carries the breakpoint as the attribute VALUE', async () => {
    // It was five classes (`auto-fullscreen-sm` …); one attribute with a value
    // is what an attribute-styled component should say.
    await mount({ autoFullscreen: 'lg' })
    expect(root().getAttribute('mono-auto-fullscreen')).toBe('lg')
  })

  it('the programmatic dialog identifies itself as an attribute too', async () => {
    // The controller marks its own modal through `cssClassName`; the port keys
    // on an attribute like everything else, so the class is mirrored.
    await mount({ cssClassName: 'mono-modal-dialog' })
    const r = root()
    expect(r.hasAttribute('mono-dialog')).toBe(true)
    expect(r.classList.contains('mono-modal-dialog')).toBe(true)
  })

  it('…also when cssClassName carries more than one class', async () => {
    // The split was `/s+/` — the LETTER s — so any second class (a consumer's own
    // `opts.props.cssClassName`) lost `mono-dialog` and with it the dialog layout.
    await mount({ cssClassName: 'mono-modal-dialog my-dialog' })
    expect(root().hasAttribute('mono-dialog')).toBe(true)
  })
})

describe('<mono-modal> header: title / subtitle / header slots', () => {
  beforeAll(async () => {
    await import('../dist/ui/modal.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []

  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
    for (const p of document.querySelectorAll('[data-mono-modal-portal]')) p.remove()
  })

  async function mount(inner: string, props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-modal') as any
    for (const [k, v] of Object.entries(props)) el[k] = v
    el.innerHTML = inner
    document.body.appendChild(el)
    hosts.push(el)
    await tick()
    return el
  }

  const root = () => document.querySelector('[data-mono-modal-portal]') as HTMLElement
  const head = () =>
    root().querySelector(':scope > [mono-panel-wrap] > [mono-panel] > [mono-header]') as HTMLElement
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

  it('no subtitle → no subtitle element and no aria-describedby', async () => {
    await mount('<div>Body</div>', { title: 'T', modelValue: true })
    expect(head().querySelector('[mono-subtitle]:not([mono-empty])')).toBeNull()
    expect(root().hasAttribute('aria-describedby')).toBe(false)
  })

  it('a subtitle alone still shows the header', async () => {
    await mount('<div>Body</div>', { subtitle: 'Only sub', dismissible: false, modelValue: true })
    expect(head()).not.toBeNull()
    expect(text('[mono-subtitle]')).toBe('Only sub')
  })

  it('`slot="title"` beats the prop; `slot="subtitle"` fills the subtitle line', async () => {
    await mount(
      '<b slot="title">Slot title</b><i slot="subtitle">Slot sub</i><div>Body</div>',
      { title: 'Prop title', modelValue: true },
    )
    expect(text('[mono-title]')).toBe('Slot title')
    expect(text('[mono-subtitle]')).toBe('Slot sub')
  })

  it('`slot="header"` replaces title + subtitle but KEEPS the ✕', async () => {
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
    expect(root().getAttribute('aria-labelledby')).toBe(h.querySelector('[mono-heading]')!.id)
  })

  it('`slot="head"` is still an alias of `header` (and keeps the ✕)', async () => {
    await mount('<div slot="head">Legacy head</div><div>Body</div>', {
      title: 'Prop title',
      modelValue: true,
    })
    expect(text('[mono-heading]')).toBe('Legacy head')
    expect(head().querySelector(':scope > [mono-close]')).not.toBeNull()
  })
})
