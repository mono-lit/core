import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoRichTextEditorCore } from './rich-text-editor-core.js'

import richTextEditorCss from './rich-text-editor.css?raw'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-rich-text-editor` (default build, `@mono-lit/helper/ui/rich-text-editor`).
 *
 * `createRenderRoot()` returns `this`, so it renders into light DOM and inherits
 * the page's global stylesheet — which is also where SunEditor's own sheet
 * lives. Named slots (label/helper) are captured from the light-DOM children in
 * `connectedCallback` and re-parented into the rendered `data-mono-slot`
 * placeholders in `updated()`; the editor mount is re-homed into the field frame
 * the same way by the core (`_placeMount`). All render-mode-agnostic logic is
 * shared with the shadow build (`@mono-lit/helper/ui/shadow/rich-text-editor`) via
 * `MonoRichTextEditorCore`.
 */
@customElement('mono-rich-text-editor')
export class MonoRichTextEditor extends MonoRichTextEditorCore(LitElement) {
  static override styles = [unsafeCSS(richTextEditorCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _slotLabel: Node[] = []
  private _slotHelper: Node[] = []

  override connectedCallback(): void {
    // Capture BEFORE the core's connectedCallback creates the mount, so the
    // mount is never mistaken for consumer content.
    this._captureSlots()
    super.connectedCallback()

    // Render synchronously so a captured named-slot element (and any Vue anchor
    // beside it) is re-placed within this insert rather than a microtask later;
    // otherwise a patch in that window hits a detached node and crashes Vue.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeSlot('label', this._slotLabel)
    this._placeSlot('helper', this._slotHelper)
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const capturedSlotNodes = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) continue
      const slotName = node.getAttribute('slot')
      if (slotName === 'label') {
        node.removeAttribute('slot')
        this._slotLabel.push(node)
        capturedSlotNodes.add(node)
      }
      if (slotName === 'helper') {
        node.removeAttribute('slot')
        this._slotHelper.push(node)
        capturedSlotNodes.add(node)
      }
    }

    this._hasLabelSlotState = this._slotLabel.length > 0
    this._hasHelperSlotState = this._slotHelper.length > 0

    for (const node of capturedSlotNodes) {
      if (node.parentNode === this) this.removeChild(node)
    }
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return
    const target = this.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return
    for (const node of nodes) placeSlotNode(target, node)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-rich-text-editor': MonoRichTextEditor
  }
}
