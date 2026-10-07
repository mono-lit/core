// @vitest-environment jsdom
//
// `<mono-accordion>` renders its Basecoat styling ATTRIBUTES: the root carries
// `mono-accordion` plus one `mono-<prop>` per prop that is off its default, the
// states `mono-open` / `mono-disabled`, and — when the item sits in a group —
// `mono-grouped` / `mono-last`, which is how the flattened list reaches an item
// no selector can cross to. Parts are `mono-head` > `mono-glyph` / `mono-heading`
// > `mono-title` / `mono-description` / `mono-actions` / `mono-arrow`, and
// `mono-body`. accordion.css keys on these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-accordion> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/accordion.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}, parent: HTMLElement = document.body) {
    const el = document.createElement('mono-accordion') as any
    parent.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-accordion]') as HTMLElement

  it('a default accordion emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount({ label: 'Question' })
    const r = root(el)
    for (const a of ['mono-size', 'mono-color', 'mono-open', 'mono-disabled', 'mono-grouped']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.classList.contains('mono-accordion'), 'the pre-Basecoat class stays as a hook').toBe(true)
    el.remove()
  })

  it('the parts render as attributes', async () => {
    const el = await mount({ label: 'Question', description: 'Sub' })
    const r = root(el)
    expect(r.querySelector(':scope > [mono-head]')).not.toBeNull()
    expect(
      r.querySelector(':scope > [mono-head] > [mono-heading] > [mono-title]')?.textContent?.trim(),
    ).toBe('Question')
    expect(
      r.querySelector(':scope > [mono-head] > [mono-heading] > [mono-description]')?.textContent?.trim(),
    ).toBe('Sub')
    expect(r.querySelector(':scope > [mono-head] > [mono-arrow]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-body]')).not.toBeNull()
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount({ label: 'Q', size: 'lg', color: 'warning' })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('warning')

    el.modelValue = true
    await tick()
    expect(r.hasAttribute('mono-open')).toBe(true)
    expect(r.querySelector('[mono-head]')?.getAttribute('aria-expanded')).toBe('true')

    el.disabled = true
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    el.remove()
  })

  it('an item inside a group says so', async () => {
    // The flattened list is `[mono-accordion-group] > [mono-accordion]` in CSS,
    // which only matches hand-written markup: the element puts a custom-element
    // host (light) or a shadow boundary (shadow) between the two, and a selector
    // crosses neither. This attribute is that path.
    const group = document.createElement('div')
    group.setAttribute('mono-accordion-group', '')
    document.body.appendChild(group)

    const first = await mount({ label: 'One' }, group)
    const last = await mount({ label: 'Two' }, group)

    // Membership only. The DIVIDER is the group's business and rides its own
    // `:last-child`, because an item that answered "am I last?" itself would
    // answer from however many siblings existed when it rendered.
    expect(root(first).hasAttribute('mono-grouped')).toBe(true)
    expect(root(last).hasAttribute('mono-grouped')).toBe(true)
    expect(root(first).hasAttribute('mono-last')).toBe(false)
    expect(root(last).hasAttribute('mono-last')).toBe(false)

    group.remove()
  })

  it('the pre-port group CLASS is honoured beside the attribute', async () => {
    // The group wrapper is CONSUMER markup, not something the element renders, so
    // breaking the class would silently unstyle an existing page.
    const group = document.createElement('div')
    group.className = 'mono-accordion-group'
    document.body.appendChild(group)
    const el = await mount({ label: 'One' }, group)
    expect(root(el).hasAttribute('mono-grouped')).toBe(true)
    group.remove()
  })
})

