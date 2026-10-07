// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoFileUploadCore } from './file-upload-core.js'
import type { FileUploadItem } from './file-upload-types.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { isIconifyClass, getFileIcon } from './file-upload-utils.js'
import { mdiGlyph } from '../../composables/icon.js'

import fileUploadCss from './file-upload.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: size the inline SVGs to their wrapper boxes (the `.mono-file-upload-*`
// boxes carry the dimensions; the `i-mdi-*` mask is replaced by inline SVG).
/** The glyphs this build draws itself — the light build's defaults, verbatim. */
const DEFAULT_ICON = 'i-mdi-cloud-upload-outline'
const REMOVE_ICON = 'i-mdi-close'
const FALLBACK_FILE_ICON = 'i-mdi-file'

const SHADOW_EXTRA_CSS = `
[mono-icon] slot[name="icon"] { display: contents; }
`

/**
 * Shadow-DOM `mono-file-upload` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/file-upload`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-file-upload`→`:host`). The
 * dropzone (label / title / subtitle / icon / `<input type=file>`) renders
 * server-side; the file LIST is inherently client-only (`File`/blob previews).
 * Icons are inline SVG (the `i-mdi-*` UnoCSS classes can't paint inside a shadow
 * root): default dropzone glyph, the remove ✕, and a generic file-type thumb glyph
 * (image files still show their `previewUrl`). A native `<slot name="icon">`
 * overrides the dropzone icon; `<slot name="title">` / `<slot name="subtitle">`
 * override the two text lines (the props are their fallback content). Custom iconify `icon`/`removeIcon` PROP values
 * degrade to invisible in shadow (use the slot). Interactivity (picker click /
 * drag-drop / remove) needs the first client update to flush — hence the
 * defer-hydration poll. Shares all logic with the light build via
 * `MonoFileUploadCore`; both register `mono-file-upload`, so a document loads one.
 */
@customElement('mono-shadow-file-upload')
export class MonoFileUploadShadow extends withShadowUtilityStyles(MonoFileUploadCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(fileUploadCss, { host: 'mono-file-upload', append: SHADOW_EXTRA_CSS })),
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

  /**
   * Slot presence from `assignedNodes()` (DSD assigns slotted content at parse
   * time, so `slotchange` may never fire after upgrade). Only ASSIGNED nodes
   * count — `flatten` would return the prop fallback for an empty slot.
   */
  private _slotHas(name: string): boolean {
    const slot = this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
    return (
      !!slot &&
      slot
        .assignedNodes()
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _scanSlots(): void {
    const icon = this._slotHas('icon')
    if (icon !== this._hasIconSlot) this._hasIconSlot = icon
    const title = this._slotHas('title')
    if (title !== this._hasTitleSlot) this._hasTitleSlot = title
    const subtitle = this._slotHas('subtitle')
    if (subtitle !== this._hasSubtitleSlot) this._hasSubtitleSlot = subtitle
  }

  protected override _useIconSlots(): boolean {
    return true
  }

  /** Native slot; the `title` prop is its fallback content (paints with no JS). */
  protected override _renderTitle(): TemplateResult {
    return html`<div
      class=${this._cls('mono-file-upload-title', 'title')}
      mono-title
      ?mono-empty=${!this._hasTitleSlot && !this.title}
    ><slot name="title" @slotchange=${this._scanSlots}>${this.title || nothing}</slot></div>`
  }

  /** Native slot; the `subtitle` prop is its fallback content. */
  protected override _renderSubtitle(): TemplateResult {
    return html`<div
      class=${this._subtitleClasses}
      mono-subtitle
      mono-subtext
      ?mono-empty=${!this._hasSubtitleSlot && !this.subtitle}
    ><slot name="subtitle" @slotchange=${this._scanSlots}>${this.subtitle || nothing}</slot></div>`
  }

  protected override _renderDropzoneIcon(): TemplateResult {
    const cls = this._cls('mono-file-upload-icon', 'icon')
    // Native slot wins; fallback is the `icon` text prop (non-iconify) or the
    // inline-SVG default (iconify `icon` props can't paint in shadow → default).
    const fallback =
      this.icon && !isIconifyClass(this.icon)
        ? html`${this.icon}`
        : this._renderIconifyGlyph(this.icon) ?? this._renderDefaultGlyph()
    return html`<div class=${cls} mono-icon aria-hidden="true">
      <slot name="icon">${fallback}</slot>
    </div>`
  }

  protected override _renderDefaultGlyph(): TemplateResult {
    return html`<span class="mono-file-upload-default-icon" mono-glyph aria-hidden="true">
      ${mdiGlyph(DEFAULT_ICON)}
    </span>`
  }

  protected override _renderRemoveIcon(): TemplateResult {
    // Plain-text custom removeIcon still works; a bundled iconify one is drawn.
    if (this.removeIcon && !isIconifyClass(this.removeIcon)) {
      return html`${this.removeIcon}`
    }
    return (
      this._renderIconifyGlyph(this.removeIcon) ??
      html`<span class="mono-file-upload-iconify" mono-glyph aria-hidden="true">
        ${mdiGlyph(REMOVE_ICON)}
      </span>`
    )
  }

  protected override _renderThumbGlyph(item: FileUploadItem): TemplateResult {
    // The SAME per-type glyph the light build masks — every `getFileIcon` result
    // is bundled, so a PDF row reads as a PDF row in both builds.
    const icon = getFileIcon(item.type, item.name)
    return (
      this._renderIconifyGlyph(icon) ??
      html`<span class="mono-file-upload-iconify" mono-glyph aria-hidden="true">
        ${mdiGlyph(FALLBACK_FILE_ICON)}
      </span>`
    )
  }

  /**
   * An `i-mdi-*` class as inline SVG, or `undefined` when that glyph is not
   * bundled (`scripts/mdi-glyphs.mjs` lists what is). The light build masks the
   * class through the page's UnoCSS, which cannot cross the shadow boundary.
   */
  private _renderIconifyGlyph(icon: string | undefined): TemplateResult | undefined {
    if (!icon || !isIconifyClass(icon)) return undefined
    const glyph = mdiGlyph(icon)
    if (!glyph) return undefined
    return html`<span class=${`mono-file-upload-iconify ${icon}`} mono-glyph aria-hidden="true">
      ${glyph}
    </span>`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-file-upload']` augmentation is owned by
// the light build (mono-file-upload.ts); redeclaring it here would be a TS2717.
