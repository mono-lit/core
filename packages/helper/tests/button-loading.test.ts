// @vitest-environment jsdom
//
// `<mono-button>` loading layout.
//
// The rule under test: the spinner is drawn IN THE ICON'S PLACE, wherever the icon sits, and the
// caption always stays readable — whether loading came from the `loading` prop or from the button
// driving itself through `handler` / `debounce` / `throttle`.
//
// It used to be two looks. Self-driven loading kept the caption and appended a spinner AFTER the
// whole content (so a button with an icon showed icon + label + spinner at once), while the
// `loading` prop blanked the caption and centred the spinner instead. There was no unit test on
// this component, which is how both survived.
//
// Drives the BUILT artifact so it exercises what a consumer installs, like `tag-input.test.ts`.
import { describe, it, expect, beforeAll } from 'vitest'

describe('<mono-button> loading', () => {
  beforeAll(async () => {
    await import('../dist/ui/button.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(
    props: Record<string, unknown> = {},
    { icon = true, label = 'Simpan' }: { icon?: boolean; label?: string } = {},
  ): Promise<any> {
    const el = document.createElement('mono-button') as any
    if (icon) {
      const span = document.createElement('span')
      span.setAttribute('slot', 'icon')
      span.className = 'i-mdi-content-save'
      el.appendChild(span)
    }
    if (label) el.appendChild(document.createTextNode(label))
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const iconBox = (el: any) => el.querySelector('[mono-icon]') as HTMLElement | null
  const text = (el: any) => el.querySelector('[mono-text]') as HTMLElement | null

  it('spins in the icon box, not beside it', async () => {
    const el = await mount({ loading: true })

    const boxes = el.querySelectorAll('[mono-icon]')
    expect(boxes.length).toBe(1)
    expect(boxes[0].hasAttribute('mono-spinning')).toBe(true)
  })

  it('keeps the caption readable while loading', async () => {
    const el = await mount({ loading: true })
    expect(text(el)?.textContent).toContain('Simpan')
  })

  it('keeps the slotted icon mounted — it is the slot target', async () => {
    // Unmounting it would take the consumer's Vue-tracked nodes with it; the next patch then dies
    // on a null `__vnode`. It is hidden by CSS, never removed.
    const el = await mount({ loading: true })
    expect(iconBox(el)?.querySelector('.i-mdi-content-save')).not.toBeNull()
  })

  it('follows icon-position to the right', async () => {
    const el = await mount({ loading: true, iconPosition: 'right' })

    const content = el.querySelector('[mono-content]') as HTMLElement
    const kids = Array.from(content.children)
    const box = iconBox(el)!
    const caption = text(el)!

    expect(box.hasAttribute('mono-spinning')).toBe(true)
    expect(kids.indexOf(box)).toBeGreaterThan(kids.indexOf(caption))
  })

  it('puts it on the left by default', async () => {
    const el = await mount({ loading: true })

    const content = el.querySelector('[mono-content]') as HTMLElement
    const kids = Array.from(content.children)
    expect(kids.indexOf(iconBox(el)!)).toBeLessThan(kids.indexOf(text(el)!))
  })

  it('grows a leading spinner on a button with no icon', async () => {
    const el = await mount({ loading: true }, { icon: false })

    const box = iconBox(el)
    expect(box).not.toBeNull()
    expect(box!.hasAttribute('mono-spinning')).toBe(true)
    expect(box!.hasAttribute('mono-empty')).toBe(false)
  })

  it('collapses that box again when it is neither loading nor iconed', async () => {
    const el = await mount({}, { icon: false })

    const box = iconBox(el)
    expect(box!.hasAttribute('mono-empty')).toBe(true)
    expect(box!.hasAttribute('mono-spinning')).toBe(false)
  })

  it('renders the same structure whether loading came from the prop or a handler', async () => {
    const viaProp = await mount({ loading: true })

    const viaHandler = await mount({
      handler: () => new Promise((r) => setTimeout(r, 120)),
    })
    ;(viaHandler.querySelector('button') as HTMLButtonElement).click()
    await tick()

    // The whole point: one look, however it was triggered.
    expect(iconBox(viaHandler)?.hasAttribute('mono-spinning')).toBe(true)
    expect(iconBox(viaProp)?.hasAttribute('mono-spinning')).toBe(true)
    expect(text(viaHandler)?.textContent).toContain('Simpan')

    // ...and it clears when the work finishes.
    await tick(200)
    expect(iconBox(viaHandler)?.hasAttribute('mono-spinning')).toBe(false)
  })

  it('spins an icon-only button too', async () => {
    const el = await mount({ loading: true, iconOnly: true }, { label: '' })
    expect(iconBox(el)?.hasAttribute('mono-spinning')).toBe(true)
  })

  it('is not spinning when idle', async () => {
    const el = await mount({})
    expect(iconBox(el)?.hasAttribute('mono-spinning')).toBe(false)
    expect(el.querySelector('.loading')).toBeNull()
  })
})
