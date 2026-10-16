// @vitest-environment jsdom
//
// A component bound to a network `dataSource` paints its request state: while the
// FIRST load (or a retry) is in flight the field reads "Loading…" with a spinner
// and refuses every gesture; when a load fails the field shows the error text
// where the placeholder sits, outlines itself in the invalid colour and offers a
// ↻ that re-runs the request. A failure is NOT a validation error — the
// validation state, aria-invalid, label and message stay untouched.
//
// The controllers are driven from source; the elements from the BUILT artifact.
import { describe, it, expect, beforeAll } from 'vitest'
import { DataSourceController, type MonoDataSource } from '../src/composables/data-source-controller'
import { monoChart } from '../src/components/chart/mono-data-chart'

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))

/** A devextreme-shaped source whose `load()` answers from a queue of outcomes. */
function fakeSource(outcomes: Array<'ok' | Error>, rows = [{ value: 'a', label: 'Apple' }]) {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {}
  let items: unknown[] = []
  let loading = false
  let gate: (() => void) | null = null
  const src = {
    calls: 0,
    hold: false,
    release() { gate?.() },
    load() {
      src.calls++
      const outcome = outcomes.shift() ?? 'ok'
      loading = true
      handlers.loadingChanged?.forEach((h) => h(true))
      return new Promise<unknown[]>((resolve, reject) => {
        const settle = () => {
          loading = false
          handlers.loadingChanged?.forEach((h) => h(false))
          if (outcome === 'ok') {
            items = rows
            handlers.changed?.forEach((h) => h())
            resolve(items)
          } else {
            handlers.loadError?.forEach((h) => h(outcome))
            reject(outcome)
          }
        }
        if (src.hold) gate = settle
        else setTimeout(settle, 5)
      })
    },
    items: () => items,
    isLoading: () => loading,
    on(ev: string, h: (...a: unknown[]) => void) { (handlers[ev] ??= []).push(h) },
    off(ev: string, h: (...a: unknown[]) => void) { handlers[ev] = (handlers[ev] ?? []).filter((x) => x !== h) },
  }
  return src
}

function hostStub() {
  return { addController() {}, removeController() {}, requestUpdate() {}, updateComplete: Promise.resolve(true) } as any
}

function controller(ds: MonoDataSource | null) {
  return new DataSourceController(hostStub(), {
    getDataSource: () => ds,
    getItems: () => [],
    getImmediate: () => true,
    getLoadMoreMode: () => undefined,
    getPageSize: () => 20,
  })
}

describe('DataSourceController request state', () => {
  it('is busy during the first load only, then usable', async () => {
    const ds = fakeSource(['ok'])
    const c = controller(ds as any)
    c.bind(ds as any)
    expect(c.busy).toBe(true)
    await tick()
    expect(c.busy).toBe(false)
    expect(c.error).toBeNull()
    expect(c.sourceItems).toHaveLength(1)

    // A later reload (a search) does not lock the field again.
    void ds.load()
    expect(c.loading).toBe(true)
    expect(c.busy).toBe(false)
    await tick()
  })

  it('captures a failure as a described error, and retry() clears it and reloads', async () => {
    const ds = fakeSource([Object.assign(new Error('boom'), { status: 503 })])
    const c = controller(ds as any)
    c.bind(ds as any)
    await tick()
    expect(c.busy).toBe(false)
    expect(c.error?.status).toBe(503)
    expect(c.error?.message).toBeTruthy()

    ds.hold = true
    const p = c.retry()
    expect(c.error).toBeNull()
    expect(c.busy).toBe(true)
    ds.release()
    await p
    expect(c.busy).toBe(false)
    expect(c.error).toBeNull()
    expect(c.sourceItems).toHaveLength(1)
    expect(ds.calls).toBe(2)
  })

  it('retry(load) runs the given loader instead of ds.load()', async () => {
    const ds = fakeSource([new Error('x')])
    const c = controller(ds as any)
    c.bind(ds as any)
    await tick()
    let used = false
    await c.retry(() => { used = true; return ds.load() })
    expect(used).toBe(true)
    expect(c.error).toBeNull()
  })

  it('ignores a cancelled load', async () => {
    const ds = fakeSource(['ok'])
    const c = controller(ds as any)
    c.bind(ds as any)
    await tick()
    c.setError('canceled')
    expect(c.error).toBeNull()
  })

  it('rebinding resets the state', async () => {
    const bad = fakeSource([new Error('x')])
    const c = controller(bad as any)
    c.bind(bad as any)
    await tick()
    expect(c.error).not.toBeNull()
    const good = fakeSource(['ok'])
    c.bind(good as any)
    expect(c.error).toBeNull()
    expect(c.busy).toBe(true)
    await tick()
    expect(c.busy).toBe(false)
  })
})

