import { LitElement } from 'lit';
import { MonoTableController } from './mono-data-grid.js';
import { Constructor } from '../../composables/hybird-prop';
/**
 * Public surface added by the shared controller base mixin (for typing the
 * per-element cores + wrappers).
 */
export declare class MonoTableControllerCoreInterface {
    dataGrid?: MonoTableController;
    /** Unsubscribe handle for the current controller subscription (set by `_subscribe`). */
    protected _off?: () => void;
    /** (Re)bind the controller subscription; called on connect + `dataGrid` change. */
    protected _subscribe(): void;
    /**
     * Which slot of `monoDataGrid({ props })` this element reads. `'th' | 'sort' |
     * 'summary'` resolve per column via the element's `field`; the rest are
     * singletons. Left undefined = the element takes no central props.
     */
    protected _propsSlot?: MonoTablePropsSlot;
    protected _applyControllerProps(): void;
}
/** The `props` key an element reads — see {@link MonoTableProps}. */
export type MonoTablePropsSlot = 'th' | 'sort' | 'summary' | 'search' | 'info' | 'paging' | 'loading' | 'empty' | 'error' | 'pageSize' | 'pagingGroup' | 'detail' | 'checkbox';
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
export declare const MonoTableControllerCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableControllerCoreInterface> & T;
