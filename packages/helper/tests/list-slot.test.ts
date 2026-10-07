// @vitest-environment jsdom
//
// `slot="list"` — the consumer renders the option rows.
//
// Three things are load-bearing and easy to regress:
//
//   · mono places the wrapper as ONE block and never touches its children. Relocating them is not
//     survivable: Vue inserts a new row with `insertBefore(node, anchor)` against the sibling at
//     that position, so moving one makes the consumer's NEXT insert throw `NotFoundError`. The
//     "wrapper keeps its children" assertions below are what pin that.
//   · the rows are the control's RESOLVED list — post-search, post-load, groups flattened — which
//     is why it is reported up to `form.items()[key].list` rather than being the array that went in.
//   · a click is paired to its entry BY POSITION, checked against the published length, so the
//     author writes a plain `v-for` and nothing else. `data-mono-item-key` remains as an override.
//
// Drives the BUILT artifact, like the other suites here.
import { describe, it, expect, beforeAll, vi } from 'vitest'

import { controlMonoForm } from '../src/components/form/mono-form-controller'

const DEPTS = [
  { Code: 'MKT', Nama: 'Marketing', Group: 'Commercial' },
  { Code: 'SLS', Nama: 'Sales', Group: 'Commercial' },
  { Code: 'DSC', Nama: 'Demand Supply', Group: 'Operations' },
]

/** Two group levels over the same rows — Divisi › Bagian › departments. */
const NESTED = [
  { Code: 'MKT', Nama: 'Marketing', Divisi: 'Commercial', Bagian: 'Brand' },
  { Code: 'MRS', Nama: 'Market Research', Divisi: 'Commercial', Bagian: 'Brand' },
  { Code: 'SLS', Nama: 'Sales', Divisi: 'Commercial', Bagian: 'Trade' },
  { Code: 'DSC', Nama: 'Demand Supply', Divisi: 'Operations', Bagian: 'Distribusi' },
]

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

/**
 * Render one node per entry, the way the documented `v-for` does — with NO key attribute, which is
 * the whole point: position is the pairing.
 */
function renderRows(wrapper: HTMLElement, entries: any[], opts: { keyed?: boolean } = {}): void {
  wrapper.replaceChildren()
  for (const e of entries) {
    const row = document.createElement('div')
    if (opts.keyed) row.setAttribute('data-mono-item-key', e.key)
    row.textContent = e.type === 'group' ? e.label : (e.item as any).Nama
    wrapper.appendChild(row)
  }
}

