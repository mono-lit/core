// Tooltip addon — `controlMonoTooltip(target, options)`.
//
// ── Why delegation, not per-element listeners ──
//
// The call usually runs in `<script setup>`, BEFORE the template has mounted, and
// the elements it names come and go with `v-if` / `v-for` / route changes. So the
// controller never queries the DOM up front. One shared set of capture-phase
// listeners on `document` (pointer, focus, click) reads `event.composedPath()` and
// asks each live controller "is anything on this path yours?". An element that
// mounts later simply starts matching; one that unmounts simply stops.
//
// `composedPath()` is also what makes shadow DOM work: it contains the host
// (`<mono-shadow-button>`) AND the nodes inside its open shadow root, so a
// selector can target a component host, and a ref can point inside one.
//
// The floating element is appended to `<body>` — outside every shadow root, so
// the global `ui/index.css` styles it in the light AND the shadow build alike —
// and it joins the shared popup stack, so it paints above an open modal.
import { registerPopupLayer, unregisterPopupLayer, type PopupLayer } from '../../composables/popup-stack'
import { resolveMaybeReactive, unwrapReactive } from '../../composables/reactive'
import { resolveTooltipOptions, type ResolvedTooltipOptions } from './tooltip-config'
import { loadFloatingUi } from './tooltip-loader'
import type {
  MonoTooltipContent,
  MonoTooltipController,
  MonoTooltipOptions,
  MonoTooltipTarget,
  MonoTooltipTargetValue,
  MonoTooltipTrigger,
} from './tooltip-types'

type Floating = typeof import('@floating-ui/dom')
type Reason = MonoTooltipTrigger

/** Grace period so an INTERACTIVE tooltip can be reached across the offset gap. */
const INTERACTIVE_HIDE_GRACE = 120
/** Longest the exit transition may take before the element is removed anyway. */
const EXIT_FALLBACK_MS = 200

let nextId = 0

/* ------------------------------------------------------------------------ */
/*  Shared document listeners                                                */
/* ------------------------------------------------------------------------ */

const live = new Set<TooltipInstance>()
let bound = false

function each(fn: (inst: TooltipInstance) => void): void {
  // a handler may destroy / create controllers — iterate a snapshot
  for (const inst of Array.from(live)) fn(inst)
}

const onPointerOver = (e: PointerEvent): void => {
  const path = e.composedPath()
  each((i) => i._pointerOver(path, e))
}
const onPointerOut = (e: PointerEvent): void => {
  // `relatedTarget === null` = the pointer left the window; nothing else fires
  if (!e.relatedTarget) each((i) => i._pointerOver([], e))
}
const onFocusIn = (e: FocusEvent): void => {
  const path = e.composedPath()
  each((i) => i._focusIn(path))
}
const onFocusOut = (e: FocusEvent): void => {
  // moving focus elsewhere fires `focusin` there, which settles it; only a blur
  // to nothing (window switch, body click) needs handling here
  if (!e.relatedTarget) each((i) => i._focusIn([]))
}
const onClick = (e: MouseEvent): void => {
  const path = e.composedPath()
  each((i) => i._click(path))
}

/**
 * A REAL document. `typeof document` is not enough on the server: Lit's SSR DOM shim (loaded by
 * VitePress / Nuxt SSR through @mono-lit/helper's server entries) defines a global `document` stub with no
 * `addEventListener`, so a `typeof` guard passed and `createMonoTooltip()` in an app's setup threw
 * "document.addEventListener is not a function" during server render.
 */
export function hasLiveDocument(): boolean {
  return typeof document !== 'undefined' && typeof document.addEventListener === 'function'
}

function bindDocument(): void {
  if (bound || !hasLiveDocument()) return
  document.addEventListener('pointerover', onPointerOver, true)
  document.addEventListener('pointerout', onPointerOut, true)
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('focusout', onFocusOut, true)
  document.addEventListener('click', onClick, true)
  bound = true
}

function unbindDocument(): void {
  if (!bound || live.size > 0 || !hasLiveDocument()) return
  document.removeEventListener('pointerover', onPointerOver, true)
  document.removeEventListener('pointerout', onPointerOut, true)
  document.removeEventListener('focusin', onFocusIn, true)
  document.removeEventListener('focusout', onFocusOut, true)
  document.removeEventListener('click', onClick, true)
  bound = false
}

