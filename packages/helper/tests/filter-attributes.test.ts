// @vitest-environment jsdom
//
// `<mono-filter-builder>` renders its Basecoat styling ATTRIBUTES on the root
// `<div>` — `mono-filter-builder` plus a `mono-size` that is absent at the
// default (`sm`). Parts are family-unique: `mono-filter-actions` >
// `mono-filter-btn` (+ `mono-variant="ghost"`), `mono-filter-group` >
// `mono-filter-group-head` / `mono-filter-children` > `mono-filter-row` >
// `mono-filter-control` (+ `-field` / `-op` / `-value`) and
// `mono-filter-icon-btn` (+ `mono-danger`), and `mono-filter-add` >
// `mono-filter-link`. filter.css reads these alone.
//
// Drives the BUILT artifact so it exercises what a consumer installs.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'

describe('<mono-filter-builder> styling attributes', () => {
  let controlMonoFilterBuilder: any
  beforeAll(async () => {
    await import('../dist/ui/filter.js')
    ;({ controlMonoFilterBuilder } = await import('../dist/index.js'))
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
  const hosts: any[] = []
  afterEach(() => {
    for (const el of hosts.splice(0)) el.remove()
  })

  const FIELDS = [
    { field: 'Nama', caption: 'Display Name', dataType: 'string' },
    { field: 'Jumlah', caption: 'Payment', dataType: 'number' },
  ]

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-filter-builder') as any
    document.body.appendChild(el)
    el.controlFilterBuilder = controlMonoFilterBuilder({
      fields: FIELDS,
      filter: [['Nama', 'contains', 'Andy'], 'and', [['Jumlah', '>', 100], 'or', ['Jumlah', '=', 1]]],
    })
    for (const [k, v] of Object.entries(props)) el[k] = v
    hosts.push(el)
    await tick()
    return el
  }
  const root = (el: any) => el.querySelector('[mono-filter-builder]') as HTMLElement
  const monoAttrs = (n: Element) => [...n.attributes].map((a) => a.name).filter((a) => a.startsWith('mono-'))

  it('the root carries only the root attribute at the default size', async () => {
    const el = await mount()
    expect(root(el)).toBeTruthy()
    expect(monoAttrs(root(el))).toEqual(['mono-filter-builder'])
  })

  it('a non-default size is mirrored one for one; the default emits nothing', async () => {
    const el = await mount({ size: 'xs' })
    expect(root(el).getAttribute('mono-size')).toBe('xs')
    el.size = 'sm'
    await tick()
    expect(root(el).hasAttribute('mono-size')).toBe(false)
    el.size = 'xxl'
    await tick()
    expect(root(el).getAttribute('mono-size')).toBe('xxl')
  })

  it('the actions, the group tree and the add links are all parts', async () => {
    const el = await mount()
    const r = root(el)
    expect(r.querySelectorAll(':scope > [mono-filter-actions] > [mono-filter-btn]').length).toBe(2)
    expect(r.querySelector('[mono-filter-btn]:not([mono-variant])')).toBeTruthy()
    expect(r.querySelector('[mono-filter-btn][mono-variant="ghost"]')).toBeTruthy()
    expect(r.querySelector(':scope > [mono-filter-group] > [mono-filter-group-head] > [mono-filter-match]')).toBeTruthy()
    expect(r.querySelector('[mono-filter-group-head] > [mono-filter-control][mono-filter-group-op]')).toBeTruthy()
    // one root rule + a nested group holding two
    expect(r.querySelectorAll('[mono-filter-row]').length).toBe(3)
    expect(r.querySelectorAll('[mono-filter-children] [mono-filter-group]').length).toBe(1)
    expect(r.querySelectorAll(':scope > [mono-filter-add] > [mono-filter-link]').length).toBe(2)
  })

  it('a rule row is field | operator | value | nested | trash, each a part', async () => {
    const el = await mount()
    const row = root(el).querySelector('[mono-filter-row]') as HTMLElement
    expect(row.querySelector('select[mono-filter-control][mono-filter-field]')).toBeTruthy()
    expect(row.querySelector('select[mono-filter-control][mono-filter-op]')).toBeTruthy()
    expect(row.querySelector('[mono-filter-value-cell] > [mono-filter-control][mono-filter-value]')).toBeTruthy()
    const btns = row.querySelectorAll(':scope > [mono-filter-icon-btn]')
    expect(btns.length).toBe(2)
    expect(btns[0].hasAttribute('mono-danger')).toBe(false)
    expect(btns[1].hasAttribute('mono-danger')).toBe(true)
  })

  it('the legacy classes are still emitted as inert hooks', async () => {
    const el = await mount()
    expect(root(el).classList.contains('mono-filter')).toBe(true)
    expect(root(el).querySelector('.mono-filter-row[mono-filter-row]')).toBeTruthy()
  })

  it('the shadow build emits the same attributes inside its root', async () => {
    await import('../dist/ui/shadow/filter.js')
    const el = document.createElement('mono-shadow-filter-builder') as any
    document.body.appendChild(el)
    el.controlFilterBuilder = controlMonoFilterBuilder({ fields: FIELDS, filter: [['Nama', 'contains', 'a']] })
    el.size = 'lg'
    hosts.push(el)
    await tick()
    const r = el.shadowRoot!.querySelector('[mono-filter-builder]') as HTMLElement
    expect(r).toBeTruthy()
    expect(r.getAttribute('mono-size')).toBe('lg')
    expect(r.querySelectorAll('[mono-filter-row]').length).toBe(1)
  })
})
