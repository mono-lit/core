// @unocss-include

import { LitElement, html, isServer, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { MonoOtpCore, type OtpIconName } from './otp-core.js'

import otpCss from './otp.css?raw'
import { placeSlotNode, unwatchHostChildren, watchHostChildren } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-otp` (default build, `@mono-lit/helper/ui/otp`).
 *
 * Renders into the host (styled by the global `dist/ui/index.css`). `slot="prefix|suffix|label|helper"`
 * children are captured on connect and re-placed into `[data-mono-slot]` placeholders after each
 * render — the same strategy as mono-input. Everything else lives in `MonoOtpCore`; the shadow
 * build (`mono-shadow-otp`) shares it with native `<slot>`s.
 */
@customElement('mono-otp')
export class MonoOtp extends MonoOtpCore(LitElement) {

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slots: Record<'prefix' | 'suffix' | 'label' | 'helper', Node[]> = { prefix: [], suffix: [], label: [], helper: [] }
  /** Re-capture on children appended after connect — one shared observer, see `watchHostChildren`. */
  private readonly _onHostChildren = (): void => this._captureSlots()

  /** Capture `slot="…"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
  private _captureSlots(): void {
    const captured = new Set<Node>()
    for (const node of monoHostChildNodes(this)) {
      if (!(node instanceof Element)) continue
      const name = node.getAttribute('slot')
      if (name !== 'prefix' && name !== 'suffix' && name !== 'label' && name !== 'helper') continue
      this._slots[name].push(node)
      node.removeAttribute('slot')
      captured.add(node)
    }
    if (captured.size) {
      this._hasPrefixSlotState = this._slots.prefix.length > 0
      this._hasSuffixSlotState = this._slots.suffix.length > 0
      this._hasLabelSlotState = this._slots.label.length > 0
      this._hasHelperSlotState = this._slots.helper.length > 0
      for (const node of captured) if (node.parentNode === this) this.removeChild(node)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (!isServer) watchHostChildren(this, this._onHostChildren)
    this._captureSlots()
    // Render synchronously so captured slot nodes are re-placed within this insert (see mono-input).
    if (this.isConnected) this.performUpdate()
  }

  override disconnectedCallback(): void {
    unwatchHostChildren(this, this._onHostChildren)
    super.disconnectedCallback()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    for (const name of ['prefix', 'suffix', 'label', 'helper'] as const) {
      const nodes = this._slots[name]
      if (!nodes.length) continue
      const target = this.querySelector(`[data-mono-slot="${name}"]`)
      if (!target) continue
      for (const node of nodes) placeSlotNode(target, node)
    }
  }

  protected override renderIcon(_name: OtpIconName): TemplateResult {
    return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-otp': MonoOtp
  }
}