describe('<mono-tag-input> slot="list"', () => {
  beforeAll(async () => {
    await import('../dist/ui/tag-input.js')
    // The row content is the consumer's, and in practice that means other mono components inside
    // it — the demo puts a <mono-checkbox> there.
    await import('../dist/ui/checkbox.js')
  })

  function makeForm(props: Record<string, unknown> = {}) {
    return controlMonoForm({
      inputs: {
        Dept: {
          component: 'mono-tag-input',
          value: [],
          props: {
            items: DEPTS,
            keyValue: 'Code',
            displayValue: (d: any) => `${d.Nama} (${d.Code})`,
            ...props,
          },
        },
      },
    })
  }

  /** The element with a consumer wrapper already in place, as a framework would author it. */
  async function mount(form: any, opts: { group?: boolean } = {}) {
    const el = document.createElement('mono-tag-input') as any

    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'list')
    el.appendChild(wrapper)

    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    // BOTH are needed, and the split is deliberate: `group` turns on client-side bucketing,
    // `display-group` supplies one caption accessor per level. Either alone renders flat.
    if (opts.group) {
      el.group = true
      el.displayGroup = ['Group']
    }
    await tick()

    return { el, wrapper }
  }

  it('reports the resolved rows onto form.items()[key].list', async () => {
    const form = makeForm()
    await mount(form)

    const list = form.items().Dept.list
    expect(list).toHaveLength(3)
    expect(list.map((e: any) => e.key)).toEqual(['MKT', 'SLS', 'DSC'])
    expect(list.every((e: any) => e.type === 'row')).toBe(true)
    expect(list[0].item.Nama).toBe('Marketing')
  })

  it('reports group headers interleaved with their leaves, in display order', async () => {
    const form = makeForm()
    await mount(form, { group: true })

    const list = form.items().Dept.list
    // group, its two leaves, group, its leaf — one flat sequence.
    expect(list.map((e: any) => e.type)).toEqual(['group', 'row', 'row', 'group', 'row'])
    expect(list[0].label).toBe('Commercial')
    expect(list[0].items).toHaveLength(2)
  })

  it('places the wrapper in the panel WITHOUT taking its children', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    // Moved into mono's target…
    expect(wrapper.parentElement?.getAttribute('data-mono-slot')).toBe('list')
    // …but every row is still a child of the wrapper. This is the Vue-safety invariant.
    expect(wrapper.children).toHaveLength(3)
  })

  it('does not render its own option rows while the slot is in use', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    expect(
      el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)'),
    ).toHaveLength(0)
  })

  it('still renders its own rows when no slot was given', async () => {
    const form = makeForm()
    const el = document.createElement('mono-tag-input') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    el.open = true
    await tick()

    expect(
      el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)').length,
    ).toBeGreaterThan(0)
  })

  it('selects the clicked row by its POSITION, with no key attribute anywhere', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    expect(wrapper.querySelector('[data-mono-item-key]')).toBeNull()
    ;(wrapper.children[1] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual(['SLS'])
  })

  it('resolves a click on something NESTED inside a row', async () => {
    // The `(?)` icon this feature exists for is a child of the row, not the row.
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    const icon = document.createElement('span')
    wrapper.children[0]!.appendChild(icon)
    el.open = true
    await tick()

    icon.click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual(['MKT'])
  })

  it('selects once through a nested mono-checkbox, with no double toggle', async () => {
    // A consumer's row is a whole subtree, commonly with another mono component in it. The click
    // has to resolve to the ROW, and it has to toggle exactly once — a checkbox that also acted on
    // its own would select and immediately deselect.
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    const box = document.createElement('mono-checkbox') as any
    box.modelValue = false
    wrapper.children[1]!.appendChild(box)
    el.open = true
    await tick()

    box.click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual(['SLS'])
  })

  it('pairs a GROUPED list positionally, headers included', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form, { group: true })

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    // 2 headers + 3 leaves, all the consumer's, none of mono's.
    expect(wrapper.children).toHaveLength(5)
    // Stamped depth drives the indent, so it has to follow the entries exactly.
    expect(Array.from(wrapper.children).map((n) => n.getAttribute('data-mono-level'))).toEqual([
      '0',
      '1',
      '1',
      '0',
      '1',
    ])
    expect(el.querySelectorAll('.mono-tag-input-group')).toHaveLength(0)
    expect(
      el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)'),
    ).toHaveLength(0)

    // Index 2 is the second leaf of the first group.
    ;(wrapper.children[2] as HTMLElement).click()
    await tick()
    expect(form.items().Dept.currentValue).toEqual(['SLS'])

    // A header is not selectable — clicking it changes nothing, as on mono's own headers.
    ;(wrapper.children[3] as HTMLElement).click()
    await tick()
    expect(form.items().Dept.currentValue).toEqual(['SLS'])
  })

  it('reports the depth of every line in a two-level list', async () => {
    // `level` is what a consumer indents by. On a HEADER it is its own depth; on a ROW it is the
    // depth of the group it sits IN, so indenting by it steps the row in from its own header.
    const form = controlMonoForm({
      inputs: {
        Dept: {
          component: 'mono-tag-input',
          value: [],
          props: { items: NESTED, keyValue: 'Code', displayValue: (d: any) => d.Nama },
        },
      },
    })

    const el = document.createElement('mono-tag-input') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    el.group = true
    el.displayGroup = ['Divisi', 'Bagian']
    await tick()

    const list = form.items().Dept.list
    expect(list.map((e: any) => [e.type, e.level])).toEqual([
      ['group', 0], // Commercial
      ['group', 1], //   Brand
      ['row', 2], //     Marketing
      ['row', 2], //     Market Research
      ['group', 1], //   Trade
      ['row', 2], //     Sales
      ['group', 0], // Operations
      ['group', 1], //   Distribusi
      ['row', 2], //     Demand Supply
    ])

    // A header's `items` is every leaf BELOW it, not just its direct children — which is what lets
    // a level-0 header speak for its whole subtree (the demo's group select-all relies on it).
    expect(list[0].items.map((i: any) => i.Code)).toEqual(['MKT', 'MRS', 'SLS'])
    expect(list[1].items.map((i: any) => i.Code)).toEqual(['MKT', 'MRS'])
  })

  it('injects its own checkbox into each row, and keeps it in step', async () => {
    // The slot is for markup; the checkbox is mono's. Same node it renders for its own rows, so it
    // inherits the same CSS — the consumer's template says nothing about it.
    const form = makeForm({ checkable: true })
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    const boxes = wrapper.querySelectorAll('[data-mono-chrome]')
    expect(boxes).toHaveLength(3)
    expect(boxes[0]!.classList.contains('mono-checkbox')).toBe(true)
    expect(boxes[0]!.querySelector('.mono-checkbox-box')).toBeTruthy()
    // First child of the row, where mono's own rows put it.
    expect(wrapper.children[0]!.firstElementChild).toBe(boxes[0])
    expect(boxes[0]!.classList.contains('mono-checkbox-checked')).toBe(false)

    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(
      wrapper.children[0]!.querySelector('[data-mono-chrome]')!.classList.contains(
        'mono-checkbox-checked',
      ),
    ).toBe(true)
  })

  it('injects nothing when the control is not checkable', async () => {
    // `checkable` is the opt-out: it already decides this for mono's own rows.
    const form = makeForm({ checkable: false })
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    expect(wrapper.querySelectorAll('[data-mono-chrome]')).toHaveLength(0)
  })

  it('stamps the state of every line as data-* attributes', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    const first = wrapper.children[0] as HTMLElement
    expect(first.getAttribute('data-mono-type')).toBe('row')
    // The input to mono's indentation ladder — `[data-mono-level]` maps to the same custom
    // property `data-level` does for mono's own rows.
    expect(first.getAttribute('data-mono-level')).toBe('0')
    expect(first.getAttribute('data-mono-key')).toBe('MKT')
    expect(first.hasAttribute('data-mono-selected')).toBe(false)

    first.click()
    await tick()

    expect(first.hasAttribute('data-mono-selected')).toBe(true)
    expect((wrapper.children[1] as HTMLElement).hasAttribute('data-mono-selected')).toBe(false)
    // `data-mono-item-key` stays the consumer's to write — mono must never stamp that name, or a
    // stale stamp would outrank the count check the pairing relies on.
    expect(first.hasAttribute('data-mono-item-key')).toBe(false)
  })

  it('re-decorates rows the consumer re-rendered', async () => {
    // mono decorates from updated(); a framework patches the wrapper on ITS next tick. Without the
    // observer, a row revealed by the search box would stay bare.
    const form = makeForm({ checkable: true })
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    // Stand in for a Vue patch: brand-new nodes, no attributes, no checkbox.
    renderRows(wrapper, form.items().Dept.list)
    expect((wrapper.children[0] as HTMLElement).hasAttribute('data-mono-selected')).toBe(false)
    await tick()

    expect((wrapper.children[0] as HTMLElement).getAttribute('data-mono-type')).toBe('row')
    expect((wrapper.children[0] as HTMLElement).hasAttribute('data-mono-selected')).toBe(true)
    expect(wrapper.querySelectorAll('[data-mono-chrome]')).toHaveLength(3)
  })

  it('selects a whole group from a consumer-rendered header', async () => {
    // The header carries mono's own select-all — the same `_toggleMany` its own header binds — so
    // the consumer writes no handler and no checkbox.
    const form = makeForm({ checkable: true })
    const { el, wrapper } = await mount(form, { group: true })

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    const header = wrapper.children[0] as HTMLElement // Commercial: MKT + SLS
    expect(header.getAttribute('data-mono-type')).toBe('group')
    expect(header.getAttribute('data-mono-state')).toBe('none')
    expect(header.querySelector('[data-mono-chrome]')).toBeTruthy()

    header.click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual(['MKT', 'SLS'])
    expect((wrapper.children[0] as HTMLElement).getAttribute('data-mono-state')).toBe('all')

    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual([])
    expect((wrapper.children[0] as HTMLElement).getAttribute('data-mono-state')).toBe('none')
  })

  it('reports a partly-picked group as indeterminate', async () => {
    const form = makeForm({ checkable: true })
    const { el, wrapper } = await mount(form, { group: true })

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()
    ;(wrapper.children[1] as HTMLElement).click() // MKT alone
    await tick()

    const header = wrapper.children[0] as HTMLElement
    expect(header.getAttribute('data-mono-state')).toBe('some')
    expect(
      header.querySelector('[data-mono-chrome]')!.classList.contains('mono-checkbox-indeterminate'),
    ).toBe(true)
  })

  it('leaves the group header inert when group-select-all is off', async () => {
    const form = makeForm({ checkable: true, groupSelectAll: false })
    const { el, wrapper } = await mount(form, { group: true })

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    expect(wrapper.children[0]!.querySelector('[data-mono-chrome]')).toBeNull()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual([])
  })

  it('lets data-mono-item-key override the position when it is present', async () => {
    // The escape hatch: rows deliberately rendered in the WRONG order, each naming its own item.
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, [...form.items().Dept.list].reverse(), { keyed: true })
    el.open = true
    await tick()

    // Position would say 'MKT' (index 0); the key says 'DSC'.
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual(['DSC'])
  })

  it('refuses the click, loudly, when the row count does not match the list', async () => {
    // Better than guessing: a wrapper that emits two nodes per entry (or hides one behind a v-if)
    // would otherwise select a neighbour of whatever the user aimed at.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list.slice(0, 2))
    el.open = true
    await tick()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('slot="list"'))
    warn.mockRestore()
  })

  it('republishes with `selected` set once a row is picked', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    const list = form.items().Dept.list
    expect(list.find((e: any) => e.key === 'MKT').selected).toBe(true)
    expect(list.find((e: any) => e.key === 'SLS').selected).toBe(false)
  })

  it('narrows the reported list to what the search leaves visible', async () => {
    const form = makeForm({ searchable: true })
    const { el } = await mount(form)

    el.open = true
    el._inputValue = 'sal'
    await tick()

    // The point of reporting the RESOLVED list: the raw `items` array would still say three.
    expect(form.items().Dept.list.map((e: any) => e.key)).toEqual(['SLS'])
  })

  it('keeps the wrapper out of the panel-less host until it can be placed', async () => {
    // An unplaced wrapper must not paint in the host's own flow, under the field.
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    await tick()

    expect(wrapper.parentElement).not.toBe(el)
  })

  it('adopts a wrapper appended AFTER the element connected', async () => {
    // <ClientOnly>, a hydration pass, a v-if flipping — the child arrives late, and the one-shot
    // capture at connect has already run. Without the watcher it sits loose in the host.
    const form = makeForm()
    const el = document.createElement('mono-tag-input') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'list')
    el.appendChild(wrapper)
    await tick()

    expect(wrapper.parentElement).not.toBe(el)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    expect(wrapper.parentElement?.getAttribute('data-mono-slot')).toBe('list')
    expect(
      el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)'),
    ).toHaveLength(0)
  })

  it('keeps the wrapper mounted when a search matches nothing', async () => {
    // Dropping it for that frame would tear out the anchors the consumer's v-for inserts against,
    // and take their NEXT insert with them.
    const form = makeForm({ searchable: true })
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()
    el._inputValue = 'zzzz'
    await tick()

    expect(form.items().Dept.list).toHaveLength(0)
    expect(wrapper.parentElement?.getAttribute('data-mono-slot')).toBe('list')
  })
})

