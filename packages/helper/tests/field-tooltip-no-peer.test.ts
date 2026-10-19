// @vitest-environment jsdom
//
// `tooltip` without the optional `@floating-ui/*` peers installed: plain text
// still gets the built-in bubble; the options-object form (the floating-ui
// addon) renders NO info icon, and says nothing about it — "not installed" is
// a supported setup, so there is no console noise either.
import { describe, it, expect, beforeAll, vi } from 'vitest'

vi.mock('@floating-ui/dom', () => {
  throw new Error("Cannot find package '@floating-ui/dom'")
})

describe('form-control tooltip without floating-ui', () => {
  beforeAll(async () => {
    await import('../dist/ui/input.js')
    await import('../dist/ui/select.js')
  })

  it('the mock really makes the peer unloadable (guards the test itself)', async () => {
    const { loadFloatingUi } = await import('../dist/tooltip.js')
    await expect(loadFloatingUi()).rejects.toThrow(/optional peer/)
  })

  it.each(['mono-input', 'mono-select'])('%s plain text still shows the built-in bubble', async (tag) => {
    const el = document.createElement(tag) as any
    el.label = 'Name'
    el.tooltip = 'No floating-ui needed'
    document.body.appendChild(el)
    await new Promise((r) => setTimeout(r, 50))
    const icon = el.querySelector('[mono-label-tooltip]')
    expect(icon).not.toBeNull()
    icon.dispatchEvent(new Event('pointerenter'))
    const bubble = icon.querySelector('[mono-label-tooltip-bubble]')
    expect(bubble.textContent).toBe('No floating-ui needed')
    expect(bubble.hasAttribute('mono-open')).toBe(true)
    el.remove()
  })

  it.each(['mono-input', 'mono-select'])('%s options object renders no icon and logs nothing', async (tag) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const el = document.createElement(tag) as any
    el.label = 'Name'
    el.tooltip = { content: 'Needs floating-ui', placement: 'right' }
    document.body.appendChild(el)
    await new Promise((r) => setTimeout(r, 150))
    expect(el.querySelector('[mono-label]')).not.toBeNull()
    expect(el.querySelector('[mono-label-tooltip]')).toBeNull()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
    el.remove()
  })
})
