// @vitest-environment jsdom
//
// checkbox / radio / switch: `sublabel` is the secondary line under the label.
// `description` is its other name — kept because existing code uses it — as a
// property, an HTML attribute and a slot name. Both names share one value.
//
// Drives the BUILT artifacts, light and shadow, like the other attribute tests.
import { describe, it, expect, beforeAll } from 'vitest'

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

const COMPONENTS = ['checkbox', 'radio', 'switch'] as const

beforeAll(async () => {
  for (const c of COMPONENTS) {
    await import(`../dist/ui/${c}.js`)
    await import(`../dist/ui/shadow/${c}.js`)
  }
})

async function mount(markup: string) {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.appendChild(host)
  await tick()
  return host
}

for (const c of COMPONENTS) {
  describe(`<mono-${c}> sublabel`, () => {
    const secondary = (el: Element) => el.querySelector('[mono-description]')

    it('renders the sublabel prop', async () => {
      const host = await mount(`<mono-${c} label="L"></mono-${c}>`)
      const el = host.firstElementChild as any
      el.sublabel = 'Sub'
      await tick()
      expect(secondary(el)?.textContent?.trim()).toBe('Sub')
      host.remove()
    })

    it('description is the same value, as a property both ways', async () => {
      const host = await mount(`<mono-${c} label="L"></mono-${c}>`)
      const el = host.firstElementChild as any
      el.description = 'Old name'
      await tick()
      expect(el.sublabel).toBe('Old name')
      expect(secondary(el)?.textContent?.trim()).toBe('Old name')
      el.sublabel = 'New name'
      expect(el.description).toBe('New name')
      host.remove()
    })

    it('maps the description ATTRIBUTE', async () => {
      const host = await mount(`<mono-${c} label="L" description="From attr"></mono-${c}>`)
      const el = host.firstElementChild as any
      expect(el.sublabel).toBe('From attr')
      expect(secondary(el)?.textContent?.trim()).toBe('From attr')
      host.remove()
    })

    it('slot="sublabel" and the old slot="description" both fill the line', async () => {
      for (const name of ['sublabel', 'description']) {
        const host = await mount(`<mono-${c} label="L" sublabel="prop"><b slot="${name}">Slotted</b></mono-${c}>`)
        const el = host.firstElementChild as any
        await tick()
        expect(secondary(el)?.textContent?.trim(), name).toBe('Slotted')
        host.remove()
      }
    })
  })

  describe(`<mono-shadow-${c}> sublabel`, () => {
    const root = (el: any) => el.shadowRoot as ShadowRoot

    it('nests slot="description" inside slot="sublabel" with the prop as fallback', async () => {
      const host = await mount(`<mono-shadow-${c} label="L" description="Old"></mono-shadow-${c}>`)
      const el = host.firstElementChild as any
      await tick()
      const outer = root(el).querySelector('slot[name="sublabel"]')!
      const inner = outer.querySelector(':scope > slot[name="description"]')!
      expect(inner.textContent?.trim()).toBe('Old')
      expect(root(el).querySelector('[mono-description]')?.hasAttribute('mono-empty')).toBe(false)
      host.remove()
    })

    it('an assigned sublabel or description slot counts as content', async () => {
      for (const name of ['sublabel', 'description']) {
        const host = await mount(`<mono-shadow-${c} label="L"><b slot="${name}">S</b></mono-shadow-${c}>`)
        const el = host.firstElementChild as any
        await tick()
        expect(el._hasDescriptionSlotState, name).toBe(true)
        expect(root(el).querySelector('[mono-description]')?.hasAttribute('mono-empty'), name).toBe(false)
        host.remove()
      }
    })

    it('no slot and no text: the line is hidden', async () => {
      const host = await mount(`<mono-shadow-${c} label="L"></mono-shadow-${c}>`)
      const el = host.firstElementChild as any
      await tick()
      expect(el._hasDescriptionSlotState).toBe(false)
      expect(root(el).querySelector('[mono-description]')?.hasAttribute('mono-empty')).toBe(true)
      host.remove()
    })
  })
}