describe('<mono-shadow-tag-input> slot="list"', () => {
  // The shadow build reaches the same contract by a different route: the wrapper is PROJECTED, not
  // moved, so the app's own stylesheet still reaches it. What used to break was upstream of that —
  // presence was measured off the rendered `<slot>`, which only renders once presence is true and
  // only inside an open panel, so the flag could never turn on and nothing projected at all.
  beforeAll(async () => {
    await import('../dist/ui/shadow/tag-input.js')
  })

  it('projects the consumer wrapper into the panel and selects through it', async () => {
    const form = controlMonoForm({
      inputs: {
        Dept: {
          component: 'mono-tag-input',
          value: [],
          props: { items: DEPTS, keyValue: 'Code', displayValue: (d: any) => d.Nama },
        },
      },
    })

    const el = document.createElement('mono-shadow-tag-input') as any
    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'list')
    el.appendChild(wrapper)
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    renderRows(wrapper, form.items().Dept.list)
    el.open = true
    await tick()

    const slot = el.shadowRoot.querySelector('slot[name="list"]') as HTMLSlotElement
    expect(slot).toBeTruthy()
    // Assigned, not relocated: the wrapper is still a light child of the host.
    expect(wrapper.parentElement).toBe(el)
    expect(slot.assignedNodes({ flatten: true })).toContain(wrapper)
    expect(
      el.shadowRoot.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)'),
    ).toHaveLength(0)

    // The click starts in the light DOM and crosses INTO the shadow root's handler on its way up,
    // which is exactly what projection buys — no listener on the consumer's own node.
    ;(wrapper.children[2] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toEqual(['DSC'])
  })
})