/* ------------------------------------------------------------------------ */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------ */

const warnedSelectors = new Set<string>()

function safeMatches(el: Element, selector: string): boolean {
  try {
    return el.matches(selector)
  } catch {
    if (!warnedSelectors.has(selector)) {
      warnedSelectors.add(selector)
      console.warn(`[mono-tooltip] invalid selector: ${JSON.stringify(selector)}`)
    }
    return false
  }
}

/** Every element a non-selector target names (refs / proxies unwrapped). */
function toElements(value: MonoTooltipTargetValue): Element[] {
  if (!value || typeof value === 'string') return []
  if (value instanceof Element) return [value]
  const out: Element[] = []
  const list = (typeof (value as Iterable<Element>)[Symbol.iterator] === 'function'
    ? Array.from(value as Iterable<Element>)
    : Array.from(value as ArrayLike<Element>)) as unknown[]
  for (const item of list) {
    // a `ref` on a component (`<MonoButton ref=…>`) hands back the instance;
    // its `$el` is the element
    const raw = unwrapReactive(item) as any
    const el = raw instanceof Element ? raw : raw?.$el
    if (el instanceof Element) out.push(el)
  }
  return out
}

function unwrapTarget(target: MonoTooltipTarget): MonoTooltipTargetValue {
  const value = resolveMaybeReactive(target as any) as any
  // a component ref resolves to its instance
  if (value && !(value instanceof Element) && typeof value === 'object' && value.$el instanceof Element) {
    return value.$el
  }
  return value
}

/** Composed-tree parent — crosses shadow boundaries (cf. `popup-portal.ts`). */
function flatTreeParent(node: Node): Node | null {
  const slot = (node as Element).assignedSlot
  if (slot) return slot
  const parent = node.parentNode
  if (parent instanceof ShadowRoot) return parent.host
  return parent
}

/**
 * The theme classes of the NEAREST scoped theme wrapper above the anchor.
 *
 * The tooltip lives on `<body>`, so it already inherits the page-level theme
 * (`applyTheme` writes to body). A section themed on its own — `<div class="mono-theme
 * dark theme-color-rose">` — is not in its inheritance chain any more; copying that
 * wrapper's theme classes onto the tooltip re-resolves the same tokens there.
 */
function scopedThemeClasses(anchor: Element): string[] {
  const stop = new Set<Node | null>([document.body, document.documentElement, null])
  for (let n: Node | null = anchor; !stop.has(n); n = flatTreeParent(n!)) {
    if (!(n instanceof Element)) continue
    const found = Array.from(n.classList).filter(
      (c) => c === 'mono-theme' || c === 'dark' || c === 'light' || c.startsWith('theme-'),
    )
    if (found.length) return found
  }
  return []
}

function isFocusVisible(el: EventTarget | undefined): boolean {
  if (!(el instanceof Element)) return false
  try {
    return el.matches(':focus-visible')
  } catch {
    return true // very old engines: show on any focus rather than never
  }
}

/**
 * How far the arrow must stay from the bubble's corners: past the rounding, on the
 * straight part of the edge. A fixed 4px let a `-start` / `-end` arrow land on the
 * curve of a well-rounded flavor (a pill, in the extreme), where the edge has
 * already pulled away and the diamond hung off the corner.
 *
 * Read from the PAINTED radius, so every flavor and radius preset is covered.
 * CSS scales radii that overflow the box down to fit it (a `9999px` pill paints
 * half its height), hence the clamp to half the smaller side. The diamond is the
 * arrow box rotated 45°: where it meets the edge it is `size·√2` wide, so it
 * overhangs its own box by `size·(√2−1)/2` on each side. Floating UI caps the
 * padding itself when the bubble is too short for it — the arrow then centres on
 * the edge and the bubble shifts so it still points at the trigger.
 */
