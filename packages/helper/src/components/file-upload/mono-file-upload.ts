// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoFileUploadCore } from './file-upload-core.js'

import fileUploadCss from './file-upload.css?raw'
import { parkDetachedNodes, placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/** Named slots the light build captures: the dropzone icon and its two text lines. */
const FILE_UPLOAD_LIGHT_SLOTS = ['icon', 'title', 'subtitle'] as const
type FileUploadLightSlot = (typeof FILE_UPLOAD_LIGHT_SLOTS)[number]

/**
 * Light-DOM `mono-file-upload` (default build, `@mono-lit/helper/ui/file-upload`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). The `slot="icon"` / `slot="title"` / `slot="subtitle"`
 * dropzone parts use the light-DOM strategy: the child is captured in
 * `connectedCallback`, the template renders an empty `[data-mono-slot="…"]`
 * target, and the node is re-placed in `updated()`.
 * All render-mode-agnostic logic + the default `i-mdi-*` iconify rendering live in
 * `MonoFileUploadCore`. The shadow build (`@mono-lit/helper/ui/shadow/file-upload`)
 * shares the mixin but uses native `<slot>` + inline SVG. Both register
 * `mono-file-upload`, so a document loads only one.
 */
@customElement('mono-file-upload')
export class MonoFileUpload extends MonoFileUploadCore(LitElement) {
  static override styles = [unsafeCSS(fileUploadCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _slots: Record<FileUploadLightSlot, Node[]> = { icon: [], title: [], subtitle: [] }
  private _parked?: HTMLElement

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
    super.updated?.(changed)
    for (const name of FILE_UPLOAD_LIGHT_SLOTS) {
      this._placeSlot(name, this._slots[name])
      // A node whose region isn't rendered must stay parented — a detached
      // captured node crashes the consumer framework's next patch.
      this._parked = parkDetachedNodes(this._parked, this._slots[name])
    }
  }

  /** Move light-DOM `slot="icon|title|subtitle"` children out for placement into their regions. */
  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    for (const node of monoHostChildNodes(this)) {
      if (!(node instanceof Element)) continue
      const name = node.getAttribute('slot') as FileUploadLightSlot | null
      if (name && (FILE_UPLOAD_LIGHT_SLOTS as readonly string[]).includes(name)) {
        node.removeAttribute('slot')
        this._slots[name].push(node)
      }
    }

    this._hasIconSlot = this._slots.icon.length > 0
    this._hasTitleSlot = this._slots.title.length > 0
    this._hasSubtitleSlot = this._slots.subtitle.length > 0

    for (const name of FILE_UPLOAD_LIGHT_SLOTS) {
      for (const node of this._slots[name]) {
        if (node.parentNode === this) this.removeChild(node)
      }
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
    'mono-file-upload': MonoFileUpload
  }
}
