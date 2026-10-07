// @vitest-environment jsdom
//
// The universal `pending` prop and the automatic skeleton (src/composables/mono-skeleton.ts).
//
// Core never imports `@aejkatappaja/phantom-ui`: it activates when `phantom-ui` is DEFINED.
// So a bare `class extends HTMLElement` registered under that tag is all these tests need
// — no ResizeObserver, no layout. Order matters inside this file: the realm can activate
// once and never deactivate, so the "inactive" cases run first.
//
// Drives the BUILT artifacts, like the other attribute tests (build first).
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

let api: typeof import('../dist/index.node.js')

beforeAll(async () => {
  api = await import('../dist/index.node.js')
  await import('../dist/ui/button.js')
  await import('../dist/ui/shadow/button.js')
  await import('../dist/ui/input.js')
  await import('../dist/ui/card.js')
  await import('../dist/ui/select.js')
  await import('../dist/ui/table.js')
})

beforeEach(() => {
  api.resetMonoUI()
  document.body.innerHTML = ''
})

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

async function mount<T = any>(markup: string): Promise<T> {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.appendChild(host)
  await tick()
  return host.firstElementChild as T
}

/** The wrapper the mixin renders (light: a host child; shadow: a root child). jsdom has no
 *  `:scope` on a ShadowRoot, so walk the children. */
const wrapperOf = (el: Element) =>
  Array.from((el.shadowRoot ?? el).children).find(
    (c) => c.localName === 'phantom-ui' && c.hasAttribute('mono-skeleton'),
  ) ?? null

/** Pending from the outside: the host carries `mono-pending` while it resolves true (whether phantom
 *  draws it — wrapper present — or the CSS block does). */
const isLoading = (el: Element) => el.hasAttribute('mono-pending')

