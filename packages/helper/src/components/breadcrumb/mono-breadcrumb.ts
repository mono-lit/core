// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoBreadcrumbCore } from './breadcrumb-core.js'
import { parkDetachedNodes, placeSlotNode } from '../../composables/light-slots'

import breadcrumbCss from './breadcrumb.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-breadcrumb` (default build, `@mono-lit/helper/ui/breadcrumb`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). Supports declarative composition with
 * `<mono-breadcrumb-list>` children and the light-DOM slot strategy: `slot="body"`
 * / `slot="separator"` / `slot="icon-<id>"` children are captured in
 * `connectedCallback`, the template renders empty `[data-mono-slot]` targets, and
 * the captured nodes are re-placed in `updated()`. All render-mode-agnostic logic
 * lives in `MonoBreadcrumbCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/breadcrumb`) shares the mixin but renders the whole list
 * from the `items` prop in a single shadow root. Both register `mono-breadcrumb`,
 * so a document loads only one.
 */
@customElement('mono-breadcrumb')
export class MonoBreadcrumb extends MonoBreadcrumbCore(LitElement) {
  static override styles = [unsafeCSS(breadcrumbCss)]

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

    // Render synchronously so a captured named-slot element (and any Vue anchor
    // beside it) is re-placed within this insert rather than a microtask later;
    // otherwise a patch in that window (e.g. a child's mounted() flipping a v-if)
    // hits a detached node and crashes Vue. Later updates re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeIconSlots()
    this._placeBodySlot()
    this._placeSeparatorSlots()
    this._notifyListChildren(changed)
    // A slot whose target isn't rendered (e.g. `icon-<id>`/`separator` before the
    // items exist) has nowhere to go; park it so it never sits detached and crashes
    // a consumer patch.
    this._orphanHolder = parkDetachedNodes(this._orphanHolder, [
      ...[...this._slotIcons.values()].flat(),
      ...this._slotBody,
      ...this._slotSeparator,
    ])
  }

  protected override _renderBody(): TemplateResult {
    if (this._hasBodySlot) {
      return html`<ol
        class=${this._cls('mono-breadcrumb-list', 'list')}
        mono-list
        data-mono-slot="body"
      ></ol>`
    }
    return super._renderBody()
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
        this._slotBody.push(node)
        toRemove.add(node)
        continue
      }

      if (slotName === 'separator') {
        node.removeAttribute('slot')
        this._slotSeparator.push(node)
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

  private _placeSeparatorSlots(): void {
    if (!this._slotSeparator.length) return
    const targets = this.querySelectorAll('[data-mono-slot^="separator-"]')
    if (!targets.length) return

    // The separator is a template reused between every pair of items. Move the
    // consumer's ORIGINAL node into the first slot (so it keeps a live parent —
    // Vue still tracks it, and a detached original crashes its next patch) and
    // clone it into the rest.
    //
    // Every clone is stamped and the target is cleared of its previous stamps
    // first. This method runs on EVERY render, and appending unconditionally
    // meant one extra permanent subtree per separator per render — 8 crumbs grew
    // the DOM by 7 nodes on every unrelated re-render, without bound.
    targets.forEach((target, ti) => {
      for (const stale of Array.from(target.querySelectorAll(':scope > [data-mono-sep-clone]'))) {
        stale.remove()
      }

      this._slotSeparator.forEach((node, ni) => {
        if (ti === 0 && ni === 0) {
          placeSlotNode(target, node)
        } else {
          const clone = node.cloneNode(true)
          if (clone instanceof Element) clone.setAttribute('data-mono-sep-clone', '')
          target.appendChild(clone)
        }
      })
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-breadcrumb': MonoBreadcrumb
  }
}
