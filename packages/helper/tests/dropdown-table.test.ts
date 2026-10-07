/**
 * `mono-dropdown-table` — the selection limits (`max` / `min`) and display caps
 * (`max-visible` / `min-visible`).
 *
 * The limits live in the wrapped grid's CHECK STORE, because that is the one
 * place every selection goes through: `dd.toggleRow` (a row click, the keyboard),
 * a `<mono-table-checkbox>` bound to `dd.table` (which never sees the dropdown
 * controller), and the select-all drain. These pin that: a pick past the cap is
 * REJECTED — nothing disabled, the store simply does not change — and a native
 * checkbox that flipped itself is put back.
 *
 * Drives the BUILT artifacts (`dist/ui/dropdown-table.js` + `dist/ui/table.js`),
 * so it exercises exactly what a consumer installs.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

let monoDataDropdown: any

beforeAll(async () => {
  const mod = await import('../dist/ui/dropdown-table.js')
  await import('../dist/ui/table.js')
  monoDataDropdown = mod.monoDataDropdown
})

beforeEach(() => {
  document.body.innerHTML = ''
})

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms))

const PEOPLE = [
  { Id: 1, Name: 'Ada' },
  { Id: 2, Name: 'Alan' },
  { Id: 3, Name: 'Grace' },
  { Id: 4, Name: 'Katherine' },
  { Id: 5, Name: 'Edsger' },
  { Id: 6, Name: 'Barbara' },
]

function build(opts: Record<string, unknown> = {}) {
  const dd = monoDataDropdown(PEOPLE, { keyExpr: 'Id', displayExpr: 'Name', multiple: true, pageSize: 10, ...opts })
  dd.table.load()
  return dd
}

async function mount(dd: any, props: Record<string, unknown> = {}): Promise<any> {
  const el = document.createElement('mono-dropdown-table') as any
  el.dataDropdown = dd
  el.multiple = true
  for (const [key, value] of Object.entries(props)) el[key] = value
  document.body.appendChild(el)
  await tick()
  return el
}

const chips = (el: any): string[] =>
  [...el.querySelectorAll('.mono-dropdown-table-chip .chip-label')].map((c: any) => (c.textContent ?? '').trim())
const closeButtons = (el: any) => el.querySelectorAll('.mono-dropdown-table-chip .chip-close').length

/** A row checkbox bound to the grid, the way the panel's checkbox column is. */
async function rowCheckbox(dd: any, row: any): Promise<HTMLInputElement> {
  const cb = document.createElement('mono-table-checkbox') as any
  cb.dataGrid = dd.table
  cb.item = row
  document.body.appendChild(cb)
  await tick()
  return cb.querySelector('input[type="checkbox"]') as HTMLInputElement
}

describe('max via the controller', () => {
  it('rejects a toggleRow past the cap and leaves the store untouched', async () => {
    const dd = build({ max: 2 })
    dd.toggleRow(1)
    dd.toggleRow(2)
    dd.toggleRow(3)
    expect(dd.value).toEqual([1, 2])
    expect(dd.table.check().atMax).toBe(true)

    // Deselect, and there is room again.
    dd.toggleRow(1)
    dd.toggleRow(3)
    expect(dd.value).toEqual([2, 3])
  })

  it('a native row checkbox un-ticks itself when the store rejects it', async () => {
    const dd = build({ max: 1 })
    dd.toggleRow(1)
    const input = await rowCheckbox(dd, PEOPLE[1])
    expect(input.checked).toBe(false)

    // The browser flips the box BEFORE `change` fires — simulate exactly that.
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await tick()

    expect(dd.value).toEqual([1])
    expect(input.checked).toBe(false)
  })

  it('selectAll fills the room left and stops', async () => {
    const dd = build({ max: 3 })
    dd.toggleRow(5)
    await dd.selectAll()
    expect(dd.value.length).toBe(3)
    expect(dd.value).toContain(5)
  })

  it('setValue is never trimmed — a pushed value is the developer\'s', async () => {
    const dd = build({ max: 1 })
    dd.setValue([1, 2, 3])
    expect(dd.value).toEqual([1, 2, 3])
  })
})