/** A controller stand-in with the surface the table helpers and the skeleton read. */
function fakeGrid(init: { loading: boolean; hasLoaded: boolean; pageSize?: number }) {
  const subs = new Set<() => void>()
  return {
    loading: init.loading,
    hasLoaded: init.hasLoaded,
    dataSource: {} as unknown,
    pageSize: init.pageSize ?? 10,
    pageSizeAll: false,
    subscribe(cb: () => void) {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    notify() {
      for (const cb of subs) cb()
    },
    registerColumn() {},
    unregisterColumn() {},
  }
}

describe('pending — before phantom-ui is defined (inactive)', () => {
  it('falls back to the CSS-only skeleton: the host carries mono-pending, no wrapper', async () => {
    const el = await mount('<mono-button pending>B</mono-button>')
    expect(el.pending).toBe(true)
    expect(wrapperOf(el)).toBeNull()
    expect(el.querySelector('[mono-button]')).not.toBeNull()
    expect(el.hasAttribute('mono-pending')).toBe(true)
    expect(el.hasAttribute('mono-pending-covered')).toBe(false) // nothing covers it: CSS paints
    el.pending = false
    await el.updateComplete
    expect(el.hasAttribute('mono-pending')).toBe(false)
    expect(api.getMonoSkeletonStatus().active).toBe(false)
    // …but it is remembered: this element can never wrap, even if the peer shows up later.
    expect(api.getMonoSkeletonStatus().createdBeforeActive).toBeGreaterThan(0)
    expect(api.getMonoSkeletonStatus().createdBeforeActiveTags).toContain('mono-button')
  })

  it('pending="false" / an object are read, still no wrapper', async () => {
    const el = await mount('<mono-card pending="false">x</mono-card>')
    expect(el.pending).toBe(false)
    expect(el.hasAttribute('mono-pending')).toBe(false)
    el.pending = { active: true, count: 3, animation: 'pulse', mode: 'overlay' }
    await el.updateComplete
    expect(wrapperOf(el)).toBeNull()
    expect(el.getAttribute('mono-pending-animation')).toBe('pulse')
    expect(el.getAttribute('mono-pending-mode')).toBe('overlay')
  })
})

describe('pending — once phantom-ui is defined (active)', () => {
  beforeAll(async () => {
    customElements.define('phantom-ui', class extends HTMLElement {})
    await tick() // `whenDefined` resolves asynchronously
  })

  it('activates from the registry alone', () => {
    expect(api.getMonoSkeletonStatus().active).toBe(true)
  })

  it('a manual `pending` wraps a light element only WHILE on; idle DOM is the plain one', async () => {
    const el = await mount('<mono-card pending>x</mono-card>')
    const wrap = wrapperOf(el)
    expect(wrap).not.toBeNull()
    expect(wrap!.hasAttribute('loading')).toBe(true)
    // The component's own root and the slotted content are INSIDE the wrapper.
    expect(wrap!.querySelector('[mono-card]')).not.toBeNull()
    expect(el.textContent).toContain('x')

    // with phantom defined the host says so, and the CSS block paint steps aside
    expect(el.hasAttribute('mono-pending')).toBe(true)
    expect(el.hasAttribute('mono-pending-covered')).toBe(true)

    el.pending = false
    await el.updateComplete
    expect(wrapperOf(el)).toBeNull() // gone: the root is a direct child again
    expect(el.hasAttribute('mono-pending')).toBe(false)
    expect(el.querySelector(':scope > [mono-card]')).not.toBeNull()
    expect(el.textContent).toContain('x') // slotted content re-homed

    el.setAttribute('pending', 'true')
    await el.updateComplete
    expect(isLoading(el)).toBe(true)
    expect(el.textContent).toContain('x')
  })

  it('attribute form: "false" is off, "auto" is auto (off in a SPA)', async () => {
    const off = await mount('<mono-card pending="false">x</mono-card>')
    expect(wrapperOf(off)).toBeNull()
    const auto = await mount('<mono-card pending="auto">x</mono-card>')
    expect(auto.pending).toBeUndefined()
    expect(wrapperOf(auto)).toBeNull()
  })

  it('SPA (no ssr flag): nothing is pending by default', async () => {
    const el = await mount('<mono-input label="Name"></mono-input>')
    expect(wrapperOf(el)).toBeNull()
  })

  it('object form merges global < tag < element and syncs attributes without churn', async () => {
    api.createMonoUI({
      skeleton: { duration: 3, animation: 'solid' },
      'mono-card': { pending: { animation: 'pulse' } },
    })
    const el = await mount('<mono-card>x</mono-card>')
    // tag default has no `active` → auto → off in a SPA: no wrapper at all
    expect(wrapperOf(el)).toBeNull()

    el.pending = { active: true, duration: 2 }
    await el.updateComplete
    const wrap = wrapperOf(el)!
    expect(wrap.hasAttribute('loading')).toBe(true)
    expect(wrap.getAttribute('animation')).toBe('pulse') // tag beats global
    expect(wrap.getAttribute('duration')).toBe('2') // element beats both

    const spy = vi.spyOn(wrap, 'setAttribute')
    el.pending = { active: true, duration: 2 } // equal copy
    await el.updateComplete
    expect(spy).not.toHaveBeenCalled()

    el.pending = { active: true, duration: 2, count: 4, pierceShadow: true }
    await el.updateComplete
    expect(wrap.getAttribute('count')).toBe('4')
    expect(wrap.hasAttribute('pierce-shadow')).toBe(true)
    expect(wrap.getAttribute('duration')).toBe('2')
    spy.mockRestore()

    el.pending = { active: true }
    await el.updateComplete
    expect(wrap.hasAttribute('count')).toBe(false)
    expect(wrap.getAttribute('duration')).toBe('3') // back to the global default
  })

  it('a tag default of `pending: true` turns it on without touching the prop', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.createMonoUI({ skeleton: {}, 'mono-card': { pending: true } })
    const el = await mount('<mono-card>x</mono-card>')
    expect(el.pending).toBeUndefined()
    expect(isLoading(el)).toBe(true)
    expect(warn).not.toHaveBeenCalled() // `skeleton` is a known key
    warn.mockRestore()
  })

  it('createMonoUI({ skeleton: false }) disables it even though the peer is defined', async () => {
    api.createMonoUI({ skeleton: false })
    const el = await mount('<mono-card pending>x</mono-card>')
    expect(api.getMonoSkeletonStatus().active).toBe(false)
    expect(wrapperOf(el)).toBeNull() // disabled → never wraps
    expect(el.querySelector('[mono-card]')).not.toBeNull()
  })

  describe('SSR app — the automatic default', () => {
    afterEach(() => vi.useRealTimers())

    it('render-driven elements release before their first paint when nothing on the page loads', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const el = await mount('<mono-input label="Name"></mono-input>')
      expect(isLoading(el)).toBe(false)
      const btn = await mount('<mono-button>Go</mono-button>')
      expect(isLoading(btn)).toBe(false)
    })

    it('render-driven elements are HELD while a data-driven element on the page still loads', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const grid = fakeGrid({ loading: true, hasLoaded: false })
      const host = document.createElement('div')
      host.innerHTML = '<mono-input label="Name"></mono-input><mono-button>Go</mono-button><mono-table-th caption="A"></mono-table-th>'
      const th = host.querySelector('mono-table-th') as any
      th.dataGrid = grid
      document.body.appendChild(host)
      await tick()
      const input = host.querySelector('mono-input')!
      const btn = host.querySelector('mono-button')!
      expect(isLoading(th)).toBe(true)
      expect(isLoading(input)).toBe(true) // the page is loading → held
      expect(isLoading(btn)).toBe(true)
      // held elements draw through PHANTOM like the data-driven ones — measured, per-leaf
      // blocks — and the CSS block steps aside (`mono-pending-covered`) exactly while the
      // wrapper is actually rendered
      expect(wrapperOf(input)).not.toBeNull()
      expect(input.hasAttribute('mono-pending-covered')).toBe(true)
      // table helpers draw with CSS too (their measured skeleton would be one bar anyway)
      expect(wrapperOf(th)).toBeNull()

      grid.loading = false
      grid.hasLoaded = true
      grid.notify()
      await tick()
      expect(isLoading(th)).toBe(false)
      expect(isLoading(input)).toBe(false) // released together with the page
      expect(isLoading(btn)).toBe(false)
      expect(input.querySelector(':scope > [mono-input]')).not.toBeNull()

      // a data element mounted AFTER the page settled holds nobody that already released
      const late = document.createElement('mono-table-th') as any
      late.dataGrid = fakeGrid({ loading: true, hasLoaded: false })
      host.appendChild(late)
      await tick()
      expect(isLoading(late)).toBe(true)
      expect(isLoading(input)).toBe(false)
    })

    it('a waiting element that leaves the page releases the held ones', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const host = document.createElement('div')
      host.innerHTML = '<mono-input label="Name"></mono-input><mono-table-th caption="A"></mono-table-th>'
      const th = host.querySelector('mono-table-th') as any
      th.dataGrid = fakeGrid({ loading: true, hasLoaded: false })
      document.body.appendChild(host)
      await tick()
      const input = host.querySelector('mono-input')!
      expect(isLoading(input)).toBe(true)
      th.remove()
      await tick()
      expect(isLoading(input)).toBe(false)
    })

    it('a table helper stays pending until its controller has loaded', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const grid = fakeGrid({ loading: true, hasLoaded: false })
      const th = document.createElement('mono-table-th') as any
      th.caption = 'Name'
      th.dataGrid = grid
      document.body.appendChild(th)
      await tick()
      expect(isLoading(th)).toBe(true)

      grid.loading = false
      grid.hasLoaded = true
      grid.notify()
      await tick()
      expect(isLoading(th)).toBe(false)
    })

    it('a failed first load releases a table helper too (the error is the answer)', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const grid = fakeGrid({ loading: true, hasLoaded: false }) as ReturnType<typeof fakeGrid> & { error: unknown }
      const th = document.createElement('mono-table-th') as any
      th.dataGrid = grid
      document.body.appendChild(th)
      await tick()
      expect(isLoading(th)).toBe(true)

      grid.loading = false
      grid.error = { status: 401, message: 'nope' }
      grid.notify()
      await tick()
      expect(isLoading(th)).toBe(false)
    })

    it('a table helper with no controller releases after one tick of grace', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const th = document.createElement('mono-table-th') as any
      th.caption = 'Name'
      document.body.appendChild(th)
      await th.updateComplete
      expect(isLoading(th)).toBe(true)
      await tick(20)
      expect(isLoading(th)).toBe(false)
    })

    it('a select with a dataSource waits for its first page', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      let loading = true
      const handlers: Record<string, () => void> = {}
      const ds = {
        on: (evt: string, cb: () => void) => {
          handlers[evt] = cb
        },
        off: () => {},
        items: () => [] as unknown[],
        isLoading: () => loading,
        isLastPage: () => true,
        load: async () => [],
      }
      const sel = document.createElement('mono-select') as any
      sel.dataSource = ds
      document.body.appendChild(sel)
      await tick()
      expect(isLoading(sel)).toBe(true)

      loading = false
      handlers.loadingChanged?.()
      await tick()
      expect(isLoading(sel)).toBe(false)

      // static items → nothing to wait for
      const plain = await mount('<mono-select></mono-select>')
      expect(isLoading(plain)).toBe(false)
    })

    it('`maxWait` releases a controller that never loads', async () => {
      api.createMonoUI({ skeleton: { ssr: true, maxWait: 40 } })
      const th = document.createElement('mono-table-th') as any
      th.dataGrid = fakeGrid({ loading: true, hasLoaded: false })
      document.body.appendChild(th)
      await tick()
      expect(isLoading(th)).toBe(true)
      await tick(80)
      expect(isLoading(th)).toBe(false)
    })

    it('a manual value always beats the automatic one', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const th = document.createElement('mono-table-th') as any
      th.dataGrid = fakeGrid({ loading: true, hasLoaded: false })
      th.pending = false
      document.body.appendChild(th)
      await tick()
      expect(isLoading(th)).toBe(false)
    })

    it('shadow elements never pend automatically, but wrap on a manual true', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const el = await mount('<mono-shadow-button>S</mono-shadow-button>')
      expect(wrapperOf(el)).toBeNull()

      el.pending = true
      await el.updateComplete
      const wrap = wrapperOf(el)
      expect(wrap).not.toBeNull()
      expect(wrap!.hasAttribute('loading')).toBe(true)
      expect(el.shadowRoot!.contains(wrap!)).toBe(true)

      el.pending = false
      await el.updateComplete
      expect(wrapperOf(el)).toBeNull()
      expect(el.shadowRoot!.querySelector('[mono-button]')).not.toBeNull()
    })
  })

  describe('mono-table-loading — pending mode', () => {
    async function mountTable(grid: ReturnType<typeof fakeGrid>) {
      const host = document.createElement('div')
      host.innerHTML = `
        <div class="mono-table-scroll">
          <table class="mono-table">
            <caption><mono-table-loading></mono-table-loading></caption>
            <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>`
      const el = host.querySelector('mono-table-loading') as any
      el.dataGrid = grid
      document.body.appendChild(host)
      await tick()
      return el
    }

    it('draws N placeholder rows mirroring the header while the first load is in flight', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const grid = fakeGrid({ loading: true, hasLoaded: false, pageSize: 7 })
      const el = await mountTable(grid)

      expect(el.hasAttribute('data-mono-pending')).toBe(true)
      expect(el.hasAttribute('data-mono-loading')).toBe(false)
      const phantom = el.querySelector('phantom-ui[mono-skeleton]')
      expect(phantom).not.toBeNull()
      expect(phantom.getAttribute('count')).toBe('7')
      expect(el.querySelectorAll('.mono-table-skeleton-cell').length).toBe(3)
      expect(el.querySelector('.mono-table-spinner')).toBeNull()

      grid.loading = false
      grid.hasLoaded = true
      grid.notify()
      await tick()
      expect(el.hasAttribute('data-mono-pending')).toBe(false)
      expect(el.querySelector('phantom-ui')).toBeNull()
      // the first load completing must NOT flash the min-duration spinner
      expect(el.hasAttribute('data-mono-loading')).toBe(false)
      // …and the spinner markup is back for every later reload. (The spinner's own
      // show/hide is behind lit's `isServer`, which is `true` under vitest's node
      // resolution of lit, so its attribute flip is not asserted here.)
      expect(el.querySelector('.mono-table-spinner')).not.toBeNull()
    })

    it('falls back to 8 rows for a "show all" page', async () => {
      api.createMonoUI({ skeleton: { ssr: true } })
      const grid = fakeGrid({ loading: true, hasLoaded: false, pageSize: 500 })
      grid.pageSizeAll = true
      const el = await mountTable(grid)
      expect(el.querySelector('phantom-ui[mono-skeleton]').getAttribute('count')).toBe('8')
    })

    it('per-tag defaults reach the placeholder (`count` override)', async () => {
      api.createMonoUI({ skeleton: { ssr: true }, 'mono-table-loading': { pending: { count: 3, animation: 'pulse' } } })
      const el = await mountTable(fakeGrid({ loading: true, hasLoaded: false, pageSize: 10 }))
      const phantom = el.querySelector('phantom-ui[mono-skeleton]')
      expect(phantom.getAttribute('count')).toBe('3')
      expect(phantom.getAttribute('animation')).toBe('pulse')
    })
  })
})
