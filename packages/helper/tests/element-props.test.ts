// @vitest-environment jsdom
//
// `applyProps` — the one writer every controller's `props` go through.
//
// The rule under test: an `on<Event>` key is a LISTENER, not a property. Before
// this, `props: { onClick }` was written as `el.onClick = fn` — an inert expando
// that never fired — so a controller could carry configuration but not behaviour.
// A controller re-applies the same `props` object on every notify, which is why
// the bookkeeping (one listener per handler, swap on change, `null` removes) is
// tested rather than just "it fires".
import { describe, expect, it, vi } from 'vitest'
import {
  applyProps,
  detachEventHandlers,
  eventNameFromHandlerKey,
  isEventHandlerKey,
} from '../src/composables/element-props'

describe('eventNameFromHandlerKey', () => {
  it('maps the Vue `on<Event>` spelling to the DOM event name', () => {
    expect(eventNameFromHandlerKey('onClick')).toBe('click')
    expect(eventNameFromHandlerKey('onToggle')).toBe('toggle')
    expect(eventNameFromHandlerKey('onLoadingChange')).toBe('loading-change')
    expect(eventNameFromHandlerKey('onMnoChange')).toBe('mno-change')
    expect(eventNameFromHandlerKey('onToggleGroup')).toBe('toggle-group')
  })

  it('only treats `on` + capital as a handler key', () => {
    expect(isEventHandlerKey('onClick')).toBe(true)
    expect(isEventHandlerKey('onclick')).toBe(false)
    expect(isEventHandlerKey('one')).toBe(false)
    expect(isEventHandlerKey('label')).toBe(false)
  })
})

describe('applyProps handlers', () => {
  it('attaches a handler as a listener and does not write it as a property', () => {
    const el = document.createElement('div')
    const onChange = vi.fn()
    applyProps(el, { onChange, label: 'x' })
    expect((el as any).onChange).toBeUndefined()
    expect((el as any).label).toBe('x')
    el.dispatchEvent(new CustomEvent('change', { detail: { modelValue: 1 } }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].detail).toEqual({ modelValue: 1 })
  })

  it('registers the same handler once across repeated applies', () => {
    const el = document.createElement('div')
    const onToggle = vi.fn()
    const props = { onToggle }
    applyProps(el, props)
    applyProps(el, props)
    applyProps(el, { ...props })
    el.dispatchEvent(new CustomEvent('toggle'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('swaps the listener when the handler changes', () => {
    const el = document.createElement('div')
    const a = vi.fn()
    const b = vi.fn()
    applyProps(el, { onClose: a })
    applyProps(el, { onClose: b })
    el.dispatchEvent(new CustomEvent('close'))
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('`null` removes the listener, `undefined` leaves it', () => {
    const el = document.createElement('div')
    const fn = vi.fn()
    applyProps(el, { onOpen: fn })
    applyProps(el, { onOpen: undefined })
    el.dispatchEvent(new CustomEvent('open'))
    expect(fn).toHaveBeenCalledTimes(1)
    applyProps(el, { onOpen: null })
    el.dispatchEvent(new CustomEvent('open'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('multi-word keys listen to the kebab event', () => {
    const el = document.createElement('div')
    const fn = vi.fn()
    applyProps(el, { onLoadingChange: fn })
    el.dispatchEvent(new CustomEvent('loading-change'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('detachEventHandlers removes everything applyProps attached', () => {
    const el = document.createElement('div')
    const a = vi.fn()
    const b = vi.fn()
    applyProps(el, { onOpen: a, onClose: b })
    detachEventHandlers(el)
    el.dispatchEvent(new CustomEvent('open'))
    el.dispatchEvent(new CustomEvent('close'))
    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    // A fresh apply after detaching attaches again.
    applyProps(el, { onOpen: a })
    el.dispatchEvent(new CustomEvent('open'))
    expect(a).toHaveBeenCalledTimes(1)
  })

  it('a non-function `on<X>` value is ignored, not written', () => {
    const el = document.createElement('div')
    applyProps(el, { onSomething: 'text' })
    expect((el as any).onSomething).toBeUndefined()
  })

  it('leaves the native lowercase `onclick` property alone', () => {
    const el = document.createElement('div')
    const fn = vi.fn()
    applyProps(el, { onclick: fn })
    expect(el.onclick).toBe(fn)
  })
})
