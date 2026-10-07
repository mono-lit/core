/**
 * `mono-tag-input` — value/label resolution and the select-all rows.
 *
 * These pin three bugs that shipped together and looked like three different
 * problems on screen (`[object Object]` chips, `undefined (undefined)` chips, and a
 * chip reading a bare `1`). All three were one question asked in three places:
 * **what value does an option actually store, and how is that value labelled back?**
 *
 * The tests drive the BUILT artifact (`dist/ui/tag-input.js`) rather than the source,
 * so they exercise exactly what a consumer installs.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(async () => {
  await import('../dist/ui/tag-input.js')
})

beforeEach(() => {
  document.body.innerHTML = ''
})

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms))

async function mount(props: Record<string, unknown>): Promise<any> {
  const el = document.createElement('mono-tag-input') as any
  document.body.appendChild(el)
  for (const [key, value] of Object.entries(props)) el[key] = value
  await tick()
  return el
}

const chips = (el: any): string[] =>
  [...el.querySelectorAll('.mono-tag-input-chip')].map((c: any) => (c.textContent ?? '').trim())

const options = (el: any): string[] =>
  [...el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)')]
    .map((c: any) => (c.textContent ?? '').trim())

/** The panel only renders while open. */
const open = async (el: any) => {
  el._open = true
  await tick()
}

const clickSelectAll = (el: any) =>
  (el.querySelector('.mono-tag-input-select-all') as HTMLElement | null)?.click()

const groupHeaders = (el: any): HTMLElement[] =>
  [...el.querySelectorAll('.mono-tag-input-group.is-toggle')] as HTMLElement[]

