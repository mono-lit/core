// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import type { Constructor } from '../../composables/hybird-prop'

/** Public surface added by the page-size core mixin. */
export declare class MonoTablePageSizeCoreInterface extends MonoTableControllerCoreInterface {
  sizes: Array<number | 'all'> | string
  label: string
}

/**
 * `MonoTablePageSizeCore` — render-mode-agnostic logic for `mono-table-page-size`:
 * a native `<select>` of page-size options wired to the controller. No slots, no
 * icons — light and shadow share the full `render()`.
 */
export const MonoTablePageSizeCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTablePageSizeCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { pageSize } })`. */
    protected override _propsSlot = 'pageSize' as const

    /**
     * Options for the select — numbers plus an optional `'all'` entry (renders
     * "All" and loads/shows everything). Array via `.prop`, or a comma string
     * attribute (e.g. `"10,20,50,all"`).
     */
    @property({ attribute: false })
    sizes: Array<number | 'all'> | string = [10, 20, 50, 100]

    /** Optional leading label, e.g. "Show". */
    @property({ type: String })
    label = ''

    private get _options(): Array<number | 'all'> {
      const raw = this.sizes
      const list = Array.isArray(raw) ? raw : String(raw).split(',').map((s) => s.trim())
      const out: Array<number | 'all'> = []
      for (const v of list) {
        if (typeof v === 'string' && v.toLowerCase() === 'all') out.push('all')
        else {
          const n = Number(v)
          if (Number.isFinite(n) && n > 0) out.push(n)
        }
      }
      return out
    }

    private _handleChange(event: Event): void {
      const raw = (event.currentTarget as HTMLSelectElement).value
      if (raw === 'all') {
        void this.dataGrid?.setPageSize('all')
        return
      }
      const value = Number(raw)
      if (Number.isFinite(value) && value > 0) void this.dataGrid?.setPageSize(value)
    }

    protected override render(): TemplateResult {
      const current = this.dataGrid?.pageSize ?? 0
      const all = this.dataGrid?.pageSizeAll ?? false
      const loading = this.dataGrid?.loading ?? false

      return html`
        <label class="mono-table-page-size" mono-table-page-size>
          ${this.label ? html`<span>${this.label}</span>` : nothing}
          <select class="mono-table-sel" mono-sel ?disabled=${loading} @change=${this._handleChange}>
            ${this._options.map((o) => {
        const isAll = o === 'all'
        const selected = isAll ? all : !all && o === current
        return html`<option value=${isAll ? 'all' : o} ?selected=${selected}>
                ${isAll ? 'All' : o}
              </option>`
      })}
          </select>
        </label>
      `
    }
  }

  return MonoTablePageSizeCoreClass as unknown as Constructor<MonoTablePageSizeCoreInterface> & T
}
