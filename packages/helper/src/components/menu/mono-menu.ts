// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoMenuCore } from './menu-core.js'
import { parkDetachedNodes, placeSlotNode } from '../../composables/light-slots'

import menuCss from './menu.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-menu` (`@mono-lit/helper/ui/menu`).
 *
 * Renders into `this` (`createRenderRoot()=>this`) and keeps the full light-DOM
 * feature set: declarative `slot="body"` composition with `<mono-menu-list>`
 * children, per-item `slot="icon-${id}"` slots, and the child registry. All
 * render-mode-agnostic logic (props, selection/open state, events, public API)
 * lives in `MonoMenuCore`.
 */
@customElement('mono-menu')
export class MonoMenu extends MonoMenuCore(LitElement) {
  static override styles = [unsafeCSS(menuCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  @state()
  private _slotsCaptured = false

  @state()
  private _hasBodySlot = false

  /** Captured nodes for the whole-body slot — `slot="body"`. */
  private _slotBody: Node[] = []
  private _orphanHolder?: HTMLElement

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()
    this._seedDefaultOpenGroups()

    // Render synchronously so a captured named-slot element (and any Vue anchor
    // beside it) is re-placed within this insert rather than a microtask later;
    // otherwise a patch in that window (e.g. a child's mounted() flipping a v-if)
    // hits a detached node and crashes Vue. Later updates re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const toRemove = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) continue

      const slotName = node.getAttribute('slot')
      if (!slotName) continue

      if (slotName === 'body') {
        node.removeAttribute('slot')
        // The element the author hung `slot="body"` on is only a carrier — the
        // rows inside it are the menu's children. Mark it so the sheet can
        // dissolve it and lay those rows out itself; the `slot` attribute is
        // gone by the time the sheet sees it.
        node.setAttribute('mono-slotted', '')
        this._slotBody.push(node)
        toRemove.add(node)
        continue
      }

      if (slotName.startsWith('icon-')) {
        const id = slotName.slice('icon-'.length)
        if (!id) continue
        node.removeAttribute('slot')
        const list = this._slotIcons.get(id) ?? []
        list.push(node)
        this._slotIcons.set(id, list)
        toRemove.add(node)
      }
    }

    this._hasBodySlot = this._slotBody.length > 0

    for (const node of toRemove) {
      if (node.parentNode === this) {
        this.removeChild(node)
      }
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeIconSlots()
    this._placeBodySlot()
    this._notifyListChildren(changed)
    // An `icon-<id>` whose item doesn't exist (yet — e.g. async items) has no
    // target; park it so it never sits detached and crashes a consumer patch.
    this._orphanHolder = parkDetachedNodes(this._orphanHolder, [
      ...[...this._slotIcons.values()].flat(),
      ...this._slotBody,
    ])
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

  private _placeBodySlot(): void {
    if (!this._slotBody.length) return
    const target = this.querySelector('[data-mono-slot="body"]')
    if (!target) return
    for (const node of this._slotBody) {
      placeSlotNode(target, node)
    }
  }

  /**
   * When any prop that influences the rendered content of descendant
   * `<mono-menu-list>` instances changes, ask each registered child to
   * re-render so they stay in lockstep with the parent.
   */
  private _notifyListChildren(changed: Map<string, unknown>): void {
    if (!this._listChildren.size) return
    const triggers = [
      'modelValue',
      '_openGroups',
      'multiple',
      'density',
      'color',
      'cssClass',
      'cssClassName',
      'disabled',
      'selectable',
      'nav',
    ]
    if (!triggers.some((k) => changed.has(k))) return
    for (const child of this._listChildren) {
      child.requestUpdate()
    }
  }

  /** Light body — declarative `slot="body"` placeholder, else items-driven. */
  protected override _renderBody(): TemplateResult {
    if (this._hasBodySlot) {
      return html`<div class="mono-menu-body" mono-body data-mono-slot="body"></div>`
    }
    return super._renderBody()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-menu': MonoMenu
  }
}
