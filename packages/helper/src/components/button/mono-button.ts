// @unocss-include

import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'

import { MonoButtonCore } from './button-core.js'
import { buildSizeStyle } from '../../composables/css-size'
import { bucketHasContent,
  captureLightSlots,
  LateSlotWatcher,
  type LightSlotBuckets, placeSlotNode } from '../../composables/light-slots'

import buttonCss from './button.css?raw'

/**
 * Light-DOM `mono-button` (default build, `@mono-lit/helper/ui/button`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="icon"` + default
 * text children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets, and the captured nodes are re-placed in `updated()`.
 * Capture goes through `composables/light-slots`, which carries the consumer
 * framework's positional anchors (Vue's `<!--v-if-->` comments and zero-length
 * Fragment text nodes) instead of deleting them, and the first render is forced
 * **synchronously** from `connectedCallback` so capture→placement is one
 * uninterrupted step — together that's what lets buttons nest freely without
 * crashing the consumer's next patch on a null anchor.
 * Host sizing is applied imperatively in `updated()`. All render-mode-agnostic
 * logic lives in `MonoButtonCore`. The shadow build (`@mono-lit/helper/ui/shadow/button`)
 * shares the mixin but uses native `<slot>`. Both register `mono-button`, so a
 * document loads only one.
 */
