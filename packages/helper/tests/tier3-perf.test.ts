// Guards for the Tier-3 performance changes: behaviour must be what it was.
import { describe, it, expect } from 'vitest'
import { flattenLeaves } from '../src/components/table/grouping'
import { monoForm } from '../src/components/form/mono-form-controller'

describe('flattenLeaves', () => {
  it('flattens nested groups in order, and survives a group too big to spread', () => {
    const tree = [
      { key: 'a', items: [{ key: 'a1', items: [1, 2] }, { key: 'a2', items: [3] }] },
      4,
      { key: 'b', items: [5] },
    ]
    expect(flattenLeaves(tree as never)).toEqual([1, 2, 3, 4, 5])

    const big = Array.from({ length: 300_000 }, (_, i) => i)
    expect(flattenLeaves([{ key: 'x', items: big }] as never)).toHaveLength(300_000)
  })
})

describe('monoForm merged props cache', () => {
  it('reflects setProp and reset; the static inputs props still win', () => {
    const form = monoForm({
      inputs: {
        a: { component: 'mono-input', value: '', props: { placeholder: 'fixed' } },
      },
    } as never)
    expect(form._propsFor('a')).toEqual({ placeholder: 'fixed' })

    form.setProp({ key: 'a', props: { label: 'One', placeholder: 'ignored' } } as never)
    expect(form._propsFor('a')).toEqual({ label: 'One', placeholder: 'fixed' })

    form.setProp({ key: 'a', props: { label: 'Two' } } as never)
    expect(form._propsFor('a').label).toBe('Two')

    form.reset()
    expect(form._propsFor('a')).toEqual({ placeholder: 'fixed' })
  })
})