/** A devextreme DataSource with `group:` set loads rows in this shape. */
const DEPT_NODES = [
  {
    key: 'EJI',
    items: [
      { _DeptKey: '1|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'EJI' },
      { _DeptKey: '1|SLS', Nama: 'Sales', Code: 'SLS', CompanyName: 'EJI' },
    ],
  },
  {
    key: 'IEG',
    items: [{ _DeptKey: '2|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'IEG' }],
  },
]

const deptDisplay = (item: any) =>
  item ? `${item.CompanyName ? `${item.CompanyName} / ` : ''}${item.Nama} (${item.Code})` : ''

describe('value resolution', () => {
  it('a plain string list round-trips through the value', async () => {
    // `_normalizeItems` wraps each primitive as `{ value }` and re-wraps on every
    // read, so storing the wrapper meant a selection could never match back.
    const el = await mount({ items: ['BUDGETING', 'PROJECT', 'PPL'], checkable: true })
    await open(el)
    clickSelectAll(el)
    await tick()

    expect(el.value).toEqual(['BUDGETING', 'PROJECT', 'PPL'])
    expect(chips(el)).toEqual(['BUDGETING', 'PROJECT', 'PPL'])
  })

  it('a { label, value } list stores the value and shows the label', async () => {
    const el = await mount({
      items: [{ label: 'Vue', value: 'vue' }, { label: 'Lit', value: 'lit' }],
      checkable: true,
    })
    await open(el)
    clickSelectAll(el)
    await tick()

    expect(el.value).toEqual(['vue', 'lit'])
    expect(chips(el)).toEqual(['Vue', 'Lit'])
  })
})

describe('pre-grouped data', () => {
  it('is treated as grouped even without display-group', async () => {
    // The group NODES used to fall through as ordinary options: `keyValue` is absent
    // on a header, so it resolved to `undefined` and selecting one stored `undefined`.
    const el = await mount({
      items: DEPT_NODES,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })
    await open(el)

    expect(groupHeaders(el).length).toBe(2)
    expect(options(el).length).toBe(3)
  })

  it('select-all takes every leaf and never stores undefined', async () => {
    const el = await mount({
      items: DEPT_NODES,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })
    await open(el)
    clickSelectAll(el)
    await tick()

    expect(el.value).toEqual(['1|MKT', '1|SLS', '2|MKT'])
    expect(chips(el).join('|')).not.toContain('undefined')
  })

  it('a group header selects only its own subtree', async () => {
    const el = await mount({
      items: DEPT_NODES,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })
    await open(el)
    groupHeaders(el)[1]?.click()
    await tick()

    expect(el.value).toEqual(['2|MKT'])
  })

  it('a selected value resolves to its full label', async () => {
    const el = await mount({
      items: DEPT_NODES,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      value: ['1|SLS'],
    })
    expect(chips(el)).toEqual(['EJI / Sales (SLS)'])
  })
})

describe('layout hooks', () => {
  // jsdom does no layout, so these pin the STRUCTURE the CSS keys on — the pixel
  // placement itself still needs a real browser.

  it('stamps a grouped option with its depth so it can indent under its header', async () => {
    const el = await mount({
      items: DEPT_NODES,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
    })
    await open(el)

    const levels = [...el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)')]
      .map((n: any) => n.getAttribute('data-level'))
    expect(levels).toEqual(['1', '1', '1'])
  })

  it('leaves a flat list at depth 0', async () => {
    const el = await mount({ items: ['a', 'b'] })
    await open(el)

    const levels = [...el.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)')]
      .map((n: any) => n.getAttribute('data-level'))
    expect(levels).toEqual(['0', '0'])
  })

  it('marks the field has-clear only while the clear button renders', async () => {
    const field = (el: any) => el.querySelector('.mono-tag-input-field')

    const empty = await mount({ items: ['a'], clearable: true })
    expect(field(empty).classList.contains('has-clear')).toBe(false)

    const filled = await mount({ items: ['a'], clearable: true, value: ['a'] })
    expect(field(filled).classList.contains('has-clear')).toBe(true)
    expect(filled.querySelector('.mono-tag-input-clear')).not.toBeNull()

    const readonly = await mount({ items: ['a'], clearable: true, value: ['a'], readonly: true })
    expect(field(readonly).classList.contains('has-clear')).toBe(false)
  })
})

describe('chip.behaviour', () => {
  const field = (el: any) => el.querySelector('.mono-tag-input-field')
  const strip = (el: any) => el.querySelector('.mono-tag-input-chip-strip')
  const ITEMS = ['a', 'b', 'c', 'd', 'e']

  it('defaults to flex: chips are bare children of the field, with no strip', async () => {
    const el = await mount({ items: ITEMS, value: ['a', 'b'] })

    expect(strip(el)).toBeNull()
    expect(field(el).classList.contains('is-inline')).toBe(false)
    // The historical markup: each chip is a direct child of the field, so it
    // wraps with the input. This is the regression guard on `flex` mode.
    const parents = [...el.querySelectorAll('.mono-tag-input-chip')].map((c: any) => c.parentElement)
    expect(parents.every((p: any) => p === field(el))).toBe(true)
  })

  it('inline nests every chip in one strip', async () => {
    const el = await mount({ items: ITEMS, value: ['a', 'b'], chip: { behaviour: 'inline' } })

    expect(strip(el)).not.toBeNull()
    expect(field(el).classList.contains('is-inline')).toBe(true)
    expect(chips(el)).toEqual(['a', 'b'])
    const parents = [...el.querySelectorAll('.mono-tag-input-chip')].map((c: any) => c.parentElement)
    expect(parents.every((p: any) => p === strip(el))).toBe(true)
  })

  it('inline honours max-visible: "+N more" sits in the strip and opens the panel', async () => {
    // The display cap applies in both layouts. In the strip the counter chip is
    // the last child, and clicking it lists the rest in the same more-panel
    // flex uses — so a capped inline field reads exactly like a capped flex one.
    const el = await mount({
      items: ITEMS,
      value: ITEMS,
      maxVisible: 2,
      chip: { behaviour: 'inline' },
    })

    expect(chips(el)).toEqual(['a', 'b', '+3 more'])
    const more = [...el.querySelectorAll('.mono-tag-input-chip')].at(-1) as HTMLElement
    expect(more.parentElement).toBe(strip(el))
    // The panel is always in the DOM (it is a portaled floating layer, so it
    // cannot be conditionally rendered) but empty and hidden until opened.
    const root = el.querySelector('.mono-tag-input') as HTMLElement
    expect(root.classList.contains('more-open')).toBe(false)
    expect(el.querySelector('.mono-tag-input-more-panel .chip-label')).toBeNull()

    ;(more.querySelector('[role="button"]') as HTMLElement).click()
    await tick()
    // Open: shown by the root's `more-open` class. In a browser the popup
    // controller relocates the panel into a <body> portal that mirrors that
    // class; under vitest Lit resolves its `node` build (`isServer` is true) so
    // the panel stays in place — hence the document-wide query.
    expect(root.classList.contains('more-open')).toBe(true)
    const panel = document.querySelector('.mono-tag-input-more-panel')
    expect(panel).not.toBeNull()
    expect([...panel!.querySelectorAll('.chip-label')].map((c: any) => c.textContent.trim())).toEqual(['c', 'd', 'e'])
  })

  it('still honours max-visible in the default flex mode', async () => {
    const el = await mount({ items: ITEMS, value: ITEMS, maxVisible: 2 })

    // Two tags plus the "+3 more" counter chip.
    expect(chips(el)).toEqual(['a', 'b', '+3 more'])
  })

  it('min-visible is the collapse floor', async () => {
    // At or under the floor every chip draws, however small max-visible is;
    // one past it, max-visible applies as usual.
    const atFloor = await mount({ items: ITEMS, value: ITEMS, maxVisible: 2, minVisible: 5 })
    expect(chips(atFloor)).toEqual(ITEMS)

    const past = await mount({ items: ITEMS, value: ITEMS, maxVisible: 2, minVisible: 4 })
    expect(chips(past)).toEqual(['a', 'b', '+3 more'])
  })

  it('chip.maxVisible / chip["max-visible"] pin over the attribute', async () => {
    const camel = await mount({ items: ITEMS, value: ITEMS, maxVisible: 4, chip: { maxVisible: 1 } })
    expect(chips(camel)).toEqual(['a', '+4 more'])

    const kebab = await mount({ items: ITEMS, value: ITEMS, maxVisible: 4, chip: { 'max-visible': 3 } })
    expect(chips(kebab)).toEqual(['a', 'b', 'c', '+2 more'])
  })

  it('a JSON chip attribute reaches behaviour, and "[object Object]" is ignored', async () => {
    const el = await mount({ items: ITEMS, value: ['a'] })

    el.setAttribute('chip', '{"behaviour":"inline"}')
    await tick()
    expect(strip(el)).not.toBeNull()

    // Vue's String() mirror of a plain `:chip="{…}"` binding — it must not wipe
    // the property that a `.prop` binding sets moments later.
    el.setAttribute('chip', '[object Object]')
    await tick()
    expect(el.chip).toEqual({ behaviour: 'inline' })
    expect(strip(el)).not.toBeNull()
  })
})

describe('clear / caret', () => {
  // ONE glyph: the clear button stands in for the caret whenever there is a
  // value to clear — open or closed. The value wins over the open state: the
  // caret is the one mouse gesture that closes a searchable list (the field body
  // only opens), and it was once kept beside ✕ for that reason; a field with a
  // value now closes by picking, Escape or an outside click.
  const clear = (el: any) => el.querySelector('.mono-tag-input-clear')
  const caret = (el: any) => el.querySelector('.mono-tag-input-arrow')

  it('shows the caret and no clear while empty', async () => {
    const el = await mount({ items: ['a'], clearable: true })
    expect(clear(el)).toBeNull()
    expect(caret(el)).not.toBeNull()
    expect(caret(el).getAttribute('role')).toBe('button')
  })

  it('swaps the caret for the clear button once there is a value', async () => {
    const el = await mount({ items: ['a'], clearable: true, value: ['a'] })
    expect(clear(el)).not.toBeNull()
    expect(caret(el)).toBeNull()
  })

  it('keeps the caret away while open with a value — the value wins', async () => {
    const el = await mount({ items: ['a'], clearable: true, value: ['a'] })
    await open(el)
    expect(clear(el)).not.toBeNull()
    expect(caret(el)).toBeNull()

    // Clear it and the caret is back, open or not.
    el.modelValue = []
    await tick()
    expect(clear(el)).toBeNull()
    expect(caret(el)).not.toBeNull()
  })

  it('inline drops the caret too — ✕ takes its place, no parked slot', async () => {
    // The strip re-lays at the swap anyway (it rides on the value changing), so
    // nothing is held open for it: no blank gap after ✕.
    const el = await mount({ items: ['a'], clearable: true, value: ['a'], chip: { behaviour: 'inline' } })
    expect(clear(el)).not.toBeNull()
    expect(caret(el)).toBeNull()

    el.modelValue = []
    await tick()
    expect(clear(el)).toBeNull()
    expect(caret(el)).not.toBeNull()
  })

  it('keeps the caret alone when clearable is off', async () => {
    const notClearable = await mount({ items: ['a'], value: ['a'], clearable: false })
    expect(clear(notClearable)).toBeNull()
    expect(caret(notClearable)).not.toBeNull()
  })

  it('shows neither glyph while disabled or readonly, but keeps the gutter', async () => {
    // The field refuses every gesture, so a caret would promise an open it never
    // delivers. The actions row still renders: `has-actions` keeps the trailing
    // gutter, so the chips do not shift when the state toggles.
    for (const state of [{ disabled: true }, { readonly: true }]) {
      const el = await mount({ items: ['a'], value: ['a'], clearable: true, ...state })
      expect(clear(el)).toBeNull()
      expect(caret(el)).toBeNull()
      expect(el.querySelector('.mono-tag-input-actions')).not.toBeNull()
      expect(el.querySelector('.mono-tag-input-field').classList.contains('has-actions')).toBe(true)

      // Same with nothing to clear — the caret does not come back for an empty field.
      const empty = await mount({ items: ['a'], clearable: true, ...state })
      expect(clear(empty)).toBeNull()
      expect(caret(empty)).toBeNull()
    }
  })

  it('always reserves the gutter, whichever glyph is showing', async () => {
    const field = (el: any) => el.querySelector('.mono-tag-input-field')

    const empty = await mount({ items: ['a'], clearable: true })
    const filled = await mount({ items: ['a'], clearable: true, value: ['a'] })

    expect(field(empty).classList.contains('has-actions')).toBe(true)
    expect(field(filled).classList.contains('has-actions')).toBe(true)
  })
})

describe('inline scroll buttons', () => {
  // jsdom reports every geometry read as 0, so the controller correctly sees "no
  // overflow" and draws nothing. Stub the three numbers it measures to drive the
  // states a real browser would produce.
  // Both buttons render together or not at all — one appearing on its own would
  // resize the actions row and shove the strip sideways mid-click. So "is the
  // button showing" is the `is-idle` marker (which CSS turns into
  // `visibility: hidden`), not whether the element exists. jsdom loads no
  // stylesheet, so the class is the only thing that can be asserted here anyway.
  const shown = (el: any, which: 'prev' | 'next') => {
    const node = el.querySelector(`.mono-tag-input-scroll-${which}`)
    return !!node && !node.classList.contains('is-idle')
  }
  const prev = (el: any) => (shown(el, 'prev') ? el.querySelector('.mono-tag-input-scroll-prev') : null)
  const next = (el: any) => (shown(el, 'next') ? el.querySelector('.mono-tag-input-scroll-next') : null)

  const stub = (el: any, scrollLeft: number, scrollWidth = 500, clientWidth = 200) => {
    const strip = el.querySelector('.mono-tag-input-chip-strip') as HTMLElement
    Object.defineProperty(strip, 'scrollWidth', { value: scrollWidth, configurable: true })
    Object.defineProperty(strip, 'clientWidth', { value: clientWidth, configurable: true })
    let left = scrollLeft
    Object.defineProperty(strip, 'scrollLeft', {
      get: () => left,
      set: (v: number) => {
        left = v
      },
      configurable: true,
    })
    return strip
  }

  const mountInline = (extra: Record<string, unknown> = {}) =>
    mount({
      items: ['a', 'b', 'c', 'd', 'e'],
      value: ['a', 'b', 'c', 'd', 'e'],
      chip: { behaviour: 'inline' },
      ...extra,
    })

  it('keeps the buttons, and paging, while disabled or readonly', async () => {
    // ✕ and ⌄ go with the state (see "clear / caret"), but the strip must stay
    // readable: both scroll buttons render and still move it. CSS re-enables
    // pointer events on them under the field's `pointer-events: none`; here only
    // the markup and the handler can be asserted.
    for (const state of [{ disabled: true }, { readonly: true }]) {
      const el = await mountInline({ clearable: true, ...state })
      const strip = stub(el, 150)
      el._chipStrip.sync()
      await tick()

      expect(el.querySelector('.mono-tag-input-clear')).toBeNull()
      expect(el.querySelector('.mono-tag-input-arrow')).toBeNull()
      expect(prev(el)).not.toBeNull()
      expect(next(el)).not.toBeNull()

      next(el).click()
      expect(strip.scrollLeft).toBe(300)
      prev(el).click()
      expect(strip.scrollLeft).toBe(100)
    }
  })

  it('draws neither button while the chips fit', async () => {
    const el = await mountInline()
    stub(el, 0, 200, 200)
    el._chipStrip.sync()
    await tick()

    expect(prev(el)).toBeNull()
    expect(next(el)).toBeNull()
  })

  it('draws only the forward button at the start of an overflowing strip', async () => {
    const el = await mountInline()
    stub(el, 0)
    el._chipStrip.sync()
    await tick()

    expect(prev(el)).toBeNull()
    expect(next(el)).not.toBeNull()
  })

  it('draws both once scrolled off the start, and drops forward at the end', async () => {
    const el = await mountInline()

    stub(el, 150)
    el._chipStrip.sync()
    await tick()
    expect(prev(el)).not.toBeNull()
    expect(next(el)).not.toBeNull()

    stub(el, 300)
    el._chipStrip.sync()
    await tick()
    expect(prev(el)).not.toBeNull()
    expect(next(el)).toBeNull()
  })

  it('never draws the buttons in flex mode, however the chips measure', async () => {
    const el = await mount({ items: ['a', 'b'], value: ['a', 'b'] })
    await tick()
    expect(prev(el)).toBeNull()
    expect(next(el)).toBeNull()
  })

  it('page() clamps to the scrollable range', async () => {
    const el = await mountInline()
    const strip = stub(el, 0)

    // No chip has a measurable offset in jsdom, so paging falls back to a plain
    // viewport-width step — the guarantee under test is the clamp, not the
    // chip-boundary alignment (which needs real layout).
    el._chipStrip.page(1)
    expect(strip.scrollLeft).toBe(200)

    el._chipStrip.page(1)
    el._chipStrip.page(1)
    expect(strip.scrollLeft).toBe(300) // scrollWidth - clientWidth

    el._chipStrip.page(-1)
    el._chipStrip.page(-1)
    expect(strip.scrollLeft).toBe(0)
  })
})

describe('selection limits: max / min', () => {
  // Neither limit disables anything. Past `max` a pick is rejected — the list
  // stays as it is and the pick does not land; at `min` a removal is rejected,
  // the chips lose their ✕ and the clear button hides.
  const option = (el: any, label: string) =>
    [...el.querySelectorAll('.mono-tag-input-item')].find((n: any) => n.textContent.trim() === label) as HTMLElement
  const closeButtons = (el: any) => el.querySelectorAll('.mono-tag-input-chip .chip-close').length
  const input = (el: any) => el.querySelector('.mono-tag-input-native') as HTMLInputElement

  it('rejects a pick past max without disabling the list or the input', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], value: ['a', 'b'], checkable: true, max: 2 })
    await open(el)

    expect(input(el).disabled).toBe(false)
    expect(option(el, 'c').hasAttribute('disabled')).toBe(false)

    option(el, 'c').click()
    await tick()
    expect(el.value).toEqual(['a', 'b'])

    // Deselecting is still allowed, and then there is room again.
    option(el, 'a').click()
    await tick()
    option(el, 'c').click()
    await tick()
    expect(el.value).toEqual(['b', 'c'])
  })

  it('drops a typed tag past max and resets the query', async () => {
    const el = await mount({ items: ['a', 'b'], value: ['a', 'b'], max: 2 })
    el.addTag('zzz')
    await tick()
    expect(el.value).toEqual(['a', 'b'])
  })

  it('min: chips lose their ✕, a deselect is rejected, the clear button hides', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], value: ['a', 'b', 'c'], checkable: true, clearable: true, min: 2 })
    expect(closeButtons(el)).toBe(3)
    expect(el.querySelector('.mono-tag-input-clear')).toBeNull()

    el.removeTag('c')
    await tick()
    expect(el.value).toEqual(['a', 'b'])
    expect(closeButtons(el)).toBe(0)

    await open(el)
    option(el, 'a').click()
    await tick()
    expect(el.value).toEqual(['a', 'b'])

    el.removeTag('a')
    await tick()
    expect(el.value).toEqual(['a', 'b'])
  })

  it('clearTags() keeps the first min values', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], value: ['a', 'b', 'c'], min: 1 })
    el.clearTags()
    await tick()
    expect(el.value).toEqual(['a'])
  })

  it('a pushed model-value is never trimmed to max', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], value: ['a', 'b', 'c'], max: 1 })
    expect(el.value).toEqual(['a', 'b', 'c'])
  })

  it('chip.max / chip.min pin over the attributes', async () => {
    const el = await mount({
      items: ['a', 'b', 'c', 'd'],
      value: ['a', 'b'],
      checkable: true,
      max: 4,
      min: 0,
      chip: { max: 2, min: 2 },
    })
    await open(el)
    option(el, 'c').click()
    await tick()
    expect(el.value).toEqual(['a', 'b'])
    expect(closeButtons(el)).toBe(0)
  })

  it('max-tags is gone: the attribute does nothing', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], value: ['a', 'b'], checkable: true })
    el.setAttribute('max-tags', '2')
    await open(el)
    option(el, 'c').click()
    await tick()
    expect(el.value).toEqual(['a', 'b', 'c'])
  })
})

