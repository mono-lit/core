// @vitest-environment jsdom
//
// `claimLayoutVar` / `releaseLayoutVar` — the refcounted layout variables, both targets:
// `'root'` (an inherited property on <html>, the nav height) and `'content'` (ONE rule of a
// library-owned sheet matching only the layout content markers — the sidebar's push, so a
// collapse does not restyle the whole page). The live-browser half (non-inheritance,
// padding) is covered by docs/e2e/stress.mjs; this pins the bookkeeping.
import { describe, it, expect, afterEach } from 'vitest'
import { claimLayoutVar, releaseLayoutVar, LAYOUT_CONTENT_SELECTOR } from '../src/composables/layout-var'

const rule = () => {
  const el = document.head.querySelector('style[data-mono-layout-content]') as HTMLStyleElement | null
  return (el?.sheet?.cssRules[0] as CSSStyleRule | undefined) ?? null
}
const contentValue = (name: string) => rule()?.style.getPropertyValue(name).trim() ?? ''
const rootValue = (name: string) => document.documentElement.style.getPropertyValue(name).trim()

describe('layout vars', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style')
  })

  it("'content' writes ONE rule for the layout content markers, never <html>", () => {
    const a = {}
    claimLayoutVar('--t-push', a, '240px', 'content')
    expect(rule()?.selectorText.replace(/\s+/g, ' ')).toBe(LAYOUT_CONTENT_SELECTOR)
    expect(contentValue('--t-push')).toBe('240px')
    expect(rootValue('--t-push')).toBe('')
    claimLayoutVar('--t-push', a, '64px', 'content') // the same owner re-claiming = an update
    expect(contentValue('--t-push')).toBe('64px')
    releaseLayoutVar('--t-push', a, 'content')
    expect(contentValue('--t-push')).toBe('')
  })

  it("'content' is refcounted: a survivor keeps its value, the last release clears it", () => {
    const a = {}, b = {}
    claimLayoutVar('--t-rc', a, '240px', 'content')
    claimLayoutVar('--t-rc', b, '64px', 'content')
    releaseLayoutVar('--t-rc', b, 'content')
    expect(contentValue('--t-rc')).toBe('240px')
    releaseLayoutVar('--t-rc', a, 'content')
    expect(contentValue('--t-rc')).toBe('')
  })

  it("the two targets are separate claims, even for the same name", () => {
    const a = {}
    claimLayoutVar('--t-both', a, '10px')
    claimLayoutVar('--t-both', a, '20px', 'content')
    expect(rootValue('--t-both')).toBe('10px')
    expect(contentValue('--t-both')).toBe('20px')
    releaseLayoutVar('--t-both', a)
    expect(rootValue('--t-both')).toBe('')
    expect(contentValue('--t-both')).toBe('20px')
    releaseLayoutVar('--t-both', a, 'content')
  })

  it('a dropped <style> is recreated with every value still held', () => {
    const a = {}
    claimLayoutVar('--t-replay', a, '240px', 'content')
    document.head.querySelector('style[data-mono-layout-content]')!.remove()
    // The next write (any content var) recreates the sheet and replays the held values.
    claimLayoutVar('--t-other', a, '1px', 'content')
    expect(contentValue('--t-replay')).toBe('240px')
    expect(contentValue('--t-other')).toBe('1px')
    releaseLayoutVar('--t-replay', a, 'content')
    releaseLayoutVar('--t-other', a, 'content')
  })
})
