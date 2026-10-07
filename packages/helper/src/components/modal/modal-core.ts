// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { styleMap, type StyleInfo } from 'lit/directives/style-map.js'

import type {
  ModalSize,
  ModalColor,
  ModalSource,
  ModalCssClass,
  ModalCloseEventDetail,
  MonoModalController,
} from './modal-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  optionalNumberConverter,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { applyProps, detachEventHandlers } from '../../composables/element-props'
import {
  registerPopupLayer,
  unregisterPopupLayer,
  refreshPopupStack,
  getOpenPopupLayers,
  type PopupLayer,
} from '../../composables/popup-stack'
import {
  autoFullscreenConverter,
  isBelowBreakpoint,
  resolveAutoFullscreen,
  type MonoAutoFullscreen,
} from '../../composables/breakpoints'
import { pathOwnedBy } from '../../composables/popup-portal'

/**
 * Named slots projected by `mono-modal` (light: captured; shadow: native).
 *
 * These are the INTERNAL region names. Consumers may also write `slot="header"`
 * and `slot="footer"` — the drawer's vocabulary — which alias `head` and `foot`.
 * When both spellings are supplied for the same region **the alias wins**; the
 * losing nodes are parked and never rendered.
 *
 * `head` (`header`) replaces the heading COLUMN — title + subtitle — and beats
 * the `title` / `subtitle` slots and props. The close ✕ always stays.
 */
export type ModalSlotName = 'head' | 'title' | 'subtitle' | 'body' | 'foot'

/** Per-instance id seed for the light build's heading ids (they live in the
 *  document, so they must be unique). The shadow build scopes ids to its own
 *  root and uses a constant — see `_headingIdBase`. */
let modalIdSeq = 0

type ModalSizeValue = string | number | undefined

/**
 * Named dimension presets for the sizing props — `width="lg"`, `max-height="sm"`.
 *
 * Deliberately the same six tokens the `size` prop uses, but a different axis:
 * `size` is the CONTENT scale (padding, type, close button, radius) and never
 * touches the panel's box, while these name a MEASURE. `size="sm" width="xl"` is a
 * compact, wide dialog — mixing the two is the point.
 *
 * Widths carry the same viewport clamp as the default `min(90vw, 520px)`, so a
 * preset can never overflow a phone; `md` reproduces that default exactly. Heights
 * are viewport-relative and match the drawer's top/bottom ladder, so one token means
 * the same thing on both components.
 */