describe('<mono-select> dataSource state', () => {
  beforeAll(async () => {
    await import('../dist/ui/select.js')
  })

  async function mount(ds: unknown, props: Record<string, unknown> = {}) {
    const el = document.createElement('mono-select') as any
    el.keyValue = 'value'
    el.displayValue = 'label'
    for (const [k, v] of Object.entries(props)) el[k] = v
    el.dataSource = ds
    document.body.appendChild(el)
    await el.updateComplete
    return el
  }
  const root = (el: any) => el.querySelector('[mono-select]') as HTMLElement

  it('reads Loading… with a spinner and refuses to open while the first load runs', async () => {
    const ds = fakeSource(['ok'])
    ds.hold = true
    const el = await mount(ds, { placeholder: 'Pick' })
    const r = root(el)
    expect(r.hasAttribute('mono-ds-loading')).toBe(true)
    expect(r.querySelector('[mono-value]')?.textContent?.trim()).toBe('Loading…')
    expect(r.querySelector('[mono-actions] > [mono-ds-spinner]')).not.toBeNull()
    expect(r.querySelector('[mono-arrow]')).toBeNull()
    el.open()
    await el.updateComplete
    expect(r.hasAttribute('mono-open')).toBe(false)

    ds.release()
    await tick()
    await el.updateComplete
    expect(r.hasAttribute('mono-ds-loading')).toBe(false)
    expect(r.querySelector('[mono-value]')?.textContent?.trim()).toBe('Pick')
    el.open()
    await el.updateComplete
    expect(r.hasAttribute('mono-open')).toBe(true)
    el.remove()
  })

  it('shows the error in the placeholder, outlines it, and ↻ retries — without a validation state', async () => {
    const ds = fakeSource([new Error('Server exploded')])
    const el = await mount(ds, { placeholder: 'Pick' })
    await tick()
    await el.updateComplete
    const r = root(el)
    expect(r.hasAttribute('mono-ds-error')).toBe(true)
    expect(r.hasAttribute('mono-validation-state')).toBe(false)
    const value = r.querySelector('[mono-value]') as HTMLElement
    expect(value.hasAttribute('mono-ds-error-text')).toBe(true)
    expect(value.textContent?.trim()).toBe('Server exploded')
    el.open()
    await el.updateComplete
    expect(r.hasAttribute('mono-open')).toBe(false)

    const retry = r.querySelector('[mono-actions] > [mono-ds-retry]') as HTMLElement
    expect(retry).not.toBeNull()
    retry.click()
    await tick()
    await el.updateComplete
    expect(ds.calls).toBe(2)
    expect(r.hasAttribute('mono-ds-error')).toBe(false)
    expect(r.querySelector('[mono-value]')?.textContent?.trim()).toBe('Pick')
    el.remove()
  })

  it('a searchable select puts the state in the input placeholder', async () => {
    const ds = fakeSource([new Error('Nope')])
    const el = await mount(ds, { searchable: true })
    await tick()
    await el.updateComplete
    const input = root(el).querySelector('[mono-search-field]') as HTMLInputElement
    expect(input.placeholder).toBe('Nope')
    expect(input.readOnly).toBe(true)
    el.remove()
  })
})

