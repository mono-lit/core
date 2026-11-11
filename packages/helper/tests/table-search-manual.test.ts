// @vitest-environment jsdom
//
// `<mono-table-search model-value>` — MANUAL mode. Passing `model-value` (even `''`) turns the
// search box into a controlled `mono-input`-style field: typing emits `input` / `change` / `clear`
// with `mono-input`'s detail shape, and the bound grid's search is NEVER called — the consumer
// runs the search itself. Without `model-value`, the debounced grid push is unchanged.
//
// Drives the BUILT artifact, like `table-th-required.test.ts`.
import { describe, it, expect, beforeAll, vi } from 'vitest'

describe('<mono-table-search> manual mode', () => {
  beforeAll(async () => {
    await import('../dist/ui/table.js')
  })

  const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  /** A controller stub with just what the search box calls. */
  function stubGrid() {
    return {
      subscribe: () => () => {},
      setSearch: vi.fn(),
      setSearchTerms: vi.fn(),
      setSearchValue: vi.fn(),
      setSearchExpr: vi.fn(),
    }
  }

  async function mount(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('mono-table-search') as any
    Object.assign(el, { debounce: 0, ...props })
    document.body.appendChild(el)
    await tick()
    return el
  }

  const native = (el: any) => el.querySelector('.mono-input-native') as HTMLInputElement

  function type(el: any, text: string): void {
    const input = native(el)
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  }

  it('emits input with the mono-input detail and never touches the grid', async () => {
    const grid = stubGrid()
    const el = await mount({ modelValue: '', dataGrid: grid, searchValue: 'Code,Nama' })
    const seen: any[] = []
    el.addEventListener('mno-input', (e: CustomEvent) => seen.push(e.detail))

    type(el, 'abc')
    await tick()

    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ modelValue: 'abc', value: 'abc', currentValue: 'abc', oldValue: '' })
    expect(el.modelValue).toBe('abc')
    expect(grid.setSearch).not.toHaveBeenCalled()
    expect(grid.setSearchTerms).not.toHaveBeenCalled()
    expect(grid.setSearchValue).not.toHaveBeenCalled()
    expect(grid.setSearchExpr).not.toHaveBeenCalled()
  })

  it('decorates the bubbling native input event with the detail (no duplicate)', async () => {
    const el = await mount({ modelValue: '' })
    const plain: Event[] = []
    el.addEventListener('input', (e: Event) => plain.push(e))

    type(el, 'x')
    expect(plain).toHaveLength(1)
    expect((plain[0] as CustomEvent).detail?.modelValue).toBe('x')
  })

  it('emits change on commit', async () => {
    const el = await mount({ modelValue: '' })
    const seen: any[] = []
    el.addEventListener('mno-change', (e: CustomEvent) => seen.push(e.detail))

    native(el).value = 'done'
    native(el).dispatchEvent(new Event('change', { bubbles: true }))
    expect(seen).toHaveLength(1)
    expect(seen[0].modelValue).toBe('done')
  })

  it('clear emits input + clear and resets the value', async () => {
    const el = await mount({ modelValue: 'abc', clearable: true })
    const events: string[] = []
    el.addEventListener('mno-input', () => events.push('input'))
    el.addEventListener('mno-clear', (e: CustomEvent) => events.push(`clear:${e.detail.oldValue}`))

    ;(el.querySelector('[mono-clear]') as HTMLButtonElement).click()
    await tick()

    expect(events).toEqual(['input', 'clear:abc'])
    expect(el.modelValue).toBe('')
    expect(native(el).value).toBe('')
  })

  it('shows a modelValue written from outside', async () => {
    const el = await mount({ modelValue: '' })
    el.modelValue = 'from-ref'
    await tick()
    expect(native(el).value).toBe('from-ref')
  })

  it('without model-value, still pushes the search to the grid', async () => {
    const grid = stubGrid()
    const el = await mount({ dataGrid: grid })
    type(el, 'abc')
    await tick()
    expect(grid.setSearchTerms).toHaveBeenCalledWith([{ value: 'abc' }])
  })
})
