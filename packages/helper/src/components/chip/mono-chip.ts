// @unocss-include

import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'

import { MonoChipCore } from './chip-core.js'
import { bucketHasContent,
  captureLightSlots,
  type LightSlotBuckets, placeSlotNode } from '../../composables/light-slots'

import chipCss from './chip.css?raw'

/**
 * Light-DOM `mono-chip` (default build, `@mono-lit/helper/ui/chip`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="icon"`/`"close"`
 * + default text children are captured in `connectedCallback`, the template
 * renders empty `[data-mono-slot]` targets, and the captured nodes are re-placed
 * in `updated()`. Capture goes through `composables/light-slots`, which carries the
 * consumer framework's positional anchors (Vue's `<!--v-if-->` comments and
 * zero-length Fragment text nodes) instead of deleting them, and the first render
 * is forced **synchronously** from `connectedCallback` so capture→placement is one
 * uninterrupted step — together that's what lets chips nest freely without crashing
 * the consumer's next patch on a null anchor. All render-mode-agnostic logic lives
 * in `MonoChipCore`. The shadow build (`@mono-lit/helper/ui/shadow/chip`) shares the
 * mixin but uses native `<slot>`. Both register `mono-chip`, so a document loads
 * only one.
 */
@customElement('mono-chip')
export class MonoChip extends MonoChipCore(LitElement) {
  static override styles = [unsafeCSS(chipCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _buckets: LightSlotBuckets = new Map()
  private _slotsCaptured = false

  private _renderLabel(): TemplateResult {
    return html`
      <span class=${this._cls('chip-label', 'label')} mono-label data-mono-slot="default">
        ${when(
          Boolean(this.label),
          () => this.label,
          () => nothing,
        )}
      </span>
    `
  }

  private _renderDot(): TemplateResult | typeof nothing {
    return when(
      this.dot,
      () => html`<span class=${this._cls('chip-dot', 'dot')} mono-dot aria-hidden="true"></span>`,
      () => nothing,
    )
  }

  private _renderClose(): TemplateResult | typeof nothing {
    return when(
      this.removable,
      () => html`
        <button
          class=${this._cls('chip-close', 'close')}
          mono-close
          type="button"
          aria-label=${this.closeLabel}
          ?disabled=${this.disabled}
          data-mono-slot="close"
          @click=${this._handleClose}
        >
          ${bucketHasContent(this._buckets.get('close'))
            ? nothing
            : html`<span class="mono-icon i-mdi-close" mono-glyph aria-hidden="true"></span>`}
        </button>
      `,
      () => nothing,
    )
  }

  private _renderContent(): TemplateResult {
    const hasIcon = this._hasIcon

    const contentClass = this._cls(
      hasIcon
        ? this.iconPosition === 'right'
          ? 'chip-content icon-right'
          : 'chip-content icon-left'
        : 'chip-content',
      'content',
    )

    return html`
      <span class=${contentClass} mono-content>
        ${this._renderDot()}

        ${when(
          hasIcon && this.iconPosition === 'left',
          () => html`<span data-mono-slot="icon"></span>`,
          () => nothing,
        )}

        ${this._renderLabel()}

        ${when(
          hasIcon && this.iconPosition === 'right',
          () => html`<span data-mono-slot="icon"></span>`,
          () => nothing,
        )}

        ${this._renderClose()}
      </span>
    `
  }

  protected override render(): TemplateResult {
    const tabIndex = this._isInteractive && !this.disabled ? '0' : undefined
    const ariaLabel = this.ariaLabelText ?? this.label

    if (this.href) {
      return html`
        <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'soft' ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === 'right' ? 'right' : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
          <a
            class=${'mono-chip-native' +
            (this.cssClass?.main ? ' ' + this.cssClass.main : '')}
            mono-main
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            role="button"
            aria-label=${ifDefined(ariaLabel)}
            aria-disabled=${this.disabled ? 'true' : 'false'}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
        </div>
      `
    }

    return html`
      <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'soft' ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === 'right' ? 'right' : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
        <span
          class=${ifDefined(this.cssClass?.main)}
          mono-main
          role=${this._isInteractive ? 'button' : 'status'}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(ariaLabel)}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </span>
      </div>
    `
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'status')
    this._captureSlots()

    // Capture detaches the consumer's children — and any framework anchors among
    // them — from the host; placement (in `updated()`) re-attaches them. Lit
    // renders on a microtask by default, so those anchors would sit orphaned
    // (`parentNode === null`) until then, and a consumer patch in that window (a
    // child's `mounted()` flipping a `v-if`, a sync store update, a nested chip's
    // own connect) crashes Vue with `Cannot read properties of null (reading
    // 'insertBefore' / 'nextSibling')`. Forcing the first render synchronously
    // keeps capture→placement one uninterrupted step inside the consumer's insert,
    // so no anchor is ever observably detached (this is what lets chips nest).
    // Later updates still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  /**
   * In light DOM mode, <slot> elements no longer project the host's children.
   * Capture them once before Lit's first render replaces the children, then
   * re-place them in the render template at the right positions. `light-slots`
   * carries comments and zero-length Fragment text nodes with the content they
   * anchor and removes *only* what it buckets — the previous inline logic deleted
   * every original child, dropping Vue's anchors for good.
   */
  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    this._buckets = captureLightSlots(this, { names: ['icon', 'close'] })
    this._hasIcon = bucketHasContent(this._buckets.get('icon'))
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)

    this._placeSlot('icon', this._buckets.get('icon') ?? [])
    this._placeSlot('close', this._buckets.get('close') ?? [])

    if (!this.label) {
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
    'mono-chip': MonoChip
  }
}