describe('<mono-tag-input> dataSource state', () => {
  beforeAll(async () => {
    await import('../dist/ui/tag-input.js')
  })

  async function mount(ds: unknown) {
    const el = document.createElement('mono-tag-input') as any
    el.keyValue = 'value'
    el.displayValue = 'label'
    el.dataSource = ds
    document.body.appendChild(el)
    await el.updateComplete
    return el
  }
  const root = (el: any) => el.querySelector('[mono-tag-input]') as HTMLElement

  it('loading → read-only input with a spinner; error → placeholder text + ↻', async () => {
    const ds = fakeSource([new Error('Down for maintenance')])
    ds.hold = true
    const el = await mount(ds)
    const r = root(el)
    const input = () => r.querySelector('[mono-native]') as HTMLInputElement
    expect(r.hasAttribute('mono-ds-loading')).toBe(true)
    expect(input().placeholder).toBe('Loading…')
    expect(input().readOnly).toBe(true)
    expect(r.querySelector('[mono-actions] > [mono-ds-spinner]')).not.toBeNull()

    ds.hold = false
    ds.release()
    await tick()
    await el.updateComplete
    expect(r.hasAttribute('mono-ds-error')).toBe(true)
    expect(r.hasAttribute('mono-validation-state')).toBe(false)
    expect(input().getAttribute('aria-invalid')).toBe('false')
    expect(input().placeholder).toBe('Down for maintenance')
    el.open()
    await el.updateComplete
    expect(r.hasAttribute('mono-open')).toBe(false)

    ;(r.querySelector('[mono-ds-retry]') as HTMLElement).click()
    await tick()
    await el.updateComplete
    expect(r.hasAttribute('mono-ds-error')).toBe(false)
    el.open()
    await el.updateComplete
    expect(r.hasAttribute('mono-open')).toBe(true)
    el.remove()
  })
})

describe('monoChart request state', () => {
  it('records a failed drain on ctrl.error and retry() reloads', async () => {
    let fail = true
    const rows = [{ m: 'Jan', v: 1 }]
    const store = {
      load: () => (fail ? Promise.reject(Object.assign(new Error('offline'), { status: 0 })) : Promise.resolve(rows)),
    }
    const src = {
      load: () => Promise.resolve(rows),
      items: () => [],
      isLoading: () => false,
      store: () => store,
      on() {},
      off() {},
    }
    const chart = monoChart(src as any, { labelField: 'm', series: [{ field: 'v' }] } as any)
    expect(chart.hasLoaded).toBe(false)
    await tick()
    expect(chart.error?.status).toBe(0)
    expect(chart.hasLoaded).toBe(false)

    fail = false
    await chart.retry()
    expect(chart.error).toBeNull()
    expect(chart.hasLoaded).toBe(true)
    expect(chart.items).toHaveLength(1)
  })

  it('raw data counts as loaded with no error', () => {
    const chart = monoChart({ labels: ['A'], datasets: [{ label: 'x', data: [1] }] })
    expect(chart.hasLoaded).toBe(true)
    expect(chart.error).toBeNull()
  })
})

describe('error text: every server message, combined once', () => {
  it('reads a devextreme OData rejection: the server body, not the reason phrase', async () => {
    const { describeError, errorText } = await import('../src/utils/normalize-error')
    const raw = Object.assign(new Error('Bad Request'), {
      httpStatus: 400,
      errorDetails: { code: '', message: "Could not find a property named 'Nickname' on type 'Trippin.Person'." },
    })
    const d = describeError(raw)
    expect(d.messages).toEqual(["Could not find a property named 'Nickname' on type 'Trippin.Person'."])
    expect(errorText(d)).toBe("Could not find a property named 'Nickname' on type 'Trippin.Person'.")
  })

  it('collects every *message* key at any depth, keeping each pattern once', async () => {
    const { collectErrorMessages } = await import('../src/utils/normalize-error')
    expect(collectErrorMessages({ message: 'X failed', errorMessage: 'x failed.', error: { message: { value: 'X  FAILED' } } }))
      .toEqual(['X failed'])
    // A text another one contains adds nothing — the more specific one wins.
    expect(collectErrorMessages({ message: 'Not found', detail: 'Not found: Order 42' })).toEqual(['Not found: Order 42'])
    expect(collectErrorMessages({ message: 'Save failed', errors: [{ Message: 'Field B is required' }] }))
      .toEqual(['Save failed', 'Field B is required'])
    expect(collectErrorMessages({ status: 400, responseText: '{"error":{"message":"bad $filter"}}' })).toEqual(['bad $filter'])
  })

  it('joins distinct messages for the field and keeps the headline for the hover', async () => {
    const { describeError, errorText, errorTitle } = await import('../src/utils/normalize-error')
    const d = describeError({ status: 422, message: 'Validation failed', errors: [{ message: 'Name is required' }] })
    expect(errorText(d)).toBe('Validation failed · Name is required')
    expect(errorTitle(d).split('\n')[0]).toBe(d.message)
  })

  it('no message at all → the generic text for the status', async () => {
    const { describeError, errorText, DEFAULT_ERROR_MESSAGES } = await import('../src/utils/normalize-error')
    expect(errorText(describeError({ status: 500 }))).toBe(DEFAULT_ERROR_MESSAGES[500])
    expect(errorText(describeError(Object.assign(new Error(''), { httpStatus: 403 })))).toBe(DEFAULT_ERROR_MESSAGES[403])
    expect(errorText(describeError(Object.assign(new Error('Service Unavailable'), { httpStatus: 503 })))).toBe(DEFAULT_ERROR_MESSAGES[503])
    expect(errorText(describeError(new TypeError('Failed to fetch')))).toBe(DEFAULT_ERROR_MESSAGES.network)
  })
})