describe('unresolved values', () => {
  it('renders no chip while a keyed value has no row behind it', async () => {
    // `keyValue` means "values are keys into the items", so an unmatched key has no
    // label worth reading — a chip saying `1` is noise, not information.
    const el = await mount({ items: [], keyValue: 'Id', displayValue: 'CompanyName', value: [1] })
    expect(chips(el)).toEqual([])
  })

  it('shows the chip as soon as the list can label it', async () => {
    const el = await mount({ items: [], keyValue: 'Id', displayValue: 'CompanyName', value: [1] })
    expect(chips(el)).toEqual([])

    el.items = [{ Id: 1, CompanyName: 'EJI' }]
    await tick()

    expect(chips(el)).toEqual(['EJI'])
  })

  it('keeps the value while it is unlabelled', async () => {
    const el = await mount({ items: [], keyValue: 'Id', displayValue: 'CompanyName', value: [7] })
    expect(el.value).toEqual([7])
  })

  it('without keyValue the value IS the label, so nothing is hidden', async () => {
    // `allow-custom` tags depend on this: a typed tag is never in `items`.
    const el = await mount({ items: [], value: ['free text'] })
    expect(chips(el)).toEqual(['free text'])
  })
})

describe('select-all', () => {
  it('is on by default and clears when everything is already selected', async () => {
    const el = await mount({ items: ['a', 'b'], checkable: true })
    await open(el)

    clickSelectAll(el)
    await tick()
    expect(el.value).toEqual(['a', 'b'])

    clickSelectAll(el)
    await tick()
    expect(el.value).toEqual([])
  })

  it('is scoped to what the search leaves visible', async () => {
    const el = await mount({ items: ['alpha', 'beta', 'alpine'], checkable: true })
    await open(el)
    el._inputValue = 'alp'
    await tick()

    clickSelectAll(el)
    await tick()
    expect(el.value).toEqual(['alpha', 'alpine'])
  })

  it('honours max rather than overshooting it', async () => {
    const el = await mount({ items: ['a', 'b', 'c', 'd'], checkable: true, max: 2 })
    await open(el)
    clickSelectAll(el)
    await tick()

    expect(el.value.length).toBe(2)
  })

  it('unticking "All" stops at min', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], value: ['a', 'b', 'c'], checkable: true, min: 2 })
    await open(el)
    clickSelectAll(el)
    await tick()

    // The FIRST `min` values survive, in selection order.
    expect(el.value).toEqual(['a', 'b'])
  })

  it('skips disabled options', async () => {
    const el = await mount({
      items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }],
      checkable: true,
    })
    await open(el)
    clickSelectAll(el)
    await tick()

    expect(el.value).toEqual(['a'])
  })

  it('emits ONE mno-change carrying the whole next array', async () => {
    const el = await mount({ items: ['a', 'b', 'c'], checkable: true })
    await open(el)

    const seen: unknown[] = []
    el.addEventListener('mno-change', (e: any) => seen.push(e.detail.modelValue))

    clickSelectAll(el)
    await tick()

    expect(seen).toEqual([['a', 'b', 'c']])
  })

  it('can be switched off', async () => {
    const el = await mount({ items: ['a', 'b'], checkable: true, selectAll: false })
    await open(el)

    expect(el.querySelector('.mono-tag-input-select-all')).toBeNull()
  })

  it('renames via selectAllLabel', async () => {
    const el = await mount({ items: ['a'], checkable: true, selectAllLabel: 'Pilih Semua' })
    await open(el)

    expect((el.querySelector('.mono-tag-input-select-all') as HTMLElement).textContent).toContain('Pilih Semua')
  })

  it('group headers stay plain labels when group-select-all is off', async () => {
    const el = await mount({
      items: DEPT_NODES,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      groupSelectAll: false,
    })
    await open(el)

    expect(groupHeaders(el).length).toBe(0)
    expect(el.querySelectorAll('.mono-tag-input-group').length).toBe(2)
  })
})