describe('<mono-select> slot="list"', () => {
  // The same contract, single-select: a click SETS the value and closes, rather than toggling one
  // of many. Everything else is shared with the tag input.
  beforeAll(async () => {
    await import('../dist/ui/select.js')
  })

  function makeForm(props: Record<string, unknown> = {}) {
    return controlMonoForm({
      inputs: {
        Dept: {
          component: 'mono-select',
          value: '',
          props: {
            items: DEPTS,
            keyValue: 'Code',
            displayValue: (d: any) => `${d.Nama} (${d.Code})`,
            ...props,
          },
        },
      },
    })
  }

  async function mount(form: any, opts: { group?: boolean } = {}) {
    const el = document.createElement('mono-select') as any

    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'list')
    el.appendChild(wrapper)

    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    if (opts.group) {
      el.group = true
      el.displayGroup = ['Group']
    }
    await tick()

    return { el, wrapper }
  }

  it('reports the resolved rows onto form.items()[key].list', async () => {
    const form = makeForm()
    await mount(form)

    const list = form.items().Dept.list
    expect(list).toHaveLength(3)
    expect(list.map((e: any) => e.key)).toEqual(['MKT', 'SLS', 'DSC'])
    expect(list.every((e: any) => e.type === 'row')).toBe(true)
  })

  it('reports group headers with their leaves, in display order', async () => {
    const form = makeForm()
    await mount(form, { group: true })

    const list = form.items().Dept.list
    expect(list.map((e: any) => e.type)).toEqual(['group', 'row', 'row', 'group', 'row'])
    expect(list[0].label).toBe('Commercial')
    // Derived by reading the flat sequence back — a group owns the item rows that follow it.
    expect(list[0].items).toHaveLength(2)
    expect(list[3].items).toHaveLength(1)
  })

  it('places the wrapper in the panel WITHOUT taking its children', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()

    expect(wrapper.parentElement?.getAttribute('data-mono-slot')).toBe('list')
    expect(wrapper.children).toHaveLength(3)
    expect(el.querySelectorAll('.mono-select-item')).toHaveLength(0)
  })

  it('gives grouped rows the depth of the group they sit in, like the tag input', async () => {
    // Select's own group rows carry no level — they never needed one to render — so `_listEntries`
    // reads it back off the sequence. Before that, every grouped row reported 0 and a consumer
    // indenting by `e.level` got a flat wall here and correct steps from the tag input.
    const form = makeForm()
    await mount(form, { group: true })

    const list = form.items().Dept.list
    expect(list.filter((e: any) => e.type === 'row').every((e: any) => e.level === 1)).toBe(true)
    expect(list.filter((e: any) => e.type === 'group').every((e: any) => e.level === 0)).toBe(true)
  })

  it('reports the depth of every line in a two-level list', async () => {
    const form = controlMonoForm({
      inputs: {
        Dept: {
          component: 'mono-select',
          value: '',
          props: { items: NESTED, keyValue: 'Code', displayValue: (d: any) => d.Nama },
        },
      },
    })

    const el = document.createElement('mono-select') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    el.group = true
    el.displayGroup = ['Divisi', 'Bagian']
    await tick()

    const list = form.items().Dept.list
    expect(list.map((e: any) => [e.type, e.level])).toEqual([
      ['group', 0],
      ['group', 1],
      ['row', 2],
      ['row', 2],
      ['group', 1],
      ['row', 2],
      ['group', 0],
      ['group', 1],
      ['row', 2],
    ])

    // Derived here rather than carried, and it must match tag-input: every leaf below the header.
    expect(list[0].items.map((i: any) => i.Code)).toEqual(['MKT', 'MRS', 'SLS'])
    expect(list[1].items.map((i: any) => i.Code)).toEqual(['MKT', 'MRS'])
  })

  it('pairs a GROUPED list positionally, headers included', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form, { group: true })

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()

    expect(wrapper.children).toHaveLength(5)
    expect(Array.from(wrapper.children).map((n) => n.getAttribute('data-mono-level'))).toEqual([
      '0',
      '1',
      '1',
      '0',
      '1',
    ])
    expect(el.querySelectorAll('.mono-select-group')).toHaveLength(0)
    ;(wrapper.children[4] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toBe('DSC')
  })

  it('still renders its own rows when no slot was given', async () => {
    const form = makeForm()
    const el = document.createElement('mono-select') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    el.open()
    await tick()

    expect(el.querySelectorAll('.mono-select-item').length).toBeGreaterThan(0)
  })

  it('sets the value through a positional click and closes', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()

    expect(wrapper.querySelector('[data-mono-item-key]')).toBeNull()
    ;(wrapper.children[1] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toBe('SLS')
    expect(el.isOpen).toBe(false)
  })

  it('resolves a click on something NESTED inside a row', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    const icon = document.createElement('span')
    wrapper.children[0]!.appendChild(icon)
    el.open()
    await tick()

    icon.click()
    await tick()

    expect(form.items().Dept.currentValue).toBe('MKT')
  })

  it('stamps state but injects nothing — a select has no checkbox to own', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()

    const first = wrapper.children[0] as HTMLElement
    expect(first.getAttribute('data-mono-type')).toBe('row')
    expect(first.getAttribute('data-mono-key')).toBe('MKT')
    expect(wrapper.querySelectorAll('[data-mono-chrome]')).toHaveLength(0)

    first.click()
    await tick()

    expect((wrapper.children[0] as HTMLElement).hasAttribute('data-mono-selected')).toBe(true)
  })

  it('lets data-mono-item-key override the position when it is present', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, [...form.items().Dept.list].reverse(), { keyed: true })
    el.open()
    await tick()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toBe('DSC')
  })

  it('refuses the click, loudly, when the row count does not match the list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list.slice(0, 2))
    el.open()
    await tick()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toBe('')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('slot="list"'))
    warn.mockRestore()
  })

  it('republishes with `selected` set once a row is picked', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()
    ;(wrapper.children[0] as HTMLElement).click()
    await tick()

    const list = form.items().Dept.list
    expect(list.find((e: any) => e.key === 'MKT').selected).toBe(true)
    expect(list.find((e: any) => e.key === 'SLS').selected).toBe(false)
  })

  it('adopts a wrapper appended AFTER the element connected', async () => {
    const form = makeForm()
    const el = document.createElement('mono-select') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'list')
    el.appendChild(wrapper)
    await tick()

    // Parked, not left painting in the host's own flow under the field.
    expect(wrapper.parentElement).not.toBe(el)

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()

    expect(wrapper.parentElement?.getAttribute('data-mono-slot')).toBe('list')
    expect(el.querySelectorAll('.mono-select-item')).toHaveLength(0)
  })
})

describe('<mono-shadow-select> slot="list"', () => {
  beforeAll(async () => {
    await import('../dist/ui/shadow/select.js')
  })

  it('projects the consumer wrapper into the panel and selects through it', async () => {
    const form = controlMonoForm({
      inputs: {
        Dept: {
          component: 'mono-select',
          value: '',
          props: { items: DEPTS, keyValue: 'Code', displayValue: (d: any) => d.Nama },
        },
      },
    })

    const el = document.createElement('mono-shadow-select') as any
    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'list')
    el.appendChild(wrapper)
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    renderRows(wrapper, form.items().Dept.list)
    el.open()
    await tick()

    const slot = el.shadowRoot.querySelector('slot[name="list"]') as HTMLSlotElement
    expect(slot).toBeTruthy()
    // Assigned, not relocated: the wrapper is still a light child, so the page's CSS reaches it.
    expect(wrapper.parentElement).toBe(el)
    expect(slot.assignedNodes({ flatten: true })).toContain(wrapper)
    expect(el.shadowRoot.querySelectorAll('.mono-select-item')).toHaveLength(0)

    ;(wrapper.children[2] as HTMLElement).click()
    await tick()

    expect(form.items().Dept.currentValue).toBe('DSC')
  })
})
