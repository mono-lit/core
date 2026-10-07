// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoNavCore } from './nav-core.js'
import { guardHostTextContent, placeSlotNode } from '../../composables/light-slots'

import navCss from './nav.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-nav` (the default build, `@mono-lit/helper/ui/nav`).
 *
 * Renders into the host itself (`createRenderRoot` → `this`) so the global
 * `dist/ui/index.css` styles it, and uses the light-DOM slot strategy: direct
 * children are captured in `connectedCallback`, the chrome renders empty
 * `[data-mono-slot]` targets, and the captured nodes are appended back in
 * `updated()`. All render-mode-agnostic logic lives in `MonoNavCore`.
 *
 * The shadow-DOM build (`@mono-lit/helper/ui/shadow/nav`) shares `MonoNavCore` but
 * uses a real shadow root + native `<slot>`. Both register the SAME tag, so a
 * given document must load only one of the two builds.
 */
@customElement('mono-nav')
export class MonoNav extends MonoNavCore(LitElement) {
  static override styles = [unsafeCSS(navCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  @state()
  private _slotsCaptured = false

  private _slotNodes = new Map<string, Node[]>()

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so the captured default content — and the consumer's
    // Vue anchors that travel with it — is re-placed within this insert rather
    // than a microtask later; otherwise a patch in that window (e.g. a child's
    // `mounted()` flipping a v-if) hits a detached node and crashes Vue. Later
    // updates still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeSlots()
  }

  /**
   * Pull every direct child into one of four buckets:
   *  - `slot="start"`  → start
   *  - `slot="end"`    → end
   *  - `slot="extension"` → extension
   *  - everything else (no slot attr) → default (center)
   *
   * Captured nodes are removed from the host root and re-inserted into the
   * matching `[data-mono-slot]` target during `updated()`.
   */
  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const toRemove = new Set<Node>()

    for (const node of captured) {
      let slotName = 'default'

      if (node instanceof Element) {
        const explicit = node.getAttribute('slot')
        if (explicit === 'start' || explicit === 'end' || explicit === 'extension') {
          slotName = explicit
          node.removeAttribute('slot')
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Skip empty text-node whitespace (formatting whitespace inside the host tag).
        if (!(node.textContent ?? '').trim()) continue
      } else if (node.nodeType === Node.COMMENT_NODE) {
        continue
      }

      const list = this._slotNodes.get(slotName) ?? []
      list.push(node)
      this._slotNodes.set(slotName, list)
      toRemove.add(node)
    }

    for (const node of toRemove) {
      if (node.parentNode === this) {
        this.removeChild(node)
      }
    }

    // Vue patches a lone interpolation with `host.textContent = next`, which in a
    // light build would wipe this element's whole render. Send those writes to the
    // default region instead.
    guardHostTextContent(this, this._slotNodes, {
      onWrite: () => this.requestUpdate(),
    })
  }

  private _placeSlots(): void {
    if (!this._slotNodes.size) return

    for (const [slotName, nodes] of this._slotNodes) {
      const target = this.querySelector(`[data-mono-slot="${slotName}"]`)
      if (!target) continue

      for (const node of nodes) {
        placeSlotNode(target, node)
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-nav': MonoNav
  }
}