/**
 * A server search must filter the LIST, never the CHIPS.
 *
 * The chips are gated by `_isUnresolvedKey`, which asks whether a value still has
 * a row behind it. That guard exists for a real case — a key whose row has not
 * loaded should not be drawn as a bare `1|MKT` — but with a bound DataSource a
 * search REPLACES the loaded rows with just the matches, so an already-selected
 * row falls out of the list and its chip was silently dropped with it.
 *
 * Reported against a Departemen picker: tick `MKT`, type `MPE`, and the `MKT`
 * chip disappeared. Needs `key-value` (the guard is inert without it) and a
 * DataSource (a plain `items` array is never replaced), which is why the
 * array-based tests above could not catch it.
 */
describe('search does not filter the chips', () => {
  /** The slice of devextreme's DataSource surface the controller actually calls. */
  const fakeSource = (rows: unknown[]) => {
    const handlers: Record<string, Array<() => void>> = {}
    let current = rows
    return {
      on: (evt: string, fn: () => void) => void (handlers[evt] ??= []).push(fn),
      off: (evt: string, fn: () => void) => {
        handlers[evt] = (handlers[evt] ?? []).filter((h) => h !== fn)
      },
      items: () => current,
      load: () => Promise.resolve(current),
      isLoading: () => false,
      isLastPage: () => true,
      filter: () => null,
      paginate: () => {},
      pageIndex: () => {},
      /** What a server search does: swap the rows, then announce it. */
      serverSearch(next: unknown[]) {
        current = next
        for (const fn of handlers.changed ?? []) fn()
      },
    }
  }

  const FLAT_DEPTS = [
    { _DeptKey: '1|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'EJI' },
    { _DeptKey: '1|MPE', Nama: 'Maintenance', Code: 'MPE', CompanyName: 'EJI' },
    { _DeptKey: '1|SLS', Nama: 'Sales', Code: 'SLS', CompanyName: 'EJI' },
  ]

  it('keeps a selected chip when the search result no longer contains its row', async () => {
    const ds = fakeSource(FLAT_DEPTS)
    const el = await mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })

    el._toggleValue('1|MKT')
    await tick()
    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])

    // Type "MPE": the server answers with only the MPE row.
    ds.serverSearch([FLAT_DEPTS[1]])
    await tick()

    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])
    expect(el.value).toEqual(['1|MKT'])
  })

  it('restores nothing extra once the search is cleared', async () => {
    const ds = fakeSource(FLAT_DEPTS)
    const el = await mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })

    el._toggleValue('1|MKT')
    await tick()

    ds.serverSearch([FLAT_DEPTS[1]])
    await tick()
    ds.serverSearch(FLAT_DEPTS)
    await tick()

    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])
  })

  it('a value deselected while filtered out does not come back', async () => {
    const ds = fakeSource(FLAT_DEPTS)
    const el = await mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })

    el._toggleValue('1|MKT')
    await tick()

    ds.serverSearch([FLAT_DEPTS[1]])
    await tick()
    el._toggleValue('1|MKT') // remove it while its row is filtered out
    await tick()

    expect(chips(el)).toEqual([])
    expect(el.value).toEqual([])
  })

  it('still hides a key that has never had a row', async () => {
    // The original guard must survive: an unknown key is not drawn as `9|XXX`.
    const ds = fakeSource(FLAT_DEPTS)
    const el = await mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      modelValue: ['9|XXX'],
    })
    await tick()

    expect(chips(el)).toEqual([])
  })
})

