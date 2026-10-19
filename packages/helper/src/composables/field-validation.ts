// @unocss-include

/* =========================================================================
   Field validation position — where a field's validation message shows
   -------------------------------------------------------------------------
   `validation-position` on mono-input, mono-select, mono-tag-input,
   mono-date, mono-textarea and mono-dropdown-table:

   - `bottom` (default) — the message row under the box, as always.
   - `icon`  — a state icon inside the box; hovering or tapping it (or keyboard
               focus on the field) shows the message in a state-coloured bubble.
   - `float` — nothing until the field is hovered or focused; then the message
               floats under the box in a state-coloured bubble.

   In `icon` / `float` the bottom row keeps the HELPER text instead, and the
   validation text stays there visually hidden (`[mono-sr-only]`), so
   `role="alert"` and the field's `aria-describedby` keep working. The bubbles
   are the dependency-free `FieldBubble`; the look is
   `components/form/field-tooltip.css` + `components/form/field-validation.css`.
   ========================================================================= */

import { html, nothing, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from 'lit'
import { ref } from 'lit/directives/ref.js'
import { FieldBubble } from './field-bubble'
import { alertCircleIcon, checkCircleIcon } from './field-icons'

export type FieldValidationPosition = 'bottom' | 'icon' | 'float'

/** The normalized state painted on the icon / bubbles. */
export type FieldValidationTone = 'invalid' | 'warning' | 'valid'

export interface FieldValidationRead {
  position: FieldValidationPosition | string | undefined
  /** The component's own state name (`invalid` / `error` / `warning` / `valid` / `success` / `default`). */
  state: string | undefined
  /** The validation message; empty → nothing moves. */
  text: string | undefined | null
  /** While the control's own popup (dropdown, calendar) is open the float bubble stays closed. */
  suppressed?: boolean
}

export interface FieldValidationNotice {
  position: 'icon' | 'float'
  tone: FieldValidationTone
  text: string
}

/** `default` (or no state) → `null`: a stateless message stays in the bottom row. */
function toneOf(state: string | undefined): FieldValidationTone | null {
  if (state === 'invalid' || state === 'error') return 'invalid'
  if (state === 'valid' || state === 'success') return 'valid'
  if (state === 'warning') return 'warning'
  return null
}

export class FieldValidationController implements ReactiveController {
  private readonly _iconBubble = new FieldBubble({ side: 'top', align: 'center' })
  private readonly _floatBubble = new FieldBubble({ side: 'bottom', align: 'start' })
  private _hovered = false
  private _focused = false

  constructor(
    private readonly host: ReactiveControllerHost & HTMLElement,
    private readonly read: () => FieldValidationRead,
    private readonly getBox: () => Element | null | undefined,
  ) {
    host.addController(this)
  }

  /** The message that moved out of the bottom row, or `null` (bottom mode / no text). */
  get notice(): FieldValidationNotice | null {
    const { position, state, text } = this.read()
    if (position !== 'icon' && position !== 'float') return null
    const message = typeof text === 'string' ? text.trim() : ''
    const tone = toneOf(state)
    if (!message || !tone) return null
    return { position, tone, text: message }
  }

  /** True when the bottom row should show the helper and keep the validation text sr-only. */
  get moved(): boolean {
    return this.notice !== null
  }

  hostConnected(): void {
    this.host.addEventListener('pointerenter', this._onEnter)
    this.host.addEventListener('pointerleave', this._onLeave)
    this.host.addEventListener('focusin', this._onFocusIn)
    this.host.addEventListener('focusout', this._onFocusOut)
  }

  hostDisconnected(): void {
    this.host.removeEventListener('pointerenter', this._onEnter)
    this.host.removeEventListener('pointerleave', this._onLeave)
    this.host.removeEventListener('focusin', this._onFocusIn)
    this.host.removeEventListener('focusout', this._onFocusOut)
    this._iconBubble.hide()
    this._floatBubble.hide()
    this._hovered = false
    this._focused = false
  }

  hostUpdated(): void {
    this._floatBubble.setAnchor((this.getBox() as HTMLElement | null | undefined) ?? null)
    const notice = this.notice
    if (notice?.position !== 'icon') this._iconBubble.hide()
    this._syncFloat()
    // The text (and so the bubble's size) may have changed under an open bubble.
    this._iconBubble.place()
    this._floatBubble.place()
  }

  /** Re-evaluate the float bubble — for popups the host opens without a re-render (date's calendar). */
  refresh(): void {
    this._syncFloat()
  }

  /**
   * `icon` mode: the state icon for inside the box (before the clear button /
   * actions). `anchored` wraps it in a zero-height `[mono-validation-anchor]`
   * — for the textarea, whose box can't hold children.
   */
  renderIcon(options: { anchored?: boolean } = {}): TemplateResult | typeof nothing {
    const notice = this.notice
    if (notice?.position !== 'icon') return nothing
    const icon = html`<span
      mono-validation-icon
      mono-state=${notice.tone}
      aria-hidden="true"
      @pointerenter=${this._iconBubble.show}
      @pointerleave=${this._iconBubble.onPointerLeave}
      @pointerdown=${stopEvent}
      @click=${this._onIconClick}
      ${ref(this._iconBubble.setAnchor)}
    >${this._glyph(notice.tone)}<span
        mono-field-bubble
        mono-validation-tip
        mono-state=${notice.tone}
        popover="manual"
        @pointerenter=${this._iconBubble.cancelHide}
        @pointerleave=${this._iconBubble.onPointerLeave}
        @click=${stopEvent}
        ${ref(this._iconBubble.setBubble)}
      >${notice.text}</span></span>`
    return options.anchored ? html`<span mono-validation-anchor>${icon}</span>` : icon
  }

  /** `float` mode: the bubble that floats under the box while the field is hovered or focused. */
  renderFloat(): TemplateResult | typeof nothing {
    const notice = this.notice
    if (notice?.position !== 'float') return nothing
    return html`<span
      mono-field-bubble
      mono-validation-float
      mono-state=${notice.tone}
      aria-hidden="true"
      popover="manual"
      @click=${stopEvent}
      ${ref(this._floatBubble.setBubble)}
    >${notice.text}</span>`
  }

  /** Light build: UnoCSS mask icons; shadow build: inline SVG (page icon CSS can't reach a shadow root). */
  private _glyph(tone: FieldValidationTone): TemplateResult {
    if ((this.host as { renderRoot?: Node }).renderRoot instanceof ShadowRoot) {
      return tone === 'valid' ? checkCircleIcon() : alertCircleIcon()
    }
    return tone === 'valid'
      ? html`<span class="mono-icon i-mdi-check-circle-outline" mono-icon aria-hidden="true"></span>`
      : html`<span class="mono-icon i-mdi-alert-circle-outline" mono-icon aria-hidden="true"></span>`
  }

  /** Touch has no hover: a tap shows the tip — and must not open / focus the control underneath. */
  private _onIconClick = (e: Event): void => {
    stopEvent(e)
    this._iconBubble.show()
  }

  private _onEnter = (): void => {
    this._hovered = true
    this._syncFloat()
  }

  private _onLeave = (e: PointerEvent): void => {
    // A touch "leaves" on lift — focus decides for touch.
    if (e.pointerType === 'touch') return
    this._hovered = false
    this._syncFloat()
  }

  private _onFocusIn = (e: FocusEvent): void => {
    this._focused = true
    this._syncFloat()
    // Keyboard users can't hover the icon: a keyboard focus shows its tip.
    if (this.notice?.position === 'icon' && isFocusVisible(e)) this._iconBubble.show()
  }

  private _onFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget as Node | null
    if (next && (next === this.host || this.host.contains(next))) return
    this._focused = false
    this._syncFloat()
    this._iconBubble.hide()
  }

  private _syncFloat(): void {
    const notice = this.notice
    const active = this._hovered || this._focused
    if (notice?.position === 'float' && active && !this.read().suppressed) this._floatBubble.show()
    // Left the field: a short grace period; anything else (popup opened, message gone): now.
    else if (!active) this._floatBubble.scheduleHide()
    else this._floatBubble.hide()
  }
}

const stopEvent = (e: Event): void => {
  e.preventDefault()
  e.stopPropagation()
}

function isFocusVisible(e: FocusEvent): boolean {
  const target = (e.composedPath?.()[0] ?? e.target) as Element | null
  try {
    return !!target?.matches?.(':focus-visible')
  } catch {
    return false
  }
}
