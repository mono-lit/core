// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import type { MonoGroupNode } from './grouping.js'
import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import { booleanStringConverter, numberStringConverter, type Constructor } from '../../composables/hybird-prop'

/** Public surface added by the group-paging core mixin. */
export declare class MonoTablePagingGroupCoreInterface extends MonoTableControllerCoreInterface {
  group?: MonoGroupNode | string
  pageSize: number
  siblings: number
  simple: boolean
}

/**
 * `MonoTablePagingGroupCore` — render-mode-agnostic logic for
 * `mono-table-paging-group`: paginates the rows inside ONE group. Extends the
 * controller base with group-paging registration on connect / disconnect /
 * group-path change. No slots, no icons — light and shadow share `render()`.
 */
export const MonoTablePagingGroupCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTablePagingGroupCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { pagingGroup } })`. */
    protected override _propsSlot = 'pagingGroup' as const

    /** The group to paginate — its node (bind with `.prop`) or its `path` string. */
    @property({ attribute: false })
    group?: MonoGroupNode | string

    /** Rows per group-page (default 5). */
    @property({ attribute: 'page-size', converter: numberStringConverter })
    pageSize = 5

    /** Numbered buttons shown around the current page (each side). Default 1. */
    @property({ converter: numberStringConverter })
    siblings = 1

    /** Only Prev / "X / Y" / Next — no numbered buttons. */
    @property({ reflect: true, converter: booleanStringConverter })
    simple = false

    /** The bound group's stable path key (drives every controller call). */
    private get _path(): string {
      const g = this.group
      return (typeof g === 'string' ? g : g?.path) ?? ''
    }

    override connectedCallback(): void {
      super.connectedCallback()
      this._register()
    }

    override disconnectedCallback(): void {
      // Removing the control un-pages the group (it shows all rows again).
      if (this._path) this.dataGrid?.clearGroupPaging(this._path)
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      // Base handles `dataGrid` (re)subscription.
      super.willUpdate(changed)

      // Re-register only on a REAL change. The controller rebuilds the group node
      // (new object, same `path`) on every `sync()`, so registering on object
      // identity would call back into the controller → notify → re-render → loop
      // ("Maximum recursive updates"). Compare the stable `path` instead.
      const groupChanged = changed.has('group')
      const prev = groupChanged
        ? (changed.get('group') as MonoGroupNode | string | undefined)
        : undefined
      const prevPath = typeof prev === 'string' ? prev : prev?.path
      const pathChanged = groupChanged && prevPath !== this._path

      if (changed.has('dataGrid') || changed.has('pageSize') || pathChanged) {
        // A new group path leaves the old one registered — release it first.
        if (pathChanged && prevPath) this.dataGrid?.clearGroupPaging(prevPath)
        this._register()
      }
    }

    private _register(): void {
      const path = this._path
      if (path && this.dataGrid) this.dataGrid.setGroupPageSize(path, this.pageSize)
    }

    private _go(pageIndex: number): void {
      if (this._path) this.dataGrid?.setGroupPage(this._path, pageIndex)
    }

    /** Windowed list of 1-based page numbers with 'gap' markers for ellipses. */
    private _pages(current1: number, total: number): Array<number | 'gap'> {
      if (total <= 1) return total === 1 ? [1] : []
      const sib = Math.max(0, Math.floor(Number(this.siblings) || 0))
      const set = new Set<number>([1, total])
      for (let p = current1 - sib; p <= current1 + sib; p++) {
        if (p >= 1 && p <= total) set.add(p)
      }
      const sorted = [...set].sort((a, b) => a - b)
      const out: Array<number | 'gap'> = []
      let prev = 0
      for (const p of sorted) {
        if (p - prev > 1) out.push('gap')
        out.push(p)
        prev = p
      }
      return out
    }

    protected override render(): TemplateResult | typeof nothing {
      const grid = this.dataGrid
      if (!grid || !this._path) return nothing

      const info = grid.groupPageInfo(this._path)
      const count = info.pageCount
      if (count <= 1) return nothing // single page → nothing to page

      const current = info.pageIndex
      const atFirst = current <= 0
      const atLast = current >= count - 1

      return html`
        <div class="mono-table-pg mono-table-pg-group" mono-table-paging mono-table-paging-group>
          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atFirst}
            @click=${() => this._go(current - 1)}
            aria-label="Previous rows"
          >
            ‹
          </button>

          ${this.simple
          ? html`<span class="mono-table-pg-el" mono-pg-el>${current + 1} / ${count}</span>`
          : this._pages(current + 1, count).map((p) =>
            p === 'gap'
              ? html`<span class="mono-table-pg-el" mono-pg-el>…</span>`
              : html`<button
                      class=${`mono-table-pgb${p === current + 1 ? ' on' : ''}`} mono-pgb ?mono-on=${p === current + 1}
                      @click=${() => this._go((p as number) - 1)}
                    >
                      ${p}
                    </button>`,
          )}

          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atLast}
            @click=${() => this._go(current + 1)}
            aria-label="Next rows"
          >
            ›
          </button>
        </div>
      `
    }
  }

  return MonoTablePagingGroupCoreClass as unknown as Constructor<MonoTablePagingGroupCoreInterface> & T
}
