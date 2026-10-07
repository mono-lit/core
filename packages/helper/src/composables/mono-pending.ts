// mono-pending — the element-side half of the automatic skeleton: the mixin the mono
// `customElement` decorator applies to every registered class (see ./mono-element.ts).
//
// Resolves `pending` before each render, wraps `render()` in `<phantom-ui>` when wrapped,
// and syncs the wrapper's phantom attributes after each render. The state, the types and
// every pure helper live in ./mono-skeleton.ts — kept lit-free on purpose (see the note
// at its end); this file is the only place the feature touches `lit`.
import { html, type LitElement, type PropertyValues } from 'lit'
import type { Constructor } from './hybird-prop'
import {
  isMonoSsrApp,
  monoApplyPhantomOptions,
  monoPendingActive,
  monoSkeletonInternals as $,
  type MonoPending,
  type MonoPendingStatics,
} from './mono-skeleton'

const { hasDom, isActive, state, activeOf, phantomOf, PHANTOM_TAG, DEFAULT_MAX_WAIT } = $
const { TAG_DEFAULT, PENDING_ACTIVE, PENDING_GRACE, PENDING_PHANTOM } = $.slots

type PendingHost = LitElement & {
  pending?: MonoPending
  _monoPendingReady?(): boolean
}

/**
 * Applied to every registered element class by the mono `customElement` decorator.
 * The property itself is registered separately (`registerPendingProperty`) so it lands in
 * Lit's attribute map before `customElements.define`.
 */
