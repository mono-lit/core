// @vitest-environment jsdom
//
// `<mono-alert>` / `<mono-shadow-alert>` render Basecoat's `.alert` as
// ATTRIBUTES: the root carries `mono-alert` plus one `mono-<prop>` per prop off
// its default, and the parts `mono-icon` / `mono-title` / `mono-subtitle` /
// `mono-body` / `mono-clear`. The body (`slot="body"` or unslotted children)
// replaces icon + title + subtitle; the ✕ only hides the alert.
//
// Drives the BUILT artifacts, like the other attribute tests.
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

beforeAll(async () => {
  await import('../dist/ui/alert.js')
  await import('../dist/ui/shadow/alert.js')
})

async function mount(markup: string) {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.appendChild(host)
  await tick()
  return { host, el: host.firstElementChild as any }
}

describe('<mono-alert>', () => {
  const root = (el: any) => el.querySelector('[mono-alert]') as HTMLElement
  const text = (el: any, sel: string) => root(el).querySelector(sel)?.textContent?.trim()

  it('a default alert emits the root attribute, role and the title guard only', async () => {
    const { host, el } = await mount('<mono-alert title="T" subtitle="S"></mono-alert>')
    const r = root(el)
    for (const a of ['mono-size', 'mono-variant', 'mono-color', 'mono-clearable']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.getAttribute('role')).toBe('alert')
    expect(r.getAttribute('title')).toBe('')
    expect(text(el, ':scope > [mono-title]')).toBe('T')
    expect(text(el, ':scope > [mono-subtitle]')).toBe('S')
    expect(r.querySelector(':scope > [mono-icon]')).toBeNull()
    host.remove()
  })

  it('props off their default mirror onto the root', async () => {
    const { host, el } = await mount(
      '<mono-alert title="T" size="lg" variant="tonal" color="danger" clearable></mono-alert>',
    )
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.getAttribute('mono-variant')).toBe('tonal')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.hasAttribute('mono-clearable')).toBe(true)
    host.remove()
  })

  it('icon: an iconify class is a masked span, anything else is text', async () => {
    const a = await mount('<mono-alert title="T" icon="i-mdi-information-outline"></mono-alert>')
    expect(root(a.el).querySelector(':scope > [mono-icon] > .i-mdi-information-outline[mono-glyph]')).not.toBeNull()
    a.host.remove()
    const b = await mount('<mono-alert title="T" icon="⚠"></mono-alert>')
    expect(text(b.el, ':scope > [mono-icon]')).toBe('⚠')
    b.host.remove()
  })

  it('slots beat props, one part each', async () => {
    const { host, el } = await mount(
      '<mono-alert title="prop" subtitle="prop" icon="x">' +
        '<b slot="title">T slot</b><i slot="subtitle">S slot</i><svg slot="icon"></svg>' +
        '</mono-alert>',
    )
    expect(text(el, ':scope > [mono-title]')).toBe('T slot')
    expect(text(el, ':scope > [mono-subtitle]')).toBe('S slot')
    expect(root(el).querySelector(':scope > [mono-icon] svg')).not.toBeNull()
    expect(root(el).querySelector(':scope > [mono-body]')?.hasAttribute('mono-empty')).toBe(true)
    host.remove()
  })

  it('slot="body" and plain children replace icon + title + subtitle; the ✕ stays', async () => {
    for (const markup of [
      '<mono-alert title="T" subtitle="S" icon="x" clearable><div slot="body">Whole body</div></mono-alert>',
      '<mono-alert title="T" subtitle="S" icon="x" clearable>Whole body</mono-alert>',
    ]) {
      const { host, el } = await mount(markup)
      const r = root(el)
      expect(r.querySelector(':scope > [mono-title]')).toBeNull()
      expect(r.querySelector(':scope > [mono-subtitle]')).toBeNull()
      expect(r.querySelector(':scope > [mono-icon]')).toBeNull()
      const body = r.querySelector(':scope > [mono-body]')!
      expect(body.hasAttribute('mono-empty')).toBe(false)
      expect(body.textContent?.trim()).toBe('Whole body')
      expect(r.querySelector(':scope > [mono-clear]')).not.toBeNull()
      host.remove()
    }
  })

  it('the ✕ hides the alert and does not count as a click on it', async () => {
    const { host, el } = await mount('<mono-alert title="T" clearable></mono-alert>')
    let clicks = 0
    el.addEventListener('click', () => clicks++)
    ;(root(el).querySelector('[mono-clear]') as HTMLButtonElement).click()
    expect(el.hidden).toBe(true)
    expect(el.hasAttribute('hidden')).toBe(true)
    expect(clicks).toBe(0)
    // a click on the alert itself is just the native click
    root(el).click()
    expect(clicks).toBe(1)
    host.remove()
  })

  it('closeable is the same as clearable (property and attribute)', async () => {
    const a = await mount('<mono-alert title="T" closeable></mono-alert>')
    expect(a.el.clearable).toBe(true)
    expect(root(a.el).querySelector('[mono-clear]')).not.toBeNull()
    a.host.remove()
    const b = await mount('<mono-alert title="T"></mono-alert>')
    b.el.closeable = true
    await tick()
    expect(root(b.el).querySelector('[mono-clear]')).not.toBeNull()
    b.host.remove()
  })

  it('clear-label names the ✕', async () => {
    const { host, el } = await mount('<mono-alert title="T" clearable clear-label="Dismiss"></mono-alert>')
    expect(root(el).querySelector('[mono-clear]')?.getAttribute('aria-label')).toBe('Dismiss')
    host.remove()
  })
})

