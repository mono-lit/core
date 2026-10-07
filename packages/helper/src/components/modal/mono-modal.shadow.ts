// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { ref } from 'lit/directives/ref.js'
import { styleMap } from 'lit/directives/style-map.js'

import { MonoModalCore, type ModalSlotName } from './modal-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import modalCss from './modal.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Alias each region also answers to. `header`/`footer` mirror the drawer's slot
 * vocabulary and OUTRANK the original `head`/`foot` when both are supplied.
 */
const ALIAS_OF: Partial<Record<ModalSlotName, string>> = {
  head: 'header',
  foot: 'footer',
}

// Shadow-only: hide the head / foot regions when they carry no content. They
// always render (so the native `<slot>`s exist to project DSD content + be
// scanned), then collapse when empty.
/**
 * Shadow-DOM `mono-modal` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/modal`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Unlike the light build (which renders into a `<body>`
 * portal that IS the `.mono-modal` root), the shadow build can't portal — so it
 * renders an inner `.mono-modal` root inside the shadow tree and carries the
 * state classes + `--modal-z` there (mirrors `mono-dropdown.shadow.ts`'s inner
 * root). The overlay/panel stay `position: fixed`; z-stacking / scroll-lock /
 * Escape all flow through the SSR-safe `popup-stack`. Slots are native `<slot>`s
 * (default = body), scanned in `firstUpdated`/`updated`. Shares all logic with
 * the light build via `MonoModalCore`; both register `mono-modal`.
 */
@customElement('mono-shadow-modal')
export class MonoModalShadow extends withShadowUtilityStyles(MonoModalCore(LitElement)) {
  static {
    // Slot presence is measured after the first render creates the <slot>
    // elements, and hydration corrects the default-empty regions in a follow-up
    // update — the legitimate exception this warning describes. Dev-only.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    // The empty head / foot regions are hidden by modal.css itself, keyed on
    // `mono-empty` — one rule for both builds, where this used to be a
    // shadow-only `append`.
    unsafeCSS(toShadowCss(modalCss, { host: 'mono-modal' })),
  ]

  protected override get _slotsAlwaysRender(): boolean {
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
    // The state half of the styling attributes moves after a render (open,
    // dragging, has-modal-above), and the root is a static template node.
    this._applyRootAttrs(this._rootEl)
    if (!isServer) this._scanSlots()
  }

  /** `string`, not `ModalSlotName` — this also resolves the alias names. */
  private _slotFor(name: string): HTMLSlotElement | null {
    return this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
  }

  private _defaultSlot(): HTMLSlotElement | null {
    return this.renderRoot.querySelector('slot:not([name])') as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    // `assignedNodes({ flatten: true })` falls back to the slot's FALLBACK
    // content when nothing is assigned — and the head / title / subtitle slots
    // all carry fallback (the prop text, the title/subtitle column). So require a
    // real assignment first; flatten only to see through a forwarded `<slot>`.
    return (
      !!slot &&
      slot.assignedNodes().length > 0 &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _onSlotChange(name: ModalSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  /**
   * Does this region have content under EITHER of its names? `head`/`foot` each
   * also answer to an alias (`header`/`footer`), so presence is the union.
   */
  private _regionHasContent(name: ModalSlotName): boolean {
    const alias = ALIAS_OF[name]
    return (
      this._slotHasContent(this._slotFor(name)) ||
      (!!alias && this._slotHasContent(this._slotFor(alias)))
    )
  }

  /** Reconcile the 4 slot-presence flags from their slots' assigned content.
   *  Body is the default (unnamed) slot OR an explicit `slot="body"`. */
  private _scanSlots(): void {
    for (const name of ['head', 'title', 'subtitle', 'foot'] as ModalSlotName[]) {
      const has = this._regionHasContent(name)
      if (has !== this._hasSlot(name)) this._setSlotState(name, has)
    }

    const bodyHas =
      this._slotHasContent(this._slotFor('body')) ||
      this._slotHasContent(this._defaultSlot())
    if (bodyHas !== this._hasSlot('body')) this._setSlotState('body', bodyHas)
  }

  /**
   * Native `<slot>`. Body accepts both the default (unnamed) slot and an
   * explicit `slot="body"` — matching the light build's capture, which treats
   * unslotted children and `slot="body"` alike.
   */
  protected override _slotOutlet(
    name: ModalSlotName,
    fallback: unknown = nothing,
  ): TemplateResult {
    if (name === 'body') {
      return html`<slot
          name="body"
          @slotchange=${(e: Event) => this._onSlotChange('body', e)}
        ></slot
        ><slot @slotchange=${() => this._scanSlots()}>${fallback}</slot>`
    }

    // `header`/`footer` alias `head`/`foot`, and must WIN when both are supplied.
    // Nesting expresses that natively: a slot renders its fallback content only
    // when nothing is assigned to it, so the inner `head`/`foot` slot is reached
    // exactly when the alias is empty. No presence bookkeeping needed for the
    // priority itself — the browser does it.
    const alias = ALIAS_OF[name]
    if (alias) {
      // Both slots recompute presence from BOTH names. Routing them through
      // `_onSlotChange` would be wrong: a `slotchange` on the empty outer alias
      // would report "no content" and clear the flag even though the inner slot is
      // filled, collapsing the region.
      const sync = () => this._setSlotState(name, this._regionHasContent(name))
      return html`<slot name=${alias} @slotchange=${sync}
        ><slot name=${name} @slotchange=${sync}>${fallback}</slot></slot
      >`
    }

    return html`<slot
      name=${name}
      @slotchange=${(e: Event) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`
  }

  /** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach
   *  a shadow root. */
  protected override renderIcon(_name: 'close'): TemplateResult {
    return html`<svg
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

  /** Ids are scoped to this shadow root, so a constant is unique enough — and,
   *  unlike a counter, the same on the server and the client. */
  protected override get _headingIdBase(): string {
    return 'mono-modal'
  }

  protected override render(): TemplateResult {
    const aria = this._headingAria()
    // `title=""` cancels the host's native `title` tooltip over the panel, which
    // lives inside the host here.
    return html`
      <div
        class=${this._computeModalClasses().join(' ')}
        mono-modal
        ${ref(this.bindRoot)}
        role="dialog"
        title=""
        aria-labelledby=${ifDefined(aria.labelledby)}
        aria-describedby=${ifDefined(aria.describedby)}
        aria-modal=${this.overlay ? 'true' : 'false'}
        aria-hidden=${this.modelValue ? 'false' : 'true'}
        style=${styleMap({ '--mono-modal-z': String(this._effectiveZ) })}
      >
        ${this._renderModalBody()}
      </div>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-modal']` augmentation is owned by the
// light build (mono-modal.ts); redeclaring it here would be a TS2717 conflict.
