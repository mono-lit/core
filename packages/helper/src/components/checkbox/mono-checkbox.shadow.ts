// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoCheckboxCore } from './checkbox-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import checkboxCss from './checkbox.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only rules:
// - hide empty label regions (presence detected post-hydration).
// - the bare icon slots are absolutely positioned so an empty one doesn't disturb
//   the default CSS checkmark (`.mono-checkbox-box::before`). When a custom icon is
//   slotted, `has-custom-icon` (set in firstUpdated) hides the default and the
//   slotted svg shows via the existing `slot[name="icon"]::slotted` rules.
// Nothing extra: checkbox.css hides an unassigned slot wrapper on [mono-empty]
// and positions the bare icon slots inside [mono-box].
const SHADOW_EXTRA_CSS = ''

type CheckboxSlotName = 'icon' | 'indeterminate-icon' | 'label' | 'description'

/**
 * Shadow-DOM `mono-checkbox` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/checkbox`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`:host{display:inline-block}` —
 * the `.mono-checkbox` class lives on the inner `<label>`). The checked/
 * indeterminate visual state is the wrapper class (CSS `::before`/`::after`), so
 * it server-renders from `this.checked`/`this.indeterminate`. Slots use native
 * `<slot>`: the `label`/`description` slots carry the prop text as native fallback
 * (shown server-side); custom icon slots are bare `<slot name="icon">` gated on
 * `checked`/`indeterminate`; slot presence is detected in `firstUpdated()` via
 * `assignedNodes()` (DSD assigns at parse time → no `slotchange` after upgrade).
 * Interactivity needs the first client update to flush (so `@change` binds) —
 * hence the defer-hydration poll. Shares all logic with the light build via
 * `MonoCheckboxCore`; both register `mono-checkbox`, so a document loads one.
 */
@customElement('mono-shadow-checkbox')
export class MonoCheckboxShadow extends withShadowUtilityStyles(MonoCheckboxCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(
      toShadowCss(checkboxCss, {
        host: 'mono-checkbox',
        hostDisplay: 'inline-block',
        append: SHADOW_EXTRA_CSS,
      }),
    ),
  ]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare updated through the generic base.
    super.updated?.(changed)
    if (!isServer) this._scanSlots()
  }

  private _slotFor(name: CheckboxSlotName): HTMLSlotElement | null {
    return this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes()
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _onSlotChange(name: CheckboxSlotName, event: Event): void {
    this._setSlotState(
      name,
      name === 'description'
        ? this._sublabelHasContent()
        : this._slotHasContent(event.target as HTMLSlotElement),
    )
  }

  /**
   * The sublabel region answers to `slot="sublabel"` and to the older
   * `slot="description"` (nested inside it), so its presence is the union.
   */
  private _sublabelHasContent(): boolean {
    const byName = (n: string) =>
      this.renderRoot.querySelector(`slot[name="${n}"]`) as HTMLSlotElement | null
    return this._slotHasContent(byName('sublabel')) || this._slotHasContent(byName('description'))
  }

  private _setSlotState(name: CheckboxSlotName, has: boolean): void {
    if (name === 'icon') this._hasIcon = has
    else if (name === 'indeterminate-icon') this._hasIndeterminateIcon = has
    else if (name === 'label') this._hasLabelSlotState = has
    else if (name === 'description') this._hasDescriptionSlotState = has
  }

  /** Reconcile the 4 slot-presence flags from their slots' assigned content. */
  private _scanSlots(): void {
    for (const name of ['icon', 'indeterminate-icon', 'label', 'description'] as CheckboxSlotName[]) {
      const has =
        name === 'description' ? this._sublabelHasContent() : this._slotHasContent(this._slotFor(name))
      // Guard: only assign on change so we don't loop (updated → state → updated).
      const current =
        name === 'icon'
          ? this._hasIcon
          : name === 'indeterminate-icon'
            ? this._hasIndeterminateIcon
            : name === 'label'
              ? this._hasLabelSlotState
              : this._hasDescriptionSlotState
      if (has !== current) this._setSlotState(name, has)
    }
  }

  /**
   * Inline SVG, not the `i-mdi-loading` utility class: a shadow root cannot see the
   * page's utility CSS, so the light build's icon class would render nothing here.
   * `fill="currentColor"` keeps it on the box's icon colour; the spin comes from the
   * adopted `checkbox.css`.
   */
  protected override _renderLoadingIcon(): TemplateResult {
    return html`
      <svg class="mono-checkbox-spinner" mono-spinner viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8" />
      </svg>
    `
  }

  protected override _renderCustomIcon(): TemplateResult | typeof nothing {
    // Bare slots (no `.mono-checkbox-icon` wrapper — that class triggers the CSS
    // `:has()` rule that would suppress the default checkmark). Gated on state so
    // a custom icon only shows in the matching state; `has-custom-icon` (from the
    // scanned `_hasIcon`) hides the default checkmark when a real icon is present.
    if (this.indeterminate) {
      return html`<slot
        name="indeterminate-icon"
        @slotchange=${(e: Event) => this._onSlotChange('indeterminate-icon', e)}
      ></slot>`
    }

    if (this.checked) {
      return html`<slot
        name="icon"
        @slotchange=${(e: Event) => this._onSlotChange('icon', e)}
      ></slot>`
    }

    return nothing
  }

  protected override _renderLabelBlock(): TemplateResult | typeof nothing {
    // Always render the regions (hidden via `data-empty` when no content) so the
    // label/description slots project DSD content server-side and the prop text
    // shows as native slot fallback with no JS.
    return html`
      <span
        class=${this._cls('mono-checkbox-label', 'label')}
        mono-label
        ?mono-empty=${!this._hasLabelContent() && !this._hasDescriptionContent()}
      >
        <span
          class=${this._cls('mono-checkbox-label-text', 'labelText')}
          mono-label-text
          ?mono-empty=${!this._hasLabelContent()}
        >
          <slot name="label" @slotchange=${(e: Event) => this._onSlotChange('label', e)}
            >${this.label || nothing}</slot
          >
        </span>

        <span
          class=${this._cls('mono-checkbox-label-description', 'description')}
          mono-description
          ?mono-empty=${!this._hasDescriptionContent()}
        >
          <slot name="sublabel" @slotchange=${(e: Event) => this._onSlotChange('description', e)}
            ><slot
              name="description"
              @slotchange=${(e: Event) => this._onSlotChange('description', e)}
              >${this.sublabel || nothing}</slot
            ></slot
          >
        </span>
      </span>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-checkbox']` augmentation is owned by the
// light build (mono-checkbox.ts); redeclaring it here would be a TS2717 conflict.