function arrowPadding(bubble: HTMLElement, arrowEl: HTMLElement): number {
  const cs = getComputedStyle(bubble)
  const half = Math.min(bubble.offsetWidth, bubble.offsetHeight) / 2
  const radius = Math.max(
    ...[
      cs.borderTopLeftRadius,
      cs.borderTopRightRadius,
      cs.borderBottomRightRadius,
      cs.borderBottomLeftRadius,
    ].map((v) => {
      const n = parseFloat(v) || 0
      return v.trim().endsWith('%') ? (n / 100) * half * 2 : n
    }),
  )
  const overhang = (arrowEl.offsetWidth * (Math.SQRT2 - 1)) / 2
  // 4px floor: the previous fixed value, so square flavors (lyra / sera) are unchanged.
  return Math.max(4, Math.ceil(Math.min(radius, half) + overhang) + 1)
}

function toDelays(delay: ResolvedTooltipOptions['delay']): [number, number] {
  if (Array.isArray(delay)) return [Number(delay[0]) || 0, Number(delay[1]) || 0]
  const d = Number(delay) || 0
  return [d, d]
}

function toTriggers(trigger: ResolvedTooltipOptions['trigger']): Set<Reason> {
  return new Set(Array.isArray(trigger) ? trigger : [trigger])
}

/**
 * The anchor's own text, when no `content` option is given: the declarative
 * `mono-tooltip-content` / `mono-tooltip-message`, then a native `title` (moved to
 * `data-mono-title` while open), then `aria-label`.
 */
function anchorText(anchor: Element): string | null {
  const attr = (name: string) => anchor.getAttribute(name)?.trim() || null
  return (
    attr('mono-tooltip-content') ??
    attr('mono-tooltip-message') ??
    attr('data-mono-title') ??
    attr('title') ??
    attr('aria-label')
  )
}

function resolveContent(content: MonoTooltipContent | undefined, anchor: Element): string | Node | null {
  const value = typeof content === 'function' ? content(anchor) : content
  if (value instanceof Node) return value
  if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  if (content !== undefined) return null // an explicit empty answer means "don't show"
  return anchorText(anchor)
}

/* ------------------------------------------------------------------------ */
/*  One controller                                                           */
/* ------------------------------------------------------------------------ */

interface OpenState {
  anchor: Element
  el: HTMLElement
  body: HTMLElement
  arrow: HTMLElement
  stopAutoUpdate: () => void
  layer: PopupLayer
  /** `title`s moved aside so the native tooltip doesn't double up. */
  stashed: Array<[Element, string]>
  /** The `aria-describedby` value before we appended our id (null = absent). */
  describedBy: string | null
  /** Watches the anchor's `mono-tooltip-*` attributes while open (declarative only). */
  observer: MutationObserver | null
}

/** Prefix of the declarative anchor attributes (`mono-tooltip-content`, …). */
export const ANCHOR_ATTR_PREFIX = 'mono-tooltip-'

class TooltipInstance implements MonoTooltipController {
  private _options: MonoTooltipOptions
  private _open: OpenState | null = null
  private _reasons = new Set<Reason>()
  private _showTimer: ReturnType<typeof setTimeout> | undefined
  private _hideTimer: ReturnType<typeof setTimeout> | undefined
  /** Bumped by every open/close so a stale async open knows to bail. */
  private _token = 0
  /** Anchor a pending (delayed) open is for. */
  private _pending: Element | null = null
  /** A `hideOnClick` anchor stays quiet until the pointer leaves it. */
  private _suppressed: Element | null = null
  /** The last event path — which elements between the pointer and the anchor carry a `title`. */
  private _lastPath: EventTarget[] = []
  private _destroyed = false
  private readonly _id = `mono-tooltip-${++nextId}`

  constructor(
    private readonly _target: MonoTooltipTarget,
    options: MonoTooltipOptions,
    /**
     * Options read off the ANCHOR itself — the declarative `mono-tooltip-*`
     * attributes. Layered last, so an element's own attribute is the most specific
     * word. Re-read on every show and whenever those attributes change while open.
     */
    private readonly _anchorOptions?: (anchor: Element) => MonoTooltipOptions,
  ) {
    this._options = { ...options }
    // On the server (`<script setup>` under Nuxt SSR) the controller is inert:
    // registering it would keep every request's instance alive forever.
    if (!hasLiveDocument()) {
      this._destroyed = true
      return
    }
    live.add(this)
    bindDocument()
  }