@customElement('mono-button')
export class MonoButton extends MonoButtonCore(LitElement) {
  static override styles = [unsafeCSS(buttonCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _buckets: LightSlotBuckets = new Map()
  private _slotsCaptured = false
  private _guardedAffixes = new WeakSet<Element>()
  /**
   * Capture is one-shot, so a `slot="prepend"` child the consumer appends AFTER
   * connect would never be seen. These re-run it when one turns up — the icon
   * slot never needed it because an icon is written inline with the button, but
   * an affix is exactly the kind of thing a `v-if` reveals later.
   */
  private _lateAffix: { name: 'prepend' | 'append'; watcher: LateSlotWatcher }[] = []

  /**
   * Light-DOM refinement: `rounded="full"` auto-icon-only only when the default slot is
   * empty. `bucketHasContent` (not a length check) so a bucket holding nothing but
   * framework anchors still counts as empty.
   */
  protected override _defaultIsEmpty(): boolean {
    return !bucketHasContent(this._buckets.get('default'))
  }

  private _renderBadge(): TemplateResult | typeof nothing {
    return when(
      Boolean(this.badge),
      () => html`
        <span class=${this._badgeClass} mono-badge=${this._badgeColor}>
          ${this.badge}
        </span>
      `,
      () => nothing,
    )
  }

  /**
   * The `[data-mono-slot]` targets must be **structurally stable** across every
   * re-render.
   *
   * These are light-DOM elements holding nodes the *consumer's* framework
   * created and still tracks. Toggling `loading` used to swap between two
   * template branches, so Lit destroyed the target `<span>` — taking the
   * consumer's nodes with it — and `updated()` re-appended them into a brand-new
   * one. Vue's vnodes then referenced detached nodes, and the next patch died
   * with `TypeError: can't access property "__vnode", el is null`.
   *
   * So visibility is expressed with the existing `.button-icon.hidden` class
   * (`display: none !important`), never by adding or removing the target. With
   * the span stable, `_placeSlot` finds its nodes already in place and mutates
   * nothing at all on a loading toggle.
   */
  private _renderIconOnlyContent(): TemplateResult {
    return html`
      <span class=${this._iconClass()} mono-icon ?mono-spinning=${this._showsSpinner} ?mono-empty=${!this._hasIcon && !this._showsSpinner} data-mono-slot="icon"></span>

      ${this._renderBadge()}
    `
  }

  /**
   * Icon slot class, hidden in place while loading rather than unmounted — but
   * only in overlay mode. Inline loading keeps the icon, so the button doesn't
   * reshuffle its contents just to show progress.
   */
  /**
   * The icon box, which is also where the spinner is drawn.
   *
   * `spinning` paints the ring and hides whatever is slotted inside; `empty` collapses the box
   * when there is neither. The span itself is ALWAYS rendered — see `_renderNormalContent`.
   */
  private _iconClass(): string {
    const base = this._cls('button-icon', 'icon')
    const state = [
      this._showsSpinner ? 'spinning' : '',
      !this._hasIcon && !this._showsSpinner ? 'empty' : '',
    ].filter(Boolean).join(' ')
    return state ? `${base} ${state}` : base
  }

  private _renderNormalContent(): TemplateResult {
    const contentBase = this._hasIcon
      ? this.iconPosition === 'right'
        ? 'button-content icon-right'
        : 'button-content icon-left'
      : 'button-content'

    const contentClass = this._cls(contentBase, 'content')
    const iconClass = this._iconClass()
    const textClass = this._cls('button-text', 'text')

    // The icon span is rendered on BOTH sides-worth of conditions collapsed into one: it is
    // always in the tree, on the side `iconPosition` names, and `_iconClass` decides whether it
    // shows an icon, a spinner, or collapses to nothing. Two reasons it is never unmounted:
    //
    // - it is the `[data-mono-slot="icon"]` target, and a target that disappears takes the
    //   consumer's Vue-tracked nodes with it — the next patch then dies on a null `__vnode`;
    // - a button with no icon still needs somewhere to draw its spinner.
    const iconSpan = (position: 'left' | 'right'): TemplateResult | typeof nothing =>
      this.iconPosition === position
        ? html`<span class=${iconClass} mono-icon ?mono-spinning=${this._showsSpinner} ?mono-empty=${!this._hasIcon && !this._showsSpinner} data-mono-slot="icon"></span>`
        : nothing

    return html`
      <div class=${contentClass} mono-content>
        ${iconSpan('left')}

        <span class=${textClass} mono-text data-mono-slot="default"></span>

        ${iconSpan('right')}
      </div>

      ${this._renderBadge()}
    `
  }

  private _renderContent(): TemplateResult {
    if (this._isIconOnlyLike) {
      return this._renderIconOnlyContent()
    }

    return this._renderNormalContent()
  }

  protected override render(): TemplateResult {
    // Spinning implies disabled — in every phase, waiting included. But only
    // the *running* phase is natively `disabled`: a disabled control fires no
    // click at all, and the wait needs to keep hearing clicks to re-arm the
    // debounce timer (they're swallowed in `_handleClick`).
    const isDisabled = this._isBlocked
    const isInert = this._isInert

    if (this.href) {
      return this._renderWrapper(html`
          ${this._renderAffix('prepend')}
          <a
            class=${'mono-button-native' +
            (this.cssClass?.main ? ' ' + this.cssClass.main : '')}
            mono-native
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            title=${ifDefined(this.tooltip)}
            aria-label=${ifDefined(this._ariaLabel)}
            role="button"
            aria-disabled=${isDisabled ? 'true' : 'false'}
            aria-busy=${this._effectiveLoading ? 'true' : 'false'}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
          ${this._renderAffix('append')}
        `)
    }

    return this._renderWrapper(html`
        ${this._renderAffix('prepend')}
        <button
          class=${ifDefined(this.cssClass?.main)}
          mono-native
          type=${this.type}
          title=${ifDefined(this.tooltip)}
          aria-label=${ifDefined(this._ariaLabel)}
          ?disabled=${isInert}
          aria-disabled=${isDisabled ? 'true' : 'false'}
          aria-busy=${this._effectiveLoading ? 'true' : 'false'}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </button>
        ${this._renderAffix('append')}
      `)
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'button')
    this._captureSlots()

    // Capture detaches the consumer's children — and any framework anchors among
    // them — from the host; placement (in `updated()`) re-attaches them. Lit
    // renders on a microtask by default, so those anchors would sit orphaned
    // (`parentNode === null`) until then, and a consumer patch in that window (a
    // child's `mounted()` flipping a `v-if`, a sync store update, a nested
    // button's own connect) crashes Vue with `Cannot read properties of null
    // (reading 'insertBefore' / 'nextSibling')`. Forcing the first render
    // synchronously keeps capture→placement one uninterrupted step inside the
    // consumer's insert, so no anchor is ever observably detached (this is what
    // lets buttons nest). Later updates still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()

    // A prefix/suffix child can arrive after connect (a `v-if` flipping true).
    // Re-capture when one does; already-captured nodes lost their `slot`
    // attribute and were detached, so a re-scan never picks them up twice.
    if (!this._lateAffix.length) {
      for (const name of ['prepend', 'append'] as const) {
        this._lateAffix.push({
          name,
          watcher: new LateSlotWatcher(this, name, () => this._recaptureAffix()),
        })
      }
    }
    for (const { watcher } of this._lateAffix) watcher.start()
  }

  override disconnectedCallback(): void {
    for (const { watcher } of this._lateAffix) watcher.stop()
    super.disconnectedCallback()
  }

  /**
   * Claim a `slot="prepend"` / `slot="append"` child that arrived after connect.
   *
   * Deliberately NOT `captureLightSlots` a second time. This build renders into
   * the host (`createRenderRoot` → `this`), so by now the host's children include
   * Lit's own `<div class="mono-button">` — a re-capture would bucket that as
   * default content and detach it, wiping the rendered button. `LateSlotWatcher`
   * hands back only the direct child carrying the slot name, which is all that is
   * wanted here.
   */
  private _recaptureAffix(): void {
    let gained = false

    for (const { name, watcher } of this._lateAffix) {
      const el = watcher.find()
      if (!el) continue

      el.removeAttribute('slot')
      if (el.parentNode === this) this.removeChild(el)

      this._buckets.set(name, [...(this._buckets.get(name) ?? []), el])
      if (name === 'prepend') this._hasPrepend = true
      else this._hasAppend = true
      gained = true
    }

    if (gained) this.requestUpdate()
  }

  /**
   * Stop a nested control's click at the affix boundary — the plain `click`
   * and the `mno-click` / `mnoClick` aliases alike.
   *
   * An affix can hold a whole `<mono-button>` or a dropdown caret. Sibling
   * placement keeps its clicks out of `_handleClick`, but they would still
   * bubble to the HOST, where a consumer's `@click` is this button's action —
   * a split button's caret would run the button's handler. So an affix's click
   * ends here: its own handlers (deeper) and any document-level CAPTURE
   * listener have already run. Same guard `mono-button-dropdown` puts on its
   * embedded buttons.
   */
  private _guardAffixEvents(el: Element): void {
    if (this._guardedAffixes.has(el)) return
    this._guardedAffixes.add(el)
    const stop = (event: Event) => event.stopPropagation()
    el.addEventListener('click', stop)
    el.addEventListener('mno-click', stop)
    el.addEventListener('mnoClick', stop)
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    // `light-slots` carries comments and zero-length Fragment text nodes with the
    // content they anchor and removes *only* what it buckets — the previous inline
    // logic deleted every original child, dropping Vue's anchors for good.
    this._buckets = captureLightSlots(this, { names: ['icon', 'prepend', 'append'] })
    this._hasIcon = bucketHasContent(this._buckets.get('icon'))
    this._hasPrepend = bucketHasContent(this._buckets.get('prepend'))
    this._hasAppend = bucketHasContent(this._buckets.get('append'))
  }

  /**
   * An affix zone renders only when its slot has content, so an affix-free button
   * keeps byte-identical markup. That conditional is safe here — unlike the icon
   * span, whose target must never unmount — because capture runs BEFORE the
   * synchronous first render in `connectedCallback`, and because the flags only
   * ever go false→true: captured nodes stay captured, so a target that exists
   * once is never taken away from under the consumer's nodes.
   */
  private _renderAffix(name: 'prepend' | 'append'): TemplateResult | typeof nothing {
    const has = name === 'prepend' ? this._hasPrepend : this._hasAppend
    if (!has) return nothing

    const cls = [
      `button-${name}`,
      this._affix(name).divider ? 'has-divider' : '',
      this._affixDisabled(name) ? 'disabled' : '',
      this.cssClass?.[name] ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`<span
      class=${cls}
      mono-affix=${name}
      ?mono-divider=${Boolean(this._affix(name).divider)}
      ?mono-disabled=${this._affixDisabled(name)}
      data-mono-slot=${name}
    ></span>`
  }

  /**
   * Apply sizing to the HOST (`mono-button` is inline-block). The `.sized` class
   * makes the wrapper + inner control fill the host, so width/height set here
   * cascade down. Props that aren't set are removed so they don't linger.
   */
  private _applyHostSize(): void {
    const style = buildSizeStyle(this) as Record<string, string>
    for (const prop of ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height']) {
      const value = style[prop]
      if (value) this.style.setProperty(prop, value)
      else this.style.removeProperty(prop)
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)

    this._applyHostSize()
    this._placeSlot('icon', this._buckets.get('icon') ?? [])
    this._placeSlot('prepend', this._buckets.get('prepend') ?? [])
    this._placeSlot('append', this._buckets.get('append') ?? [])

    for (const name of ['prepend', 'append'] as const) {
      const zone = this.querySelector(`[data-mono-slot="${name}"]`)
      if (zone) this._guardAffixEvents(zone)
    }

    if (!this._isIconOnlyLike) {
      this._placeSlot('default', this._buckets.get('default') ?? [])
    }
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return

    const target = this.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return

    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-button': MonoButton
  }
}
