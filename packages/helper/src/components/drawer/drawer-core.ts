// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'

import type {
  DrawerPosition,
  DrawerSize,
  DrawerColor,
  DrawerSource,
  DrawerCssClass,
  DrawerClickEventDetail,
} from './drawer-types.js'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  optionalNumberConverter,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import {
  autoFullscreenConverter,
  isBelowBreakpoint,
  resolveAutoFullscreen,
  type MonoAutoFullscreen,
} from '../../composables/breakpoints'
import { pathOwnedBy } from '../../composables/popup-portal'
import {
  registerPopupLayer,
  unregisterPopupLayer,
  refreshPopupStack,
  getOpenPopupLayers,
  type PopupLayer,
} from '../../composables/popup-stack'

/**
 * Named slots projected by `mono-drawer` (light: captured; shadow: native).
 *
 * `header` replaces the heading COLUMN — title + subtitle — and beats the
 * `title` / `subtitle` slots and props. The close ✕ always stays. `foot` is
 * accepted as an alias of `footer`.
 */
export type DrawerSlotName = 'header' | 'title' | 'subtitle' | 'body' | 'footer'

/** Per-instance id seed for the light build's heading ids (they live in the
 *  document, so they must be unique). The shadow build scopes ids to its own
 *  root and uses a constant — see `_headingIdBase`. */
let drawerIdSeq = 0

type DrawerSizeValue = string | number | undefined

/**
 * Named dimension presets for `width` / `height` — `width="lg"`, `height="sm"`.
 *
 * The same six tokens the `size` prop uses, on a different axis: `size` is the
 * CONTENT scale (padding, type, close icon) and never touches the panel's box, while
 * these name a MEASURE. `size="sm" width="xl"` is a compact, wide drawer.
 *
 * These are the dimensions the drawer has always shipped — `md` reproduces the
 * stylesheet defaults (`420px` / `50vh`) exactly. Only the axis `position` leaves
 * free is ever read, so a token on the pinned axis is simply inert.
 */
const WIDTH_PRESETS: Record<string, string> = {
  xs: '220px',
  sm: '280px',
  md: '420px',
  lg: '560px',
  xl: '720px',
  xxl: '900px',
}

const HEIGHT_PRESETS: Record<string, string> = {
  xs: '22vh',
  sm: '30vh',
  md: '50vh',
  lg: '70vh',
  xl: '85vh',
  xxl: '95vh',
}

/**
 * Normalize a dimension prop to a CSS length.
 * - a preset token (`"xs"`…`"xxl"`) → the ladder for `axis`
 * - `number` (or a numeric string) → `${n}px`
 * - any other non-empty string → passed through (`"80%"`, `"100vw"`, `"32rem"`)
 * - `null` / `undefined` / `''` → `undefined` ("not set", fall back to the var)
 *
 * Mirrors `toCssSize` in modal-core.ts, ladders included.
 */