  /* ----------------------------- public API ----------------------------- */

  get isOpen(): boolean {
    return !!this._open
  }

  get anchor(): Element | null {
    return this._open?.anchor ?? null
  }

  get tooltip(): HTMLElement | null {
    return this._open?.el ?? null
  }

  async show(anchor?: Element): Promise<void> {
    const el = anchor ?? this._firstTarget()
    if (!el) return
    this._lastPath = []
    await this._openOn(el, 'manual', 0)
  }

  hide(): void {
    this._close(false)
  }

  async toggle(anchor?: Element): Promise<void> {
    if (this._open && (!anchor || anchor === this._open.anchor)) this.hide()
    else await this.show(anchor)
  }

  update(options: Partial<MonoTooltipOptions>): void {
    this._options = { ...this._options, ...options }
    this._refresh()
  }

  /** Re-apply the resolved options to an open tooltip (or close it when now disabled). */
  private _refresh(): void {
    const o = this._resolved(this._open?.anchor)
    if (o.disabled) return this._close(true)
    if (this._open) {
      this._applyAppearance(this._open.el, o)
      this._renderBody(this._open, o)
    }
  }

  setContent(content: MonoTooltipContent | undefined): void {
    this.update({ content })
  }

  enable(): void {
    this.update({ disabled: false })
  }

  disable(): void {
    this.update({ disabled: true })
  }

  destroy(): void {
    if (this._destroyed) return
    this._close(true)
    this._destroyed = true
    live.delete(this)
    unbindDocument()
  }

  /* --------------------------- event handlers --------------------------- */

  /** @internal — pointer entered something (or `[]`: left the window). */
  _pointerOver(path: EventTarget[], e: PointerEvent): void {
    if (e.pointerType === 'touch') return // a tap is a click, not a hover
    // resolve against the candidate: its own attributes may change the triggers
    const candidate = this._findAnchor(path)
    const o = this._resolved(candidate ?? this._open?.anchor)
    const anchor = candidate && toTriggers(o.trigger).has('hover') ? candidate : null

    if (this._suppressed && anchor !== this._suppressed) this._suppressed = null

    if (anchor) {
      if (anchor === this._suppressed || o.disabled) return
      this._lastPath = path
      if (this._open?.anchor === anchor) {
        this._cancelHide()
        this._reasons.add('hover')
        return
      }
      if (this._pending === anchor) return
      void this._openOn(anchor, 'hover', toDelays(o.delay)[0])
      return
    }

    // over the bubble itself: an interactive tooltip stays
    if (o.interactive && this._open && path.includes(this._open.el)) {
      this._cancelHide()
      return
    }

    this._dropReason('hover')
  }

  /** @internal — focus landed somewhere (or `[]`: focus left the document). */
  _focusIn(path: EventTarget[]): void {
    const candidate = this._findAnchor(path)
    const o = this._resolved(candidate)
    const anchor = candidate && toTriggers(o.trigger).has('focus') ? candidate : null
    // Keyboard focus only. A mouse click focuses too, and would re-open the
    // tooltip `hideOnClick` just closed.
    if (anchor && !o.disabled && isFocusVisible(path[0])) {
      this._lastPath = path
      if (this._open?.anchor === anchor) {
        this._cancelHide()
        this._reasons.add('focus')
      } else {
        void this._openOn(anchor, 'focus', toDelays(o.delay)[0])
      }
      return
    }
    if (this._open && path.includes(this._open.el)) return // focus moved INTO an interactive tooltip
    this._dropReason('focus')
  }

  /** @internal */
  _click(path: EventTarget[]): void {
    const anchor = this._findAnchor(path)
    const o = this._resolved(anchor ?? this._open?.anchor)
    const triggers = toTriggers(o.trigger)
    const inTooltip = !!this._open && path.includes(this._open.el)

    if (triggers.has('click') && !o.disabled) {
      if (anchor) {
        if (this._open?.anchor === anchor && this._reasons.has('click')) this._close(false)
        else {
          this._lastPath = path
          void this._openOn(anchor, 'click', 0)
        }
        return
      }
      if (!inTooltip && this._reasons.has('click')) this._close(false)
      return
    }

    if (anchor && o.hideOnClick) {
      this._suppressed = anchor
      if (this._pending === anchor) this._cancelShow()
      if (this._open?.anchor === anchor && !this._reasons.has('manual')) this._close(false)
    }
  }

