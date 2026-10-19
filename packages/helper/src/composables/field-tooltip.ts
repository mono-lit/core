// @unocss-include

/* =========================================================================
   Field label tooltip — the ⓘ a form control draws beside its label
   -------------------------------------------------------------------------
   `tooltip="text"` or `.tooltip=${{ content, placement, … }}` on mono-input,
   mono-date, mono-textarea, mono-select, mono-tag-input, mono-dropdown-table
   and mono-slider. The extra explanation that is too long for `helper-text`
   goes in a bubble on an info icon at the end of the label row.

   Two bubbles, picked by the prop's shape:

   - **Plain text** (`tooltip="…"`) → a small BUILT-IN bubble, no dependency.
     It lives inside the icon and is shown in the top layer (Popover API), so
     a field's `overflow`, a disabled label's `opacity` and stacking contexts
     can't clip or fade it. Placed above the icon, below when there's no room,
     clamped to the viewport. Styled by `components/form/field-tooltip.css`.
   - **Options object** (`.tooltip=${{ content, placement, color, … }}`) → the
     tooltip addon (`components/tooltip/`), which needs the OPTIONAL
     `@floating-ui/dom` + `@floating-ui/core` peers. Without them that icon is
     not rendered at all: a hover target that never answers is worse than
     none, and "not installed" is a supported setup, so the probe fails
     SILENTLY (no console noise, unlike a direct `controlMonoTooltip` show).

   The addon is imported lazily and only for the object form, so a plain-text
   tooltip pays for none of it. The probe is client-only: SSR renders no
   object-form icon and it appears once the probe resolves — a conditional
   part Lit adds after hydration, never a mismatch.
   ========================================================================= */