function toCssSize(value: DrawerSizeValue, axis: 'width' | 'height'): string | undefined {
  if (value === null || value === undefined) return undefined

  if (typeof value === 'number') {
    return Number.isFinite(value) ? `${value}px` : undefined
  }

  const trimmed = String(value).trim()
  if (trimmed === '') return undefined

  const preset = (axis === 'width' ? WIDTH_PRESETS : HEIGHT_PRESETS)[trimmed.toLowerCase()]
  if (preset) return preset
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`

  return trimmed
}

/**
 * `MonoDrawerCore` — render-mode-agnostic logic for `mono-drawer`: props/hybrid
 * aliases, the open/close model (`show`/`hide`/`toggle` + `mno-*` events), the
 * `PopupLayer` surface (shared z-stack / scroll-lock / topmost-Escape via the
 * SSR-safe `popup-stack`), resizeable-edge logic, and the shared drawer markup
 * (`_renderDrawerBody`). SSR-safe: `popup-stack` no-ops server-side and the
 * `window`/resize access is `isServer`-guarded. Mirrors `modal-core.ts`.
 *
 * Each build supplies the render root + slot/icon strategy:
 *  - light (`mono-drawer.ts`): a `<body>` portal that IS the `.mono-drawer` root,
 *    `data-mono-slot` placeholders, UnoCSS `.i-mdi-close`.
 *  - shadow (`mono-drawer.shadow.ts`): a real shadow root with an inner
 *    `.mono-drawer` root, native `<slot>`s, inline-SVG ✕.
 */
export const MonoDrawerCore = <T extends Constructor<LitElement>>(superClass: T) => {
class MonoDrawerCoreClass extends superClass implements PopupLayer {
  /** Automatic skeleton (`pending`): never automatic for an overlay host — manual `pending` still works. */
  static monoPendingAuto = 'never' as const

  constructor(...args: any[]) {
    super(...args)

    defineHybridPropAliases(this, [
      'modelValue',
      'cssClass',
      'closeOnEscape',
      'closeOnOverlay',
      'lockScroll',
      'autoFullscreen',
      'zIndex',
    ])

    Object.defineProperty(this, 'css-class', {
      get: () => this.cssClass,
      set: (value: unknown) => this._setCssClass(value),
      configurable: true,
      enumerable: false,
    })

    Object.defineProperty(this, 'cssclass', {
      get: () => this.cssClass,
      set: (value: unknown) => this._setCssClass(value),
      configurable: true,
      enumerable: false,
    })
  }

  static get observedAttributes(): string[] {
    // @ts-ignore — `super` statics are untyped through the generic mixin base.
    const base: string[] = super.observedAttributes ?? []
    return [...base, 'modelvalue', 'css-class', 'cssclass']
  }

  override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (oldValue === newValue) return

    if (name === 'modelvalue') {
      this.modelValue = booleanStringConverter.fromAttribute(newValue)
      return
    }

    if (name === 'css-class' || name === 'cssclass') {
      this._setCssClass(newValue)
    }
  }

  @property({ type: String })
  position: DrawerPosition = 'right'

  @property({ type: String })
  size: DrawerSize = 'md'

  @property({ type: String })
  color: DrawerColor = 'primary'

  /**
   * Heading text shown in the drawer header. Field + attribute are both
   * `title`, no reflection. A host `title` attribute would still raise the
   * browser's native tooltip over everything rendered inside the host (the
   * shadow build's panel IS inside it), so both builds stamp `title=""` on the
   * rendered root to cancel it.
   */
  @property({ type: String })
  title = ''

  /**
   * Secondary line under the title (Basecoat's drawer description — muted,
   * smaller). Hidden when empty. `slot="subtitle"` replaces it; `slot="header"`
   * replaces title + subtitle together.
   */
  @property({ type: String })
  subtitle = ''

  @property({
    attribute: 'model-value',
    reflect: true,
    converter: booleanStringConverter,
  })
  modelValue = false

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  dismissible = true

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  persistent = false

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  overlay = true

  @property({
    attribute: 'close-on-escape',
    converter: booleanStringConverter,
  })
  closeOnEscape = true

  /**
   * Clicking OUTSIDE the panel closes the drawer (default `true`). With an overlay
   * that is the backdrop; with `overlay="false"` the page itself is the outside —
   * a document listener closes the drawer and the click still reaches whatever
   * was under it (the page stays interactive, the panel just goes). `persistent`
   * and `dismissible="false"` gate both the same way.
   */
  @property({
    attribute: 'close-on-overlay',
    converter: booleanStringConverter,
  })
  closeOnOverlay = true

  @property({
    attribute: 'lock-scroll',
    converter: booleanStringConverter,
  })
  lockScroll = true

  /**
   * Allow the user to resize the drawer by dragging a handle on the panel's
   * inner edge — width for left/right drawers, height for top/bottom. Single
   * lowercase word, so no hybrid alias is needed.
   */
  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  resizeable = false

  /**
   * Fill the screen at a breakpoint and below. `auto-fullscreen` on its own means
   * Tailwind's `sm` (< 640px); pass a token to move the boundary —
   * `auto-fullscreen="lg"` covers everything `lg:` does not match (< 1024px).
   *
   * The drawer keeps its `position`: a `right` drawer still slides in from the
   * right, it just covers the viewport. Sizing is done by `@media` blocks in
   * `drawer.css` keyed on the `auto-fullscreen-<bp>` class rather than by measuring
   * the viewport in JS — the server has no viewport, and lit's hydration would
   * record a wrong server guess as already-committed (see `sidebar-core.ts`).
   */
  @property({
    attribute: 'auto-fullscreen',
    converter: autoFullscreenConverter,
  })
  autoFullscreen: MonoAutoFullscreen = false

  /**
   * Allow this drawer to stack on top of others. When `false` (default) the
   * drawer is exclusive — opening it closes any other open drawers. Set
   * `stackable` to let drawers stack (single lowercase word, so no hybrid alias).
   */
  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  stackable = false

  /**
   * Panel dimensions. A preset token (`"xs"`…`"xxl"`, resolved through
   * `WIDTH_PRESETS` / `HEIGHT_PRESETS` above), a CSS length string (`"12rem"`,
   * `"80%"`, `"100vw"`), or a number / numeric string, interpreted as px.
   *
   * Independent of `size`, which is the content scale — `size="sm"` with
   * `width="xl"` is a compact, wide drawer.
   *
   * `width` drives left/right drawers and `height` top/bottom ones — the other axis
   * is pinned to the viewport edge by `position`, so setting it has no effect there.
   * `width="100%"` replaces the old `size="full"`.
   *
   * These are applied as the PUBLIC `--mono-drawer-width` / `--mono-drawer-height`
   * vars rather than inline panel styles, because that is the same channel the
   * resize handle writes to — so dragging keeps working and simply overrides the
   * prop until it is next assigned.
   */
  @property({ type: String })
  width?: DrawerSizeValue

  @property({ type: String })
  height?: DrawerSizeValue

  /**
   * Pin this drawer to an explicit stacking level instead of the one the shared
   * popup stack assigns.
   *
   * Leave it unset for the normal behaviour: `composables/popup-stack` hands every
   * open layer a slot (base 1000, +10 per layer) so the newest is always on top.
   * Set it when the drawer has to sit relative to something outside mono's control —
   * a host app's sticky header, a third-party widget, a legacy `z-index` soup.
   *
   * The value is the OVERLAY's level; the panel renders at `z-index + 1` (see
   * drawer.css). Accepts `z-index="1500"`, `:z-index="1500"` and `:zIndex="1500"`.
   */
  @property({ attribute: 'z-index', converter: optionalNumberConverter })
  zIndex?: number

  @property({ attribute: false })
  cssClass: DrawerCssClass = {}

  /**
   * Plain HTML root class fallback:
   *
   * <mono-drawer css-class="premium-drawer"></mono-drawer>
   */
  @property({ attribute: false })
  cssClassName = ''

  @state()
  protected _slotsCaptured = false

  @state()
  protected _hasHeaderSlotState = false

  @state()
  protected _hasTitleSlotState = false

  @state()
  protected _hasSubtitleSlotState = false

  @state()
  protected _hasBodySlotState = false

  @state()
  protected _hasFooterSlotState = false

  /** True when another drawer is stacked above this one (drives the
   *  `has-drawer-above` class so its backdrop is hidden — see drawer.css). */
  @state()
  private _hasDrawerAbove = false

  /** True while the user is resizing the panel by its inner-edge handle. */
  @state()
  private _resizing = false

  /** Current z-index slot assigned by the shared stack (CSS `--drawer-z`). Light
   *  pushes it onto the portal; shadow reads it into the inner root's style. */
  @state()
  protected _drawerZ = 9990

  /** Pointer + panel size captured at resize start. */
  private _resizeStartX = 0
  private _resizeStartY = 0
  private _resizeBaseW = 0
  private _resizeBaseH = 0

  @query('.mono-drawer-panel')
  protected _panelEl?: HTMLElement

  /** Duck-type marker so the exclusive-close logic targets only OTHER drawers in
   *  the shared stack (not modals/dropdowns) without an `instanceof` that the
   *  light + shadow builds — distinct classes — would each fail. */
  protected get _isMonoDrawer(): boolean {
    return true
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.modelValue) this._applyOpenSideEffects()
  }

  override disconnectedCallback(): void {
    this._releaseSideEffects()
    this._teardownResize()
    super.disconnectedCallback()
  }

  override willUpdate(changed: Map<string, unknown>): void {
    // nuxt-ssr-lit forwards a bare boolean attribute as the PROPERTY string `""`
    // (these use `booleanStringConverter`, not `type:Boolean`) — coerce so the
    // server and client renders match. See project_shadow_boolean_prop_ssr.
    // NOTE: `autoFullscreen` is deliberately NOT in this list. It is a
    // boolean-or-breakpoint union, and `autoFullscreenConverter` already maps `""`
    // to `true`; coercing it here would turn `"lg"` into a plain boolean.
    for (const key of [
      'modelValue', 'dismissible', 'persistent', 'overlay',
      'closeOnEscape', 'closeOnOverlay', 'lockScroll', 'resizeable', 'stackable',
    ] as const) {
      if (typeof (this as any)[key] === 'string') {
        ;(this as any)[key] = this._toBoolean((this as any)[key])
      }
    }

    if (changed.has('modelValue')) {
      if (this.modelValue) {
        this._applyOpenSideEffects()
      } else {
        this._releaseSideEffects()
      }
    }

    // @ts-ignore — super may not declare willUpdate through the generic base.
    super.willUpdate?.(changed)
  }

  protected override updated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare updated through the generic base.
    super.updated?.(changed)
    if (isServer) return
    // After render: the `.mono-drawer` root (portal in the light build, inner root
    // in the shadow one) has to exist before the vars can be written to it.
    if (changed.has('width') || changed.has('height')) this._applyDimensionProps()

    // A bound `:z-index` that changes while the drawer is OPEN moves the floor the
    // popup stack hands out, so every layer above this one has to be re-levelled.
    // The drawer's own level is republished by each build's `updated()` regardless;
    // this is only about the selects/dropdowns already open on top of it.
    if (changed.has('zIndex') && this.modelValue) refreshPopupStack()
    // `lockScroll` flipped on an already-open overlay: membership has not changed, so
    // neither register nor unregister runs and the lock would otherwise stay as it was
    // until this closes. `refreshPopupStack` re-runs the lock as well as the order.
    if (changed.has('lockScroll') && this.modelValue) refreshPopupStack()
    // `overlay` flipped while open: the backdrop takes over, or hands over — and
    // `hasBackdrop` follows it, so the dialogs below must re-decide whether their
    // own overlay is still covered.
    if (changed.has('overlay') && this.modelValue) {
      this._syncOutsideClick()
      refreshPopupStack()
    }
  }

  /**
   * Publish `width`/`height` as the public sizing vars.
   *
   * Deliberately the same vars the resize handle writes (`_setDrawerSizeVar`) rather
   * than an inline panel style: that keeps one channel for dimensions, so dragging
   * still works and a later prop change simply re-asserts. Clearing a prop removes
   * the var so the stylesheet default comes back.
   */
  private _applyDimensionProps(): void {
    const width = toCssSize(this.width, 'width')
    const height = toCssSize(this.height, 'height')

    if (width) this._setDrawerSizeVar('--mono-drawer-width', width)
    else this._removeDrawerSizeVar('--mono-drawer-width')

    if (height) this._setDrawerSizeVar('--mono-drawer-height', height)
    else this._removeDrawerSizeVar('--mono-drawer-height')
  }

  /** `auto-fullscreen-<bp>` for the CSS to key its media blocks on, else null. */
  protected get _autoFullscreenClass(): string | null {
    const bp = resolveAutoFullscreen(this.autoFullscreen)
    return bp ? `auto-fullscreen-${bp}` : null
  }

  /**
   * Whether auto-fullscreen is in force RIGHT NOW. Only for pointer handlers that
   * CSS cannot reach — never for rendering, which would reintroduce the SSR
   * viewport-guess problem the `@media` approach exists to avoid.
   */
  protected get _autoFullscreenActive(): boolean {
    const bp = resolveAutoFullscreen(this.autoFullscreen)
    return !!bp && isBelowBreakpoint(bp)
  }

  /** The state-class list for the `.mono-drawer` root (light: on the portal;
   *  shadow: on the inner root). */
  protected _computeDrawerClasses(): string[] {
    return [
      'mono-drawer',
      this.size,
      this.color,
      `position-${this.position}`,
      this.modelValue ? 'open' : 'closed',
      this.overlay ? null : 'no-overlay',
      this.persistent ? 'persistent' : null,
      this.dismissible ? null : 'no-dismiss',
      this._hasDrawerAbove ? 'has-drawer-above' : null,
      this.resizeable ? 'resizeable' : null,
      this._autoFullscreenClass,
      this._resizing ? 'resizing' : null,
      this.cssClassName || null,
      this.cssClass?.root || null,
    ].filter((c): c is string => Boolean(c))
  }

  /**
   * The prop mirrors and the states, for the same root the classes go on — the
   * `<body>` portal in the light build, the inner root in the shadow one. Each
   * is omitted at its default so `:not([mono-size])` means "md" and
   * `:not([mono-position])` means RIGHT for hand-written markup exactly as they
   * do for the element.
   */
  protected _computeRootAttrs(): Record<string, string | null> {
    return {
      'mono-size': this.size === 'md' ? null : this.size,
      'mono-color': this.color === 'primary' ? null : this.color,
      'mono-position': this.position === 'right' ? null : this.position,
      'mono-open': this.modelValue ? '' : null,
      'mono-no-overlay': this.overlay ? null : '',
      'mono-persistent': this.persistent ? '' : null,
      'mono-no-dismiss': this.dismissible ? null : '',
      'mono-has-drawer-above': this._hasDrawerAbove ? '' : null,
      'mono-resizeable': this.resizeable ? '' : null,
      'mono-resizing': this._resizing ? '' : null,
      'mono-auto-fullscreen': this._autoFullscreenClass
        ? this._autoFullscreenClass.replace('auto-fullscreen-', '')
        : null,
    }
  }

  protected _applyRootAttrs(root: HTMLElement | null | undefined): void {
    if (!root) return
    if (!root.hasAttribute('mono-drawer')) root.setAttribute('mono-drawer', '')
    for (const [name, value] of Object.entries(this._computeRootAttrs())) {
      if (value === null) root.removeAttribute(name)
      else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
    }
  }

  /**
   * The shadow build's inner root. The light build's root is the `<body>`
   * portal it owns, so it applies these from its own class/attribute sync.
   */
  protected _rootEl: HTMLElement | null = null

  protected bindRoot = (el: Element | undefined): void => {
    this._rootEl = (el as HTMLElement) ?? null
    this._applyRootAttrs(this._rootEl)
  }

  protected _setCssClass(value: unknown): void {
    if (value == null) {
      this.cssClass = {}
      this.cssClassName = ''
      return
    }

    if (typeof value === 'object') {
      this.cssClass = value as DrawerCssClass
      return
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()

      if (!trimmed) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.cssClass = JSON.parse(trimmed) as DrawerCssClass
          return
        } catch {
          // fall through
        }
      }

      this.cssClassName = trimmed
    }
  }

  protected _cls(base: string, key: keyof DrawerCssClass): string {
    const extra = this.cssClass?.[key]
    return extra ? `${base} ${extra}` : base
  }

  protected _toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value

    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return normalized === '' || normalized === 'true'
    }

    return Boolean(value)
  }

  /**
   * Join the shared stack: assigns z-order, coordinates body-scroll lock, and
   * arms the shared Escape listener. Per-drawer scroll-lock / Escape behaviour
   * is owned by the stack manager so nesting works (see composables/popup-stack).
   */
  protected _applyOpenSideEffects(): void {
    // Non-stackable drawers are exclusive: opening one closes any other open
    // drawers first (other layer types in the shared stack are left untouched).
    if (!this.stackable) {
      // Copied: `getOpenPopupLayers()` returns the LIVE stack array, and `hide()`
      // splices the layer out of it. Iterating it directly skipped every second
      // match, leaving drawers open that were supposed to be closed.
      for (const other of [...getOpenPopupLayers()]) {
        if (
          other !== this &&
          (other as PopupLayer & { _isMonoDrawer?: boolean })._isMonoDrawer
        ) {
          ;(other as PopupLayer & { hide?: (s: DrawerSource) => void }).hide?.('manual')
        }
      }
    }
    registerPopupLayer(this)
    this._syncOutsideClick()
  }

  protected _releaseSideEffects(): void {
    unregisterPopupLayer(this)
    this._unbindOutsideClick()
  }

  // ── outside click without an overlay ────────────────────────────────────
  //
  // Same mechanism as mono-modal. With an overlay the backdrop IS the outside;
  // without one it is `display: none`, a page click reaches the page and nothing
  // sees it — the drawer could only be closed by ✕ or Escape. So while a
  // no-overlay drawer is open a document `click` listener stands in for the
  // backdrop. Bubble phase, never `stopPropagation`: the click goes THROUGH.

  private _outsideBound = false
  private _outsideArm: ReturnType<typeof setTimeout> | null = null
  private _openedAt = 0

  /** Bind when open without an overlay, unbind otherwise — safe to call repeatedly. */
  private _syncOutsideClick(): void {
    if (isServer) return
    const wanted = this.modelValue && !this.overlay
    if (wanted && !this._outsideBound && !this._outsideArm) {
      // Armed a tick later: the click that called `show()` is still dispatching
      // and would otherwise close the drawer it just opened.
      this._openedAt = performance.now()
      this._outsideArm = setTimeout(() => {
        this._outsideArm = null
        if (!this.modelValue || this.overlay) return
        document.addEventListener('click', this._onOutsideClick)
        this._outsideBound = true
      }, 0)
    } else if (!wanted) {
      this._unbindOutsideClick()
    }
  }

  private _unbindOutsideClick(): void {
    if (this._outsideArm) {
      clearTimeout(this._outsideArm)
      this._outsideArm = null
    }
    if (this._outsideBound) {
      document.removeEventListener('click', this._onOutsideClick)
      this._outsideBound = false
    }
  }

  private _onOutsideClick = (event: MouseEvent): void => {
    if (!this.modelValue || this.overlay) return
    if (!this.closeOnOverlay || !this.dismissible || this.persistent) return
    if (event.timeStamp <= this._openedAt) return
    // Topmost only — the same rule Escape follows. A drawer under another dialog,
    // or under an open select / dropdown, leaves the click to the layer above.
    const layers = getOpenPopupLayers()
    if (layers[layers.length - 1] !== this) return
    // Inside: the host, its render root (the body portal in the light build; the
    // shadow build's path carries the host itself), or a popup opened from within.
    const root = this.renderRoot instanceof Element ? this.renderRoot : null
    if (pathOwnedBy(event.composedPath(), root ? [this, root] : [this])) return
    this.hide('overlay', event)
  }

  /** Body-scroll lock is wanted while this drawer is open and `lockScroll` is set. */
  public get lockBodyScroll(): boolean {
    return this.lockScroll
  }

  /**
   * Whether this drawer dims what is beneath it — see `isTopBackdrop` in popup-stack.
   * Only while `overlay` is on: an `overlay="false"` drawer stacked above another
   * dialog used to count as a backdrop, so the one below hid its overlay and
   * nothing dimmed the page at all.
   */
  public get hasBackdrop(): boolean {
    return this.overlay
  }

  /** Topmost-only Escape from the shared stack — close unless persistent. */
  public onStackEscape(event: KeyboardEvent): void {
    if (this.closeOnEscape && !this.persistent) {
      this.hide('escape', event)
    }
  }

  /**
   * Called by the stack manager whenever stack order changes. `z` raises this
   * drawer's overlay + panel above the ones below; when another backdrop layer
   * sits above it (`isTopBackdrop` is false) its own backdrop is hidden so
   * stacked overlays don't compound. An `overlay="false"` modal/drawer above
   * does not count (see `hasBackdrop`). Both builds read `_drawerZ` into the
   * `.mono-drawer` root's `--drawer-z`.
   */
  public setStackZ(z: number, isTopBackdrop: boolean): void {
    this._drawerZ = z
    this._hasDrawerAbove = !isTopBackdrop
  }

  /**
   * PopupLayer hook — the level this drawer pins itself to, or `undefined` to take
   * the stack's slot. The stack reads it so layers opened ABOVE a pinned drawer
   * clear it instead of landing back at the base (see popup-stack).
   *
   * Coerced through `Number` rather than read directly because the prop can arrive
   * as a numeric STRING — a plain `z-index="1500"` attribute goes through the
   * converter, but `el.zIndex = '1500'` (or a framework binding that stringifies)
   * does not.
   *
   * `null` and `''` are screened out FIRST, and that guard is load-bearing:
   * `Number(null)` and `Number('')` are both `0` and both finite, so `:z-index="null"`
   * — Vue's ordinary spelling for "no value" — used to pin the drawer to `z-index: 0`
   * and drop it behind the page. Only the attribute path was safe, because
   * `optionalNumberConverter` maps `''`/`null` to `undefined`; the PROPERTY path,
   * which is what Vue actually uses (the hybrid alias makes `'z-index' in el` true),
   * was not.
   */
  public get pinnedZ(): number | undefined {
    const raw = this.zIndex as unknown

    if (raw === null || raw === undefined) return undefined
    if (typeof raw === 'string' && raw.trim() === '') return undefined

    const manual = Number(raw)

    return Number.isFinite(manual) ? manual : undefined
  }

  /**
   * The level actually published to CSS: the `zIndex` prop when the consumer set
   * one, otherwise the stack's slot.
   */
  protected get _effectiveZ(): number {
    return this.pinnedZ ?? this._drawerZ
  }

  /* ----------------------------- Resizing ----------------------------- */

  private get _isHorizontal(): boolean {
    return this.position === 'left' || this.position === 'right'
  }

  /**
   * Apply a sizing CSS var to the `.mono-drawer` root. Build hook: light writes
   * to the portal; shadow (default here) writes to the inner root element.
   */
  protected _setDrawerSizeVar(name: string, value: string): void {
    const root = this.renderRoot.querySelector('.mono-drawer') as HTMLElement | null
    root?.style.setProperty(name, value)
  }

  /** Counterpart of {@link _setDrawerSizeVar} — same build hook, same root. */
  protected _removeDrawerSizeVar(name: string): void {
    const root = this.renderRoot.querySelector('.mono-drawer') as HTMLElement | null
    root?.style.removeProperty(name)
  }

  protected _onResizeStart = (event: PointerEvent): void => {
    if (isServer || typeof window === 'undefined') return
    if (!this.resizeable || event.button !== 0) return
    // The handle is `display: none` under auto-fullscreen, so this is normally
    // unreachable — but a drag that somehow started would write
    // `--mono-drawer-width` for a panel the media block is sizing, and the drawer
    // would snap to that stale width the moment the viewport grew back.
    if (this._autoFullscreenActive) return

    event.preventDefault()
    event.stopPropagation()

    const rect = this._panelEl?.getBoundingClientRect()
    this._resizeBaseW = rect?.width ?? 0
    this._resizeBaseH = rect?.height ?? 0
    this._resizeStartX = event.clientX
    this._resizeStartY = event.clientY
    this._resizing = true

    window.addEventListener('pointermove', this._onResizeMove)
    window.addEventListener('pointerup', this._onResizeEnd, { once: true })
    window.addEventListener('pointercancel', this._onResizeEnd, { once: true })
  }

  private _onResizeMove = (event: PointerEvent): void => {
    if (typeof window === 'undefined') return

    const MIN = 200

    if (this._isHorizontal) {
      // right: handle on the left edge → dragging left grows width.
      // left:  handle on the right edge → dragging right grows width.
      const delta =
        this.position === 'right'
          ? this._resizeStartX - event.clientX
          : event.clientX - this._resizeStartX
      const next = Math.max(MIN, Math.min(this._resizeBaseW + delta, window.innerWidth))
      this._setDrawerSizeVar('--mono-drawer-width', `${next}px`)
    } else {
      // top:    handle on the bottom edge → dragging down grows height.
      // bottom: handle on the top edge → dragging up grows height.
      const delta =
        this.position === 'top'
          ? event.clientY - this._resizeStartY
          : this._resizeStartY - event.clientY
      const next = Math.max(MIN, Math.min(this._resizeBaseH + delta, window.innerHeight))
      this._setDrawerSizeVar('--mono-drawer-height', `${next}px`)
    }
  }

  private _onResizeEnd = (): void => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this._onResizeMove)
    }
    this._resizing = false
  }

  private _teardownResize(): void {
    if (typeof window === 'undefined') return
    window.removeEventListener('pointermove', this._onResizeMove)
    window.removeEventListener('pointerup', this._onResizeEnd)
    window.removeEventListener('pointercancel', this._onResizeEnd)
  }

  /**
   * Every open-state change emits `toggle` (historically `mno-click`, which is
   * kept), then the transition-specific `open` / `close`. `toggle` rather than
   * a plain `click`: a real click from inside the panel already bubbles to the
   * host on its own, and this is not one — it is a state change.
   */
  private _emitChange(detail: DrawerClickEventDetail): void {
    dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })

    if (detail.value && !detail.oldValue) {
      dispatchMonoEvent(this, 'open', detail)
    } else if (!detail.value && detail.oldValue) {
      dispatchMonoEvent(this, 'close', detail)
    }
  }

  public show(source: DrawerSource = 'manual', sourceEvent?: Event): void {
    if (this.modelValue) return

    const oldValue = this.modelValue
    this.modelValue = true

    this._emitChange({
      modelValue: true,
      currentValue: true,
      oldValue,
      value: true,
      source,
      sourceEvent,
    })
  }

  public hide(source: DrawerSource = 'manual', sourceEvent?: Event): void {
    if (!this.modelValue) return

    const oldValue = this.modelValue
    this.modelValue = false

    this._emitChange({
      modelValue: false,
      currentValue: false,
      oldValue,
      value: false,
      source,
      sourceEvent,
    })
  }

  public toggle(source: DrawerSource = 'manual', sourceEvent?: Event): void {
    if (this.modelValue) {
      this.hide(source, sourceEvent)
    } else {
      this.show(source, sourceEvent)
    }
  }

  private _handleClose(event: Event): void {
    if (!this.dismissible) return
    this.hide('close', event)
  }

  private _handleOverlayClick(event: Event): void {
    if (!this.closeOnOverlay || !this.dismissible || this.persistent) return
    this.hide('overlay', event)
  }

  /** Title / subtitle / heading-column presence, shared by the head render and
   *  the dialog's `aria-labelledby` / `aria-describedby`. */
  protected get _headingState(): { title: boolean; subtitle: boolean; heading: boolean } {
    const title = !!this.title || this._hasTitleSlotState
    const subtitle = !!this.subtitle || this._hasSubtitleSlotState
    return { title, subtitle, heading: this._hasHeaderSlotState || title || subtitle }
  }

  private _idSeq?: number

  /**
   * Prefix of the heading ids (`<base>-heading` / `-title` / `-subtitle`). The
   * light build's panel lives in the document, so the ids must be unique per
   * instance; the shadow build overrides this with a constant (ids are scoped to
   * its own root, and a counter would differ between server and client).
   */
  protected get _headingIdBase(): string {
    this._idSeq ??= ++drawerIdSeq
    return `mono-drawer-${this._idSeq}`
  }

  /** `aria-labelledby` / `aria-describedby` for the `role="dialog"` root. A
   *  `slot="header"` labels the dialog with its whole column; otherwise the
   *  title labels it and the subtitle describes it. */
  protected _headingAria(): { labelledby?: string; describedby?: string } {
    const s = this._headingState
    const base = this._headingIdBase
    if (this._hasHeaderSlotState) return { labelledby: `${base}-heading` }
    return {
      labelledby: s.title ? `${base}-title` : undefined,
      describedby: s.subtitle ? `${base}-subtitle` : undefined,
    }
  }

  private _renderHead(): TemplateResult | typeof nothing {
    const s = this._headingState
    const hasContent = s.heading || this.dismissible

    if (!hasContent && !this._slotsAlwaysRender) return nothing

    const base = this._headingIdBase

    // The heading column (title + subtitle) — the `header` slot's fallback. The
    // ✕ sits OUTSIDE the column, so a `slot="header"` never removes it.
    const heading = html`
      <div
        class=${this._cls('mono-drawer-title', 'title')}
        mono-title
        id=${`${base}-title`}
        ?mono-empty=${!s.title}
      >${this._slotOutlet('title', this.title || nothing)}</div>
      <div
        class=${this._cls('mono-drawer-subtitle', 'subtitle')}
        mono-subtitle
        id=${`${base}-subtitle`}
        ?mono-empty=${!s.subtitle}
      >${this._slotOutlet('subtitle', this.subtitle || nothing)}</div>
    `

    return html`
      <div
        class=${this._cls('mono-drawer-head', 'head')}
        mono-header
        ?mono-empty=${!hasContent}
      >
        <div
          class=${this._cls('mono-drawer-heading', 'heading')}
          mono-heading
          id=${`${base}-heading`}
          ?mono-empty=${!s.heading}
        >
          ${this._slotOutlet('header', heading)}
        </div>
        ${this.dismissible
          ? html`
              <button
                type="button"
                class=${this._cls('mono-drawer-close', 'close')}
                mono-close
                aria-label="Close drawer"
                @click=${this._handleClose}
              >
                ${this.renderIcon('close')}
              </button>
            `
          : nothing}
      </div>
    `
  }

  private _renderFoot(): TemplateResult | typeof nothing {
    if (!this._hasFooterSlotState && !this._slotsAlwaysRender) return nothing

    return html`
      <div
        class=${this._cls('mono-drawer-foot', 'foot')}
        mono-footer
        ?mono-empty=${!this._hasFooterSlotState}
      >
        ${this._slotOutlet('footer')}
      </div>
    `
  }

  /** Shared drawer markup (overlay + panel[resizer + head + body + foot]). The
   *  light build renders this directly into the portal (which IS `.mono-drawer`);
   *  the shadow build wraps it in an inner `.mono-drawer` root. */
  protected _renderDrawerBody(): TemplateResult {
    return html`
      <div
        class=${this._cls('mono-drawer-overlay', 'overlay')}
        mono-overlay
        @click=${this._handleOverlayClick}
      ></div>
      <div
        class=${this._cls('mono-drawer-panel', 'panel')}
        mono-panel
        role="document"
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${this.resizeable
          ? html`<div
              class=${this._cls('mono-drawer-resizer', 'resizer')}
              mono-resizer
              role="separator"
              aria-orientation=${this._isHorizontal ? 'vertical' : 'horizontal'}
              @pointerdown=${this._onResizeStart}
            ></div>`
          : nothing}
        ${this._renderHead()}
        <div class=${this._cls('mono-drawer-body', 'body')} mono-body>
          ${this._slotOutlet('body')}
        </div>
        ${this._renderFoot()}
      </div>
    `
  }

  // --- build hooks -----------------------------------------------------------

  /** Whether the slot regions render even when empty. Light: no (omit empty
   *  regions). Shadow: yes — the native `<slot>`s must exist to project DSD
   *  content + be scanned (hidden via `[data-empty]` when empty). */
  protected get _slotsAlwaysRender(): boolean {
    return false
  }

  protected _hasSlot(name: DrawerSlotName): boolean {
    return name === 'header'
      ? this._hasHeaderSlotState
      : name === 'title'
        ? this._hasTitleSlotState
        : name === 'subtitle'
          ? this._hasSubtitleSlotState
          : name === 'body'
            ? this._hasBodySlotState
            : this._hasFooterSlotState
  }

  protected _setSlotState(name: DrawerSlotName, has: boolean): void {
    if (name === 'header') this._hasHeaderSlotState = has
    else if (name === 'title') this._hasTitleSlotState = has
    else if (name === 'subtitle') this._hasSubtitleSlotState = has
    else if (name === 'body') this._hasBodySlotState = has
    else this._hasFooterSlotState = has
  }

  /**
   * Slot outlet. Light build (default): a `data-mono-slot` placeholder the
   * captured light-DOM nodes are re-parented into when present, else the
   * `fallback`. Shadow build overrides this with a native `<slot name>`.
   */
  protected _slotOutlet(name: DrawerSlotName, fallback: unknown = nothing): TemplateResult {
    return this._hasSlot(name)
      ? html`<span data-mono-slot=${name}></span>`
      : html`${fallback}`
  }

  /** Close ✕. Light (default): UnoCSS icon span. Shadow overrides → inline SVG
   *  (global `.i-mdi-close` can't reach a shadow root). */
  protected renderIcon(_name: 'close'): TemplateResult {
    return html`<span class="mono-icon i-mdi-close" aria-hidden="true"></span>`
  }
}

  return MonoDrawerCoreClass as unknown as Constructor<MonoDrawerCoreInterface> & T
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoDrawerCoreInterface implements PopupLayer {
  position: DrawerPosition
  size: DrawerSize
  color: DrawerColor
  title: string
  subtitle: string
  modelValue: boolean
  dismissible: boolean
  persistent: boolean
  overlay: boolean
  closeOnEscape: boolean
  closeOnOverlay: boolean
  lockScroll: boolean
  resizeable: boolean
  autoFullscreen: MonoAutoFullscreen
  stackable: boolean
  zIndex?: number
  width?: string | number
  height?: string | number
  cssClass: DrawerCssClass
  cssClassName: string

  show(source?: DrawerSource, sourceEvent?: Event): void
  hide(source?: DrawerSource, sourceEvent?: Event): void
  toggle(source?: DrawerSource, sourceEvent?: Event): void

  // PopupLayer surface
  get lockBodyScroll(): boolean
  get hasBackdrop(): boolean
  get pinnedZ(): number | undefined
  onStackEscape(event: KeyboardEvent): void
  setStackZ(z: number, isTopBackdrop: boolean): void

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  protected _slotsCaptured: boolean
  protected _hasHeaderSlotState: boolean
  protected _hasTitleSlotState: boolean
  protected _hasSubtitleSlotState: boolean
  protected get _headingState(): { title: boolean; subtitle: boolean; heading: boolean }
  protected get _headingIdBase(): string
  protected _headingAria(): { labelledby?: string; describedby?: string }
  protected _hasBodySlotState: boolean
  protected _hasFooterSlotState: boolean
  protected _drawerZ: number
  protected get _effectiveZ(): number
  protected _panelEl?: HTMLElement
  protected get _isMonoDrawer(): boolean
  protected _computeDrawerClasses(): string[]
  protected _setCssClass(value: unknown): void
  protected _cls(base: string, key: keyof DrawerCssClass): string
  protected _computeRootAttrs(): Record<string, string | null>
  protected _applyRootAttrs(root: HTMLElement | null | undefined): void
  protected bindRoot: (el: Element | undefined) => void
  /** The shadow build's inner root, bound by `bindRoot`. */
  protected _rootEl: HTMLElement | null
  protected _toBoolean(value: unknown): boolean
  protected _applyOpenSideEffects(): void
  protected _releaseSideEffects(): void
  protected _setDrawerSizeVar(name: string, value: string): void
  protected _removeDrawerSizeVar(name: string): void
  protected _onResizeStart: (event: PointerEvent) => void
  protected _renderDrawerBody(): TemplateResult
  protected get _slotsAlwaysRender(): boolean
  protected _hasSlot(name: DrawerSlotName): boolean
  protected _setSlotState(name: DrawerSlotName, has: boolean): void
  protected _slotOutlet(name: DrawerSlotName, fallback?: unknown): TemplateResult
  protected renderIcon(name: 'close'): TemplateResult
}