  /* ------------------------------ internals ----------------------------- */

  private _resolved(anchor?: Element | null): ResolvedTooltipOptions {
    const own = anchor && this._anchorOptions ? this._anchorOptions(anchor) : null
    return resolveTooltipOptions(this._options, own)
  }

  /** The innermost element on the path this controller's target names. */
  private _findAnchor(path: EventTarget[]): Element | null {
    if (!path.length) return null
    const value = unwrapTarget(this._target)
    if (!value) return null
    if (typeof value === 'string') {
      for (const node of path) {
        if (node instanceof Element && safeMatches(node, value)) return node
      }
      return null
    }
    const set = new Set(toElements(value))
    if (!set.size) return null
    for (const node of path) if (set.has(node as Element)) return node as Element
    return null
  }

  private _firstTarget(): Element | null {
    const value = unwrapTarget(this._target)
    if (typeof value === 'string') {
      try {
        return document.querySelector(value)
      } catch {
        return null
      }
    }
    return toElements(value)[0] ?? null
  }

  private _cancelShow(): void {
    clearTimeout(this._showTimer)
    this._showTimer = undefined
    this._pending = null
  }

  private _cancelHide(): void {
    clearTimeout(this._hideTimer)
    this._hideTimer = undefined
  }

  /** One reason to stay open went away — close once none is left. */
  private _dropReason(reason: Reason): void {
    if (this._pending && !this._open) {
      // a delayed open that has not happened yet: just forget it
      this._cancelShow()
      this._token++
    }
    if (!this._open || !this._reasons.has(reason)) return
    this._reasons.delete(reason)
    if (this._reasons.size) return

    const o = this._resolved(this._open.anchor)
    let delay = toDelays(o.delay)[1]
    if (o.interactive) delay = Math.max(delay, INTERACTIVE_HIDE_GRACE)
    this._cancelHide()
    if (delay > 0) this._hideTimer = setTimeout(() => this._close(false), delay)
    else this._close(false)
  }

  private async _openOn(anchor: Element, reason: Reason, delay: number): Promise<void> {
    if (this._destroyed) return
    this._cancelHide()
    this._cancelShow()
    if (this._open?.anchor === anchor) {
      this._reasons.add(reason)
      return
    }
    const token = ++this._token
    if (delay > 0) {
      this._pending = anchor
      await new Promise<void>((resolve) => {
        this._showTimer = setTimeout(resolve, delay)
      })
      if (token !== this._token) return
    }
    this._pending = null
    await this._mount(anchor, reason, token)
  }