/**
 * The reporting shape exactly: a PRE-GROUPED source (`{ key, items }` nodes, as
 * `createGroupedTagSource` builds), `checkable`, a function `displayValue`, and a
 * server search that returns a narrowed TREE rather than a flat list.
 */
describe('grouped source: search does not filter the chips', () => {
  const groupedSource = (nodes: unknown[]) => {
    const handlers: Record<string, Array<() => void>> = {}
    let current = nodes
    return {
      on: (evt: string, fn: () => void) => void (handlers[evt] ??= []).push(fn),
      off: (evt: string, fn: () => void) => {
        handlers[evt] = (handlers[evt] ?? []).filter((h) => h !== fn)
      },
      items: () => current,
      load: () => Promise.resolve(current),
      isLoading: () => false,
      isLastPage: () => true,
      filter: () => null,
      paginate: () => {},
      pageIndex: () => {},
      serverSearch(next: unknown[]) {
        current = next
        for (const fn of handlers.changed ?? []) fn()
      },
    }
  }

  const NODES = [
    {
      key: 'EJI',
      items: [
        { _DeptKey: '1|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'EJI' },
        { _DeptKey: '1|MPE', Nama: 'Maintenance', Code: 'MPE', CompanyName: 'EJI' },
      ],
    },
    {
      key: 'IEG',
      items: [{ _DeptKey: '2|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'IEG' }],
    },
  ]
  const ONLY_MPE = [{ key: 'EJI', items: [NODES[0].items[1]] }]

  it('keeps a grouped chip when the search narrows the tree', async () => {
    const ds = groupedSource(NODES)
    const el = await mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      displayGroup: ['CompanyName'],
      checkable: true,
    })

    el._toggleValue('1|MKT')
    await tick()
    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])

    ds.serverSearch(ONLY_MPE)
    await tick()

    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])
  })

  it('keeps a chip that was seeded from model-value, not clicked', async () => {
    // The reporting page seeds DeptCodes from the JWT, so these chips are never
    // "selected" through the UI — they arrive as a value and must still survive.
    const ds = groupedSource(NODES)
    const el = await mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      displayGroup: ['CompanyName'],
      checkable: true,
      modelValue: ['1|MKT'],
    })
    await tick()
    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])

    ds.serverSearch(ONLY_MPE)
    await tick()

    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])
  })
})

