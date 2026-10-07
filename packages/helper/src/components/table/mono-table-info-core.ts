// @unocss-include

import { LitElement, html, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import type { Constructor } from '../../composables/hybird-prop'

/** Public surface added by the info core mixin. */
export declare class MonoTableInfoCoreInterface extends MonoTableControllerCoreInterface {
  template: string
}

/**
 * `MonoTableInfoCore` — render-mode-agnostic logic for `mono-table-info`: a
 * read-only summary line (`Showing {from}–{to} of {total}`) driven by the
 * controller. No slots, no icons — light and shadow share the full `render()`.
 */
export const MonoTableInfoCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableInfoCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { info } })`. */
    protected override _propsSlot = 'info' as const

    /** Override template; tokens: {from} {to} {total} {page} {pages}. */
    @property({ type: String })
    template = 'Showing {from}–{to} of {total}'

    protected override render(): TemplateResult {
      const grid = this.dataGrid
      const shown = grid?.items.length ?? 0
      const pageIndex = grid?.pageIndex ?? 0
      const pageSize = grid?.pageSize ?? 0
      const total = grid?.totalCount ?? shown

      const from = shown === 0 ? 0 : pageIndex * pageSize + 1
      const to = shown === 0 ? 0 : from + shown - 1

      const text = this.template
        .replace('{from}', String(from))
        .replace('{to}', String(to))
        .replace('{total}', String(total))
        .replace('{page}', String(pageIndex + 1))
        .replace('{pages}', String(grid?.pageCount ?? 1))

      return html`<span class="mono-table-info" mono-table-info>${text}</span>`
    }
  }

  return MonoTableInfoCoreClass as unknown as Constructor<MonoTableInfoCoreInterface> & T
}