  private async _mount(anchor: Element, reason: Reason, token: number): Promise<void> {
    const o = this._resolved(anchor)
    if (o.disabled || !anchor.isConnected) return
    const content = resolveContent(o.content, anchor)
    if (content === null) return

    let floating: Floating
    try {
      floating = await loadFloatingUi()
    } catch (err) {
      console.error(err)
      return
    }
    if (token !== this._token || this._destroyed || !anchor.isConnected) return

    // switching anchors: the old bubble goes without asking `onHide`
    if (this._open) this._teardown(this._open)

    const el = document.createElement('div')
    el.id = this._id
    el.setAttribute('role', 'tooltip')
    el.setAttribute('mono-tooltip', '')
    const body = document.createElement('div')
    body.setAttribute('mono-tooltip-body', '')
    const arrow = document.createElement('div')
    arrow.setAttribute('mono-tooltip-arrow', '')
    el.append(body, arrow)
    this._applyAppearance(el, o, anchor)

    if (o.onShow?.(anchor, el) === false) return

    const state: OpenState = {
      anchor,
      el,
      body,
      arrow,
      stopAutoUpdate: () => {},
      layer: {
        setStackZ: (z) => el.style.setProperty('--mono-popup-z', String(z)),
        // Escape dismisses the tooltip first (WCAG 1.4.13); the next one reaches
        // whatever is underneath.
        onStackEscape: () => this._close(false),
      },
      stashed: [],
      describedBy: anchor.getAttribute('aria-describedby'),
      observer: null,
    }
    // Declarative anchors: a bound attribute (`:mono-tooltip-content="msg"`)
    // that changes while the tooltip is open re-renders it in place.
    if (this._anchorOptions && typeof MutationObserver !== 'undefined') {
      state.observer = new MutationObserver((records) => {
        if (this._open !== state) return
        if (records.some((r) => r.attributeName?.startsWith(ANCHOR_ATTR_PREFIX))) this._refresh()
      })
      state.observer.observe(anchor, { attributes: true })
    }
    this._open = state
    this._reasons = new Set([reason])
    this._renderContent(body, content, o.allowHTML)

    const host = (typeof o.appendTo === 'function' ? o.appendTo() : o.appendTo) ?? document.body
    host.appendChild(el)

    this._stashTitles(state)
    const ids = (state.describedBy ?? '').split(/\s+/).filter(Boolean)
    if (!ids.includes(this._id)) anchor.setAttribute('aria-describedby', [...ids, this._id].join(' '))

    registerPopupLayer(state.layer)

    const reposition = () => void this._position(floating, state)
    state.stopAutoUpdate = floating.autoUpdate(anchor, el, reposition)
    // first position BEFORE the enter transition, so it doesn't slide in from 0,0
    await this._position(floating, state)
    if (this._open === state) {
      requestAnimationFrame(() => {
        if (this._open === state) el.setAttribute('data-open', '')
      })
    }
  }

  private async _position(floating: Floating, state: OpenState): Promise<void> {
    if (this._open !== state) return
    if (!state.anchor.isConnected) {
      this._close(true)
      return
    }
    const o = this._resolved(state.anchor)
    const { computePosition, offset, flip, shift, arrow, hide } = floating
    const middleware = [offset(o.offset)]
    if (o.flip) middleware.push(flip({ padding: o.padding }))
    if (o.shift) middleware.push(shift({ padding: o.padding }))
    if (o.arrow) middleware.push(arrow({ element: state.arrow, padding: arrowPadding(state.el, state.arrow) }))
    middleware.push(hide())

    const { x, y, placement, middlewareData } = await computePosition(state.anchor, state.el, {
      placement: o.placement,
      strategy: 'fixed',
      middleware,
    })
    if (this._open !== state) return

    state.el.style.left = `${x}px`
    state.el.style.top = `${y}px`
    const [side, align] = placement.split('-')
    state.el.setAttribute('data-side', side)
    if (align) state.el.setAttribute('data-align', align)
    else state.el.removeAttribute('data-align')

    const a = middlewareData.arrow
    state.arrow.style.left = a?.x != null ? `${a.x}px` : ''
    state.arrow.style.top = a?.y != null ? `${a.y}px` : ''

    // the anchor scrolled out of view: hide, don't float over unrelated content
    state.el.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : ''
  }

  /** Attributes + classes the CSS keys on. Re-run by `update()` on an open tooltip. */
  private _applyAppearance(el: HTMLElement, o: ResolvedTooltipOptions, anchor?: Element): void {
    const themed = scopedThemeClasses(anchor ?? this._open?.anchor ?? el)
    el.className = ['mono-tooltip', ...themed, ...(o.class ? o.class.split(/\s+/) : [])]
      .filter(Boolean)
      .join(' ')
    const attr = (name: string, value: string | null) =>
      value === null ? el.removeAttribute(name) : el.setAttribute(name, value)
    attr('mono-variant', o.variant && o.variant !== 'inverted' ? o.variant : null)
    attr('mono-color', o.color ?? null)
    attr('mono-size', o.size && o.size !== 'md' ? o.size : null)
    attr('mono-interactive', o.interactive ? '' : null)
    attr('mono-arrow', o.arrow ? '' : null)
    if (o.maxWidth) el.style.setProperty('--mono-tooltip-max-width', o.maxWidth)
    else el.style.removeProperty('--mono-tooltip-max-width')
  }

