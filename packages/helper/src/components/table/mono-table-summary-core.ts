// @unocss-include

import { LitElement, html, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import type { MonoSummarySpec, MonoSummaryType } from './mono-data-grid.js'
import type { Constructor } from '../../composables/hybird-prop'

/** Public surface added by the summary core mixin. */
export declare class MonoTableSummaryCoreInterface extends MonoTableControllerCoreInterface {
  field?: string
  type?: MonoSummaryType
  name?: string
}

/**
 * `MonoTableSummaryCore` — render-mode-agnostic logic for `mono-table-summary`: an
 * aggregate footer cell. The aggregate (type + formatting) is configured centrally
 * in `monoDataGrid(data, { summary: [...] })`; this element only names which
 * summary to show (`field`, optionally `type`/`name`) and renders the controller's
 * formatted result, re-rendering whenever the controller notifies.
 *
 * A `field` with no central spec falls back to a `sum` (the controller
 * auto-registers a default), so a bare `<mono-table-summary field="Price">` also
 * works with zero config.
 *
 * No slots, no icons — light and shadow share the full `render()`.
 *
 * SSR-safe: `dataGrid` is undefined on the server, so it renders an empty shell.
 */
export const MonoTableSummaryCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableSummaryCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { summary } })`. */
    protected override _propsSlot = 'summary' as const

    /** Data field to summarize (path-aware). */
    @property({ type: String })
    field?: string

    /** Pick a specific aggregate when the field has several specs. */
    @property({ type: String })
    type?: MonoSummaryType

    /** Pick a specific spec by its `name` when the field has several. */
    @property({ type: String })
    name?: string

    /**
     * Ensure the controller knows about this cell's summary.
     *
     * EVERY element registers, even when a matching spec already exists — the
     * controller dedupes by key and refcounts, so a centrally-declared spec (with
     * its formatting) is still never overwritten by a bare element. Registering
     * only the first element is what used to break a second cell on the same
     * field: when the first unmounted it removed the shared spec, and nothing
     * re-runs registration on the survivor, so it rendered empty forever.
     */
    private _ensureSpec(): void {
      const grid = this.dataGrid
      if (!grid || !this.field) return

      const wanted: MonoSummarySpec = {
        field: this.field,
        type: this.type ?? 'sum',
        name: this.name,
      }

      const current = this._ownSpec
      if (
        current &&
        current.field === wanted.field &&
        current.type === wanted.type &&
        current.name === wanted.name
      ) {
        return // already registered for exactly this spec
      }

      // The field/type/name moved — release the old refcount before taking a new one.
      if (current) grid.unregisterSummary(current)
      grid.registerSummary(wanted)
      this._ownSpec = wanted
    }

    /** The spec this element registered itself (if any), to remove on disconnect. */
    private _ownSpec?: MonoSummarySpec

    override willUpdate(changed: Map<string, unknown>): void {
      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
      if (changed.has('dataGrid') || changed.has('field') || changed.has('type') || changed.has('name')) {
        this._ensureSpec()
      }
    }

    override connectedCallback(): void {
      super.connectedCallback()
      // Re-take a refcount after a reconnect. `willUpdate` only calls `_ensureSpec`
      // when field/type/name/dataGrid change, and none of them move on a plain
      // reattach — so without this the cell would come back permanently blank.
      this._ensureSpec()
    }

    override disconnectedCallback(): void {
      if (this._ownSpec) {
        this.dataGrid?.unregisterSummary(this._ownSpec)
        this._ownSpec = undefined
      }
      super.disconnectedCallback()
    }

    protected override render(): TemplateResult {
      const text =
        this.field && this.dataGrid ? this.dataGrid.summaryText(this.field, this.type) : ''
      return html`<span class="mono-table-summary" mono-table-summary>${text}</span>`
    }
  }

  return MonoTableSummaryCoreClass as unknown as Constructor<MonoTableSummaryCoreInterface> & T
}