describe('nested alerts (an alert inside an alert)', () => {
  it('light: the inner alerts are the outer body, each clears on its own', async () => {
    const { host, el } = await mount(
      '<mono-alert color="danger" size="lg" title="Outer">' +
        '<mono-alert id="a" title="Inner A" clearable></mono-alert>' +
        '<mono-alert id="b" title="Inner B"></mono-alert>' +
        '</mono-alert>',
    )
    const outerRoot = el.querySelector(':scope > [mono-alert]') as HTMLElement
    const body = outerRoot.querySelector(':scope > [mono-body]')!
    // plain children are the body, so the outer title gives way to them
    expect(outerRoot.querySelector(':scope > [mono-title]')).toBeNull()
    const a = body.querySelector('#a') as any
    const b = body.querySelector('#b') as any
    expect(a && b).toBeTruthy()
    // each inner alert rendered its own parts, and none of the outer's attributes
    expect(a.querySelector(':scope > [mono-alert] > [mono-title]')?.textContent?.trim()).toBe('Inner A')
    expect(a.querySelector(':scope > [mono-alert]')!.hasAttribute('mono-color')).toBe(false)
    expect(a.querySelector(':scope > [mono-alert]')!.hasAttribute('mono-size')).toBe(false)
    // clearing the inner one leaves the outer (and the sibling) alone
    ;(a.querySelector('[mono-clear]') as HTMLButtonElement).click()
    expect(a.hidden).toBe(true)
    expect(el.hidden).toBe(false)
    expect(b.hidden).toBe(false)
    host.remove()
  })

  it('shadow: the inner alert is projected into the outer body slot', async () => {
    const { host, el } = await mount(
      '<mono-shadow-alert title="Outer"><mono-shadow-alert id="in" title="Inner" clearable></mono-shadow-alert></mono-shadow-alert>',
    )
    await tick()
    const inner = el.querySelector('#in') as any
    const def = el.shadowRoot.querySelector('[mono-body] slot:not([name])') as HTMLSlotElement
    expect(def.assignedElements()).toContain(inner)
    expect(el._hasBodySlot).toBe(true)
    ;(inner.shadowRoot.querySelector('[mono-clear]') as HTMLButtonElement).click()
    expect(inner.hidden).toBe(true)
    expect(el.hidden).toBe(false)
    host.remove()
  })

  it('every preset the sheet writes is reset on the bare root (no inheritance leak)', () => {
    // A `[mono-size]` / `[mono-color]` rule writes `--_mono-alert-*-preset` on the
    // alert that has the prop, and custom properties inherit — so a nested alert
    // would take the outer one's size/colour unless the ROOT rule resets it.
    // jsdom cannot compute that cascade, so the guard is on the stylesheet.
    const css = readFileSync(resolve(__dirname, '../src/components/alert/alert.css'), 'utf8')
    const written = new Set(css.match(/--_mono-alert-[a-z-]+-preset(?=\s*:)/g) ?? [])
    const rootBlock = css.match(/\n\[mono-alert\] \{([\s\S]*?)\n\}/)![1]
    for (const preset of written) {
      expect(rootBlock, preset).toMatch(new RegExp(`${preset}\\s*:`))
    }
    expect(written.size).toBeGreaterThan(0)
  })
})

describe('<mono-shadow-alert>', () => {
  const root = (el: any) => el.shadowRoot.querySelector('[mono-alert]') as HTMLElement

  it('props are the slot fallbacks; an empty body does not hide them', async () => {
    const { host, el } = await mount('<mono-shadow-alert title="T" subtitle="S"></mono-shadow-alert>')
    await tick()
    const r = root(el)
    expect(el._hasBodySlot).toBe(false)
    expect(r.querySelector('[mono-title]')?.hasAttribute('mono-empty')).toBe(false)
    expect(r.querySelector('[mono-title] > slot[name="title"]')?.textContent).toBe('T')
    // (the body's own `mono-empty` is never set where Lit's `isServer` is true —
    // vitest resolves lit's node build — so it is not asserted here)
    expect(r.getAttribute('title')).toBe('')
    host.remove()
  })

  it('slot="body" or plain children replace the other regions', async () => {
    for (const markup of [
      '<mono-shadow-alert title="T"><div slot="body">B</div></mono-shadow-alert>',
      '<mono-shadow-alert title="T">B</mono-shadow-alert>',
    ]) {
      const { host, el } = await mount(markup)
      await tick()
      const r = root(el)
      expect(el._hasBodySlot).toBe(true)
      expect(r.querySelector('[mono-title]')?.hasAttribute('mono-empty')).toBe(true)
      expect(r.querySelector('[mono-body]')?.hasAttribute('mono-empty')).toBe(false)
      host.remove()
    }
  })

  it('draws a bundled mdi icon as inline svg', async () => {
    const { host, el } = await mount(
      '<mono-shadow-alert title="T" icon="i-mdi-alert-outline"></mono-shadow-alert>',
    )
    await tick()
    expect(root(el).querySelector('[mono-icon] slot[name="icon"] [mono-glyph] > svg')).not.toBeNull()
    host.remove()
  })

  it('the ✕ hides the host', async () => {
    const { host, el } = await mount('<mono-shadow-alert title="T" clearable></mono-shadow-alert>')
    ;(root(el).querySelector('[mono-clear]') as HTMLButtonElement).click()
    expect(el.hidden).toBe(true)
    host.remove()
  })
})
