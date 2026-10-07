// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ref } from 'lit/directives/ref.js'

import { MonoAccordionCore, type AccordionSlotName } from './accordion-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import accordionCss from './accordion.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * The old slot name each text region also answers to. The canonical name
 * (`title` / `subtitle`) OUTRANKS the old one when both are supplied.
 */
const ALIAS_OF: Partial<Record<AccordionSlotName, AccordionSlotName>> = {
  title: 'label',
  subtitle: 'description',
}

/**
 * Shadow-DOM `mono-accordion` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/accordion`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-accordion`→`:host`).
 * Slotting uses native `<slot>`. During SSR the element has no light children, so
 * the slot-presence flags default `false` (hydration-matching) and the decorative
 * regions render `mono-empty` (hidden by accordion.css itself); real presence is
 * corrected in `firstUpdated()` (DSD assigns slotted content at parse time →
 * `slotchange` doesn't fire after upgrade → scan `assignedNodes()`; `slotchange` is
 * kept for later dynamic changes). `<slot name="label">${label}</slot>` carries the
 * prop text as native fallback so it shows with no JS. The body region is always
 * visible so main content never flashes. Shares all logic with the light build via
 * `MonoAccordionCore`. Both register `mono-accordion`, so a document loads one.
 */
@customElement('mono-shadow-accordion')
export class MonoAccordionShadow extends withShadowUtilityStyles(MonoAccordionCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  // A decorative region whose slot has no assigned content (and no prop
  // fallback) renders `mono-empty` and accordion.css hides it — one rule for
  // both builds, where this used to be a shadow-only `append`. Presence is
  // detected after hydration (see firstUpdated); default-hidden so the server
  // and the initial client render match. The body / default region is
  // deliberately never marked — its main content (projected by DSD at parse
  // time) must show server-side without a flash.
  static override styles = [unsafeCSS(toShadowCss(accordionCss, { host: 'mono-accordion' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so its
    // `@click` is never bound and `this.modelValue = …` never re-renders (the
    // open/close toggle silently does nothing). Force the first client update to
    // flush by polling `requestUpdate()` for a few frames until it takes. Same
    // remedy the shadow `mono-menu` uses; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    for (const name of ['title', 'subtitle', 'header', 'icon', 'actions'] as AccordionSlotName[]) {
      this._setSlotState(name, this._regionHasContent(name))
    }
    this._setSlotState('default', this._bodyHasContent())
  }

  /**
   * Presence of a region that may also answer to an old name (`label` →
   * `title`, `description` → `subtitle`): the union of both slots.
   */
  private _regionHasContent(name: AccordionSlotName): boolean {
    const alias = ALIAS_OF[name]
    return (
      this._slotHasContent(this._slotFor(name)) ||
      (!!alias && this._slotHasContent(this._slotFor(alias)))
    )
  }

  /**
   * `<slot name="title"><slot name="label">fallback</slot></slot>` — a slot's
   * children are its fallback, shown only when nothing is assigned to it, so the
   * canonical name wins and the old name is reached exactly when it is empty.
   * Both slots recompute presence from BOTH names (an empty outer `slotchange`
   * must not clear a filled inner one).
   */
  private _renderAliasedSlot(
    name: AccordionSlotName,
    fallback: unknown,
  ): TemplateResult {
    const alias = ALIAS_OF[name]!
    const sync = () => this._setSlotState(name, this._regionHasContent(name))
    return html`<slot name=${name} @slotchange=${sync}
      ><slot name=${alias} @slotchange=${sync}>${fallback}</slot></slot
    >`
  }

  private _slotFor(name: AccordionSlotName): HTMLSlotElement | null {
    const selector = name === 'default' ? 'slot:not([name])' : `slot[name="${name}"]`
    return this.renderRoot.querySelector(selector) as HTMLSlotElement | null
  }

  /**
   * Whether something is ASSIGNED to this slot. Not `assignedNodes({ flatten:
   * true })`: for a slot with nothing assigned, flatten returns its FALLBACK
   * content — and `<slot name="header">`'s fallback is the title/subtitle
   * markup, so every accordion looked like it had a header slot and hid its
   * icon. The old alias names (`label` / `description`) are nested slots of
   * their own and are checked separately by the caller.
   */
  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes()
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _setSlotState(name: AccordionSlotName, has: boolean): void {
    if (name === 'title' || name === 'label') this._hasTitleSlotState = has
    else if (name === 'subtitle' || name === 'description') this._hasSubtitleSlotState = has
    else if (name === 'header') this._hasHeaderSlotState = has
    else if (name === 'icon') this._hasIconSlotState = has
    else if (name === 'actions') this._hasActionsSlotState = has
    else if (name === 'default') this._hasBodySlotState = has
  }

  private _onSlotChange(name: AccordionSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  private _renderIcon(): TemplateResult {
    return html`
      <span
        class=${this._cls('mono-accordion-icon', 'icon')}
        mono-glyph
        aria-hidden="true"
        ?mono-empty=${!this._hasIconContent || this._hasHeaderSlotState}
      >
        <slot name="icon" @slotchange=${(e: Event) => this._onSlotChange('icon', e)}></slot>
      </span>
    `
  }

  private _renderText(): TemplateResult {
    // slot="header" wins: its fallback is the whole title/subtitle pair, and
    // `_renderIcon` hides the icon while it is present. Actions and the
    // chevron stay, and the head is still the toggle.
    return html`
      <span
        class="mono-accordion-text"
        mono-heading
        ?mono-empty=${!this._hasHeaderSlotState &&
        !this._hasTitleContent &&
        !this._hasSubtitleContent}
      >
        <slot name="header" @slotchange=${(e: Event) => this._onSlotChange('header', e)}>
          <span
            class=${this._cls('mono-accordion-title', 'title')}
            mono-title
            ?mono-empty=${!this._hasTitleContent}
          >
            ${this._renderAliasedSlot('title', this.title || nothing)}
          </span>

          <span
            class=${this._cls('mono-accordion-description', 'description')}
            mono-subtitle
            mono-description
            ?mono-empty=${!this._hasSubtitleContent}
          >
            ${this._renderAliasedSlot('subtitle', this.subtitle || nothing)}
          </span>
        </slot>
      </span>
    `
  }

  private _renderActions(): TemplateResult {
    return html`
      <span
        class=${this._cls('mono-accordion-actions', 'actions')}
        mono-actions
        ?mono-empty=${!this._hasActionsSlotState}
      >
        <slot name="actions" @slotchange=${(e: Event) => this._onSlotChange('actions', e)}></slot>
      </span>
    `
  }

  private _renderBody(): TemplateResult {
    // Always visible — the default slot carries the accordion body, which DSD
    // projects at parse time; hiding it would flash the content in on hydrate.
    //
    // `slot="body"` AND unslotted children both land here, as in the light build
    // (which captures `slot="body"` into its body region). With only the default
    // slot, an explicit `slot="body"` child had nowhere to go and the shadow
    // build showed an empty body.
    //
    // ONE wrapper around both: the body is a `grid-template-rows: 0fr → 1fr`
    // collapse with a single track, so it needs a single grid item (the
    // `[mono-body] > *` rule gives it `min-height: 0`). Two slot boxes would be two
    // rows, and the second would never collapse.
    const sync = () => this._setSlotState('default', this._bodyHasContent())
    return html`
      <div class=${this._cls('mono-accordion-body', 'body')} mono-body role="region">
        <div mono-body-slots>
          <slot name="body" @slotchange=${sync}></slot><slot @slotchange=${sync}></slot>
        </div>
      </div>
    `
  }

  /** Body presence: the named `body` slot or the default slot. */
  private _bodyHasContent(): boolean {
    const named = this.renderRoot.querySelector('slot[name="body"]') as HTMLSlotElement | null
    return this._slotHasContent(named) || this._slotHasContent(this._slotFor('default'))
  }

  protected override render(): TemplateResult {
    return html`
      <div class=${this._wrapperClasses} mono-accordion title="" ${ref(this.bindRoot)}>
        <button
          type="button"
          class=${this._cls('mono-accordion-head', 'head')}
          mono-head
          aria-expanded=${this.modelValue ? 'true' : 'false'}
          ?disabled=${this.disabled}
          @click=${this._handleClick}
        >
          ${this._renderIcon()}
          ${this._renderText()}
          ${this._renderActions()}
          <span class=${this._cls('mono-accordion-arrow', 'arrow')} mono-arrow aria-hidden="true">
            <!-- Inline SVG (not the global UnoCSS \`i-mdi-chevron-down\`, which can't
                 reach into the shadow root → the icon would be unstyled/oversized). -->
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"></path>
            </svg>
          </span>
        </button>

        ${this._renderBody()}
      </div>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-accordion']` augmentation is owned by the
// light build (mono-accordion.ts); redeclaring it here would be a TS2717 conflict.