  private _renderBody(state: OpenState, o: ResolvedTooltipOptions): void {
    const content = resolveContent(o.content, state.anchor)
    if (content === null) return this._close(true)
    this._renderContent(state.body, content, o.allowHTML)
  }

  private _renderContent(body: HTMLElement, content: string | Node, allowHTML: boolean): void {
    if (content instanceof Node) body.replaceChildren(content)
    else if (allowHTML) body.innerHTML = content
    else body.textContent = content
  }

  /**
   * Move `title`s aside while open — the anchor's, and any between the pointer
   * and the anchor (a component may render one on an inner element) — or the
   * browser shows its own tooltip on top of ours.
   */
  private _stashTitles(state: OpenState): void {
    const chain: Element[] = []
    for (const node of this._lastPath) {
      if (node instanceof Element) chain.push(node)
      if (node === state.anchor) break
    }
    if (!chain.includes(state.anchor)) chain.push(state.anchor)
    for (const el of chain) {
      const title = el.getAttribute('title')
      if (title === null) continue
      state.stashed.push([el, title])
      el.setAttribute('data-mono-title', title)
      el.removeAttribute('title')
    }
  }

  private _close(force: boolean): void {
    this._cancelShow()
    this._cancelHide()
    this._token++
    const state = this._open
    if (!state) return
    if (!force && this._resolved(state.anchor).onHide?.(state.anchor, state.el) === false) return
    this._teardown(state)
  }

  private _teardown(state: OpenState): void {
    state.stopAutoUpdate()
    state.observer?.disconnect()
    unregisterPopupLayer(state.layer)

    for (const [el, title] of state.stashed) {
      if (el.getAttribute('title') === null) el.setAttribute('title', title)
      el.removeAttribute('data-mono-title')
    }
    const ids = (state.anchor.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== this._id)
    if (ids.length) state.anchor.setAttribute('aria-describedby', ids.join(' '))
    else if (state.describedBy === null) state.anchor.removeAttribute('aria-describedby')
    else state.anchor.setAttribute('aria-describedby', state.describedBy)

    if (this._open === state) {
      this._open = null
      this._reasons.clear()
    }

    // let the exit transition play, then remove
    const el = state.el
    el.removeAttribute('data-open')
    el.removeAttribute('id') // the next bubble reuses the id
    let done = false
    const remove = () => {
      if (done) return
      done = true
      el.remove()
    }
    el.addEventListener('transitionend', remove, { once: true })
    setTimeout(remove, EXIT_FALLBACK_MS)
  }
}

/**
 * Attach a tooltip to every element `target` names — now or later.
 *
 * ```ts
 * // <script setup> — the elements need not exist yet
 * const tip = controlMonoTooltip('.save-btn', { content: 'Save changes', placement: 'bottom' })
 * onBeforeUnmount(() => tip.destroy())
 * ```
 *
 * `target` is a CSS selector, an element, a list of elements, or a Vue ref /
 * getter of any of those. Light `<mono-*>` elements, shadow `<mono-shadow-*>`
 * hosts and elements inside open shadow roots all match.
 *
 * Needs the optional peers `@floating-ui/dom` + `@floating-ui/core`, loaded on
 * the first show. Options set with `createMonoTooltip` override these.
 */
export function controlMonoTooltip(
  target: MonoTooltipTarget,
  options: MonoTooltipOptions = {},
): MonoTooltipController {
  return new TooltipInstance(target, options)
}

/**
 * @internal — a controller with a per-anchor options layer. Used by the
 * declarative `mono-tooltip-*` attributes (`tooltip-declarative.ts`).
 */
export function createTooltipController(
  target: MonoTooltipTarget,
  options: MonoTooltipOptions,
  anchorOptions: (anchor: Element) => MonoTooltipOptions,
): MonoTooltipController {
  return new TooltipInstance(target, options, anchorOptions)
}

/** Alias, matching the `monoX` / `controlMonoX` pairs of the other controllers. */
export const monoTooltip = controlMonoTooltip

/** @internal — close and forget every live controller. Public as `destroyAllMonoTooltips`. */
export function destroyAllTooltipControllers(): void {
  each((i) => i.destroy())
}
