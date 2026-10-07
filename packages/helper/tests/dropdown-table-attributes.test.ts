// @vitest-environment jsdom
//
// `<mono-dropdown-table>` renders its Basecoat styling ATTRIBUTES: the wrapper
// carries `mono-dropdown-table` plus one `mono-<prop>` per prop that is off its
// default (and the states `mono-open` / `mono-more-open` / `mono-has-value` /
// `mono-side`), and every inner part is named by a FAMILY-UNIQUE `mono-dd-*`
// attribute — the panel holds a whole `<table mono-table>` whose cells may carry
// a consumer's `<mono-chip>`, so the bare `mono-chip` the field components use
// would repaint it. dropdown-table.css keys on these alone — the old classes are
// inert hooks — so a prop that stops emitting its attribute silently unstyles
// the element. A picked row is the TABLE's own `mono-selected` row.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'

type Person = { Id: number; Name: string; Role: string }
const PEOPLE: Person[] = [
  { Id: 1, Name: 'Ada', Role: 'Analyst' },
  { Id: 2, Name: 'Alan', Role: 'Engineer' },
  { Id: 3, Name: 'Grace', Role: 'Admiral' },
]

describe('<mono-dropdown-table> styling attributes', () => {
  let controlMonoDataDropdown: any

  beforeAll(async () => {
    await import('../dist/ui/dropdown-table.js')
    ;({ controlMonoDataDropdown } = await import('../dist/index.js'))
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  async function mount(props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}): Promise<{ el: any; dd: any }> {
    const dd = controlMonoDataDropdown(PEOPLE, { keyExpr: 'Id', displayExpr: 'Name', pageSize: 10, ...opts })
    const el = document.createElement('mono-dropdown-table') as any
    el.innerHTML = `<table mono-table><thead><tr><th>Name</th></tr></thead><tbody>${PEOPLE.map(
      (p) => `<tr data-row-key="${p.Id}"><td>${p.Name}</td></tr>`,
    ).join('')}</tbody></table>`
    document.body.appendChild(el)
    el.dataDropdown = dd
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return { el, dd }
  }

  const root = (el: any) => el.querySelector('[mono-dropdown-table]') as HTMLElement

  it('a default field emits the root attribute (+ the resolved side) and nothing for default-valued props', async () => {
    const { el, dd } = await mount({ label: 'Owner', placeholder: 'Pick', helperText: 'hint' })
    const r = root(el)
    expect(r).not.toBeNull()
    for (const a of ['mono-size', 'mono-color', 'mono-variant', 'mono-validation-state', 'mono-open', 'mono-more-open', 'mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable', 'mono-multiple', 'mono-has-value']) {
      expect(r.hasAttribute(a), a).toBe(false)
    }
    expect(r.getAttribute('mono-side')).toBe('bottom')
    expect(r.querySelector(':scope > [mono-dd-label]')?.textContent?.trim()).toBe('Owner')
    const trigger = r.querySelector(':scope > [mono-dd-control] > [mono-dd-trigger]') as HTMLElement
    expect(trigger.getAttribute('role')).toBe('combobox')
    expect(trigger.querySelector('[mono-dd-value][mono-dd-placeholder]')?.textContent?.trim()).toBe('Pick')
    expect(trigger.querySelector('[mono-dd-actions] > [mono-dd-arrow] > [mono-icon]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-dd-control] > [mono-dd-more]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-dd-panel] > [mono-dd-region="body"]')).not.toBeNull()
    expect(r.querySelector(':scope > [mono-dd-message="helper"]')?.textContent?.trim()).toBe('hint')
    expect(r.classList.contains('mono-dropdown-table')).toBe(true)
    el.remove()
    dd.dispose()
  })

  it('every prop mirrors onto the wrapper by name; the label carries the required mark', async () => {
    const { el, dd } = await mount({
      size: 'sm', color: 'danger', variant: 'filled', validationState: 'warning',
      disabled: true, readonly: true, required: true, clearable: true, label: 'L',
    })
    const r = root(el)
    expect(r.getAttribute('mono-size')).toBe('sm')
    expect(r.getAttribute('mono-color')).toBe('danger')
    expect(r.getAttribute('mono-variant')).toBe('filled')
    expect(r.getAttribute('mono-validation-state')).toBe('warning')
    for (const a of ['mono-disabled', 'mono-readonly', 'mono-required', 'mono-clearable']) {
      expect(r.hasAttribute(a), a).toBe(true)
    }
    expect(r.querySelector('[mono-dd-label] > [mono-dd-required-mark]')?.textContent?.trim()).toBe('*')
    // disabled / readonly render neither glyph, but the actions gutter stays
    expect(r.querySelector('[mono-dd-actions]')).not.toBeNull()
    expect(r.querySelector('[mono-dd-arrow]')).toBeNull()
    expect(r.querySelector('[mono-dd-clear]')).toBeNull()
    el.remove()
    dd.dispose()
  })

  it('a multi selection renders combobox chips (not mono-chip) and sets mono-multiple / mono-has-value', async () => {
    const { el, dd } = await mount({ clearable: true }, { multiple: true })
    dd.setValue([1, 3])
    await tick()
    const r = root(el)
    expect(r.hasAttribute('mono-multiple')).toBe(true)
    expect(r.hasAttribute('mono-has-value')).toBe(true)
    const chips = [...r.querySelectorAll('[mono-dd-value] [mono-dd-chip]')] as HTMLElement[]
    expect(chips.map((c) => c.querySelector('[mono-dd-chip-label]')?.textContent?.trim())).toEqual(['Ada', 'Grace'])
    for (const c of chips) {
      expect(c.hasAttribute('mono-chip'), 'a chip is not a mono-chip').toBe(false)
      expect(c.classList.contains('mono-chip')).toBe(false)
      expect(c.hasAttribute('mono-dd-removable')).toBe(true)
      expect(c.querySelector(':scope > [mono-dd-chip-main] > [mono-dd-chip-content] > [mono-dd-chip-close] > [mono-icon]')).not.toBeNull()
    }
    // a value shows the clear glyph in place of the caret
    expect(r.querySelector('[mono-dd-actions] > [mono-dd-clear] > [mono-icon]')).not.toBeNull()
    expect(r.querySelector('[mono-dd-actions] > [mono-dd-arrow]')).toBeNull()
    el.remove()
    dd.dispose()
  })

  it('opening sets mono-open, a picked row is the table\'s own mono-selected row, the cursor is mono-dd-active', async () => {
    const { el, dd } = await mount({})
    const r = root(el)
    el.open()
    await tick()
    expect(r.hasAttribute('mono-open'), 'mono-open').toBe(true)
    // In a browser the panel moves into a body portal that mirrors the wrapper's
    // mono-* attributes; under vitest lit resolves to its node build and the panel
    // stays in the host, so accept either home.
    const portal = document.querySelector('[data-mono-popup-portal]') as HTMLElement | null
    if (portal) {
      expect(portal.hasAttribute('mono-dropdown-table')).toBe(true)
      expect(portal.hasAttribute('mono-open')).toBe(true)
    }
    const scope = portal ?? r
    const rows = [...scope.querySelectorAll('[mono-dd-region="body"] [mono-table] tbody tr[data-row-key]')] as HTMLElement[]
    expect(rows.length, 'rows found').toBe(3)
    // Under vitest lit is its node build (isServer), so the open-time reflect in
    // updated() is skipped — a row click reflects unconditionally, as in a browser.
    rows[1].querySelector('td')!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
    await tick()
    expect(String(dd.value), 'the click picked row 2').toBe('2')
    expect(rows[1].hasAttribute('mono-selected'), 'mono-selected on row 2: ' + rows[1].outerHTML).toBe(true)
    expect(rows[1].hasAttribute('mono-dd-selected'), 'mono-dd-selected').toBe(true)
    expect(rows[1].getAttribute('aria-selected')).toBe('true')
    expect(rows[0].hasAttribute('mono-selected'), 'row 1 unselected').toBe(false)
    expect(rows[1].hasAttribute('mono-dd-active'), 'the click moved the cursor onto row 2').toBe(true)
    expect(rows.filter((x) => x.hasAttribute('mono-dd-active')).length).toBe(1)
    el.close()
    await tick()
    expect(r.hasAttribute('mono-open'), 'closed').toBe(false)
    el.remove()
    dd.dispose()
  })

  it('validation resolves to the state attribute and the message part; the error message is an alert', async () => {
    const { el, dd } = await mount({ errorMessage: 'Bad' })
    const r = root(el)
    expect(r.getAttribute('mono-validation-state')).toBe('invalid')
    const msg = r.querySelector(':scope > [mono-dd-message="invalid"]') as HTMLElement
    expect(msg?.textContent?.trim()).toBe('Bad')
    expect(msg.getAttribute('role')).toBe('alert')
    el.remove()
    dd.dispose()
  })
})
