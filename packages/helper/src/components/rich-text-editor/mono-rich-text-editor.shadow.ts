import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoRichTextEditorCore, type RichTextEditorSlotName } from './rich-text-editor-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import richTextEditorCss from './rich-text-editor.css?raw'

// Shadow-only: hide the label / helper / footer regions when they carry no
// content. They always render (so the native `<slot>`s exist to project DSD
// content and be scanned), then collapse when empty.
const SHADOW_EXTRA_CSS = `
[mono-rte-label][mono-empty],
[mono-rte-message][mono-empty],
[mono-rte-footer][mono-empty] {
  display: none;
}
`

/**
 * Shadow-DOM `mono-shadow-rich-text-editor` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/rich-text-editor`).
 *
 * Real shadow root + `static styles` for the CHROME (label, frame, messages),
 * serialised to Declarative Shadow DOM by `@lit-labs/ssr`. The EDITOR itself is
 * never in the shadow root: SunEditor's stylesheet is global and its modals are
 * parked on `<body>`, so the core keeps the mount as a light child of the host
 * and this build projects it through `<slot name="editor">` — the page sheet
 * styles it, and the `--se-*` remap declared on the frame still reaches it
 * through the flat tree. On the server the slot is empty (an editor is client
 * state); the first client update builds it.
 */
@customElement('mono-shadow-rich-text-editor')
export class MonoRichTextEditorShadow extends withShadowUtilityStyles(MonoRichTextEditorCore(LitElement)) {
  static {
    // Slot presence is measured after the first render creates the <slot>
    // elements, and hydration corrects the default-empty regions in a follow-up
    // update — the legitimate exception this warning describes. Dev-only.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(richTextEditorCss, { host: 'mono-rich-text-editor', append: SHADOW_EXTRA_CSS })),
  ]

  protected override get _slotsAlwaysRender(): boolean {
    return true
  }

  protected override get _useNativeSlots(): boolean {
    return true
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so its
    // handlers never bind. Force the first client update to flush by polling
    // `requestUpdate()` for a few frames; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — core's firstUpdated takes no args; LitElement's is typed with 1.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (!isServer) this._scanSlots()
  }

  private _slotFor(name: RichTextEditorSlotName): HTMLSlotElement | null {
    return this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _onSlotChange(name: RichTextEditorSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  /** Reconcile the 2 slot-presence flags from their slots' assigned content. */
  private _scanSlots(): void {
    for (const name of ['label', 'helper'] as RichTextEditorSlotName[]) {
      const has = this._slotHasContent(this._slotFor(name))
      const current = name === 'label' ? this._hasLabelSlotState : this._hasHelperSlotState
      // Guard: only assign on change so we don't loop (updated → state → updated).
      if (has !== current) this._setSlotState(name, has)
    }
  }

  /** Native `<slot>` carrying the prop fallback as native slot content. */
  protected override _slotOutlet(name: RichTextEditorSlotName, fallback: unknown = nothing): TemplateResult {
    return html`<slot name=${name} @slotchange=${(e: Event) => this._onSlotChange(name, e)}>${fallback}</slot>`
  }

  /** The frame projects the light-DOM mount the core keeps on the host. */
  protected override _renderEditorOutlet(fieldClass: string): TemplateResult {
    return html`<div class=${fieldClass} mono-rte-field><slot name="editor"></slot></div>`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-rich-text-editor']` augmentation is owned
// by the light build (mono-rich-text-editor.ts); redeclaring it here would be a
// TS2717 conflict.