describe('app-driven state: loading / loading-error / retry', () => {
  beforeAll(async () => {
    await import('../dist/ui/select.js')
    await import('../dist/ui/tag-input.js')
  })

  for (const tag of ['mono-select', 'mono-tag-input'] as const) {
    const rootSel = `[${tag}]`

    it(`${tag}: \`loading\` locks the field with no dataSource bound, until the app clears it`, async () => {
      const el = document.createElement(tag) as any
      el.loading = true
      el.loadingText = 'Fetching companies…'
      document.body.appendChild(el)
      await el.updateComplete
      const r = el.querySelector(rootSel) as HTMLElement
      expect(r.hasAttribute('mono-ds-loading')).toBe(true)
      expect(r.querySelector('[mono-ds-spinner]')).not.toBeNull()
      expect(r.textContent + ((r.querySelector('input') as HTMLInputElement | null)?.placeholder ?? '')).toContain('Fetching companies…')
      el.open()
      await el.updateComplete
      expect(r.hasAttribute('mono-open')).toBe(false)

      el.items = [{ value: 'a', label: 'A' }]
      el.loading = false
      await el.updateComplete
      expect(r.hasAttribute('mono-ds-loading')).toBe(false)
      el.open()
      await el.updateComplete
      expect(r.hasAttribute('mono-open')).toBe(true)
      el.remove()
    })

    it(`${tag}: \`loading-error\` paints the failure and ↻ fires \`retry\` for the app`, async () => {
      const el = document.createElement(tag) as any
      el.setAttribute('loading-error', 'Companies could not be loaded')
      document.body.appendChild(el)
      await el.updateComplete
      const r = el.querySelector(rootSel) as HTMLElement
      expect(r.hasAttribute('mono-ds-error')).toBe(true)
      expect(r.hasAttribute('mono-validation-state')).toBe(false)
      const shown = r.textContent + ((r.querySelector('input') as HTMLInputElement | null)?.placeholder ?? '')
      expect(shown).toContain('Companies could not be loaded')

      const events: string[] = []
      for (const n of ['retry', 'mno-retry', 'mnoRetry']) el.addEventListener(n, () => events.push(n))
      ;(r.querySelector('[mono-ds-retry]') as HTMLElement).click()
      expect(events).toEqual(expect.arrayContaining(['retry', 'mno-retry', 'mnoRetry']))

      // The app re-fetches: loading, then done.
      el.loadingError = null
      el.loading = true
      await el.updateComplete
      expect(r.hasAttribute('mono-ds-error')).toBe(false)
      expect(r.hasAttribute('mono-ds-loading')).toBe(true)
      el.remove()
    })
  }

  it('an error object is described like any other (server messages, status fallback)', async () => {
    const el = document.createElement('mono-select') as any
    el.loadingError = { status: 500 }
    document.body.appendChild(el)
    await el.updateComplete
    expect(el.querySelector('[mono-value]')?.textContent?.trim()).toBe('Something went wrong on the server. Please try again later.')
    el.remove()
  })
})
