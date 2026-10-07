// @vitest-environment jsdom
//
// `<mono-table-th required>` — the marker that tells a user a column wants input.
//
// Two things are worth locking down. The MARKER: off by default, and a red `*` when the flag is
// set — the same one the form controls draw for their own `required`. And its PLACEMENT: it must
// sit inside the caption group, beside the label, because the header otherwise lays out as three
// independent boxes (funnel / caption / sort arrow) and a marker among them drifts away from its
// text the moment a narrow header wraps.
//
// The third assertion is the invariant the wrapper could have broken: `[data-mono-slot="label"]`
// has to stay the element the light build re-appends the consumer's captured nodes into after every
// render. Rendering the `*` INTO it instead of around it would have put Lit's own child part in
// that same range.
//
// Drives the BUILT artifact, like `button-loading.test.ts` and `tag-input.test.ts`.
import { describe, it, expect, beforeAll } from 'vitest'
import { monoDataGrid } from '../src/components/table/mono-data-grid'

describe('<mono-table-th> required', () => {
  beforeAll(async () => {
    await import('../dist/ui/table.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(attrs: Record<string, string> = {}, label = 'Nilai'): Promise<any> {
    const th = document.createElement('th')
    const el = document.createElement('mono-table-th') as any
    el.setAttribute('field', 'Nilai')
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    el.appendChild(document.createTextNode(label))
    th.appendChild(el)
    document.body.appendChild(th)
    await tick()
    return el
  }

  const marker = (el: any) => el.querySelector('.mono-th-required') as HTMLElement | null
  const labelEl = (el: any) => el.querySelector('[data-mono-slot="label"]') as HTMLElement | null

  it('draws nothing by default', async () => {
    const el = await mount()
    expect(marker(el)).toBeNull()
    expect(el.querySelector('.mono-th-caption')).toBeNull()
  })

  it('draws a * for a bare attribute', async () => {
    const el = await mount({ required: '' })

    const m = marker(el)!
    expect(m).not.toBeNull()
    expect(m.tagName).toBe('SUP')
    expect(m.textContent).toBe('*')
  })

  it('reads "true" the same way', async () => {
    const el = await mount({ required: 'true' })
    expect(marker(el)).not.toBeNull()
  })

  it('stays off for "false"', async () => {
    const el = await mount({ required: 'false' })
    expect(marker(el)).toBeNull()
  })

  it('takes the flag as a property too', async () => {
    const el = await mount()
    el.required = true
    await tick()
    expect(marker(el)).not.toBeNull()
  })

  it('puts the marker in the caption group, immediately after the label', async () => {
    const el = await mount({ required: '' })

    const group = el.querySelector('.mono-th-caption') as HTMLElement
    expect(group).not.toBeNull()

    const kids = Array.from(group.children)
    expect(kids.indexOf(labelEl(el)!)).toBe(0)
    expect(kids.indexOf(marker(el)!)).toBe(1)
  })

  it('keeps the marker with the caption when the column also sorts and filters', async () => {
    // The case the wrapper exists for: with a funnel and a sort arrow in play, the marker must
    // still be inside the caption group rather than a fourth sibling among them.
    const el = await mount({ required: '', 'header-filter': '' })
    el.sort = { order: 'asc' }
    await tick()

    const group = el.querySelector('.mono-th-caption') as HTMLElement
    expect(group).not.toBeNull()
    expect(group.contains(marker(el)!)).toBe(true)
    expect(group.contains(labelEl(el)!)).toBe(true)
    // The funnel is a header-level control, NOT part of the caption group.
    expect(group.querySelector('.mono-th-filter-ind')).toBeNull()
    expect(el.querySelector('.mono-th-filter-ind')).not.toBeNull()
  })

  it('leaves the slot placeholder intact, and the consumer text inside it', async () => {
    const el = await mount({ required: '' })

    const target = labelEl(el)
    expect(target).not.toBeNull()
    expect(target!.textContent).toContain('Nilai')
    // Exactly one — the light build looks the placeholder up by this selector.
    expect(el.querySelectorAll('[data-mono-slot="label"]').length).toBe(1)
    // The `*` is a SIBLING of the placeholder, never inside it.
    expect(target!.querySelector('.mono-th-required')).toBeNull()
    expect(target!.textContent).not.toContain('*')
  })

  it('adds and removes the group as the flag flips', async () => {
    const el = await mount()
    el.required = true
    await tick()
    expect(el.querySelector('.mono-th-caption')).not.toBeNull()

    el.required = false
    await tick()
    expect(el.querySelector('.mono-th-caption')).toBeNull()
    expect(labelEl(el)?.textContent).toContain('Nilai')
  })

  it('sort: true is sortable with defaults, {} still works, false is not sortable', async () => {
    const mk = async (sort: unknown) => {
      const el = document.createElement('mono-table-th') as any
      el.field = 'X'
      el.caption = 'X'
      el.sort = sort
      el.dataGrid = monoDataGrid([{ Id: 1, X: 'a' }], { keyExpr: 'Id' })
      document.body.appendChild(el)
      await el.updateComplete
      const arrow = !!el.querySelector('.mono-table-sort-btn')
      const attr = el.getAttribute('sort')
      el.remove()
      return { arrow, attr }
    }
    expect((await mk(true)).arrow).toBe(true)
    expect((await mk({})).arrow).toBe(true)
    expect((await mk({ order: 'asc' })).arrow).toBe(true)
    expect((await mk(false)).arrow).toBe(false)
    // reflect: an object still writes a bare attribute, never [object Object]
    expect((await mk({ order: 'asc' })).attr).toBe('')
  })
})
