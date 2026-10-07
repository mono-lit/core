// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { ref } from 'lit/directives/ref.js'
import { styleMap } from 'lit/directives/style-map.js'

import { MonoDrawerCore, type DrawerSlotName } from './drawer-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import drawerCss from './drawer.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide the head / foot regions when they carry no content. They
/**
 * Shadow-DOM `mono-drawer` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/drawer`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Unlike the light build (which renders into a `<body>`
 * portal that IS the `.mono-drawer` root), the shadow build can't portal — so it
 * renders an inner `.mono-drawer` root inside the shadow tree and carries the
 * state classes + `--drawer-z` there (mirrors `mono-modal.shadow.ts`). The
 * overlay/panel stay `position: fixed`; z-stacking / scroll-lock / Escape all
 * flow through the SSR-safe `popup-stack`. Slots are native `<slot>`s (default =
 * body), scanned in `firstUpdated`/`updated`. Shares all logic with the light
 * build via `MonoDrawerCore`; both register `mono-drawer`.
 */
@customElement('mono-shadow-drawer')
export class MonoDrawerShadow extends withShadowUtilityStyles(MonoDrawerCore(LitElement)) {
  static {
    // Slot presence is measured after the first render creates the <slot>
    // elements, and hydration corrects the default-empty regions in a follow-up
    // update — the legitimate exception this warning describes. Dev-only.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    // The regions always render (so the native `<slot>`s exist to project DSD
    // content and be scanned) and collapse when empty — keyed on `mono-empty`,
    // which drawer.css hides for both builds where this used to be an `append`.
    unsafeCSS(toShadowCss(drawerCss, { host: 'mono-drawer' })),
  ]

  protected override get _slotsAlwaysRender(): boolean {
    return true
  }

  /** Shadow build: the size-vars live on the inner `.mono-drawer` root. */
  protected override _setDrawerSizeVar(name: string, value: string): void {
    const root = this.renderRoot.querySelector('.mono-drawer') as HTMLElement | null
    root?.style.setProperty(name, value)
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
    // resizing, has-drawer-above), and the root is a static template node.
    this._applyRootAttrs(this._rootEl)
    if (!isServer) this._scanSlots()
  }

  private _slotFor(name: DrawerSlotName): HTMLSlotElement | null {
    return this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
  }

  private _defaultSlot(): HTMLSlotElement | null {
    return this.renderRoot.querySelector('slot:not([name])') as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    // `assignedNodes({ flatten: true })` falls back to the slot's FALLBACK
    // content when nothing is assigned — and the header / title / subtitle slots
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

  private _onSlotChange(name: DrawerSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  /** Reconcile the 3 slot-presence flags from their slots' assigned content.
   *  Body is the default (unnamed) slot OR an explicit `slot="body"`. */
  private _scanSlots(): void {
    for (const name of ['header', 'title', 'subtitle', 'footer'] as DrawerSlotName[]) {
      const has = this._slotHasContent(this._slotFor(name))
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
    name: DrawerSlotName,
    fallback: unknown = nothing,
  ): TemplateResult {
    if (name === 'body') {
      return html`<slot
          name="body"
          @slotchange=${(e: Event) => this._onSlotChange('body', e)}
        ></slot
        ><slot @slotchange=${() => this._scanSlots()}>${fallback}</slot>`
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
    return 'mono-drawer'
  }

  protected override render(): TemplateResult {
    const aria = this._headingAria()
    // `title=""` cancels the host's native `title` tooltip over the panel, which
    // lives inside the host here.
    return html`
      <div
        class=${this._computeDrawerClasses().join(' ')}
        mono-drawer
        ${ref(this.bindRoot)}
        role="dialog"
        title=""
        aria-labelledby=${ifDefined(aria.labelledby)}
        aria-describedby=${ifDefined(aria.describedby)}
        aria-modal=${this.overlay ? 'true' : 'false'}
        aria-hidden=${this.modelValue ? 'false' : 'true'}
        style=${styleMap({ '--mono-drawer-z': String(this._effectiveZ) })}
      >
        ${this._renderDrawerBody()}
      </div>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-drawer']` augmentation is owned by the
// light build (mono-drawer.ts); redeclaring it here would be a TS2717 conflict.
