// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTagInputCore, type TagInputSlotName } from './tag-input-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import tagInputCss from './tag-input.css?raw'
// The tag chips reuse `.mono-chip` classes and the `checkable` rows reuse
// `.mono-checkbox` classes — both live in OTHER components' stylesheets, which
// the light build gets from the global `ui/index.css`. CSS doesn't cross the
// shadow boundary, so adopt them into THIS shadow root too (raw: their bare
// `mono-chip`/`mono-checkbox` element selectors are inert here, the class rules
// apply, and there are no `:host` rules to leak).
import chipCss from '../chip/chip.css?raw'
import checkboxCss from '../checkbox/checkbox.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide the label / helper regions when they carry no content. They
// always render (so the native `<slot>`s exist to project DSD content and be
// scanned), then collapse when empty.
// Nothing extra: tag-input.css hides an unassigned slot wrapper on [mono-empty].
const SHADOW_EXTRA_CSS = ''

/**
 * Shadow-DOM `mono-tag-input` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/tag-input`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-tag-input`→`:host`). The
 * collapsed control (label + field + placeholder + message) server-renders; the
 * dropdown is closed server-side and the DataSource (async) is client-only —
 * suggestions populate after hydration. The panel stays in the shadow root (the
 * shared `PopupPortalController` skips the body portal for a shadow host and CSS
 * positions it under the `position:relative` `.mono-tag-input`).
 *
 * Slotting uses native `<slot>`: `label`/`helper` carry the prop text as native
 * fallback (shown server-side); presence is detected in `firstUpdated()` via
 * `assignedNodes()` (DSD assigns at parse time → no `slotchange` after upgrade)
 * plus `@slotchange`. Interactivity needs the first client update to flush —
 * hence the defer-hydration poll. Shares all logic with the light build via
 * `MonoTagInputCore`; both register `mono-tag-input`, so a document loads one.
 */
/** One document-level copy of the checkbox rules, for chrome injected into projected content. */
const SLOT_CHECKBOX_STYLE_ID = 'mono-list-slot-checkbox-css'

@customElement('mono-shadow-tag-input')
export class MonoTagInputShadow extends withShadowUtilityStyles(MonoTagInputCore(LitElement)) {
  static {
    // Slot presence is measured after the first render creates the <slot>
    // elements, and hydration corrects the default-empty regions in a follow-up
    // update — the legitimate exception this warning describes. Dev-only.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(tagInputCss, { host: 'mono-tag-input', append: SHADOW_EXTRA_CSS })),
    unsafeCSS(chipCss),
    unsafeCSS(checkboxCss),
  ]

  protected override get _slotsAlwaysRender(): boolean {
    return true
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Before the first render, so the very first open already renders the <slot> — and above the
    // isServer guard, so an SSR pass emits it too rather than leaving the wrapper unprojected.
    this._onLateListSlot()

    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so its
    // handlers never bind. Force the first client update to flush by polling
    // `requestUpdate()` for a few frames; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (isServer) return

    this._scanSlots()
    this._watchListChrome()
    this._syncListChrome()
  }

  /**
   * Slotted content stays in the LIGHT DOM, so the checkbox mono injects into it is out of reach
   * of this build's scoped styles — the one place where projection's virtue (the page's CSS still
   * applies) turns into a cost. The rules it needs are added to the document once, under an id, and
   * only when a list slot actually asks for chrome; `checkboxCss` is already bundled here for the
   * shadow root's own copy, so this costs no extra bytes.
   */
  protected override _syncListChrome(): void {
    super._syncListChrome()

    if (!this._hasListSlotState || !this.checkable || typeof document === 'undefined') return
    if (document.getElementById(SLOT_CHECKBOX_STYLE_ID)) return

    const style = document.createElement('style')
    style.id = SLOT_CHECKBOX_STYLE_ID
    style.textContent = checkboxCss
    document.head.appendChild(style)
  }

  private _slotFor(name: TagInputSlotName): HTMLSlotElement | null {
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

  private _onSlotChange(name: TagInputSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  /** A wrapper appeared after connect — the flag is all this build needs, projection does the rest. */
  protected override _onLateListSlot(): void {
    const has = !!this._lateListSlot.find()
    if (has !== this._hasListSlotState) this._setSlotState('list', has)
  }

  /** Reconcile the 3 slot-presence flags from their slots' assigned content. */
  private _scanSlots(): void {
    for (const name of ['label', 'helper', 'list'] as TagInputSlotName[]) {
      const has = name === 'list'
        // The list slot cannot be measured the way the others are. Its <slot> lives inside the
        // dropdown AND behind this very flag, so it does not exist until the flag is already on —
        // scanning for it would keep the feature switched off forever. The light child carrying
        // `slot="list"` is the honest signal, and it is readable from the moment it is appended.
        ? !!this._lateListSlot.find()
        : this._slotHasContent(this._slotFor(name))
      const current = name === 'label'
        ? this._hasLabelSlotState
        : name === 'helper'
          ? this._hasHelperSlotState
          : this._hasListSlotState
      // Guard: only assign on change so we don't loop (updated → state → updated).
      if (has !== current) this._setSlotState(name, has)
    }
  }

  /**
   * The consumer's list wrapper, PROJECTED rather than moved.
   *
   * Projection is what makes this work in a shadow root at all: slotted content stays in the light
   * DOM, so the app's own stylesheet still reaches it. Moving those nodes inside the shadow root
   * would cut them off from it — the same reason this build inlines SVGs instead of icon classes.
   */
  protected override renderListSlot(): TemplateResult {
    return html`<div class="mono-tag-input-list-slot" mono-list-slot @click=${this._onListSlotClick}>
      <slot name="list" @slotchange=${(e: Event) => this._onSlotChange('list', e)}></slot>
    </div>`
  }

  /** Native `<slot>` carrying the prop fallback as native slot content. */
  protected override _slotOutlet(
    name: TagInputSlotName,
    fallback: unknown = nothing,
  ): TemplateResult {
    return html`<slot
      name=${name}
      @slotchange=${(e: Event) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`
  }

  /** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach a
   *  shadow root. (The caret and scroll chevrons are already inline SVG from
   *  `composables/field-icons`, so they need no override.) */
  protected override renderIcon(_name: 'close'): TemplateResult {
    return html`<svg
      mono-icon
      class="mono-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      ></path>
    </svg>`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-tag-input']` augmentation is owned by
// the light build (mono-tag-input.ts); redeclaring it here would be a TS2717.
