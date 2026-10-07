// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { property, state, query } from 'lit/decorators.js'

import type {
  ButtonSize,
  ButtonColor,
  ButtonVariant,
  ButtonRounded,
  ButtonIconPosition,
  ButtonBadgeColor,
  ButtonCssClass,
  ButtonAffixProps,
  ButtonHandler,
  ButtonRateLimitEventDetail,
} from './button-types.js'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { dispatchMonoEvent } from '../../composables/mono-event'
import {
  createRateLimiter,
  normalizeDebounce,
  normalizeThrottle,
  rateLimitConverter,
  rateLimitHasChanged,
  type DebounceConfig,
  type RateLimitOption,
  type RateLimitPhase,
  type RateLimiter,
  type ThrottleConfig,
} from '../../composables/rate-limit'

type ButtonLikeElement = HTMLButtonElement | HTMLAnchorElement

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoButtonCoreInterface {
  size: ButtonSize
  color: ButtonColor
  variant: ButtonVariant
  rounded?: ButtonRounded
  disabled: boolean
  loading: boolean
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  href?: string
  target?: string
  type: 'button' | 'submit' | 'reset'
  iconPosition: ButtonIconPosition
  prepend: ButtonAffixProps
  append: ButtonAffixProps
  badge?: string
  badgeColor: ButtonBadgeColor
  iconOnly: boolean

  glass: boolean
  tooltip?: string
  ariaLabelText?: string
  cssClass: ButtonCssClass
  throttle?: RateLimitOption<ThrottleConfig>
  debounce?: RateLimitOption<DebounceConfig>
  handler?: ButtonHandler
  noAutoLoading: boolean
  focus(): void
  blur(): void
  click(): void
  cancelPending(): void

  // Shared-protected surface used / overridden by the light/shadow render()s.
  protected _hasIcon: boolean
  protected _hasPrepend: boolean
  protected _hasAppend: boolean
  /** The affix config for one side, always an object. */
  protected _affix(name: 'prepend' | 'append'): ButtonAffixProps
  /** Whether that affix is inert — follows `disabled`, never `loading`. */
  protected _affixDisabled(name: 'prepend' | 'append'): boolean
  protected _isActive: boolean
  protected _buttonElement?: ButtonLikeElement
  protected _cls(base: string, key: keyof ButtonCssClass): string
  protected _toBoolean(value: unknown): boolean
  protected _sizeStyle(): ReturnType<typeof buildSizeStyle>
  protected get _hasSize(): boolean
  protected _defaultIsEmpty(): boolean
  protected get _isIconOnlyLike(): boolean
  protected get _buttonClasses(): string
  protected _renderWrapper(inner: TemplateResult, style?: unknown): TemplateResult
  protected get _badgeClass(): string
  protected get _badgeColor(): string
  protected get _ariaLabel(): string | undefined
  /** Spinner visibility: the `loading` prop OR either self-driven phase. */
  protected get _effectiveLoading(): boolean
  /** Where the spinner is drawn: in the icon position, whatever triggered loading. */
  protected get _showsSpinner(): boolean
  /** A click does nothing observable (covers the wait as well as the work). */
  protected get _isBlocked(): boolean
  /** The native `disabled` attribute — `_isBlocked` minus the wait. */
  protected get _isInert(): boolean
  protected _handleClick(event: MouseEvent): void
  protected _handleKeyDown(event: KeyboardEvent): void
  protected _handleFocus(): void
  protected _handleBlur(): void
}

/**
 * `MonoButtonCore` — all render-mode-agnostic logic for `mono-button`: reactive
 * props, hybrid aliases, the camelCase attribute fallbacks, the slot-presence
 * `@state` (`_hasIcon`), class/getter computation, sizing, click/keyboard
 * interactivity, and the imperative `focus/blur/click`. No `render()` — the light
 * build keeps its `[data-mono-slot]` capture strategy and the shadow build uses
 * native `<slot>` (each ships its own `render()`, mirroring `mono-card`).
 *
 * The `rounded="full"` auto-"icon-only when empty" refinement depends on light-DOM slot
 * introspection, so it lives behind the `_defaultIsEmpty()` hook (defaults to
 * `false` here; the light build overrides it). SSR-safe: no `document`/`window`
 * access; `_buttonElement` (`@query`) is lazy and `focus/blur/click` only run
 * client-side.
 */
