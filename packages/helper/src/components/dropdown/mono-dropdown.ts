// @unocss-include

import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoDropdownCore } from './dropdown-core.js'
import { guardHostTextContent, placeSlotNode } from '../../composables/light-slots'

import dropdownCss from './dropdown.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-dropdown` (default build, `@mono-lit/helper/ui/dropdown`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="main"`/`"body"`
 * children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets, and the captured nodes are re-appended in
 * `updated()`. All render-mode-agnostic logic lives in `MonoDropdownCore`. The
 * shadow build (`@mono-lit/helper/ui/shadow/dropdown`) shares the mixin but uses native
 * `<slot>`. Both register `mono-dropdown`, so a document loads only one.
 */
@customElement('mono-dropdown')
export class MonoDropdown extends MonoDropdownCore(LitElement) {
  static override styles = [unsafeCSS(dropdownCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  @state()
  private _hasBodySlotState = false

  private _slotsCaptured = false
  private _slotMain: Node[] = []
  private _slotBody: Node[] = []

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so the captured content — and the consumer's Vue
    // anchors that travel with it — is re-placed within this insert rather than a
    // microtask later; otherwise a patch in that window hits a detached node and
    // crashes Vue. Later updates still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    this._placeSlot('main', this._slotMain)
    this._placeSlot('body', this._slotBody)
    super.updated(changed)
  }

  protected override _activeMainNodes(): HTMLElement[] {
    return this._slotMain.filter((n): n is HTMLElement => n instanceof HTMLElement)
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const capturedSlotNodes = new Set<Node>()
    let unslottedSeen = false

    for (const node of captured) {
      if (!(node instanceof Element)) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          unslottedSeen = true
        }
        continue
      }

      const slotName = node.getAttribute('slot')

      if (slotName === 'main') {
        node.removeAttribute('slot')
        this._slotMain.push(node)
        capturedSlotNodes.add(node)
        continue
      }

      if (slotName === 'body' || slotName === null) {
        if (slotName === 'body') node.removeAttribute('slot')
        this._slotBody.push(node)
        capturedSlotNodes.add(node)
        unslottedSeen = true
        continue
      }
    }

    this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0

    for (const node of capturedSlotNodes) {
      if (node.parentNode === this) this.removeChild(node)
    }

    // Vue patches a lone interpolation with `host.textContent = next`, which in a
    // light build would wipe this element's whole render. Send those writes to the
    // body region instead.
    guardHostTextContent(
      this,
      new Map([
        ['main', this._slotMain],
        ['body', this._slotBody],
      ]),
      {
        fallback: 'body',
        onWrite: () => {
          this._hasBodySlotState = this._slotBody.length > 0
          this.requestUpdate()
        },
      },
    )
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return
    // The `body` slot target lives inside the panel, which the portal controller
    // may relocate into a body portal — fall back to the portal when the target
    // is no longer under the host.
    const sel = `[data-mono-slot="${name}"]`
    const target = this.querySelector(sel) ?? this._popup.panelRoot.querySelector(sel)
    if (!target) return
    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }

  private _renderBody(): TemplateResult | typeof nothing {
    if (!this._hasBodySlotState) return nothing
    return html`<div class=${this._cls('mono-dropdown-body', 'body')} mono-body data-mono-slot="body"></div>`
  }

  protected override render(): TemplateResult {
    return html`
      <span class=${this._cls('mono-dropdown-main', 'main')} mono-activator data-mono-slot="main"></span>
      <div
        class=${this._cls('mono-dropdown-panel', 'panel')}
        mono-panel
        role="dialog"
        aria-hidden=${this.modelValue ? 'false' : 'true'}
      >
        ${this._renderBody()}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-dropdown': MonoDropdown
  }
}