const WIDTH_PRESETS: Record<string, string> = {
  xs: 'min(90vw, 300px)',
  sm: 'min(90vw, 380px)',
  md: 'min(90vw, 520px)',
  lg: 'min(90vw, 680px)',
  xl: 'min(95vw, 880px)',
  xxl: 'min(95vw, 1080px)',
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
 * Normalize a sizing prop to a CSS length string.
 * - a preset token (`"xs"`…`"xxl"`) → the ladder for `axis`
 * - `number` (or numeric string) → `${n}px`
 * - any other non-empty string → passed through verbatim (`"12rem"`, `"80%"`, …)
 * - `null` / `undefined` / `''` → `undefined` (treated as "not set")
 *
 * The token lookup runs before the numeric/passthrough branches, which is safe:
 * no CSS length is spelled `xs`…`xxl`, so there is nothing for it to shadow.
 */
function toCssSize(value: ModalSizeValue, axis: 'width' | 'height'): string | undefined {
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
 * `MonoModalCore` — render-mode-agnostic logic for `mono-modal`: props/hybrid
 * aliases, the open/close model (`show`/`hide`/`toggle` + `mno-*` events), the
 * `PopupLayer` surface (shared z-stack / scroll-lock / topmost-Escape via the
 * SSR-safe `popup-stack`), draggable-header logic, sizing, and the shared modal
 * markup (`_renderModalBody`). SSR-safe: `popup-stack` no-ops server-side and the
 * `window`/drag access is `isServer`-guarded.
 *
 * Each build supplies the render root + slot/icon strategy:
 *  - light (`mono-modal.ts`): renders into a `<body>` portal that IS the
 *    `.mono-modal` root, `data-mono-slot` placeholders, UnoCSS `.i-mdi-close`.
 *  - shadow (`mono-modal.shadow.ts`): a real shadow root with an inner
 *    `.mono-modal` root, native `<slot>`s, inline-SVG ✕ (mirrors dropdown).
 */
export const MonoModalCore = <T extends Constructor<LitElement>>(superClass: T) => {
class MonoModalCoreClass extends superClass implements PopupLayer {
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
      // Sizing props — camelCase only. `width`/`height` are intentionally absent:
      // being all-lowercase they self-alias and infinitely recurse, and they need
      // no alias since their attribute + property are already lowercase.
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
      'zIndex',
      'dataModal',
    ])
    // `control-modal` / `controlModal` / `controlmodal` all read and write `dataModal`,
    // the way `controlTable` aliases `dataGrid` and `controlForm` aliases `dataForm`.
    defineHybridPropAlias(this, 'controlModal', 'dataModal')

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
  size: ModalSize = 'md'

  @property({ type: String })
  color: ModalColor = 'primary'

  /**
   * Heading text shown in the modal header. Field + attribute are both `title`,
   * no reflection. A host `title` attribute would still raise the browser's
   * native tooltip over everything rendered inside the host (the shadow build's
   * panel IS inside it), so both builds stamp `title=""` on the rendered root
   * to cancel it.
   */
  @property({ type: String })
  title = ''

  /**
   * Secondary line under the title (Basecoat's dialog description — muted,
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
   * Clicking OUTSIDE the panel closes the modal (default `true`). With an overlay
   * that is the backdrop; with `overlay="false"` the page itself is the outside —
   * a document listener closes the modal and the click still reaches whatever
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
   * Allow the user to drag the modal by its header. While dragging, the panel
   * follows the pointer freely (even past the screen edges); on drop it snaps
   * back so the whole panel stays inside the viewport. Single lowercase word,
   * so no hybrid alias is needed.
   */
  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  draggable = false

  /**
   * Allow this modal to stack on top of others. When `false` (default) the
   * modal is exclusive — opening it closes any other open modals. Set
   * `stackable` to let modals stack (single lowercase word, so no hybrid alias).
   */
  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  stackable = false

  /**
   * Fill the screen at a breakpoint and below. `auto-fullscreen` on its own means
   * Tailwind's `sm` (< 640px); pass a token to move the boundary —
   * `auto-fullscreen="lg"` covers everything `lg:` does not match (< 1024px).
   *
   * The sizing itself is done by `@media` blocks in `modal.css` keyed on the
   * `auto-fullscreen-<bp>` class, NOT by measuring the viewport in JS: the server
   * has no viewport, and lit's hydration would record a wrong server guess as
   * already-committed and never correct it (see the note in `sidebar-core.ts`).
   */
  @property({
    attribute: 'auto-fullscreen',
    converter: autoFullscreenConverter,
  })
  autoFullscreen: MonoAutoFullscreen = false

  @property({ attribute: false })
  cssClass: ModalCssClass = {}

  /**
   * Plain HTML root class fallback:
   *
   * <mono-modal css-class="premium-modal"></mono-modal>
   */
  @property({ attribute: false })
  cssClassName = ''

  /**
   * The controller (`monoModal()` / `controlMonoModal()`) driving this modal — bind
   * with `:control-modal.prop`. Its `props()` are pushed onto this element on every
   * notify (they win over attributes, like a form's `setProp`), `open()`/`close()`
   * arrive as `show()`/`hide()` so the events still fire, and every transition this
   * element makes on its own (✕, overlay, Escape) is reported back so the
   * controller's `isOpen` stays true to the screen.
   */
  @property({ attribute: false })
  dataModal?: MonoModalController

  private _controllerUnsub?: () => void
  private _boundController?: MonoModalController

  private _bindController(): void {
    const next = this.dataModal
    if (this._boundController === next) return
    this._unbindController()
    if (!next) return
    this._boundController = next
    next._register(this)
    this._controllerUnsub = next.subscribe(() => this._applyControllerProps())
    this._applyControllerProps()
  }

  private _unbindController(): void {
    this._controllerUnsub?.()
    this._controllerUnsub = undefined
    this._boundController?._unregister(this)
    this._boundController = undefined
    // Its `props.on*` listeners go with it.
    detachEventHandlers(this)
  }

  private _applyControllerProps(): void {
    const props = this._boundController?.props()
    if (!props) return
    // `modelValue` is state, not a prop — the controller drives it through show()/hide().
    const { modelValue: _m, 'model-value': _mv, modelvalue: _mvl, ...rest } = props as Record<string, unknown>
    applyProps(this, rest)
    this.requestUpdate()
  }

  /**
   * Explicit panel sizing. Each accepts a preset token (`"xs"`…`"xxl"`, resolved
   * through `WIDTH_PRESETS` / `HEIGHT_PRESETS` above), a CSS length string
   * (`"12px"`, `"12rem"`, `"80%"`), or a number / numeric string (px).
   *
   * These are independent of `size`, which is the content scale — `size="sm"`
   * with `width="xl"` is a compact, wide dialog.
   *
   * Setting both `width` and `height` to `"100%"` switches the modal to true
   * full-screen (edge-to-edge, no radius). Kebab attributes (`min-width`) and
   * camelCase property access (`minWidth`) both work — see the constructor.
   */
  @property({ type: String })
  width?: ModalSizeValue

  @property({ type: String })
  height?: ModalSizeValue

  /**
   * Pin this modal to an explicit stacking level instead of the one the shared
   * popup stack assigns.
   *
   * Leave it unset for the normal behaviour: `composables/popup-stack` hands every
   * open layer a slot (base 1000, +10 per layer) so the newest is always on top.
   * Set it when the modal has to sit relative to something outside mono's control —
   * a host app's sticky header, a third-party widget, a legacy `z-index` soup.
   *
   * The value is the OVERLAY's level; the panel renders at `z-index + 1` (see
   * modal.css). Accepts `z-index="1500"`, `:z-index="1500"` and `:zIndex="1500"`.
   */
  @property({ attribute: 'z-index', converter: optionalNumberConverter })
  zIndex?: number

  @property({ type: String, attribute: 'min-width' })
  minWidth?: ModalSizeValue

  @property({ type: String, attribute: 'max-width' })
  maxWidth?: ModalSizeValue

  @property({ type: String, attribute: 'min-height' })
  minHeight?: ModalSizeValue

  @property({ type: String, attribute: 'max-height' })
  maxHeight?: ModalSizeValue

  @state()
  protected _slotsCaptured = false

  @state()
  protected _hasHeadSlotState = false

  @state()
  protected _hasTitleSlotState = false

  @state()
  protected _hasSubtitleSlotState = false

  @state()
  protected _hasBodySlotState = false

  @state()
  protected _hasFootSlotState = false

  /** True when another modal is stacked above this one (drives the
   *  `has-modal-above` class so its backdrop is hidden — see modal.css). */
  @state()
  private _hasModalAbove = false

  /** True while the user is dragging the panel by its header. */
  @state()
  private _dragging = false

  /** Current z-index slot assigned by the shared stack (CSS `--modal-z`). Light
   *  pushes it onto the portal; shadow reads it into the inner root's style. */
  @state()
  protected _modalZ = 600

  /** Current drag offset (px) of the panel from its centered position. */
  private _dragX = 0
  private _dragY = 0
  /** Pointer position and offset captured at drag start. */
  private _dragStartX = 0
  private _dragStartY = 0
  private _dragOriginX = 0
  private _dragOriginY = 0

  @query('.mono-modal-panel')
  protected _panelEl?: HTMLElement

  /** Duck-type marker so the exclusive-close logic targets only OTHER modals in
   *  the shared stack (not drawers/dropdowns) without an `instanceof` that the
   *  light + shadow builds — distinct classes — would each fail. */
  protected get _isMonoModal(): boolean {
    return true
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this._bindController()
    if (this.modelValue) this._applyOpenSideEffects()
  }

  override disconnectedCallback(): void {
    this._unbindController()
    this._releaseSideEffects()
    this._teardownDrag()
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
      'closeOnEscape', 'closeOnOverlay', 'lockScroll', 'draggable', 'stackable',
    ] as const) {
      if (typeof (this as any)[key] === 'string') {
        ;(this as any)[key] = this._toBoolean((this as any)[key])
      }
    }

    if (changed.has('dataModal')) this._bindController()

    if (changed.has('modelValue')) {
      if (this.modelValue) {
        // Each open starts centered — a previous drag shouldn't persist.
        this._resetDrag()
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

    // A bound `:z-index` that changes while the modal is OPEN moves the floor the
    // popup stack hands out, so every layer above this one has to be re-levelled.
    // The modal's own level is republished by each build's `updated()` regardless;
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
   * Full-screen is value-driven: there's no separate flag. Passing both
   * `width` and `height` as `"100%"` means "fill the viewport", which CSS can't
   * do edge-to-edge on its own (the wrap has padding), so we tag the portal and
   * let the `.fullscreen` rules take over.
   */
  protected get _isFullscreen(): boolean {
    return toCssSize(this.width, 'width') === '100%' && toCssSize(this.height, 'height') === '100%'
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

  /** Inline sizing for the panel, overriding the `size` preset / default max-height. */
  protected _panelSizeStyle(): StyleInfo {
    // Full-screen is handled entirely by the `.fullscreen` CSS; emitting inline
    // width/height here would fight that class, so return nothing.
    if (this._isFullscreen) return {}

    const style: StyleInfo = {}

    const width = toCssSize(this.width, 'width')
    const height = toCssSize(this.height, 'height')
    const minWidth = toCssSize(this.minWidth, 'width')
    const maxWidth = toCssSize(this.maxWidth, 'width')
    const minHeight = toCssSize(this.minHeight, 'height')
    const maxHeight = toCssSize(this.maxHeight, 'height')

    if (width) style.width = width
    if (height) style.height = height
    if (minWidth) style['min-width'] = minWidth
    if (maxWidth) style['max-width'] = maxWidth
    if (minHeight) style['min-height'] = minHeight
    if (maxHeight) style['max-height'] = maxHeight

    return style
  }

  /** The state-class list for the `.mono-modal` root (light: on the portal;
   *  shadow: on the inner root). */
  protected _computeModalClasses(): string[] {
    return [
      'mono-modal',
      this.size,
      this.color,
      this.modelValue ? 'open' : 'closed',
      this.overlay ? null : 'no-overlay',
      this.persistent ? 'persistent' : null,
      this.dismissible ? null : 'no-dismiss',
      this._isFullscreen ? 'fullscreen' : null,
      this._autoFullscreenClass,
      this._hasModalAbove ? 'has-modal-above' : null,
      this.draggable ? 'draggable' : null,
      this._dragging ? 'dragging' : null,
      // Consumer strings may hold SEVERAL classes; the light build applies these
      // one by one with `classList.add`, which throws on whitespace and aborted
      // the whole update. Split them into tokens.
      ...(this.cssClassName ?? '').split(/\s+/),
      ...(this.cssClass?.root ?? '').split(/\s+/),
    ].filter((c): c is string => Boolean(c))
  }

  /**
   * The prop mirrors and the states, for the same root the classes go on — the
   * `<body>` portal in the light build, the inner root in the shadow one. Each
   * is omitted at its default so `:not([mono-size])` means "md" for
   * hand-written markup exactly as it does for the element.
   */
  protected _computeRootAttrs(): Record<string, string | null> {
    return {
      'mono-size': this.size === 'md' ? null : this.size,
      'mono-color': this.color === 'primary' ? null : this.color,
      'mono-open': this.modelValue ? '' : null,
      'mono-no-overlay': this.overlay ? null : '',
      'mono-persistent': this.persistent ? '' : null,
      'mono-no-dismiss': this.dismissible ? null : '',
      'mono-fullscreen': this._isFullscreen ? '' : null,
      'mono-auto-fullscreen': this._autoFullscreenClass
        ? this._autoFullscreenClass.replace('auto-fullscreen-', '')
        : null,
      'mono-has-modal-above': this._hasModalAbove ? '' : null,
      'mono-draggable': this.draggable ? '' : null,
      'mono-dragging': this._dragging ? '' : null,
      // The programmatic dialog identifies itself through `cssClassName`, which
      // is a class; mirror it so the ported sheet keys on an attribute like
      // everything else.
      'mono-dialog': this.cssClassName?.split(/\s+/).includes('mono-modal-dialog') ? '' : null,
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

  protected _applyRootAttrs(root: HTMLElement | null | undefined): void {
    if (!root) return
    if (!root.hasAttribute('mono-modal')) root.setAttribute('mono-modal', '')
    for (const [name, value] of Object.entries(this._computeRootAttrs())) {
      if (value === null) root.removeAttribute(name)
      else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
    }
  }

  protected _setCssClass(value: unknown): void {
    if (value == null) {
      this.cssClass = {}
      this.cssClassName = ''
      return
    }

    if (typeof value === 'object') {
      this.cssClass = value as ModalCssClass
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
          this.cssClass = JSON.parse(trimmed) as ModalCssClass
          return
        } catch {
          // fall through
        }
      }

      this.cssClassName = trimmed
    }
  }

  protected _cls(base: string, key: keyof ModalCssClass): string {
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
   * arms the shared Escape listener. Per-modal scroll-lock / Escape behaviour
   * is owned by the stack manager so nesting works (see composables/popup-stack).
   */
  protected _applyOpenSideEffects(): void {
    // Non-stackable modals are exclusive: opening one closes any other open
    // modals first (other layer types in the shared stack are left untouched).
    if (!this.stackable) {
      // Copied: `getOpenPopupLayers()` returns the LIVE stack array, and `hide()`
      // splices the layer out of it. Iterating it directly skipped every second
      // match, leaving modals open that were supposed to be closed.
      for (const other of [...getOpenPopupLayers()]) {
        if (
          other !== this &&
          (other as PopupLayer & { _isMonoModal?: boolean })._isMonoModal
        ) {
          ;(other as PopupLayer & { hide?: (s: ModalSource) => void }).hide?.('manual')
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
  // With an overlay the backdrop IS the outside and its click handler closes the
  // modal. Without one the backdrop is `display: none` and the panel wrap is
  // `pointer-events: none`, so a click on the page reaches the page and nothing
  // ever sees it — the modal could only be closed by ✕ or Escape. So while a
  // no-overlay modal is open a document `click` listener stands in for the
  // backdrop. Bubble phase, never `stopPropagation`: the page target has already
  // handled its click by the time this runs, so the click goes THROUGH.

  private _outsideBound = false
  private _outsideArm: ReturnType<typeof setTimeout> | null = null
  private _openedAt = 0

  /** Bind when open without an overlay, unbind otherwise — safe to call repeatedly. */
  private _syncOutsideClick(): void {
    if (isServer) return
    const wanted = this.modelValue && !this.overlay
    if (wanted && !this._outsideBound && !this._outsideArm) {
      // Armed a tick later: the click that called `show()` is still dispatching
      // and would otherwise close the modal it just opened.
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
    // Topmost only — the same rule Escape follows. A modal under another dialog,
    // or under an open select / dropdown, leaves the click to the layer above:
    // a click on a stacked modal's backdrop must not also close this one, and
    // the first click outside an open select inside the panel closes the select.
    const layers = getOpenPopupLayers()
    if (layers[layers.length - 1] !== this) return
    // Inside: the host, its render root (the body portal in the light build, the
    // shadow root's panel in the shadow build), or a popup opened from within.
    const root = this.renderRoot instanceof Element ? this.renderRoot : null
    const path = event.composedPath()
    if (pathOwnedBy(path, root ? [this, root] : [this])) return
    this.hide('overlay', event)
  }

  /** Body-scroll lock is wanted while this modal is open and `lockScroll` is set. */
  public get lockBodyScroll(): boolean {
    return this.lockScroll
  }

  /**
   * Whether this modal dims what is beneath it — see `isTopBackdrop` in popup-stack.
   * Only while `overlay` is on: an `overlay="false"` modal stacked above another
   * used to count as a backdrop, so the one below hid its overlay and nothing
   * dimmed the page at all.
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
   * modal above the ones below; when another backdrop layer sits above it
   * (`isTopBackdrop` is false) its own backdrop is hidden so stacked overlays
   * don't compound. A backdrop-less popup above it does not count — nor does an
   * `overlay="false"` modal/drawer (see `hasBackdrop`). Both builds
   * read `_modalZ` into the `.mono-modal` root's `--modal-z`.
   */
  public setStackZ(z: number, isTopBackdrop: boolean): void {
    this._modalZ = z
    this._hasModalAbove = !isTopBackdrop
  }

  /**
   * PopupLayer hook — the level this modal pins itself to, or `undefined` to take
   * the stack's slot. The stack reads it so layers opened ABOVE a pinned modal
   * clear it instead of landing back at the base (see popup-stack).
   *
   * Coerced through `Number` rather than read directly because the prop can arrive
   * as a numeric STRING — a plain `z-index="1500"` attribute goes through the
   * converter, but `el.zIndex = '1500'` (or a framework binding that stringifies)
   * does not.
   *
   * `null` and `''` are screened out FIRST, and that guard is load-bearing:
   * `Number(null)` and `Number('')` are both `0` and both finite, so `:z-index="null"`
   * — Vue's ordinary spelling for "no value" — used to pin the modal to `z-index: 0`
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
    return this.pinnedZ ?? this._modalZ
  }

  /* ----------------------------- Dragging ----------------------------- */

  /** Push the current offset onto the panel as CSS vars (no Lit re-render). */
  private _applyDragVars(): void {
    const panel = this._panelEl
    if (!panel) return
    panel.style.setProperty('--drag-x', `${this._dragX}px`)
    panel.style.setProperty('--drag-y', `${this._dragY}px`)
  }

  /** Recenter the panel — called on each open so drags don't persist. */
  private _resetDrag(): void {
    this._dragX = 0
    this._dragY = 0
    this._applyDragVars()
  }

  protected _onHeaderPointerDown = (event: PointerEvent): void => {
    if (isServer || typeof window === 'undefined') return
    // `_autoFullscreenActive` matches what the `@media` block is doing right now.
    // Without it a `draggable` + `auto-fullscreen` modal could be dragged off the
    // screen by its header while visually filling it — CSS can hide a resizer but
    // it cannot stop a pointer handler.
    if (!this.draggable || this._isFullscreen || this._autoFullscreenActive) return
    if (event.button !== 0) return
    // Don't start a drag from the close button — let it click normally.
    if ((event.target as Element)?.closest?.('.mono-modal-close')) return

    event.preventDefault()

    this._dragging = true
    this._dragStartX = event.clientX
    this._dragStartY = event.clientY
    this._dragOriginX = this._dragX
    this._dragOriginY = this._dragY

    // Listen on window so the drag keeps tracking past the panel/viewport edges.
    window.addEventListener('pointermove', this._onPointerMove)
    window.addEventListener('pointerup', this._onPointerUp, { once: true })
    window.addEventListener('pointercancel', this._onPointerUp, { once: true })
  }

  private _onPointerMove = (event: PointerEvent): void => {
    this._dragX = this._dragOriginX + (event.clientX - this._dragStartX)
    this._dragY = this._dragOriginY + (event.clientY - this._dragStartY)
    this._applyDragVars()
  }

  private _onPointerUp = (): void => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this._onPointerMove)
    }
    // Clamp while `dragging` (transition still suppressed) so the snap is instant.
    this._clampIntoViewport()
    this._dragging = false
  }

  /**
   * After a drop, pull the panel back so it sits fully inside the viewport
   * ("the maximum location is the inner window"). If the panel is larger than
   * the viewport, pin its top-left corner.
   */
  private _clampIntoViewport(): void {
    const panel = this._panelEl
    if (!panel || typeof window === 'undefined') return

    const rect = panel.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let dx = 0
    if (rect.width >= vw) dx = -rect.left
    else if (rect.left < 0) dx = -rect.left
    else if (rect.right > vw) dx = vw - rect.right

    let dy = 0
    if (rect.height >= vh) dy = -rect.top
    else if (rect.top < 0) dy = -rect.top
    else if (rect.bottom > vh) dy = vh - rect.bottom

    if (dx === 0 && dy === 0) return

    this._dragX += dx
    this._dragY += dy
    this._applyDragVars()
  }

  private _teardownDrag(): void {
    if (typeof window === 'undefined') return
    window.removeEventListener('pointermove', this._onPointerMove)
    window.removeEventListener('pointerup', this._onPointerUp)
    window.removeEventListener('pointercancel', this._onPointerUp)
  }

  /**
   * Every open-state change emits `toggle` (historically `mno-click`, which is
   * kept), then the transition-specific `open` / `close`. `toggle` rather than
   * a plain `click`: a real click from inside the panel already bubbles to the
   * host on its own, and this is not one — it is a state change.
   * Mirrors mono-drawer's event surface. Note: only programmatic state changes
   * (`show`/`hide`/`toggle` and the overlay/✕/Escape handlers) call this —
   * parent-driven opens via `model-value` go through `willUpdate` and emit
   * nothing, so a controlled parent never gets an echo of its own change.
   */
  private _emitChange(detail: ModalCloseEventDetail): void {
    this._boundController?._report(detail.value, detail.source)
    dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })

    if (detail.value && !detail.oldValue) {
      dispatchMonoEvent(this, 'open', detail)
    } else if (!detail.value && detail.oldValue) {
      dispatchMonoEvent(this, 'close', detail)
    }
  }

  public show(source: ModalSource = 'manual', sourceEvent?: Event): void {
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

  public hide(source: ModalSource = 'manual', sourceEvent?: Event): void {
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

  public toggle(source: ModalSource = 'manual', sourceEvent?: Event): void {
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
    // `!this.overlay` cannot really happen here (the backdrop is `display: none`
    // and the wrap is `pointer-events: none`) — the no-overlay case is the
    // document listener in `_onOutsideClick` instead.
    if (
      !this.closeOnOverlay ||
      !this.dismissible ||
      this.persistent ||
      !this.overlay
    ) {
      return
    }
    this.hide('overlay', event)
  }

  /** Title / subtitle / heading-column presence, shared by the head render and
   *  the dialog's `aria-labelledby` / `aria-describedby`. */
  protected get _headingState(): { title: boolean; subtitle: boolean; heading: boolean } {
    const title = !!this.title || this._hasTitleSlotState
    const subtitle = !!this.subtitle || this._hasSubtitleSlotState
    return { title, subtitle, heading: this._hasHeadSlotState || title || subtitle }
  }

  private _idSeq?: number

  /**
   * Prefix of the heading ids (`<base>-heading` / `-title` / `-subtitle`). The
   * light build's panel lives in the document, so the ids must be unique per
   * instance; the shadow build overrides this with a constant (ids are scoped to
   * its own root, and a counter would differ between server and client).
   */
  protected get _headingIdBase(): string {
    this._idSeq ??= ++modalIdSeq
    return `mono-modal-${this._idSeq}`
  }

  /** `aria-labelledby` / `aria-describedby` for the `role="dialog"` root. A
   *  `slot="header"` labels the dialog with its whole column; otherwise the
   *  title labels it and the subtitle describes it. */
  protected _headingAria(): { labelledby?: string; describedby?: string } {
    const s = this._headingState
    const base = this._headingIdBase
    if (this._hasHeadSlotState) return { labelledby: `${base}-heading` }
    return {
      labelledby: s.title ? `${base}-title` : undefined,
      describedby: s.subtitle ? `${base}-subtitle` : undefined,
    }
  }

  private _renderHead(): TemplateResult | typeof nothing {
    const s = this._headingState
    const hasDefaultHeader = s.heading || this.dismissible

    if (!hasDefaultHeader && !this._slotsAlwaysRender) {
      return nothing
    }

    const base = this._headingIdBase

    // The heading column (title + subtitle) — the `head` slot's fallback. The
    // light build renders it only when no `head` slot was captured; the shadow
    // build renders it as the native `<slot name="head">` fallback content. The
    // ✕ sits OUTSIDE the column, so a `slot="header"` never removes it.
    const heading = html`
      <div
        class=${this._cls('mono-modal-title', 'title')}
        mono-title
        id=${`${base}-title`}
        ?mono-empty=${!s.title}
      >${this._slotOutlet('title', this.title || nothing)}</div>
      <div
        class=${this._cls('mono-modal-subtitle', 'subtitle')}
        mono-subtitle
        id=${`${base}-subtitle`}
        ?mono-empty=${!s.subtitle}
      >${this._slotOutlet('subtitle', this.subtitle || nothing)}</div>
    `

    return html`
      <div
        class=${this._cls('mono-modal-head', 'head')}
        mono-header
        ?mono-empty=${!hasDefaultHeader}
        @pointerdown=${this._onHeaderPointerDown}
      >
        <div
          class=${this._cls('mono-modal-heading', 'heading')}
          mono-heading
          id=${`${base}-heading`}
          ?mono-empty=${!s.heading}
        >
          ${this._slotOutlet('head', heading)}
        </div>
        ${this.dismissible
          ? html`
              <button
                type="button"
                class=${this._cls('mono-modal-close', 'close')}
                mono-close
                aria-label="Close"
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
    if (!this._hasFootSlotState && !this._slotsAlwaysRender) return nothing

    return html`
      <div
        class=${this._cls('mono-modal-foot', 'foot')}
        mono-footer
        ?mono-empty=${!this._hasFootSlotState}
      >
        ${this._slotOutlet('foot')}
      </div>
    `
  }

  /** Shared modal markup (overlay + panel-wrap + panel + head/body/foot). The
   *  light build renders this directly into the portal (which IS `.mono-modal`);
   *  the shadow build wraps it in an inner `.mono-modal` root. */
  protected _renderModalBody(): TemplateResult {
    return html`
      <div
        class=${this._cls('mono-modal-overlay', 'overlay')}
        mono-overlay
        @click=${this._handleOverlayClick}
      ></div>
      <div class="mono-modal-panel-wrap" mono-panel-wrap @click=${this._handleOverlayClick}>
        <div
          class=${this._cls('mono-modal-panel', 'panel')}
          mono-panel
          style=${styleMap(this._panelSizeStyle())}
          role="document"
          @click=${(e: Event) => e.stopPropagation()}
        >
          ${this._renderHead()}
          <div class=${this._cls('mono-modal-body', 'body')} mono-body>
            ${this._slotOutlet('body')}
          </div>
          ${this._renderFoot()}
        </div>
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

  protected _hasSlot(name: ModalSlotName): boolean {
    return name === 'head'
      ? this._hasHeadSlotState
      : name === 'title'
        ? this._hasTitleSlotState
        : name === 'subtitle'
          ? this._hasSubtitleSlotState
          : name === 'body'
            ? this._hasBodySlotState
            : this._hasFootSlotState
  }

  protected _setSlotState(name: ModalSlotName, has: boolean): void {
    if (name === 'head') this._hasHeadSlotState = has
    else if (name === 'title') this._hasTitleSlotState = has
    else if (name === 'subtitle') this._hasSubtitleSlotState = has
    else if (name === 'body') this._hasBodySlotState = has
    else this._hasFootSlotState = has
  }

  /**
   * Slot outlet. Light build (default): a `data-mono-slot` placeholder the
   * captured light-DOM nodes are re-parented into when present, else the
   * `fallback`. Shadow build overrides this with a native `<slot name>`.
   */
  protected _slotOutlet(name: ModalSlotName, fallback: unknown = nothing): TemplateResult {
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

  return MonoModalCoreClass as unknown as Constructor<MonoModalCoreInterface> & T
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoModalCoreInterface implements PopupLayer {
  size: ModalSize
  color: ModalColor
  title: string
  subtitle: string
  modelValue: boolean
  dismissible: boolean
  persistent: boolean
  overlay: boolean
  closeOnEscape: boolean
  closeOnOverlay: boolean
  lockScroll: boolean
  draggable: boolean
  stackable: boolean
  autoFullscreen: MonoAutoFullscreen
  cssClass: ModalCssClass
  cssClassName: string
  width?: ModalSizeValue
  height?: ModalSizeValue
  minWidth?: ModalSizeValue
  maxWidth?: ModalSizeValue
  minHeight?: ModalSizeValue
  maxHeight?: ModalSizeValue
  zIndex?: number

  show(source?: ModalSource, sourceEvent?: Event): void
  hide(source?: ModalSource, sourceEvent?: Event): void
  toggle(source?: ModalSource, sourceEvent?: Event): void

  // PopupLayer surface
  get lockBodyScroll(): boolean
  get hasBackdrop(): boolean
  get pinnedZ(): number | undefined
  onStackEscape(event: KeyboardEvent): void
  setStackZ(z: number, isTopBackdrop: boolean): void

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  protected _slotsCaptured: boolean
  protected _hasHeadSlotState: boolean
  protected _hasTitleSlotState: boolean
  protected _hasSubtitleSlotState: boolean
  protected get _headingState(): { title: boolean; subtitle: boolean; heading: boolean }
  protected get _headingIdBase(): string
  protected _headingAria(): { labelledby?: string; describedby?: string }
  protected _hasBodySlotState: boolean
  protected _hasFootSlotState: boolean
  protected _modalZ: number
  protected get _effectiveZ(): number
  protected _panelEl?: HTMLElement
  protected get _isMonoModal(): boolean
  protected get _isFullscreen(): boolean
  protected _panelSizeStyle(): StyleInfo
  protected _computeModalClasses(): string[]
  protected _setCssClass(value: unknown): void
  protected _cls(base: string, key: keyof ModalCssClass): string
  protected _computeRootAttrs(): Record<string, string | null>
  protected _applyRootAttrs(root: HTMLElement | null | undefined): void
  protected bindRoot: (el: Element | undefined) => void
  /** The shadow build's inner root, bound by `bindRoot` — it re-applies the
   *  state attributes from its own `updated()`. */
  protected _rootEl: HTMLElement | null
  protected _toBoolean(value: unknown): boolean
  protected _applyOpenSideEffects(): void
  protected _releaseSideEffects(): void
  protected _onHeaderPointerDown: (event: PointerEvent) => void
  protected _renderModalBody(): TemplateResult
  protected get _slotsAlwaysRender(): boolean
  protected _hasSlot(name: ModalSlotName): boolean
  protected _setSlotState(name: ModalSlotName, has: boolean): void
  protected _slotOutlet(name: ModalSlotName, fallback?: unknown): TemplateResult
  protected renderIcon(name: 'close'): TemplateResult
}