import { html, nothing, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from 'lit'
import { ref } from 'lit/directives/ref.js'
import { infoIcon } from './field-icons'
import { FieldBubble } from './field-bubble'
import type { MonoTooltipController, MonoTooltipOptions } from '../components/tooltip/tooltip-types'

/** What the `tooltip` prop accepts: plain text, or full tooltip options. */
export type FieldTooltipValue = string | MonoTooltipOptions | null | undefined | false

type ControlTooltipFn = typeof import('../components/tooltip/control-tooltip').controlMonoTooltip

/** `controlMonoTooltip` once floating-ui is known to load, else `null`. Probed once per page. */
let _probe: Promise<ControlTooltipFn | null> | null = null

function probeTooltip(): Promise<ControlTooltipFn | null> {
  _probe ??= (async () => {
    try {
      const [{ loadFloatingUi }, { controlMonoTooltip }] = await Promise.all([
        import('../components/tooltip/tooltip-loader'),
        import('../components/tooltip/control-tooltip'),
      ])
      await loadFloatingUi()
      return controlMonoTooltip
    } catch {
      return null
    }
  })()
  return _probe
}

/** @internal — tests: forget the cached probe so a re-mocked peer is probed again. */
export function resetFieldTooltipProbe(): void {
  _probe = null
}

/** `string` → `{ content }`; anything without content → `null` (renders nothing). */
export function normalizeFieldTooltip(value: FieldTooltipValue): MonoTooltipOptions | null {
  if (!value) return null
  if (typeof value === 'string') return value.trim() ? { content: value } : null
  if (typeof value !== 'object') return null
  const { content } = value
  if (content === undefined || content === null || content === '') return null
  return value
}

/** Which bubble a prop value gets: the built-in one, the floating-ui addon, or none. */
function tooltipMode(value: FieldTooltipValue): 'simple' | 'floating' | null {
  if (!normalizeFieldTooltip(value)) return null
  return typeof value === 'string' ? 'simple' : 'floating'
}

/** A click on the bubble is still inside the `<label>` and the icon: neither should react. */
export const stopBubbleClick = (e: Event): void => {
  e.preventDefault()
  e.stopPropagation()
}

const stopLabelActivation = (e: Event) => {
  // The icon sits inside `<label for=…>`: without this a click on it would
  // focus (or open) the field instead of just showing the bubble.
  e.preventDefault()
}

export class FieldTooltipController implements ReactiveController {
  private _fn: ControlTooltipFn | null = null
  private _ctrl: MonoTooltipController | null = null
  private _el: HTMLElement | null = null
  /** The options last handed to the controller — keys dropped since get blanked. */
  private _applied: MonoTooltipOptions | null = null
  /** The raw prop value behind `_applied` — a string re-normalizes to a new object every time. */
  private _raw: FieldTooltipValue = null
  private _connected = false

  /** The built-in bubble behind a plain-text tooltip. */
  private readonly _bubble = new FieldBubble({ side: 'top', align: 'center' })

  constructor(
    private readonly host: ReactiveControllerHost & { readonly renderRoot?: Node },
    private readonly read: () => FieldTooltipValue,
  ) {
    host.addController(this)
  }

  hostConnected(): void {
    this._connected = true
  }

  hostDisconnected(): void {
    this._connected = false
    this._bubble.hide()
    this._unbind()
  }

  hostUpdated(): void {
    if (tooltipMode(this.read()) === 'floating') this._ensureProbe()
    this._sync()
  }

  /** The ⓘ for the end of the label row, or `nothing`. */
  render(): TemplateResult | typeof nothing {
    const raw = this.read()
    const mode = tooltipMode(raw)
    if (mode === 'simple') return this._renderSimple(raw as string)
    if (mode !== 'floating' || !this._fn) return nothing
    return html`<span
      mono-label-tooltip
      tabindex="0"
      role="img"
      aria-label="More information"
      @click=${stopLabelActivation}
      ${ref(this._setEl)}
    >${this._icon()}</span>`
  }

  /**
   * Plain text: the icon carries its own bubble. `aria-describedby` reads the
   * text to screen readers on focus; hover, focus or a tap shows it, Escape
   * dismisses it, and the pointer may move onto it without it closing.
   */
  private _renderSimple(text: string): TemplateResult {
    return html`<span
      mono-label-tooltip
      tabindex="0"
      role="img"
      aria-label="More information"
      aria-describedby=${this._bubble.id}
      @click=${this._onIconClick}
      @pointerenter=${this._bubble.show}
      @pointerleave=${this._bubble.onPointerLeave}
      @focus=${this._bubble.show}
      @blur=${this._bubble.hide}
      @keydown=${this._bubble.onKeydown}
      ${ref(this._setEl)}
    >${this._icon()}<span
        mono-field-bubble
        mono-label-tooltip-bubble
        id=${this._bubble.id}
        role="tooltip"
        popover="manual"
        @pointerenter=${this._bubble.cancelHide}
        @pointerleave=${this._bubble.onPointerLeave}
        @click=${stopBubbleClick}
        ${ref(this._bubble.setBubble)}
      >${text}</span></span>`
  }

  /**
   * Light build: the UnoCSS `i-mdi-information-outline` mask (shipped in
   * `ui/index.css`). Shadow build: the same path inline — the page's icon CSS
   * cannot reach a shadow root.
   */
  private _icon(): TemplateResult {
    if (this.host.renderRoot instanceof ShadowRoot) return infoIcon()
    return html`<span class="mono-icon i-mdi-information-outline" mono-icon aria-hidden="true"></span>`
  }

  private _ensureProbe(): void {
    if (this._fn || typeof document === 'undefined') return
    void probeTooltip().then((fn) => {
      if (!fn || this._fn) return
      this._fn = fn
      this.host.requestUpdate()
    })
  }

  private _setEl = (el: Element | undefined): void => {
    // A new icon element (or none) means the controller points at a stale node.
    if ((el ?? null) !== this._el) this._unbind()
    this._el = (el as HTMLElement | undefined) ?? null
    this._bubble.setAnchor(this._el)
  }

  private _sync(): void {
    const raw = this.read()
    if (tooltipMode(raw) !== 'floating') return this._unbind()
    if (this._ctrl && this._raw === raw) return
    const options = normalizeFieldTooltip(raw)
    if (!this._fn || !this._connected || !this._el || !options) return this._unbind()
    if (this._ctrl) {
      // `update()` merges, and `undefined` never overwrites — so blank any key
      // the new options dropped by setting it to `undefined` explicitly.
      const blanked: Record<string, unknown> = {}
      for (const key of Object.keys(this._applied ?? {})) blanked[key] = undefined
      this._ctrl.update({ ...blanked, ...options })
    } else {
      this._ctrl = this._fn(this._el, options)
    }
    this._applied = options
    this._raw = raw
  }

  private _unbind(): void {
    this._ctrl?.destroy()
    this._ctrl = null
    this._applied = null
    this._raw = null
  }

  /** Touch has no hover: a tap shows it, and it closes when focus leaves. */
  private _onIconClick = (e: Event): void => {
    stopLabelActivation(e)
    this._bubble.show()
  }
}
