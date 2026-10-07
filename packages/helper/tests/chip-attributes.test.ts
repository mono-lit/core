// @vitest-environment jsdom
//
// `<mono-chip>` renders its Basecoat styling ATTRIBUTES: the root carries
// `mono-chip` plus one `mono-<prop>` per prop that is off its default and the
// states `mono-has-dot` / `mono-removable` / `mono-clickable` / `mono-disabled`
// / `mono-selected`; the parts are `mono-main` > `mono-content` > `mono-dot` /
// `mono-label` / `mono-close`. chip.css keys on these alone.
//
// It also guards the two collisions the port had to resolve:
//  - a FIELD's internal chip (`<mono-tag-input>`) carries `mono-chip` too, so
//    chip.css must paint on `mono-main`, a part a field chip does not have;
//  - `rounded-<step>` is Tailwind/UnoCSS's namespace and is no longer emitted.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-chip> styling attributes', () => {
  beforeAll(async () => {
    await import('../dist/ui/chip.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(tag: string, props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement(tag) as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const root = (el: any) => el.querySelector('[mono-chip]') as HTMLElement

  it('a default chip emits the root attribute and nothing for default-valued props', async () => {
    const el = await mount('mono-chip', { label: 'Active' })
    const r = root(el)
    for (const a of [
      'mono-size',
      'mono-color',
      'mono-variant',
      'mono-rounded',
      'mono-icon-position',
      'mono-has-dot',
      'mono-removable',
      'mono-clickable',
      'mono-disabled',
      'mono-selected',
    ]) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    const main = r.querySelector(':scope > [mono-main]') as HTMLElement
    expect(main).not.toBeNull()
    expect(main.tagName).toBe('SPAN')
    expect(main.querySelector(':scope > [mono-content] > [mono-label]')?.textContent?.trim()).toBe(
      'Active',
    )
    expect(r.classList.contains('mono-chip')).toBe(true)
    el.remove()
  })

  it('props and states mirror onto the root', async () => {
    const el = await mount('mono-chip', {
      label: 'L',
      size: 'lg',
      color: 'success',
      variant: 'solid',
      rounded: 'sm',
      dot: true,
      removable: true,
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-color')).toBe('success')
    expect(r.getAttribute('mono-variant')).toBe('solid')
    expect(r.getAttribute('mono-rounded')).toBe('sm')
    expect(r.hasAttribute('mono-has-dot')).toBe(true)
    expect(r.hasAttribute('mono-removable')).toBe(true)
    expect(r.querySelector('[mono-content] > [mono-dot]')).not.toBeNull()
    const close = r.querySelector('[mono-content] > [mono-close]') as HTMLButtonElement
    expect(close.tagName).toBe('BUTTON')
    expect(close.querySelector('[mono-glyph]')).not.toBeNull()

    el.disabled = true
    el.selected = true
    await tick()
    expect(r.hasAttribute('mono-disabled')).toBe(true)
    expect(r.hasAttribute('mono-selected')).toBe(true)
    el.remove()
  })

  it('`rounded` no longer emits the Tailwind-namespaced class', async () => {
    const el = await mount('mono-chip', { label: 'L', rounded: 'md' })
    const r = root(el)
    expect(r.getAttribute('mono-rounded')).toBe('md')
    expect([...r.classList].some((c) => c.startsWith('rounded-'))).toBe(false)
    el.remove()
  })

  it('an href chip renders the anchor as the badge box', async () => {
    const el = await mount('mono-chip', { label: 'Go', href: '/x', target: '_blank' })
    const r = root(el)
    const main = r.querySelector(':scope > [mono-main]') as HTMLAnchorElement
    expect(main.tagName).toBe('A')
    expect(main.getAttribute('href')).toBe('/x')
    // href implies clickable, which is what the hover/cursor rules key on
    expect(r.hasAttribute('mono-clickable')).toBe(true)
    el.remove()
  })

  it('a status dot carries its own root and part', async () => {
    const el = await mount('mono-status-dot', { state: 'busy', pulse: true, label: 'Busy' })
    // `<mono-status-dot>` is a real shadow-DOM element in both bundles
    const r = (el.shadowRoot ?? el).querySelector('[mono-status-dot]') as HTMLElement
    expect(r.getAttribute('mono-status')).toBe('busy')
    expect(r.hasAttribute('mono-pulse')).toBe(true)
    expect(r.querySelector('[mono-dot]')).not.toBeNull()
    el.remove()

    // `online` is the default state and emits no attribute
    const dflt = await mount('mono-status-dot', { label: 'On' })
    expect(
      (dflt.shadowRoot ?? dflt).querySelector('[mono-status-dot]')?.hasAttribute('mono-status'),
    ).toBe(false)
    dflt.remove()
  })

  // `selected` and `modelValue` mirror each other, and on the FIRST update both
  // are in the change set (the constructor assigns both defaults) — so the sync
  // used to let `modelValue`'s default win and a plain `<mono-chip selected>`
  // deselected itself before it ever painted.
  it('a bare `selected` attribute survives the modelValue sync', async () => {
    document.body.innerHTML = '<mono-chip selected clickable>x</mono-chip>'
    await tick()
    const el = document.querySelector('mono-chip') as any
    expect(el.selected).toBe(true)
    expect(el.modelValue, 'it mirrors into modelValue').toBe(true)
    expect(root(el).hasAttribute('mono-selected')).toBe(true)
    document.body.innerHTML = ''
  })

  it('…and so does a bare `model-value`, mirroring the other way', async () => {
    document.body.innerHTML = '<mono-chip model-value clickable>x</mono-chip>'
    await tick()
    const el = document.querySelector('mono-chip') as any
    expect(el.modelValue).toBe(true)
    expect(el.selected).toBe(true)
    expect(root(el).hasAttribute('mono-selected')).toBe(true)
    document.body.innerHTML = ''
  })

  it('a property set after the first update still syncs both ways', async () => {
    const el = await mount('mono-chip', { label: 'L' })
    el.selected = true
    await tick()
    expect(el.modelValue).toBe(true)
    expect(root(el).hasAttribute('mono-selected')).toBe(true)
    el.modelValue = false
    await tick()
    expect(el.selected).toBe(false)
    expect(root(el).hasAttribute('mono-selected')).toBe(false)
    el.remove()
  })

  it("a tag-input's own chips carry mono-chip but NOT the mono-main box", async () => {
    await import('../dist/ui/tag-input.js')
    const el = await mount('mono-tag-input', {
      options: [{ text: 'Vue', value: 'vue' }],
      modelValue: ['vue'],
    })
    await tick(120)
    const chip = el.querySelector('[mono-chip]') as HTMLElement
    expect(chip, 'the field rendered a chip').not.toBeNull()
    // It is Basecoat's COMBOBOX chip: painted by tag-input.css on its own parts,
    // so chip.css (which paints [mono-main]) never reaches it.
    expect(chip.querySelector('[mono-main]')).toBeNull()
    expect(chip.querySelector('[mono-chip-main]')).not.toBeNull()
    el.remove()
  })
})
