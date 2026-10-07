// @unocss-include

import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { property, query } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'

import type { StatusDotState } from './chip-types.js'
import { booleanStringConverter } from '../../composables/hybird-prop'
import { defineMonoElement } from '../../composables/mono-element'

import chipCss from './chip.css?raw'

type StatusLikeElement = HTMLSpanElement

/**
 * `mono-status-dot` — a small status indicator. Already a real shadow-DOM
 * LitElement (default render root + `static styles`, native `<slot>`), so it is
 * SSR-compatible as-is and shared verbatim by BOTH the light (`@mono-lit/helper/ui/chip`)
 * and shadow (`@mono-lit/helper/ui/shadow/chip`) chip builds. It lives in its own
 * module so the shadow chip build can register it WITHOUT importing the light
 * `mono-chip` (which would collide with the shadow `mono-chip` class).
 *
 * It keeps the SAME `mono-status-dot` tag in both builds (it has no light/shadow
 * variant — it is always a shadow-DOM element), so its registration is guarded
 * (see bottom of file): whichever chip build loads first wins, and a page that
 * loads both light + shadow chip won't throw a "already defined" registry error.
 */
export class MonoStatusDot extends LitElement {
  static override styles = [unsafeCSS(chipCss)]

  constructor() {
    super()

    this.state = 'online'
    this.pulse = false
    this.label = undefined
    this.color = undefined
  }

  @property({ type: String })
  state!: StatusDotState

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  pulse!: boolean

  @property({ type: String })
  label?: string

  @property({ type: String })
  color?: string

  @query('span')
  private _statusElement?: StatusLikeElement

  private get _statusClasses(): string {
    const classes: string[] = ['mono-status-dot', `sd-${this.state}`]

    if (this.pulse) {
      classes.push('pulse')
    }

    return classes.join(' ')
  }

  private get _statusStyle(): string | undefined {
    if (!this.color) return undefined
    return `--mono-status-dot-color:${this.color};`
  }

  protected override render(): TemplateResult {
    return html`
      <span
        class=${this._statusClasses}
        mono-status-dot
        mono-status=${this.state === 'online' ? nothing : this.state}
        ?mono-pulse=${this.pulse}
        style=${ifDefined(this._statusStyle)}
        role="status"
        aria-label=${ifDefined(this.label)}
      >
        <span class="sd-dot" mono-dot aria-hidden="true"></span>
        <span class="sd-label">
          ${when(
            Boolean(this.label),
            () => this.label,
            () => html`<slot></slot>`,
          )}
        </span>
      </span>
    `
  }

  public override focus(): void {
    this._statusElement?.focus()
  }

  public override blur(): void {
    this._statusElement?.blur()
  }
}

// Guarded define: shared verbatim by both the light and shadow chip bundles, so
// the second bundle to evaluate must not re-register the same tag.
// `defineMonoElement` is that guard plus the `createMonoUI` defaults.
defineMonoElement('mono-status-dot', MonoStatusDot)

declare global {
  interface HTMLElementTagNameMap {
    'mono-status-dot': MonoStatusDot
  }
}
