// @vitest-environment jsdom
//
// `slot="select-all"` — the consumer renders what sits beside the "All" checkbox.
//
// What is load-bearing:
//
//   · the wrapper is placed as ONE node inside the row and its children are never touched (the same
//     Vue-safety rule as `slot="list"`), and it keeps a parent even when the row unrenders.
//   · the row stays mono's: a click anywhere on it still toggles every row — EXCEPT a click on a
//     control the consumer put in the slot, which is theirs.
//   · with the slot in use the row is a <div>, because the consumer's <button> cannot live inside
//     a <button>.
//
// Drives the BUILT artifact, like the other suites here.
import { describe, it, expect, beforeAll } from 'vitest'

import { controlMonoForm } from '../src/components/form/mono-form-controller'

const DEPTS = [
  { Code: 'MKT', Nama: 'Marketing' },
  { Code: 'SLS', Nama: 'Sales' },
  { Code: 'DSC', Nama: 'Demand Supply' },
]

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

describe('<mono-tag-input> slot="select-all"', () => {
  beforeAll(async () => {
    await import('../dist/ui/tag-input.js')
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
            displayValue: (d: any) => d.Nama,
            checkable: true,
            ...props,
          },
        },
      },
    })
  }

  /** A wrapper holding a label and a button of the consumer's own. */
  function makeWrapper() {
    const wrapper = document.createElement('div')
    wrapper.setAttribute('slot', 'select-all')
    const label = document.createElement('span')
    label.textContent = 'Semua departemen'
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = '?'
    wrapper.append(label, button)
    return { wrapper, label, button }
  }

  async function mount(form: any, opts: { late?: boolean } = {}) {
    const el = document.createElement('mono-tag-input') as any
    const parts = makeWrapper()

    if (!opts.late) el.appendChild(parts.wrapper)
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    if (opts.late) {
      el.appendChild(parts.wrapper)
      await tick()
    }

    return { el, ...parts }
  }

  /** The "All" row — through the document, since the open panel lives in a body portal. */
  const selectAllRow = () => document.querySelector('[mono-select-all]') as HTMLElement | null

  it('places the wrapper beside the checkbox, in place of the label', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    el.open = true
    await tick()

    const row = selectAllRow()!
    expect(row).not.toBeNull()
    expect(row.tagName).toBe('DIV')
    expect(row.querySelector('[mono-check-box], .mono-checkbox')).not.toBeNull()
    expect(row.querySelector('[mono-select-all-slot]')!.contains(wrapper)).toBe(true)
    expect(row.querySelector('[mono-item-title]')).toBeNull()
    // Its children are the consumer's, untouched.
    expect(wrapper.children).toHaveLength(2)

    el.remove()
  })

  it('toggles every row on a click anywhere else on the row', async () => {
    const form = makeForm()
    const { el, label } = await mount(form)

    el.open = true
    await tick()

    label.click()
    await tick()
    expect(form.items().Dept.currentValue).toEqual(['MKT', 'SLS', 'DSC'])

    selectAllRow()!.click()
    await tick()
    expect(form.items().Dept.currentValue).toEqual([])

    el.remove()
  })

  it('leaves a click on a control inside the slot to the consumer', async () => {
    const form = makeForm()
    const { el, button } = await mount(form)

    let clicked = 0
    button.addEventListener('click', () => clicked++)

    el.open = true
    await tick()

    button.click()
    await tick()

    expect(clicked).toBe(1)
    expect(form.items().Dept.currentValue).toEqual([])

    el.remove()
  })

  it('adopts a wrapper appended after connect instead of leaving it in the host', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form, { late: true })

    expect(wrapper.parentNode).not.toBe(el)

    el.open = true
    await tick()

    expect(selectAllRow()!.contains(wrapper)).toBe(true)

    el.remove()
  })

  it('keeps the wrapper parented when the row is not rendered', async () => {
    const form = makeForm()
    const { el, wrapper } = await mount(form)

    el.open = true
    await tick()
    el.open = false
    await tick()

    el.selectAll = false
    el.open = true
    await tick()

    expect(selectAllRow()).toBeNull()
    expect(wrapper.parentNode).not.toBeNull()

    el.remove()
  })

  it('renders the stock <button> row with its label when no slot is given', async () => {
    const form = makeForm()
    const el = document.createElement('mono-tag-input') as any
    document.body.appendChild(el)
    el.dataForm = form
    el.keyForm = 'Dept'
    await tick()

    el.open = true
    await tick()

    const row = selectAllRow()!
    expect(row.tagName).toBe('BUTTON')
    expect(row.querySelector('[mono-item-title]')!.textContent!.trim()).toBe('All')

    el.remove()
  })
})
