// @unocss-include

import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoAlertCore } from './alert-core.js'
import {
  bucketHasContent,
  captureLightSlots,
  parkDetachedNodes,
  placeLightSlots,
  type LightSlotBuckets,
} from '../../composables/light-slots'

import alertCss from './alert.css?raw'

/** Named regions. Unslotted children fall into `body` (the capture fallback). */
const ALERT_NAMED_SLOTS = ['icon', 'title', 'subtitle', 'body'] as const

/**
 * Light-DOM `mono-alert` (default build, `@mono-lit/helper/ui/alert`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy of `mono-card`:
 * `slot="icon|title|subtitle|body"` children — and unslotted ones, which are the
 * body — are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` regions, and the captured nodes are re-appended in
 * `updated()`. The first render is forced SYNCHRONOUSLY so a framework's
 * positional anchors are never observably detached (see mono-card).
 *
 * The body wins: when it has content the icon / title / subtitle regions are not
 * rendered, and their captured nodes are parked (kept parented, invisible).
 */
@customElement('mono-alert')
export class MonoAlert extends MonoAlertCore(LitElement) {
  static override styles = [unsafeCSS(alertCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _buckets: LightSlotBuckets = new Map()
  private _parked?: HTMLElement

  /**
   * The body region is ALWAYS rendered (like the card's): it is also the home
   * of the consumer framework's positional anchors (`<!--v-if-->`), which must
   * keep a live, visible parent — content a `v-if` inserts there later has to
   * show up. It is `mono-empty` while it holds nothing but anchors, and a
   * MutationObserver flips `_hasBodySlot` when real content arrives or leaves.
   */
  protected override _renderMain(): unknown {
    const body = html`<div
      class=${this._cls('mono-alert-body', 'body')}
      mono-body
      data-mono-slot="body"
      ?mono-empty=${!this._hasBodySlot}
    ></div>`

    // ONE template either way, so the body element is never recreated (it holds
    // the consumer's nodes). While the body wins, `_shows*` are false and the
    // other regions are simply absent.
    const icon = this._showsIcon
      ? html`<span class=${this._cls('mono-alert-icon', 'icon')} mono-icon aria-hidden="true"
          >${this._hasIconSlot
            ? html`<span data-mono-slot="icon"></span>`
            : this._renderIconGlyph()}</span
        >`
      : nothing

    const title = this._showsTitle
      ? this._hasTitleSlot
        ? html`<div class=${this._cls('mono-alert-title', 'title')} mono-title data-mono-slot="title"></div>`
        : html`<div class=${this._cls('mono-alert-title', 'title')} mono-title>${this.title}</div>`
      : nothing

    const subtitle = this._showsSubtitle
      ? this._hasSubtitleSlot
        ? html`<div class=${this._cls('mono-alert-subtitle', 'subtitle')} mono-subtitle data-mono-slot="subtitle"></div>`
        : html`<div class=${this._cls('mono-alert-subtitle', 'subtitle')} mono-subtitle>${this.subtitle}</div>`
      : nothing

    return html`${icon}${title}${subtitle}${body}`
  }

  private _bodyObserver?: MutationObserver

  /** Re-read body presence from the placed region (late `v-if` content). */
  private _watchBody(): void {
    if (this._bodyObserver || typeof MutationObserver === 'undefined') return
    // The inner root is a direct child — or one level down when the `pending`
    // skeleton wraps it in `<phantom-ui>` (see composables/mono-skeleton.ts).
    const region = this.querySelector(
      ':scope > [mono-alert] > [data-mono-slot="body"], :scope > phantom-ui > [mono-alert] > [data-mono-slot="body"]',
    )
    if (!region) return
    this._bodyObserver = new MutationObserver(() => {
      const has = bucketHasContent(Array.from(region.childNodes))
      if (has !== this._hasBodySlot) this._hasBodySlot = has
    })
    this._bodyObserver.observe(region, { childList: true, characterData: true, subtree: true })
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._bodyObserver?.disconnect()
    this._bodyObserver = undefined
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()
    // Same reason as mono-card: capture detaches the consumer's children (and any
    // framework anchors among them); rendering synchronously makes
    // capture → placement one uninterrupted step.
    if (this.isConnected) this.performUpdate()
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    this._buckets = captureLightSlots(this, { names: ALERT_NAMED_SLOTS, fallback: 'body' })

    this._hasIconSlot = bucketHasContent(this._buckets.get('icon'))
    this._hasTitleSlot = bucketHasContent(this._buckets.get('title'))
    this._hasSubtitleSlot = bucketHasContent(this._buckets.get('subtitle'))
    this._hasBodySlot = bucketHasContent(this._buckets.get('body'))
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    placeLightSlots(this, this._buckets)
    // The body suppresses the other regions, so their captured nodes have no
    // target — keep them parented (a detached node crashes the consumer
    // framework's next patch) and invisible.
    for (const nodes of this._buckets.values()) {
      this._parked = parkDetachedNodes(this._parked, nodes)
    }
    this._watchBody()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-alert': MonoAlert
  }
}