describe('<mono-accordion> title / subtitle', () => {
  beforeAll(async () => {
    await import('../dist/ui/accordion.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  /** Mount from markup, so HTML attributes and `slot="…"` children are real. */
  async function mountHtml(markup: string) {
    const host = document.createElement('div')
    host.innerHTML = markup
    document.body.appendChild(host)
    await tick()
    const el = host.querySelector('mono-accordion') as any
    return { el, host }
  }

  const heading = (el: any) =>
    el.querySelector('[mono-accordion] > [mono-head] > [mono-heading]') as HTMLElement | null
  const titleText = (el: any) => heading(el)?.querySelector('[mono-title]')?.textContent?.trim()
  const subtitleText = (el: any) =>
    heading(el)?.querySelector('[mono-subtitle]')?.textContent?.trim()

  it('title / subtitle props render into [mono-title] / [mono-subtitle]', async () => {
    const el = document.createElement('mono-accordion') as any
    document.body.appendChild(el)
    el.title = 'Question'
    el.subtitle = 'Sub'
    await tick()
    expect(titleText(el)).toBe('Question')
    expect(subtitleText(el)).toBe('Sub')
    // the old part name stays on the same element for existing CSS
    expect(heading(el)?.querySelector('[mono-subtitle]')?.hasAttribute('mono-description')).toBe(true)
    el.remove()
  })

  it('label / description properties are aliases of title / subtitle', async () => {
    const el = document.createElement('mono-accordion') as any
    document.body.appendChild(el)
    el.label = 'Old title'
    el.description = 'Old sub'
    await tick()
    expect(el.title).toBe('Old title')
    expect(el.subtitle).toBe('Old sub')
    expect(titleText(el)).toBe('Old title')
    expect(subtitleText(el)).toBe('Old sub')

    el.title = 'New title'
    await tick()
    expect(el.label).toBe('New title')
    expect(titleText(el)).toBe('New title')
    el.remove()
  })

  it('label / description HTML attributes map to title / subtitle', async () => {
    const { el, host } = await mountHtml(
      '<mono-accordion label="From attr" description="Sub attr">Body</mono-accordion>',
    )
    expect(el.title).toBe('From attr')
    expect(titleText(el)).toBe('From attr')
    expect(subtitleText(el)).toBe('Sub attr')
    host.remove()
  })

  it('the title attribute renders as the title', async () => {
    const { el, host } = await mountHtml('<mono-accordion title="Attr title">Body</mono-accordion>')
    expect(titleText(el)).toBe('Attr title')
    host.remove()
  })

  it('the rendered root carries title="" (no native tooltip over the content)', async () => {
    const { el, host } = await mountHtml('<mono-accordion title="Tip">Body</mono-accordion>')
    expect(el.querySelector('[mono-accordion]')?.getAttribute('title')).toBe('')
    host.remove()
  })

  it('slot="title" beats the title prop', async () => {
    const { el, host } = await mountHtml(
      '<mono-accordion title="Prop"><b slot="title">Slotted</b><i slot="subtitle">Sub slot</i>Body</mono-accordion>',
    )
    expect(titleText(el)).toBe('Slotted')
    expect(subtitleText(el)).toBe('Sub slot')
    host.remove()
  })

  it('slot="label" / slot="description" still work as aliases', async () => {
    const { el, host } = await mountHtml(
      '<mono-accordion><b slot="label">Old slot</b><i slot="description">Old sub</i>Body</mono-accordion>',
    )
    expect(titleText(el)).toBe('Old slot')
    expect(subtitleText(el)).toBe('Old sub')
    host.remove()
  })

  it('the canonical slot beats its alias, and the loser stays parented', async () => {
    const { el, host } = await mountHtml(
      '<mono-accordion><b slot="label" id="loser">Old</b><b slot="title">New</b>Body</mono-accordion>',
    )
    expect(titleText(el)).toBe('New')
    // not rendered in the accordion, but never detached (parentNode === null crashes Vue)
    expect(el.querySelector('#loser')).toBeNull()
    const loser = el._parked?.querySelector('#loser')
    expect(loser).toBeTruthy()
    expect(loser.parentNode).not.toBeNull()
    host.remove()
  })

  it('slot="header" replaces icon + title/subtitle, and keeps actions / chevron', async () => {
    const { el, host } = await mountHtml(
      `<mono-accordion title="Prop" subtitle="Prop sub">
        <svg slot="icon"></svg>
        <b slot="title" id="beaten">Slotted title</b>
        <div slot="header" id="custom-header">Custom header</div>
        <span slot="actions">ACT</span>
        Body
      </mono-accordion>`,
    )
    const h = heading(el)
    expect(h?.querySelector('#custom-header')).not.toBeNull()
    expect(h?.querySelector('[mono-title]')).toBeNull()
    expect(h?.querySelector('[mono-subtitle]')).toBeNull()
    // (the host's own `textContent` is guarded for Vue — read the rendered root)
    const rendered = el.querySelector('[mono-accordion]')!.textContent
    expect(rendered).not.toContain('Slotted title')
    expect(rendered).not.toContain('Prop sub')

    const head = el.querySelector('[mono-accordion] > [mono-head]') as HTMLElement
    expect(head.tagName).toBe('BUTTON')
    // the header replaces the left icon too; the icon node is parked, not detached
    expect(head.querySelector('[mono-glyph]')).toBeNull()
    expect(el._parked?.querySelector('svg')).toBeTruthy()
    expect(head.querySelector('[mono-actions]')?.textContent?.trim()).toBe('ACT')
    expect(head.querySelector('[mono-arrow]')).not.toBeNull()

    // the beaten title node is parked, not detached
    const beaten = el._parked?.querySelector('#beaten')
    expect(beaten).toBeTruthy()
    expect(beaten.parentNode).not.toBeNull()

    // the header is still the toggle
    head.click()
    await tick()
    expect(el.modelValue).toBe(true)
    host.remove()
  })
})

describe('<mono-shadow-accordion> title / subtitle', () => {
  beforeAll(async () => {
    await import('../dist/ui/shadow/accordion.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mountHtml(markup: string) {
    const host = document.createElement('div')
    host.innerHTML = markup
    document.body.appendChild(host)
    await tick()
    const el = host.querySelector('mono-shadow-accordion') as any
    return { el, host, root: el.shadowRoot.querySelector('[mono-accordion]') as HTMLElement }
  }

  it('renders title="" on the root and the title/subtitle props as slot fallback', async () => {
    const { host, root } = await mountHtml(
      '<mono-shadow-accordion label="Old" subtitle="Sub">Body</mono-shadow-accordion>',
    )
    expect(root.getAttribute('title')).toBe('')
    expect(root.querySelector('[mono-title]')?.textContent?.trim()).toBe('Old')
    const sub = root.querySelector('[mono-subtitle]')!
    expect(sub.hasAttribute('mono-description')).toBe(true)
    expect(sub.textContent?.trim()).toBe('Sub')
    host.remove()
  })

  it('an EMPTY header slot does not count as a header (its fallback is not content)', async () => {
    // `assignedNodes({ flatten: true })` returns the fallback — the title/subtitle
    // markup — so an accordion with no header used to hide its icon.
    const { host, el, root } = await mountHtml(
      '<mono-shadow-accordion title="T"><svg slot="icon"></svg>Body</mono-shadow-accordion>',
    )
    await tick()
    expect(el._hasHeaderSlotState).toBe(false)
    expect(root.querySelector('[mono-glyph]')?.hasAttribute('mono-empty')).toBe(false)
    host.remove()
  })

  it('a real header slot hides the icon', async () => {
    const { host, el, root } = await mountHtml(
      '<mono-shadow-accordion title="T"><svg slot="icon"></svg><b slot="header">H</b>Body</mono-shadow-accordion>',
    )
    await tick()
    expect(el._hasHeaderSlotState).toBe(true)
    expect(root.querySelector('[mono-glyph]')?.hasAttribute('mono-empty')).toBe(true)
    host.remove()
  })

  it('slot="body" and unslotted children both land in the body (one grid item)', async () => {
    const { host, el, root } = await mountHtml(
      '<mono-shadow-accordion title="T" model-value><div slot="body" id="named">Named</div></mono-shadow-accordion>',
    )
    await tick()
    const body = root.querySelector('[mono-body]')!
    // a single grid item wraps both slots, so the 0fr → 1fr collapse still works
    expect(body.children.length).toBe(1)
    const named = body.querySelector('slot[name="body"]') as HTMLSlotElement
    expect(named.assignedElements().map((e) => e.id)).toEqual(['named'])
    expect(el._hasBodySlotState).toBe(true)
    host.remove()

    const plain = await mountHtml('<mono-shadow-accordion title="T">Plain body</mono-shadow-accordion>')
    await tick()
    const def = plain.root.querySelector('[mono-body] slot:not([name])') as HTMLSlotElement
    expect(def.assignedNodes().some((n) => n.textContent?.includes('Plain body'))).toBe(true)
    expect(plain.el._hasBodySlotState).toBe(true)
    plain.host.remove()
  })

  it('nests the slots so header > title > label', async () => {
    const { host, root } = await mountHtml('<mono-shadow-accordion>Body</mono-shadow-accordion>')
    const header = root.querySelector('[mono-heading] > slot[name="header"]')!
    const title = header.querySelector('[mono-title] > slot[name="title"]')!
    expect(title.querySelector(':scope > slot[name="label"]')).not.toBeNull()
    expect(
      header.querySelector('[mono-subtitle] > slot[name="subtitle"] > slot[name="description"]'),
    ).not.toBeNull()
    host.remove()
  })

  it('an old-name slot counts as title content', async () => {
    const { host, el, root } = await mountHtml(
      '<mono-shadow-accordion><b slot="label">Slotted</b>Body</mono-shadow-accordion>',
    )
    await tick()
    expect(el._hasTitleSlotState).toBe(true)
    expect(root.querySelector('[mono-title]')?.hasAttribute('mono-empty')).toBe(false)
    host.remove()
  })
})
