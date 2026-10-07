// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoTabsCore } from './tabs-core.js'
import { parkDetachedNodes, placeSlotNode } from '../../composables/light-slots'

import tabsCss from './tabs.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-tabs` (default build, `@mono-lit/helper/ui/tabs`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). Per-tab icons use the light-DOM slot strategy: `slot=
 * "icon-<id>"` children are captured in `connectedCallback`, the template renders
 * empty `[data-mono-slot="icon-<id>"]` targets, and the captured nodes are
 * re-placed in `updated()`. All render-mode-agnostic logic lives in `MonoTabsCore`.
 * The shadow build (`@mono-lit/helper/ui/shadow/tabs`) shares the mixin but renders the
 * whole tablist in one shadow root with native `<slot>`. Both register `mono-tabs`,
 * so a document loads only one.
 */
@customElement('mono-tabs')
export class MonoTabs extends MonoTabsCore(LitElement) {
  static override styles = [unsafeCSS(tabsCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  @state()
  private _slotsCaptured = false

  private _slotIcons = new Map<string, Node[]>()
  private _orphanHolder?: HTMLElement

  /** Light-DOM: a tab has an icon when a `slot="icon-<id>"` child was captured. */
  protected override _iconHasContent(id: string): boolean {
    return this._slotIcons.has(id)
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so a captured named-slot element (and any Vue anchor
    // beside it) is re-placed within this insert rather than a microtask later;
    // otherwise a patch in that window (e.g. a child's mounted() flipping a v-if)
    // hits a detached node and crashes Vue. Later updates re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeIconSlots()
    // An `icon-<id>` whose tab doesn't exist (yet — e.g. async items) has no target;
    // park it so it never sits detached and crashes a consumer patch.
    this._orphanHolder = parkDetachedNodes(
      this._orphanHolder,
      [...this._slotIcons.values()].flat(),
    )
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return

    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const capturedSlotNodes = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) continue

      const slotName = node.getAttribute('slot')
      if (!slotName || !slotName.startsWith('icon-')) continue

      const id = slotName.slice('icon-'.length)
      if (!id) continue

      node.removeAttribute('slot')
      const list = this._slotIcons.get(id) ?? []
      list.push(node)
      this._slotIcons.set(id, list)
      capturedSlotNodes.add(node)
    }

    for (const node of capturedSlotNodes) {
      if (node.parentNode === this) {
        this.removeChild(node)
      }
    }
  }

  private _placeIconSlots(): void {
    if (!this._slotIcons.size) return

    for (const [id, nodes] of this._slotIcons) {
      const target = this.querySelector(`[data-mono-slot="icon-${id}"]`)
      if (!target) continue

      for (const node of nodes) {
        placeSlotNode(target, node)
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-tabs': MonoTabs
  }
}
