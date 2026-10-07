// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoBreadcrumbListCore } from './breadcrumb-list-core.js'
import {
  renderBreadcrumbItemsLeadingSep,
  type BreadcrumbRenderContext,
} from './breadcrumb-render.js'
import type { MonoBreadcrumb } from './mono-breadcrumb.js'

import breadcrumbCss from './breadcrumb.css?raw'

/**
 * Light-DOM `mono-breadcrumb-list` (default build, `@mono-lit/helper/ui/breadcrumb`).
 *
 * Two modes:
 *   - Standalone (no parent) — a self-contained breadcrumb nav. All of that logic
 *     lives in `MonoBreadcrumbListCore`.
 *   - Child (inside `<mono-breadcrumb>`) — registers with the parent via
 *     `closest()` and renders BARE items + leading separators (the parent owns
 *     the `<ol>`/`<nav>` chrome). This composition is light-only; the shadow build
 *     (`@mono-lit/helper/ui/shadow/breadcrumb`) supports standalone only.
 */
@customElement('mono-breadcrumb-list')
export class MonoBreadcrumbList extends MonoBreadcrumbListCore(LitElement) {
  static override styles = [unsafeCSS(breadcrumbCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _parent: MonoBreadcrumb | null = null

  override connectedCallback(): void {
    super.connectedCallback()

    this._parent = this.closest('mono-breadcrumb') as MonoBreadcrumb | null

    if (this._parent) {
      this._parent._registerListChild(this)
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()

    if (this._parent) {
      this._parent._unregisterListChild(this)
      this._parent = null
    }
  }

  protected override _buildContext(): BreadcrumbRenderContext {
    const parent = this._parent

    if (parent) {
      return {
        cssClass: parent.cssClass ?? {},
        separator: parent.getSeparatorString(),
        hasSeparatorSlot: parent.hasSeparatorSlot(),
        disabled: parent.disabled,
        isCurrent: (id) => parent.isItemCurrent(id),
        getSlotIconNodes: (id) => parent.getSlotIconNodes(id),
        onItemClick: (item, index, e) =>
          parent.requestItemActivation(item, index, e),
      }
    }

    return super._buildContext()
  }

  protected override render(): TemplateResult {
    if (this._parent) {
      // Inside a wrapper — render bare items + leading separators. The parent
      // provides the `<ol>` and the surrounding `<nav>` semantics. CSS hides
      // the very first separator across sibling lists.
      const ctx = this._buildContext()
      const effectiveItems = this._getEffectiveItems()
      return html`${renderBreadcrumbItemsLeadingSep(effectiveItems, ctx)}`
    }

    // Standalone — render a self-contained breadcrumb nav (core).
    return super.render() as TemplateResult
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-breadcrumb-list': MonoBreadcrumbList
  }
}
