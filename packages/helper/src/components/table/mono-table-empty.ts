// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableEmptyCore } from './mono-table-empty-core.js'
import {
  bucketHasContent,
  captureLightSlots,
  placeLightSlots,
  type LightSlotBuckets,
} from '../../composables/light-slots'

import tableCss from './table.css?raw'

/** The one named region. Everything unnamed falls into the default bucket. */
const EMPTY_NAMED_SLOTS = ['body'] as const

/**
 * Light-DOM `mono-table-empty` (default build, `@mono-lit/helper/ui/table`).
 *
 * The message shown over a grid that came back with no rows — `mono-table-loading`'s
 * pair, and placed the same way:
 *
 * ```html
 * <caption>
 *   <mono-table-empty :control-table.prop="table" title="No people found" />
 * </caption>
 * ```
 *
 * Everything else — when it shows, what it shows, the overlay geometry — is in
 * `MonoTableEmptyCore`. This build only adds the light-DOM half of `slot="body"`:
 * the consumer's markup is captured out of the host before the first render and
 * re-placed into the rendered region afterwards, because a light build renders
 * INTO the host and would otherwise overwrite it.
 */
@customElement('mono-table-empty')
export class MonoTableEmpty extends MonoTableEmptyCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  private _buckets: LightSlotBuckets = new Map()
  private _slotsCaptured = false

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    // BEFORE super's: the core's `connectedCallback` may move this element into a
    // generated `<tr><td>`, and capture has to have taken the consumer's children
    // off the host before anything else touches it.
    this._captureSlots()
    super.connectedCallback()

    // Capture detaches the consumer's children — and any framework positional
    // anchors among them — from the host; `placeLightSlots` (in `updated()`)
    // re-attaches them. Lit renders on a microtask, so those anchors sit orphaned
    // (`parentNode === null`) until then, and a consumer patching in that window
    // walks a null anchor and throws. Forcing the first render synchronously makes
    // capture→placement one uninterrupted step inside the consumer's insert.
    if (this.isConnected) this.performUpdate()
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    this._buckets = captureLightSlots(this, { names: EMPTY_NAMED_SLOTS })

    // `bucketHasContent` rather than a length check: a bucket may hold nothing but
    // framework anchors (`<!--v-if-->`), which must not count as "the consumer
    // filled the body" and blank out the icon/title/subtitle.
    this._hasBodySlot = bucketHasContent(this._buckets.get('body'))
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    placeLightSlots(this, this._buckets)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-empty': MonoTableEmpty
  }
}