/**
 * The cache must survive prop churn.
 *
 * `dataSource` has no `hasChanged` (unlike `items`, which uses `arrayHasChanged`),
 * so any new-but-equivalent source object counts as a change. A form controller
 * re-pushing props, or a store rebuilding its DataSource, would previously empty
 * the cache and bring the bug straight back.
 */
describe('chips survive a source swap', () => {
  const src = (rows: unknown[]) => {
    const h: Record<string, Array<() => void>> = {}
    let cur = rows
    return {
      on: (e: string, f: () => void) => void (h[e] ??= []).push(f),
      off: () => {},
      items: () => cur,
      load: () => Promise.resolve(cur),
      isLoading: () => false,
      isLastPage: () => true,
      filter: () => null,
      paginate: () => {},
      pageIndex: () => {},
      shrink(n: unknown[]) { cur = n; for (const f of h.changed ?? []) f() },
    }
  }
  const ROWS = [
    { _DeptKey: '1|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'EJI' },
    { _DeptKey: '1|MPE', Nama: 'Maintenance', Code: 'MPE', CompanyName: 'EJI' },
  ]

  it('a re-pushed, equivalent dataSource does not lose the chip', async () => {
    const el = await mount({
      dataSource: src(ROWS),
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      checkable: true,
    })

    el._toggleValue('1|MKT')
    await tick()
    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])

    // A brand-new source object that does NOT contain the selected row — the
    // worst case, and the one that isolates the cache: if the swap emptied it,
    // nothing can resolve the chip and it disappears. (A swap that still holds
    // the row proves nothing, because the row is simply re-cached on resolve.)
    el.dataSource = src([ROWS[1]])
    await tick()
    expect(chips(el)).toEqual(['EJI / Marketing (MKT)'])
  })
})