export const MonoButtonCore = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class MonoButtonCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      // NOTE: `throttle`, `debounce`, `handler`, `prepend` and `append` are
      // deliberately absent — they're already lowercase single words, and
      // aliasing such a name makes the accessor point at itself and recurse
      // forever.
      defineHybridPropAliases(this, [
        'iconPosition',
        'badgeColor',
        'iconOnly',
        'ariaLabelText',
        'cssClass',
        'noAutoLoading',
        // Sizing props (camelCase only — width/height are single words, no alias).
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ])

      this.size = 'md'
      this.color = 'primary'
      this.variant = 'solid'


      this.disabled = false
      this.loading = false

      this.href = undefined
      this.target = undefined
      this.type = 'button'
      this.iconPosition = 'left'
      this.prepend = {}
      this.append = {}

      this.badge = undefined
      this.badgeColor = 'red'

      this.iconOnly = false

      this.glass = false

      this.tooltip = undefined
      this.ariaLabelText = undefined

      this.throttle = undefined
      this.debounce = undefined
      this.handler = undefined
      this.noAutoLoading = false

      this._isActive = false
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'iconposition',
        'badgecolor',
        'icononly',
        'arialabeltext',
        'noautoloading',
        'prepend',
        'append',
      ]
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'icononly') {
        this.iconOnly = this._toBoolean(newValue)
        return
      }

      if (name === 'prepend' || name === 'append') {
        this._setAffix(name, newValue)
        return
      }

      if (name === 'iconposition') {
        this.iconPosition = (newValue ?? 'left') as ButtonIconPosition
        return
      }

      if (name === 'badgecolor') {
        this.badgeColor = (newValue ?? 'red') as ButtonBadgeColor
        return
      }

      if (name === 'noautoloading') {
        this.noAutoLoading = this._toBoolean(newValue)
        return
      }

      if (name === 'arialabeltext') {
        this.ariaLabelText = newValue ?? undefined
      }
    }

    @property({ type: String })
    size!: ButtonSize

    @property({ type: String })
    color!: ButtonColor

    @property({ type: String })
    variant!: ButtonVariant

    @property({ type: String })
    rounded?: ButtonRounded

    @property({ reflect: true, converter: booleanStringConverter })
    disabled!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    loading!: boolean

    /**
     * Explicit sizing. Each accepts a CSS length string (`"220px"`, `"80%"`) or a
     * number (interpreted as px). Use `width="100%"` for a full-width button.
     */
    @property({ type: String })
    width?: CssSizeValue

    @property({ type: String })
    height?: CssSizeValue

    @property({ type: String, attribute: 'min-width' })
    minWidth?: CssSizeValue

    @property({ type: String, attribute: 'max-width' })
    maxWidth?: CssSizeValue

    @property({ type: String, attribute: 'min-height' })
    minHeight?: CssSizeValue

    @property({ type: String, attribute: 'max-height' })
    maxHeight?: CssSizeValue

    @property({ type: String })
    href?: string

    @property({ type: String })
    target?: string

    @property({ type: String })
    type!: 'button' | 'submit' | 'reset'

    @property({ type: String, attribute: 'icon-position' })
    iconPosition!: ButtonIconPosition

    /**
     * Affix config. `attribute: false` because these are objects — the string
     * forms arrive through `observedAttributes` + `_setAffix` instead, which is
     * what lets a JSON attribute work without Vue's `"[object Object]"` mirror
     * clobbering the property.
     *
     * Typed `any` ONLY to override the DOM methods these names shadow —
     * `ParentNode.prepend()` / `.append()`, whose signatures a plain object type
     * cannot satisfy. Lit defines its accessor on this class's prototype, which
     * sits below `Element.prototype`, so the shadow works at runtime and
     * assignment is fine. The precise type consumers actually see is
     * `ButtonAffixProps` on `ButtonProps` and on the core interface above.
     *
     * The cost is real and deliberate: `monoButtonEl.append(node)` is no longer a
     * function. Nothing in this library calls it — slot placement uses
     * `appendChild` — but consumer code that does will break on a button.
     */
    @property({ attribute: false })
    prepend!: any

    @property({ attribute: false })
    append!: any

    @property({ type: String })
    badge?: string

    @property({ type: String, attribute: 'badge-color' })
    badgeColor!: ButtonBadgeColor

    @property({
      attribute: 'icon-only',
      reflect: true,
      converter: booleanStringConverter,
    })
    iconOnly!: boolean


    @property({ reflect: true, converter: booleanStringConverter })
    glass!: boolean

    @property({ type: String })
    tooltip?: string

    @property({ type: String, attribute: 'aria-label-text' })
    ariaLabelText?: string

    @property({ attribute: false })
    cssClass: ButtonCssClass = {}

    /**
     * Rate-limit clicks with `p-throttle`: at most `limit` executions per
     * `interval` ms, the rest **queued and replayed** (never dropped). Accepts
     * the option object, or a bare number read as the interval —
     * `throttle="1000"` is one call per second.
     *
     * Each execution emits `mno-throttle`.
     */
    @property({ converter: rateLimitConverter, hasChanged: rateLimitHasChanged })
    throttle?: RateLimitOption<ThrottleConfig>

    /**
     * Collapse a burst of clicks with `p-debounce`: run once, `wait` ms after
     * the last one. Accepts the option object, or a bare number read as the
     * wait — `debounce="300"`.
     *
     * Each execution emits `mno-debounce`.
     */
    @property({ converter: rateLimitConverter, hasChanged: rateLimitHasChanged })
    debounce?: RateLimitOption<DebounceConfig>

    /**
     * The work a click performs. Bind it as a property
     * (`:handler.prop="save"`) — it is what gets throttled / debounced, and its
     * promise defines the loading window, so the button shows its own spinner
     * for exactly as long as the work takes.
     *
     * Without a handler the same window can be driven from a listener with
     * `event.detail.waitUntil(promise)`.
     */
    @property({ attribute: false })
    handler?: ButtonHandler

    /**
     * Opt out of the self-driven spinner. Clicks are still rate-limited and the
     * handler still runs; the button just never paints or blocks on its own,
     * leaving `loading` entirely under the consumer's control.
     */
    @property({
      attribute: 'no-auto-loading',
      reflect: true,
      converter: booleanStringConverter,
    })
    noAutoLoading!: boolean

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards a bare boolean attribute (`<mono-button loading>`)
      // to the SSR renderer as the PROPERTY string `""` (these props use
      // `booleanStringConverter`, not `type: Boolean`, so the wrapper doesn't
      // coerce them). Left as a string, `if (this.loading)` is truthy but the
      // class/structure can still drift from the client — coerce to a real
      // boolean before render so the server and client renders match.
      for (const key of [
        'disabled',
        'loading',
        'iconOnly',

        'glass',
        'noAutoLoading',
      ] as const) {
        if (typeof (this as any)[key] === 'string') {
          ;(this as any)[key] = this._toBoolean((this as any)[key])
        }
      }

      // A changed config must produce a NEW wrapper — the old one has the old
      // interval/wait baked in. `rateLimitHasChanged` is what stops an inline
      // object literal from landing here on every parent render.
      if (changed.has('throttle')) this._invalidateLimiter('throttle')
      if (changed.has('debounce')) this._invalidateLimiter('debounce')

      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    @state()
    protected _isActive!: boolean

    /** Whether an icon is slotted. Light sets it from capture; shadow from `assignedNodes`. */
    @state()
    protected _hasIcon = false

    /** Whether the leading / trailing affix slot has content. Same sources. */
    @state()
    protected _hasPrepend = false

    @state()
    protected _hasAppend = false

    /**
     * Self-driven loading, mirrored from the limiters. `loading` itself is never
     * written: it's a one-way input under Vue, and writing it would leave the
     * consumer's variable disagreeing with the DOM until the next patch
     * silently reverted us. These are the component's own state instead, and
     * the two are combined in `_effectiveLoading`.
     */
    @state()
    private _pending = 0

    @state()
    private _running = 0

    private _throttler: RateLimiter | null = null
    private _debouncer: RateLimiter | null = null
    private _directRunning = 0
    private _lastPhase: RateLimitPhase = 'idle'

    /**
     * Limiters are built on demand rather than up front: nothing schedules a
     * timer server-side, and a disposed one (config change, disconnect) simply
     * rebuilds on the next click — which is also what makes the element
     * survive being moved or re-activated under `<KeepAlive>`.
     */
    private _ensureThrottler(): RateLimiter | null {
      if (this._throttler) return this._throttler

      const config = normalizeThrottle(this.throttle)
      if (!config) return null

      this._throttler = createRateLimiter({
        kind: 'throttle',
        config,
        run: (...args) => this._runLimited('throttle', args[0] as MouseEvent),
        onChange: () => this._syncLoading(),
      })

      return this._throttler
    }

    private _ensureDebouncer(): RateLimiter | null {
      if (this._debouncer) return this._debouncer

      const config = normalizeDebounce(this.debounce)
      if (!config) return null

      this._debouncer = createRateLimiter({
        kind: 'debounce',
        config,
        run: (...args) => this._runLimited('debounce', args[0] as MouseEvent),
        onChange: () => this._syncLoading(),
      })

      return this._debouncer
    }

    /** Drop a limiter so the next click rebuilds it with the current config. */
    private _invalidateLimiter(kind: 'throttle' | 'debounce'): void {
      if (kind === 'throttle') {
        this._throttler?.dispose()
        this._throttler = null
      } else {
        this._debouncer?.dispose()
        this._debouncer = null
      }

      this._syncLoading()
    }

    /**
     * Mirror the limiters' counters into reactive state and report transitions.
     *
     * The two pipelines are independent, so the button is busy while *either*
     * is — hence the sum. Direct (unlimited) work counts as running only: it
     * never waits.
     */
    private _syncLoading(): void {
      const pending = this.noAutoLoading
        ? 0
        : (this._throttler?.pending ?? 0) + (this._debouncer?.pending ?? 0)

      const running = this.noAutoLoading
        ? 0
        : (this._throttler?.running ?? 0) +
          (this._debouncer?.running ?? 0) +
          this._directRunning

      if (this._pending !== pending) this._pending = pending
      if (this._running !== running) this._running = running

      const phase: RateLimitPhase =
        running > 0 ? 'running' : pending > 0 ? 'pending' : 'idle'

      if (phase === this._lastPhase) return
      this._lastPhase = phase

      // The one write-back that works on a custom element: `update:*` events
      // are never wired by Vue, so a plain listener is how a parent mirrors this.
      dispatchMonoEvent(this, 'loading-change', {
        loading: phase !== 'idle',
        phase,
      })
    }

    /**
     * Drop anything waiting — the debounce timer and the throttle queue — without
     * touching work already running. Each limiter rebuilds itself on the next click.
     */
    public cancelPending(): void {
      this._throttler?.cancel()
      this._debouncer?.cancel()
      this._syncLoading()
    }

    override disconnectedCallback(): void {
      this._throttler?.dispose()
      this._debouncer?.dispose()
      this._throttler = null
      this._debouncer = null
      super.disconnectedCallback()
    }

    @query('div > button, div > a')
    protected _buttonElement?: ButtonLikeElement

    protected _cls(base: string, key: keyof ButtonCssClass): string {
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
     * Whether the default (text) slot is empty — drives the `rounded="full"`
     * auto-icon-only refinement. Requires light-DOM introspection, so the core
     * returns `false` (no auto-iconize); the light build overrides it.
     */
    protected _defaultIsEmpty(): boolean {
      return false
    }

    /**
     * Icon-only, explicitly or by inference.
     *
     * The inference: a fully-rounded button with no text in it is a circle
     * holding one glyph, which is the shape people reach for as a FAB. It used to
     * hang off `fab && (circle || shape === 'circle')`; `rounded="full"` is the
     * one prop those three collapsed into.
     */
    protected get _isIconOnlyLike(): boolean {
      return this.iconOnly || (this.rounded === 'full' && this._defaultIsEmpty())
    }

    /**
     * What the spinner follows: the `loading` prop (a manual override that
     * always wins) OR either self-driven phase.
     */
    protected get _effectiveLoading(): boolean {
      return this.loading || this._pending > 0 || this._running > 0
    }

    /**
     * Whether a click produces anything the user can observe. A spinning button
     * is a disabled button in every phase, the wait included — no event, no
     * handler, no form submit.
     *
     * This is the *behavioural* answer; `_isInert` is the structural one. They
     * differ during the wait, and that gap is deliberate — see `_isInert`.
     */
    protected get _isBlocked(): boolean {
      return this.disabled || this._effectiveLoading
    }

    /**
     * Whether the native control carries `disabled` — everything `_isBlocked`
     * covers EXCEPT the self-driven wait.
     *
     * A natively disabled button dispatches no click event at all. If the wait
     * were inert, repeat clicks could never reach the debouncer to reset its
     * timer, and `debounce` would quietly degrade from "run once the user
     * stops" into "wait, then run, ignoring the rest". So while waiting the
     * control stays live and merely *looks* and *behaves* disabled: clicks land,
     * are swallowed by `_handleClick`, and only extend the wait.
     */
    protected get _isInert(): boolean {
      return this.disabled || this.loading || this._running > 0
    }

    /**
     * Where the spinner is drawn.
     *
     * It replaces the ICON, wherever the icon sits — so `icon-position="right"` spins on the
     * right, and a button with no icon grows a leading spinner in the slot an icon would have
     * used. The caption always stays readable.
     *
     * This used to be two looks. Self-driven loading kept the caption and TRAILED the spinner
     * after it, while the `loading` prop blanked the caption and centred the spinner — so a
     * button with an icon rendered icon + label + spinner all at once, and which of the two
     * looks you got depended on how loading had been switched on. `MonoConfirm` sets BOTH, and
     * so blanked the very caption it had just changed to "Menyimpan...".
     *
     * One rule now, whatever triggered it.
     */
    protected get _showsSpinner(): boolean {
      return this._effectiveLoading
    }

    /**
     * Spinning because a call is waiting rather than executing. Drives the
     * `pending` class, which restores `pointer-events` so those clicks can be
     * absorbed — hence the hard-block exclusions, which must never be made
     * clickable again.
     */
    protected get _isPendingOnly(): boolean {
      return (
        this._pending > 0 &&
        this._running === 0 &&
        !this.loading &&
        !this.disabled
      )
    }

    /**
     * `prepend` / `append` are object props, so the real binding is
     * `:append.prop="{…}"`. This covers the two ways a STRING can arrive: a
     * hand-written JSON attribute (`append='{"border":true}'`, incl. DSD/SSR) and
     * Vue's `String(value)` mirror of a plain `:append="{…}"` binding — which
     * yields `"[object Object]"` and must be ignored, or it would wipe the
     * property set moments later.
     */
    private _setAffix(name: 'prepend' | 'append', value: unknown): void {
      const assign = (v: ButtonAffixProps) => {
        if (name === 'prepend') this.prepend = v
        else this.append = v
      }

      if (value == null) return assign({})
      if (typeof value === 'object') return assign(value as ButtonAffixProps)
      if (typeof value !== 'string') return

      const trimmed = value.trim()
      if (!trimmed) return assign({})
      // A bare attribute (no value) is the natural way to say "yes" in
      // static HTML; treat it as an empty config rather than dropping it.
      if (!trimmed.startsWith('{')) return
      if (!trimmed.endsWith('}')) return

      try {
        assign(JSON.parse(trimmed) as ButtonAffixProps)
      } catch {
        // Not JSON (e.g. a stringified object) — keep whatever the property holds.
      }
    }

    /** The affix config, always an object (either can be assigned null). */
    protected _affix(name: 'prepend' | 'append'): ButtonAffixProps {
      const value = name === 'prepend' ? this.prepend : this.append
      return value && typeof value === 'object' ? (value as ButtonAffixProps) : {}
    }

    /**
     * Whether an affix zone is inert. Follows the button's `disabled` by default
     * so the control dims as one, but NOT its `loading` — a busy main action with
     * a live trailing menu is the case this feature exists for.
     */
    protected _affixDisabled(name: 'prepend' | 'append'): boolean {
      const own = this._affix(name).disabled
      return own === undefined ? this.disabled : own
    }

    /**
     * The wrapper the whole stylesheet is keyed on.
     *
     * Its ATTRIBUTES mirror the props one for one — `<div mono-button
     * mono-size="sm" mono-color="danger" mono-variant="outline">` — so a
     * hand-written twin reads like the tag, and `button.css` selects on them
     * exactly as Basecoat selects on `data-size` / `data-variant`. A prop at its
     * default (md / primary / solid / left) emits NO attribute — absence IS the
     * default in the sheet — so the rendered wrapper carries exactly what the
     * author wrote, and a hand-written twin can be compared to it 1:1. The classes
     * (`mono-button sm outline-danger`) are still emitted as inert hooks for
     * consumer CSS until 2.0; no rule reads them. Bound in the template (not set
     * in `updated()`) so the SSR build carries them.
     */
    protected _renderWrapper(inner: TemplateResult, style?: unknown): TemplateResult {
      return html`<div
        class=${this._buttonClasses}
        style=${style ?? nothing}
        mono-button
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'solid' ? nothing : this.variant}
        mono-rounded=${ifDefined(this.rounded)}
        mono-icon-position=${this.iconPosition === 'left' ? nothing : this.iconPosition}
        ?mono-icon-only=${this._isIconOnlyLike}
        ?mono-glass=${Boolean(this.glass)}
        ?mono-loading=${this._effectiveLoading}
        ?mono-pending=${this._isPendingOnly}
        ?mono-sized=${this._hasSize}
      >${inner}</div>`
    }

    /** @deprecated inert since the Basecoat port — see `_renderWrapper`. */
    protected get _buttonClasses(): string {
      const classes: string[] = [
        this._isIconOnlyLike ? 'mono-button-icon' : 'mono-button',
      ]

      classes.push(this.size)

      if (this.variant === 'solid') {
        classes.push(this.color)
      } else if (this.variant === 'outline') {
        classes.push(`outline-${this.color}`)
      } else if (this.variant === 'tonal') {
        classes.push(`tonal-${this.color}`)
      } else if (this.variant === 'text') {
        // `plain-`, not `text-`: these land as real classes in the consumer's
        // light DOM, and `text-primary`/`text-danger` are ubiquitous utility
        // names in Tailwind/UnoCSS setups.
        classes.push(`plain-${this.color}`)
      }

      // Unset emits nothing, so the per-size radius stands — see `ButtonRounded`.
      if (this.rounded) classes.push(`rounded-${this.rounded}`)
      if (this.glass) classes.push('glass')
      if (this._effectiveLoading) classes.push('loading')
      if (this._isPendingOnly) classes.push('pending')
      if (this._hasSize) classes.push('sized')
      if (this.disabled) classes.push('disabled')
      if (this._isActive) classes.push('active')
      if (this.cssClass?.root) classes.push(this.cssClass.root)

      return classes.join(' ')
    }

    /** The `badge-color` value the badge's `mono-badge` attribute carries (red by default). */
    protected get _badgeColor(): string {
      return this.badgeColor === 'green' || this.badgeColor === 'orange' || this.badgeColor === 'cobalt'
        ? this.badgeColor
        : 'red'
    }

    /** @deprecated inert since the Basecoat port — the badge is styled by `mono-badge`. */
    protected get _badgeClass(): string {
      let base = 'btn-badge bb-red'

      if (this.badgeColor === 'green') {
        base = 'btn-badge bb-green'
      } else if (this.badgeColor === 'orange') {
        base = 'btn-badge bb-orange'
      } else if (this.badgeColor === 'cobalt') {
        base = 'btn-badge bb-cobalt'
      }

      return this.cssClass?.badge ? `${base} ${this.cssClass.badge}` : base
    }

    protected get _ariaLabel(): string | undefined {
      return this.ariaLabelText || this.tooltip
    }

    /** True when any sizing prop is set — drives the `sized` class + host styles. */
    protected get _hasSize(): boolean {
      return Object.keys(buildSizeStyle(this)).length > 0
    }

    /** Inline sizing object (used by the shadow build via `styleMap`). */
    protected _sizeStyle() {
      return buildSizeStyle(this)
    }

    protected _handleClick(event: MouseEvent): void {
      if (this._isBlocked) {
        event.preventDefault()
        event.stopPropagation()
        this._absorbWhileWaiting(event)
        return
      }

      // `mno-click` is unchanged: it still fires raw and synchronously on every
      // click, so existing listeners keep their timing. The rate-limited events
      // are additive. The detail gains `waitUntil`, so the self-driven spinner
      // can be used from a listener even with no throttle/debounce configured.
      const awaited: Promise<unknown>[] = []

      // The plain `click` is this very native click, decorated with the detail
      // (`waitUntil` and all) as it bubbles on to the host — never a second one.
      dispatchMonoEvent(
        this,
        'click',
        {
          originalEvent: event,
          result: undefined,
          waitUntil: (promise: Promise<unknown>) => {
            awaited.push(Promise.resolve(promise))
          },
        } satisfies ButtonRateLimitEventDetail,
        { sourceEvent: event },
      )

      const throttler = this._ensureThrottler()
      const debouncer = this._ensureDebouncer()
      const rateLimited = Boolean(throttler || debouncer)

      if (throttler) void throttler.call(event)
      if (debouncer) void debouncer.call(event)

      // The handler belongs to exactly one path: the limiters own it when
      // either is configured, otherwise it runs directly from here. Promises
      // registered by `mno-click` listeners are awaited either way.
      const runsHandlerHere = !rateLimited && Boolean(this.handler)
      if (runsHandlerHere || awaited.length > 0) {
        void this._runDirect(event, runsHandlerHere, awaited)
      }

      // Deliberately NOT rate-limited: deferring this would break
      // `type="submit"` the moment a throttle or debounce is configured.
      this._maybeSubmitForm(event)
    }

    /**
     * A click that arrived while the button was already busy.
     *
     * It stays silent — no `mno-click`, no handler, no form submit — but a
     * debounce still needs to *hear* it: the contract is "run once the user
     * stops", so every repeat has to push the deadline out. Feeding the
     * debouncer does exactly that (`p-debounce` clears and re-arms its timer on
     * each call), which is why the waiting phase is deliberately not inert.
     *
     * Nothing is absorbed once work is actually running — a click then would
     * queue a second execution, which is the opposite of what a busy button
     * should do — nor while `disabled`/`loading` hard-block the control. A
     * throttle is deliberately not fed either: its contract is a rate, not a
     * quiet period, and every absorbed call would become another execution.
     */
    private _absorbWhileWaiting(event: MouseEvent): void {
      if (this.disabled || this.loading) return
      if (this._running > 0 || this._pending === 0) return

      void this._ensureDebouncer()?.call(event)
    }

    /** Immediate (unlimited) work: the handler and/or `waitUntil` promises. */
    private async _runDirect(
      event: MouseEvent,
      runHandler: boolean,
      awaited: Promise<unknown>[],
    ): Promise<void> {
      this._directRunning++
      this._syncLoading()

      try {
        if (runHandler) await this.handler?.(event)
        if (awaited.length) await Promise.allSettled(awaited)
      } finally {
        this._directRunning--
        this._syncLoading()
      }
    }

    /**
     * The work a limiter performs: run the handler, then emit the matching
     * rate-limited event carrying its resolved result, then wait for anything
     * listeners registered. The enclosing limiter is what tracks this as the
     * `running` phase.
     */
    private async _runLimited(
      kind: 'throttle' | 'debounce',
      event: MouseEvent,
    ): Promise<unknown> {
      const result = this.handler ? await this.handler(event) : undefined
      const awaited: Promise<unknown>[] = []

      dispatchMonoEvent(this, kind, {
        originalEvent: event,
        result,
        waitUntil: (promise: Promise<unknown>) => {
          awaited.push(Promise.resolve(promise))
        },
      } satisfies ButtonRateLimitEventDetail)

      if (awaited.length) await Promise.allSettled(awaited)

      return result
    }

    /**
     * Native form submission doesn't cross a shadow boundary: in the shadow build the
     * real `<button type="submit">` lives in the shadow root, so clicking it never
     * submits the light-DOM `<form>` the host sits in (the inner button's form owner
     * is `null`). When there's no native association, submit/reset the host's closest
     * form manually via `requestSubmit()`/`reset()` (which still fires the form's
     * `submit` event + constraint validation). The light build's inner `<button>` IS
     * form-associated, so `innerForm` is truthy there and this is skipped — no double
     * submit.
     */
    protected _maybeSubmitForm(event: MouseEvent): void {
      if (
        event.defaultPrevented ||
        this.href ||
        (this.type !== 'submit' && this.type !== 'reset')
      ) {
        return
      }

      const innerForm = (this._buttonElement as HTMLButtonElement | undefined)?.form
      if (innerForm) return

      const form = this.closest('form')
      if (!form) return

      if (this.type === 'submit') form.requestSubmit()
      else form.reset()
    }

    protected _handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this._buttonElement?.click()
      }
    }

    protected _handleFocus(): void {
      this._isActive = true
    }

    protected _handleBlur(): void {
      this._isActive = false
    }

    public override focus(): void {
      this._buttonElement?.focus()
    }

    public override blur(): void {
      this._buttonElement?.blur()
    }

    public override click(): void {
      this._buttonElement?.click()
    }
  }

  return MonoButtonCoreClass as unknown as Constructor<MonoButtonCoreInterface> &
    T
}
