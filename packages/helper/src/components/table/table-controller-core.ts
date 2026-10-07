// @unocss-include

import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import type { MonoTableController } from './mono-data-grid.js'
import {
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { applyProps, detachEventHandlers } from '../../composables/element-props'
import { monoPendingGrace } from '../../composables/mono-skeleton'

/**
 * Public surface added by the shared controller base mixin (for typing the
 * per-element cores + wrappers).
 */
export declare class MonoTableControllerCoreInterface {
  dataGrid?: MonoTableController
  /** Unsubscribe handle for the current controller subscription (set by `_subscribe`). */
  protected _off?: () => void
  /** (Re)bind the controller subscription; called on connect + `dataGrid` change. */
  protected _subscribe(): void
  /**
   * Which slot of `monoDataGrid({ props })` this element reads. `'th' | 'sort' |
   * 'summary'` resolve per column via the element's `field`; the rest are
   * singletons. Left undefined = the element takes no central props.
   */
  protected _propsSlot?: MonoTablePropsSlot
  protected _applyControllerProps(): void
}

/** The `props` key an element reads — see {@link MonoTableProps}. */
export type MonoTablePropsSlot =
  | 'th'
  | 'sort'
  | 'summary'
  | 'search'
  | 'info'
  | 'paging'
  | 'loading'
  | 'empty'
  | 'error'
  | 'pageSize'
  | 'pagingGroup'
  | 'detail'
  | 'checkbox'

/**
 * `MonoTableControllerCore` — the render-mode-agnostic plumbing shared by every
 * `mono-table-*` element: the `dataGrid` controller property (bound via Vue
 * `.prop`, so `attribute: false`), its hybrid alias, and the
 * subscribe/unsubscribe lifecycle that re-renders the element whenever the
 * controller notifies.
 *
 * The six per-element cores compose this base, so their light/shadow wrappers
 * only ever call `MonoTable<El>Core(LitElement)`. Elements needing extra
 * lifecycle work (e.g. `mono-table-paging-group` registers/clears group paging)
 * override the lifecycle methods and chain `super.*` to keep this plumbing.
 *
 * SSR-safe: holds no `document`/`window` access. `dataGrid` is undefined on the
 * server (a `.prop` binding can't cross Declarative Shadow DOM), so `_subscribe`
 * is a no-op there and the element renders its deterministic empty shell.
 */
export const MonoTableControllerCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableControllerCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, ['dataGrid'])
      // Renamed controller binding — `:control-table` / `:controlTable` alias the
      // canonical `dataGrid` (no breaking change; both spellings work).
      defineHybridPropAlias(this, 'controlTable', 'dataGrid')
    }

    /** The shared table controller (bind with `.prop`). */
    @property({ attribute: false })
    dataGrid?: MonoTableController

    protected _off?: () => void

    /** Set by each element's core; undefined = no central props for this element. */
    protected _propsSlot?: MonoTablePropsSlot

    /**
     * Automatic skeleton (`pending`, composables/mono-skeleton.ts): every `mono-table-*`
     * helper is DATA-driven — it stays pending until the bound controller has finished
     * its first load, so the placeholder covers exactly the wait for rows.
     */
    static monoPendingAuto = 'data' as const

    /** A helper's measured skeleton is one bar anyway — the CSS block costs no re-render. */
    static monoPendingDraw = 'css' as const

    /** "First load done" for the automatic `pending` (re-checked on every controller notify). */
    protected _monoPendingReady(): boolean {
      const grid = this.dataGrid
      // No controller: one tick of grace for a binding made in the consumer's
      // `onMounted`, then there is nothing to wait for (static usage).
      if (!grid) return monoPendingGrace(this)
      // Loaded — or FAILED: an error is an answer too (the error element shows it).
      if (grid.hasLoaded || grid.error) return true
      // Nothing in flight one tick after mount: a page that fetches on mount has started its
      // load by then (mounted hooks flush before a macrotask), so this grid waits for a user
      // action (a filter, "Cari Data") — not something a skeleton should sit on for 15 s.
      return monoPendingGrace(this) && !grid.loading
    }

    override connectedCallback(): void {
      super.connectedCallback()
      this._subscribe()
    }

    override disconnectedCallback(): void {
      this._off?.()
      this._off = undefined
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      if (changed.has('dataGrid')) this._subscribe()
      // Chain, or every mixin composed BELOW this one silently loses its
      // `willUpdate` — this base sits under all twelve `mono-table-*` elements.
      // @ts-ignore — the generic mixin base may not declare it, LitElement does.
      super.willUpdate?.(changed)
    }

    protected _subscribe(): void {
      this._off?.()
      // Listeners the previous controller's `props.on*` attached leave with it;
      // the new one's are re-attached by the apply below.
      detachEventHandlers(this)
      this._off = this.dataGrid?.subscribe(() => {
        this._scheduleApplyProps()
        this.requestUpdate()
      })
      this._scheduleApplyProps()
    }

    /**
     * Drive the apply from `update()` as well as `_subscribe()`.
     *
     * `mono-table-paging` and `mono-table-loading` REPLACE `_subscribe` without
     * chaining `super`, so hanging the apply off that alone silently skipped
     * them — and the next core to override it would break the same way. Every
     * element still reaches `update()` (nothing overrides it), and those cores
     * call `requestUpdate()` on notify, so this path always runs.
     */
    protected override update(changed: Map<string, unknown>): void {
      this._scheduleApplyProps()
      super.update(changed)
    }

    private _applyQueued = false

    /**
     * Deferred + de-duplicated: the apply writes reactive props, and doing that
     * inside the update cycle would trip Lit's change-in-update warning.
     */
    private _scheduleApplyProps(): void {
      if (this._applyQueued) return
      if (typeof queueMicrotask !== 'function') {
        this._applyControllerProps()
        return
      }
      this._applyQueued = true
      queueMicrotask(() => {
        this._applyQueued = false
        this._applyControllerProps()
      })
    }

    /**
     * Pull this element's slice of `monoDataGrid({ props })` onto itself.
     *
     * The CONTROLLER WINS for keys it declares (matching `monoForm`'s `setProp`);
     * keys it doesn't mention are left to whatever the template set. Every write
     * is equality-guarded so a sync can't trigger another update cycle.
     */
    protected _applyControllerProps(): void {
      const slot = this._propsSlot
      const grid = this.dataGrid
      if (!slot || !grid?.props) return

      const all = grid.props()
      let patch: Record<string, unknown> | undefined

      if (slot === 'th' || slot === 'sort' || slot === 'summary') {
        // Per-column: find this element's entry by the `field` it already carries.
        const field = (this as unknown as { field?: string }).field
        if (!field) return
        const col = (all.th ?? []).find((c) => c.field === field)
        if (!col) return
        if (slot === 'th') {
          // Everything except the sibling elements' sub-configs.
          const { summary: _s, ...rest } = col
          patch = rest as Record<string, unknown>
        } else {
          const sub = col[slot] as Record<string, unknown> | undefined
          if (!sub) return
          patch = { field, ...sub }
        }
      } else {
        patch = all[slot] as Record<string, unknown> | undefined
      }

      // No re-entrancy guard is needed: `registerColumn` only mutates a Set (it
      // does not notify), so an assignment here can't loop back through the
      // controller. `applyProps` supplies the equality + read-only guards.
      applyProps(this, patch)
    }
  }

  return MonoTableControllerCoreClass as unknown as Constructor<MonoTableControllerCoreInterface> & T
}
