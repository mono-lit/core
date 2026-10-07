// @unocss-include

import { LitElement, html, nothing, isServer, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { MonoInputCore } from './input-core.js'

import inputCss from './input.css?raw'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-input` (default build, `@mono-lit/helper/ui/input`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) and uses the light-DOM slot strategy: `slot="prefix|…"`
 * children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets, and the captured nodes are appended back in
 * `updated()`. All render-mode-agnostic logic lives in `MonoInputCore`. The
 * shadow build (`@mono-lit/helper/ui/shadow/input`) shares the mixin but uses native
 * `<slot>`. Both register `mono-input`, so a document loads only one.
 */
@customElement('mono-input')
export class MonoInput extends MonoInputCore(LitElement) {
  static override styles = [unsafeCSS(inputCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotPrefix: Node[] = []
  private _slotSuffix: Node[] = []
  private _slotLabel: Node[] = []
  private _slotHelper: Node[] = []
  private _slotObserver?: MutationObserver

  /**
   * Capture `slot="…"` light-DOM children into the per-region arrays. Safe to run
   * MORE THAN ONCE: captured nodes have their `slot` attribute removed and are
   * detached from the host, so a re-scan never re-captures them. Re-running lets
   * us pick up children Vue appends AFTER `connectedCallback` (e.g. a client-only
   * `<mono-input>` slotted into the SSR `<mono-nav>`'s shadow `<slot>`, where the
   * `<span slot="prefix">` can arrive late) — the original one-shot capture missed
   * those, so the prefix wrapper was never rendered and the icon never showed.
   */
  private _captureSlots(): void {
    // Pause our own observer so the `removeChild` calls below don't re-enter.
    this._slotObserver?.disconnect()

    const captured = monoHostChildNodes(this)
    const capturedSlotNodes = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) continue
      const slotName = node.getAttribute('slot')

      if (slotName === 'prefix') {
        node.removeAttribute('slot')
        this._slotPrefix.push(node)
        capturedSlotNodes.add(node)
      } else if (slotName === 'suffix') {
        node.removeAttribute('slot')
        this._slotSuffix.push(node)
        capturedSlotNodes.add(node)
      } else if (slotName === 'label') {
        node.removeAttribute('slot')
        this._slotLabel.push(node)
        capturedSlotNodes.add(node)
      } else if (slotName === 'helper') {
        node.removeAttribute('slot')
        this._slotHelper.push(node)
        capturedSlotNodes.add(node)
      }
    }

    if (capturedSlotNodes.size) {
      // Reactive `@state` writes → re-render → the prefix/etc. wrapper appears,
      // and `updated()` → `_placeSlot()` moves the captured node into it.
      this._hasPrefixSlotState = this._slotPrefix.length > 0
      this._hasSuffixSlotState = this._slotSuffix.length > 0
      this._hasLabelSlotState = this._slotLabel.length > 0
      this._hasHelperSlotState = this._slotHelper.length > 0

      for (const node of capturedSlotNodes) {
        if (node.parentNode === this) this.removeChild(node)
      }
    }

    // Resume watching for any further late/dynamic slot children.
    if (this._slotObserver && this.isConnected) {
      this._slotObserver.observe(this, { childList: true })
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Watch for slot children Vue appends after connect (client only; the lit-ssr
    // shim has no MutationObserver and the light input is client-only anyway).
    if (!isServer && !this._slotObserver && typeof MutationObserver !== 'undefined') {
      this._slotObserver = new MutationObserver(() => this._captureSlots())
    }
    this._captureSlots()

    // Render synchronously so a captured named-slot element (and any Vue anchor
    // beside it) is re-placed within this insert rather than a microtask later;
    // otherwise a patch in that window (e.g. a child's mounted() flipping a v-if)
    // hits a detached node and crashes Vue. The observer still handles genuinely-
    // late children asynchronously; later updates re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  override disconnectedCallback(): void {
    this._slotObserver?.disconnect()
    super.disconnectedCallback()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeSlot('prefix', this._slotPrefix)
    this._placeSlot('suffix', this._slotSuffix)
    this._placeSlot('label', this._slotLabel)
    this._placeSlot('helper', this._slotHelper)
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return
    const target = this.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return
    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }

  protected override renderIcon(_name: 'close'): TemplateResult {
    return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`
  }

  private _renderLabel(): TemplateResult | typeof nothing {
    if (!this.label && !this._hasLabelSlot) return nothing
    return html`
      <label class=${this._cls('mono-input-label', 'label')} mono-label for=${this._inputId}>
        ${this._hasLabelSlot ? html`<span data-mono-slot="label"></span>` : this.label}
        ${this.required
          ? html`<span class=${this._cls('mono-input-required', 'required')} mono-required-mark>*</span>`
          : nothing}
      </label>
    `
  }

  private _renderHelper(): TemplateResult | typeof nothing {
    const base = this._cls('mono-input-message', 'message')
    if (this.validationMessage) {
      const state = this._resolvedValidationState
      return html`<div class=${`${base} ${state}`} mono-message=${state} role=${state === 'invalid' ? 'alert' : nothing}>${this.validationMessage}</div>`
    }
    if (this.errorMessage) {
      return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`
    }
    if (this.successMessage) {
      return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`
    }
    if (this.helperText || this._hasHelperSlot) {
      return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlot ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`
    }
    return nothing
  }

  protected override render(): TemplateResult {
    return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          ${this._hasPrefixSlot
            ? html`<span class=${this._cls('mono-input-prefix', 'prefix')} mono-prefix><span data-mono-slot="prefix"></span></span>`
            : nothing}
          ${this._renderNative()}
          ${this._renderClear()}
          ${this._hasSuffixSlot
            ? html`<span class=${this._cls('mono-input-suffix', 'suffix')} mono-suffix><span data-mono-slot="suffix"></span></span>`
            : nothing}
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>
          ${this._renderHelper()}
        </div>
    `)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-input': MonoInput
  }
}