describe('min via the controller', () => {
  it('rejects a removal at the floor, and clear() keeps the first min', async () => {
    const dd = build({ min: 2 })
    dd.setValue([1, 2, 3])
    dd.removeKey(3)
    expect(dd.value).toEqual([1, 2])
    dd.removeKey(2)
    expect(dd.value).toEqual([1, 2])
    expect(dd.table.check().atMin).toBe(true)

    dd.setValue([1, 2, 3, 4])
    dd.clear()
    expect(dd.value).toEqual([1, 2])
  })

  it('a native row checkbox re-ticks itself at the floor', async () => {
    const dd = build({ min: 1 })
    dd.toggleRow(1)
    const input = await rowCheckbox(dd, PEOPLE[0])
    expect(input.checked).toBe(true)

    input.checked = false
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await tick()

    expect(dd.value).toEqual([1])
    expect(input.checked).toBe(true)
  })
})

describe('limits from the element', () => {
  it('element max / min win over the controller options', async () => {
    const dd = build({ max: 5, min: 0 })
    const el = await mount(dd, { max: 2, min: 1, clearable: true })
    dd.toggleRow(1)
    dd.toggleRow(2)
    dd.toggleRow(3)
    expect(dd.value).toEqual([1, 2])
    expect(dd.limits()).toEqual({ max: 2, min: 1 })

    // At min=1 nothing hides yet (two selected); remove one and the floor bites.
    await tick()
    expect(closeButtons(el)).toBe(2)
    dd.removeKey(2)
    await tick()
    expect(closeButtons(el)).toBe(0)
    expect(el.querySelector('.mono-dropdown-table-clear')).toBeNull()

    // Lifting the element's limits hands control back to the options.
    el.max = undefined
    el.min = undefined
    await tick()
    expect(dd.limits()).toEqual({ max: 5, min: 0 })
  })

  it('chip.max / chip.min pin over the attributes', async () => {
    const dd = build()
    await mount(dd, { max: 4, chip: { max: 1, min: 1 } })
    expect(dd.limits()).toEqual({ max: 1, min: 1 })
    dd.toggleRow(1)
    dd.toggleRow(2)
    expect(dd.value).toEqual([1])
  })
})

describe('display caps', () => {
  it('max-visible collapses the rest into "+N more" — inline included', async () => {
    const dd = build()
    dd.setValue([1, 2, 3, 4, 5, 6])
    const flex = await mount(dd, { maxVisible: 2 })
    expect(chips(flex)).toEqual(['Ada', 'Alan', '+4 more'])

    const inline = await mount(dd, { maxVisible: 2, chip: { behaviour: 'inline' } })
    expect(chips(inline)).toEqual(['Ada', 'Alan', '+4 more'])
    const strip = inline.querySelector('.mono-dropdown-table-chip-strip')
    const last = [...inline.querySelectorAll('.mono-dropdown-table-chip')].at(-1) as HTMLElement
    expect(last.parentElement).toBe(strip)

    // Its panel lists the rest — a floating layer of its own, shown by the
    // root's `more-open` class (in a browser it is portaled to <body>; under
    // vitest Lit's `node` build keeps it in place). The panel is always in the
    // DOM — the flex field above has an empty one too — so query THIS field's.
    ;(last.querySelector('[role="button"]') as HTMLElement).click()
    await tick()
    expect(inline.querySelector('.mono-dropdown-table')!.classList.contains('more-open')).toBe(true)
    const panel = inline.querySelector('.mono-dropdown-table-more')
    expect(panel).not.toBeNull()
    expect([...panel!.querySelectorAll('.chip-label')].map((c: any) => c.textContent.trim())).toEqual([
      'Grace', 'Katherine', 'Edsger', 'Barbara',
    ])
  })

  it('defaults to 5 visible; 0 draws all; min-visible is the collapse floor', async () => {
    const dd = build()
    dd.setValue([1, 2, 3, 4, 5, 6])
    expect(chips(await mount(dd)).at(-1)).toBe('+1 more')
    expect(chips(await mount(dd, { maxVisible: 0 })).length).toBe(6)
    expect(chips(await mount(dd, { maxVisible: 2, minVisible: 6 })).length).toBe(6)
    expect(chips(await mount(dd, { maxVisible: 2, minVisible: 5 }))).toEqual(['Ada', 'Alan', '+4 more'])
  })

  it('chip["max-visible"] pins over the attribute', async () => {
    const dd = build()
    dd.setValue([1, 2, 3, 4])
    expect(chips(await mount(dd, { maxVisible: 4, chip: { 'max-visible': 1 } }))).toEqual(['Ada', '+3 more'])
  })
})