export function withMonoPending<T extends Constructor<LitElement>>(superClass: T, tag: string): T {
  class WithMonoPending extends superClass {
    /** Registered through `registerPendingProperty` — declared here only for typing. */
    declare pending?: MonoPending

    /** Whether THIS render goes inside `<phantom-ui>` — only while pending (see `_monoResolve`). */
    private _monoWrap = false
    /** Pending drawn by the CSS block alone (no wrapper): page-held, or `monoPendingDraw: 'css'`. */
    private _monoCssOnly = false
    private _monoSeenInactive = false
    private _monoReleased = false
    private _monoHadShadowRoot = false
    private _monoGraceTimer?: ReturnType<typeof setTimeout>
    private _monoMaxWaitTimer?: ReturnType<typeof setTimeout>

    constructor(...args: any[]) {
      super(...args)
      // A declarative-shadow-DOM host already carries its root before upgrade — the
      // same test Lit's hydrate support uses to tell a hydrating render apart.
      if (hasDom) this._monoHadShadowRoot = !!this.shadowRoot
    }

    private get _monoStatics(): MonoPendingStatics {
      return this.constructor as unknown as MonoPendingStatics
    }

    private get _monoIsShadow(): boolean {
      return this.renderRoot !== (this as unknown as HTMLElement)
    }

    override willUpdate(changed: PropertyValues): void {
      // @ts-ignore — the generic mixin base may not declare it, LitElement does.
      super.willUpdate?.(changed)
      if (!hasDom) return // the server never pends
      this._monoResolve()
    }

    /** Resolve `pending` → the per-element slots the render / the Cores read. */
    private _monoResolve(): void {
      const self = this as unknown as Record<symbol, unknown> & PendingHost
      const own = self.pending
      const tagDefault = self[TAG_DEFAULT] as MonoPending | undefined
      const explicit = activeOf(own) ?? activeOf(tagDefault)
      const statics = this._monoStatics

      // A MANUAL value always applies — without phantom-ui it is the CSS-only skeleton
      // (`mono-pending` on the host, see skeleton.css); the AUTOMATIC behaviour needs phantom.
      this._monoCssOnly = statics.monoPendingDraw === 'css'
      let loading = false
      if (explicit !== undefined) loading = explicit
      else if (isActive()) loading = this._monoAuto(statics)

      // Diagnostics: an element that rendered while the peer was not defined yet.
      if (!isActive() && !this._monoSeenInactive && !this.hasUpdated) {
        this._monoSeenInactive = true
        state.createdBeforeActive++
        if (!state.createdBeforeActiveTags.includes(tag)) state.createdBeforeActiveTags.push(tag)
      }

      // The wrapper exists ONLY while pending. Idle, the element's DOM is exactly what it
      // is without the skeleton: several light builds style their parts with direct-child
      // combinators from the HOST (`[mono-dropdown] > [mono-panel]`, `[mono-textarea] >
      // [mono-native]`, …) and re-scan the host's children for slotted content, and an
      // always-present wrapper broke both. While pending the content is hidden under the
      // shimmer anyway, so the swap costs one re-render of the inner DOM per flip — the
      // light-slot placement runs on every update and re-homes the consumer's nodes.
      // A hydrating shadow render (declarative shadow root already present) must match the
      // server's template, so it never wraps on that first pass.
      this._monoWrap =
        loading &&
        isActive() &&
        !this._monoCssOnly &&
        statics.monoPendingMode !== 'custom' &&
        (!this._monoIsShadow || this.hasUpdated || !this._monoHadShadowRoot)

      self[PENDING_ACTIVE] = loading
      self[PENDING_PHANTOM] = loading
        ? { ...phantomOf(state.defaults), ...phantomOf(tagDefault), ...phantomOf(own) }
        : {}
    }

    /**
     * Mirror the resolved state onto the HOST as the CSS-only attributes (`mono-pending`,
     * `mono-pending-animation`, `mono-pending-mode` — skeleton.css): the element paints as a
     * block the instant it exists, with no script involved. `mono-pending-covered` marks that
     * phantom-ui is defined and will draw the measured blocks instead, so the CSS paint steps
     * aside (both at once would hide phantom's wrapper under the block).
     */
    private _monoReflect(): void {
      const self = this as unknown as Record<symbol, unknown>
      const host = this as unknown as HTMLElement
      if (!self[PENDING_ACTIVE]) {
        for (const a of ['mono-pending', 'mono-pending-animation', 'mono-pending-mode', 'mono-pending-covered']) {
          if (host.hasAttribute(a)) host.removeAttribute(a)
        }
        return
      }
      const opts = (self[PENDING_PHANTOM] ?? {}) as Record<string, unknown>
      if (!host.hasAttribute('mono-pending')) host.setAttribute('mono-pending', '')
      for (const [attr, key] of [['mono-pending-animation', 'animation'], ['mono-pending-mode', 'mode']] as const) {
        const v = opts[key]
        if (v == null || v === '') {
          if (host.hasAttribute(attr)) host.removeAttribute(attr)
        } else if (host.getAttribute(attr) !== String(v)) host.setAttribute(attr, String(v))
      }
      // phantom draws instead of the CSS block only when its wrapper is ACTUALLY rendered this
      // pass (`_monoWrap` — which already implies phantom is active and the draw is not CSS-only).
      // Claiming coverage any earlier suppressed the CSS block while there was nothing to cover:
      // a hydrating SHADOW element's first render must match the server template (no wrapper —
      // see the guard in `_monoResolve`), and a shell element that never updates again would
      // then show NO skeleton at all, whatever `pending` said. With the truthful flag the CSS
      // block paints the moment the attribute lands (first response for a server-rendered
      // `pending` attribute, hydration for a `.prop` object binding), and the first wrapped
      // re-render swaps it for phantom's measured blocks.
      // phantom draws instead of the CSS block only when its wrapper is ACTUALLY rendered this
      // pass (`_monoWrap` — which already implies phantom is active and the draw is not CSS-only).
      // Claiming coverage any earlier suppressed the CSS block while there was nothing to cover:
      // a hydrating SHADOW element's first render must match the server template (no wrapper —
      // see the guard in `_monoResolve`), and a shell element that never updates again would
      // then show NO skeleton at all, whatever `pending` said. With the truthful flag the CSS
      // block paints the moment the attribute lands (first response for a server-rendered
      // `pending` attribute, hydration for a `.prop` object binding), and the first wrapped
      // re-render swaps it for phantom's measured blocks.
      host.toggleAttribute('mono-pending-covered', this._monoWrap)
    }

    /** The automatic rule — see the header of ./mono-skeleton.ts. */
    private _monoAuto(statics: MonoPendingStatics): boolean {
      if (this._monoIsShadow) return false
      if (statics.monoPendingAuto === 'never') return false
      if (!isMonoSsrApp()) return false
      if (this._monoReleased) return false

      const self = this as unknown as PendingHost
      if (statics.monoPendingAuto === 'data') {
        // Its own first load decides; while it waits, the page counts as loading.
        if (self._monoPendingReady?.() ?? true) {
          this._monoRelease()
          return false
        }
        state.waiting.add(this)
        this._monoStartTimers(true)
        return true
      }

      // Render-driven: held while the page's data-driven elements are still loading.
      // Held elements draw through PHANTOM like the data-driven ones — the measured,
      // per-leaf blocks: a held card's labels, fields and buttons each become a block,
      // where the CSS-only lane paints the whole card as ONE slab that swallows them.
      // Releasing then costs one re-render per element (the wrapper swap in render()),
      // exactly what a manual `pending` flip already pays; without phantom-ui active
      // `_monoWrap` stays false and the CSS block lane covers them anyway.
      if (state.waiting.size === 0 && this._monoPageChecked) {
        this._monoRelease()
        return false
      }
      // First pass: the page's data elements may not have resolved yet — they do so in
      // the update microtasks already queued behind this one, so re-check in a microtask
      // (still before the first paint: a page with no data element never shows this).
      if (!this._monoPageChecked) {
        this._monoPageChecked = true
        queueMicrotask(() => {
          if (state.waiting.size === 0) this._monoReleaseHeld()
        })
      }
      state.holders.add(this)
      // No grace tick here: a held element re-checks when the page settles (or in the
      // microtask above), never on a timer — a timer-driven update per element is what
      // made a page switch noticeably slower.
      this._monoStartTimers(false)
      return true
    }

    private _monoPageChecked = false

    /** Done waiting (from inside an update): leave the page-wide sets, release the held. */
    private _monoRelease(): void {
      this._monoReleased = true
      this._monoClearTimers()
      state.holders.delete(this)
      if (state.waiting.delete(this) && state.waiting.size === 0) {
        for (const holder of Array.from(state.holders)) holder._monoReleaseHeld()
      }
    }

    /**
     * Release a page-held element from OUTSIDE an update, without scheduling one for the
     * CSS-only draw (the attribute flip below is the whole release). A held element that
     * DREW through phantom was wrapped, so its release is a normal re-render instead —
     * `_monoWrap` decides, and both paths land on the same idle DOM.
     */
    _monoReleaseHeld(): void {
      if (this._monoReleased) return
      this._monoReleased = true
      this._monoClearTimers()
      state.holders.delete(this)
      const self = this as unknown as Record<symbol, unknown>
      self[PENDING_ACTIVE] = false
      self[PENDING_PHANTOM] = {}
      this._monoCssOnly = false
      if (this._monoWrap) this.requestUpdate()
      else this._monoReflect()
    }

    /** `grace`: data-driven elements re-check once after a macrotask (see `monoPendingGrace`). */
    private _monoStartTimers(grace: boolean): void {
      const self = this as unknown as Record<symbol, unknown>
      if (grace && !self[PENDING_GRACE] && !this._monoGraceTimer) {
        this._monoGraceTimer = setTimeout(() => {
          this._monoGraceTimer = undefined
          self[PENDING_GRACE] = true
          this.requestUpdate()
        }, 0)
      }
      const maxWait = state.defaults.maxWait ?? DEFAULT_MAX_WAIT
      if (maxWait > 0 && !this._monoMaxWaitTimer) {
        this._monoMaxWaitTimer = setTimeout(() => {
          this._monoMaxWaitTimer = undefined
          if (state.holders.has(this)) {
            this._monoReleaseHeld()
            return
          }
          this._monoReleased = true
          this.requestUpdate()
        }, maxWait)
      }
    }

    private _monoClearTimers(): void {
      if (this._monoGraceTimer) clearTimeout(this._monoGraceTimer)
      if (this._monoMaxWaitTimer) clearTimeout(this._monoMaxWaitTimer)
      this._monoGraceTimer = undefined
      this._monoMaxWaitTimer = undefined
    }

    override disconnectedCallback(): void {
      this._monoClearTimers()
      // Leave no stale `mono-pending` on an element that is re-inserted later.
      const self = this as unknown as Record<symbol, unknown>
      self[PENDING_ACTIVE] = false
      this._monoReflect()
      // A page that leaves takes its waiting elements with it; whoever is still held
      // (on the next page, or outside the page) must not wait for them.
      state.holders.delete(this)
      if (state.waiting.delete(this) && state.waiting.size === 0) {
        for (const holder of Array.from(state.holders)) holder._monoReleaseHeld()
      }
      super.disconnectedCallback()
    }

    protected override render(): unknown {
      const inner = super.render()
      if (!this._monoWrap) return inner
      return html`<phantom-ui mono-skeleton ?loading=${monoPendingActive(this)}>${inner}</phantom-ui>`
    }

    protected override updated(changed: PropertyValues): void {
      super.updated(changed)
      if (!hasDom) return
      this._monoReflect()
      if (this._monoWrap) monoApplyPhantomOptions(this, this._monoWrapper())
    }

    /** The wrapper this mixin rendered (a direct child of the render root). */
    private _monoWrapper(): Element | null {
      const root = this.renderRoot as ParentNode
      for (const child of Array.from(root.children)) {
        if (child.localName === PHANTOM_TAG && child.hasAttribute('mono-skeleton')) return child
      }
      return null
    }
  }

  return WithMonoPending as T
}
