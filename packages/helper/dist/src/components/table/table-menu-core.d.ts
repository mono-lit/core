import { LitElement, TemplateResult } from 'lit';
import { SortOrder } from './mono-data-grid.js';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { Constructor } from '../../composables/hybird-prop';
import { PopupPortalController } from '../../composables/popup-portal.js';
/** Resolved sort config — see {@link MonoColumnSort}. */
export interface MonoResolvedSort {
    enable: boolean;
    showIcon: boolean;
    noClear: boolean;
    disabled: boolean;
}
/** Public surface added by the menu core mixin. */
export declare class MonoTableMenuCoreInterface extends MonoTableControllerCoreInterface {
    protected _menuOpen: boolean;
    protected _sortMenuOpen: boolean;
    protected _menuPopup?: PopupPortalController;
    protected _sortMenuPopup?: PopupPortalController;
    protected _menuPanelEl: HTMLElement | null;
    protected _cell: HTMLElement | null;
    protected get _sortDir(): SortOrder;
    protected resolveSort(raw?: {
        enable?: boolean;
        showIcon?: boolean;
        noClear?: boolean;
        disabled?: boolean;
    }): MonoResolvedSort;
    protected bindContextMenu(wanted: boolean): void;
    protected detachContextMenu(): void;
    protected ensurePopups(): void;
    protected openMenu(e?: Event): void;
    protected closeMenu(): void;
    protected _menuKeepsPath(path: EventTarget[]): boolean;
    protected bindDocListeners(): void;
    protected teardownDocListeners(): void;
    protected renderSortMenuItem(): TemplateResult;
    protected renderSortSubmenu(noClear?: boolean): TemplateResult;
    protected pickSort(order: SortOrder): Promise<void>;
    protected clearAllSorts(): Promise<void>;
    protected _caretIcon(): TemplateResult;
    protected _sortGlyph(dir: 'asc' | 'desc' | 'clear'): TemplateResult;
    protected _clearAllIcon(): TemplateResult;
    protected _checkIcon(): TemplateResult;
}
/**
 * `MonoTableMenuCore` — the header context-menu machinery shared by
 * `mono-table-th` and the standalone `mono-table-sort`.
 *
 * Right-click on the header cell ALWAYS opens the menu; its **Sort** row cascades
 * into an Ascending / Descending / Clear / Clear-all submenu, and picking a
 * direction there ACCUMULATES keys (the column's own arrow stays single-key).
 * Only `mono-table-th` adds a Header Filter row (and its value panel), so the
 * filter-specific parts deliberately stay in that core — this mixin owns just what
 * is genuinely common:
 *
 *  - the menu + submenu `PopupPortalController`s,
 *  - the `contextmenu` binding on the closest `th`/`td`,
 *  - the document `pointerdown` / `Escape` dismissal, with a
 *    `_menuKeepsPath()` hook subclasses extend for their own popups,
 *  - the Sort row and submenu rendering.
 *
 * It only *declares* `field` / `caption` — both cores already define them as
 * reactive properties, and re-declaring would shadow them.
 */
export declare const MonoTableMenuCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableMenuCoreInterface> & T;