/**
 * The typed query and the filter applied to the source are two separate tracks,
 * and with a bound DataSource only the second one filters anything —
 * `_searchMatches` short-circuits to `true` because the rows arrive pre-filtered.
 * So clearing the box without unapplying the query leaves the list filtered by
 * something invisible, and reopening still shows it.
 *
 * These assert on what the SOURCE was told, not on what the box shows, because
 * the box was never the broken half.
 */
describe('clearing the box unapplies the search', () => {
  /** Records what `MonoSourceSearch.apply` writes through (data-search.ts:394-408). */
  const recordingSource = (rows: unknown[]) => {
    const h: Record<string, Array<() => void>> = {}
    const calls: Array<{ fn: string; arg: unknown }> = []
    let currentFilter: unknown = null
    return {
      calls,
      on: (e: string, f: () => void) => void (h[e] ??= []).push(f),
      off: () => {},
      items: () => rows,
      load: () => { calls.push({ fn: 'load', arg: undefined }); return Promise.resolve(rows) },
      isLoading: () => false,
      isLastPage: () => true,
      filter: (f?: unknown) => {
        if (f === undefined) return currentFilter
        currentFilter = f
        calls.push({ fn: 'filter', arg: f })
        return f
      },
      searchValue: (v?: unknown) => void calls.push({ fn: 'searchValue', arg: v }),
      searchExpr: () => {},
      searchOperation: () => {},
      paginate: () => {},
      pageIndex: () => {},
    }
  }
  const ROWS = [
    { _DeptKey: '1|MKT', Nama: 'Marketing', Code: 'MKT', CompanyName: 'EJI' },
    { _DeptKey: '1|MPE', Nama: 'Maintenance', Code: 'MPE', CompanyName: 'EJI' },
  ]
  /** What the source was last told the query is. */
  const lastSearch = (ds: any) =>
    [...ds.calls].reverse().find((c: any) => c.fn === 'searchValue')?.arg

  const mountSearchable = async (ds: any, extra: Record<string, unknown> = {}) =>
    mount({
      dataSource: ds,
      keyValue: '_DeptKey',
      displayValue: deptDisplay,
      searchable: true,
      searchDebounce: 0,
      ...extra,
    })

  const type = async (el: any, text: string) => {
    el._inputValue = text
    el._scheduleSearch()
    await tick()
  }

  it('the clear button unapplies the query, not just the text', async () => {
    const ds = recordingSource(ROWS)
    const el = await mountSearchable(ds)

    await type(el, 'MPE')
    expect(lastSearch(ds)).toBe('MPE')

    el._clear(new Event('click'))
    await tick()

    expect(el._inputValue).toBe('')
    expect(lastSearch(ds)).toBeNull() // ← was 'MPE': the reported bug
  })

  it('closing the panel unapplies it, so reopening is not still filtered', async () => {
    const ds = recordingSource(ROWS)
    const el = await mountSearchable(ds)

    await type(el, 'MPE')
    expect(lastSearch(ds)).toBe('MPE')

    el.close()
    await tick()

    expect(lastSearch(ds)).toBeNull()
  })

  it('checkable ticking KEEPS the query — that contract is deliberate', async () => {
    const ds = recordingSource(ROWS)
    const el = await mountSearchable(ds, { checkable: true })

    await type(el, 'MPE')
    el._toggleValue('1|MPE')
    await tick()

    expect(el._inputValue).toBe('MPE')
    expect(lastSearch(ds)).toBe('MPE')
  })

  // NOTE: there is deliberately NO test for "a pending debounce re-applies a stale
  // query". The timer reads `this._inputValue` at FIRE time rather than capturing
  // it when scheduled, so a late timer applies whatever the box currently holds —
  // after a reset, `''`. The race exists in the code but is not observable from
  // outside, so such a test would pass with or without the fix. `_resetSearch`
  // cancels the timer regardless, which is the actual guarantee.

  it('teardown unwinds the clause it wrote, without another load', async () => {
    const ds = recordingSource(ROWS)
    // A dotted PATH is what forces the non-foldable branch: `isFoldableSearch`
    // rejects paths, so the clause is AND-ed into `source.filter()` — the
    // consumer's own slot — instead of folded into `searchValue`. A bare `'*'`
    // expands to plain column names first and folds, so it never gets here.
    const el = await mountSearchable(ds, { searchValue: ['Company.Name'] })
    const baseline = ds.filter()

    await type(el, 'MPE')
    const loadsBefore = ds.calls.filter((c: any) => c.fn === 'load').length

    el.remove()
    await tick()

    expect(ds.filter()).toEqual(baseline)
    expect(ds.calls.filter((c: any) => c.fn === 'load').length).toBe(loadsBefore)
  })

  it('a filter the consumer sets on the source AFTER mount survives a search', async () => {
    const ds = recordingSource(ROWS)
    const el = await mountSearchable(ds, { searchValue: ['Company.Name'] })

    // The consumer's watcher scopes the same DataSource the element is bound to.
    const scope = ['Dept', '=', 'MKT']
    ds.filter(scope)

    await type(el, 'MPE')

    // The non-foldable clause is AND-ed onto the scope, not written over it — and
    // the scope is the reference the consumer set, not a snapshot from mount.
    const written = ds.filter() as unknown[]
    expect(Array.isArray(written)).toBe(true)
    expect(written[0]).toBe(scope) // ← was `null and search`: the mount-time snapshot

    el._clear(new Event('click'))
    await tick()
    expect(ds.filter()).toBe(scope) // clearing restores the scope, not null
  })
})
