// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoSidebarCore } from './sidebar-core.js'
import { guardHostTextContent, placeSlotNode } from '../../composables/light-slots'

import sidebarCss from './sidebar.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-sidebar` (default build, `@mono-lit/helper/ui/sidebar`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="header"`/
 * `"footer"`/`"body"` (or unslotted) children are captured in
 * `connectedCallback`, the template renders empty `[data-mono-slot]` targets,
 * and the captured nodes are re-appended in `updated()`. All render-mode-agnostic
 * logic lives in `MonoSidebarCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/sidebar`) shares the mixin but uses native `<slot>`.
 * Both register `mono-sidebar`, so a document loads only one.
 */
@customElement('mono-sidebar')
export class MonoSidebar extends MonoSidebarCore(LitElement) {
  static override styles = [unsafeCSS(sidebarCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _slotHeader: Node[] = []
  private _slotBody: Node[] = []
  private _slotFooter: Node[] = []

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
    super.updated(changed)
    this._placeSlots()
  }

  protected override renderIcon(_name: 'chevron'): TemplateResult {
    return html`<span class="mono-icon i-mdi-chevron-right" aria-hidden="true"></span>`
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const toRemove = new Set<Node>()

    for (const node of captured) {
      let bucket: 'header' | 'footer' | 'body' = 'body'

      if (node instanceof Element) {
        const explicit = node.getAttribute('slot')
        if (explicit === 'header' || explicit === 'footer') {
          bucket = explicit
          node.removeAttribute('slot')
        } else if (explicit === 'body' || explicit === null) {
          bucket = 'body'
          if (explicit === 'body') node.removeAttribute('slot')
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        if (!(node.textContent ?? '').trim()) continue
      } else if (node.nodeType === Node.COMMENT_NODE) {
        continue
      }

      if (bucket === 'header') this._slotHeader.push(node)
      else if (bucket === 'footer') this._slotFooter.push(node)
      else this._slotBody.push(node)

      toRemove.add(node)
    }

    for (const node of toRemove) {
      if (node.parentNode === this) this.removeChild(node)
    }

    // Vue patches a lone interpolation with `host.textContent = next`, which in a
    // light build would wipe this element's whole render. Send those writes to the
    // body region instead.
    guardHostTextContent(
      this,
      new Map([
        ['header', this._slotHeader],
        ['body', this._slotBody],
        ['footer', this._slotFooter],
      ]),
      { fallback: 'body', onWrite: () => this.requestUpdate() },
    )
  }

  private _placeSlots(): void {
    this._placeSlot('header', this._slotHeader)
    this._placeSlot('body', this._slotBody)
    this._placeSlot('footer', this._slotFooter)
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
    'mono-sidebar': MonoSidebar
  }
}
