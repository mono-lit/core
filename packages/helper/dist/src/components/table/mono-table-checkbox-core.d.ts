import { LitElement, TemplateResult } from 'lit';
import { MonoTableControllerCoreInterface } from './table-controller-core.js';
import { MonoCheckMode } from './mono-data-grid.js';
import { CheckboxColor, CheckboxCssClass, CheckboxSize } from '../checkbox/checkbox-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Which job this checkbox does. */
export type TableCheckboxType = 'all' | 'single';
/** `detail` of the `mno-change` event `<mono-table-checkbox>` emits. */
export interface TableCheckboxChangeEventDetail<T = any> {
    /** The state it moved TO. */
    checked: boolean;
    /** The row, for `type="single"`; `null` for the select-all. */
    item: T | null;
    /** How many rows are selected after the change (a drain fills in later). */
    count: number;
}
export type TableCheckboxChangeEvent<T = any> = CustomEvent<TableCheckboxChangeEventDetail<T>>;
/** Events emitted by `<mono-table-checkbox>` (feeds the generated Vue types). */
export interface TableCheckboxEvents {
    change: TableCheckboxChangeEvent;
    'mno-change': TableCheckboxChangeEvent;
    mnoChange: TableCheckboxChangeEvent;
}
/** Public surface added by the table-checkbox core mixin. */
export declare class MonoTableCheckboxCoreInterface extends MonoTableControllerCoreInterface {
    type: TableCheckboxType;
    item?: unknown;
    keyValue?: string | string[];
    mode: MonoCheckMode;
    chunk: number;
    size: CheckboxSize;
    color: CheckboxColor;
    disabled: boolean;
    label: string;
    /** Secondary line under the label. */
    sublabel: string;
    /** The same as `sublabel`, kept for existing code. */
    description: string;
    ariaLabelText?: string;
    cssClass: CheckboxCssClass;
    cssClassName: string;
    /** The spinner shown mid-drain — the shadow build swaps in inline SVG. */
    protected _renderLoadingIcon(): TemplateResult;
}
/**
 * `MonoTableCheckboxCore` — render-mode-agnostic logic for `mono-table-checkbox`,
 * a checkbox that knows about the grid.
 *
 * Two jobs, chosen with `type`:
 * - **`type="single"`** (default) — one row's checkbox. Give it the row with
 *   `:item.prop="row"`; it reads and writes `table.check()`.
 * - **`type="all"`** — the select-all. In `mode="all"` (default) checking it
 *   drains the SOURCE in `chunk`-sized requests and selects every row the active
 *   search/filter matches — including rows never fetched for display, which is the
 *   point of the component. `mode="per-page"` selects the loaded page with no
 *   request at all. **Every checkbox on the grid is disabled while a drain runs**
 *   (the selection is still filling in), but only the select-all shows the spinner.
 *
 * ```html
 * <th><mono-table-checkbox type="all" :control-table.prop="table" key-value="Id" /></th>
 * <td><mono-table-checkbox :control-table.prop="table" :item.prop="row" /></td>
 * ```
 *
 * The `<th>` one canNOT render the `<td>` ones — the library never renders your
 * `<tbody>` — so both are declared; the row one needs only `:item.prop`.
 *
 * **It renders `mono-checkbox`'s markup and classes rather than embedding the
 * element**, so `size` / `color` / `disabled` / `label` behave identically and the
 * whole size × color matrix comes from `checkbox.css`. Same trade `mono-table-search`
 * makes with `mono-input` — and embedding a light `<mono-*>` inside another light
 * component would steal the parent's Lit-rendered children.
 *
 * SSR-safe: the controller is undefined on the server, so it renders an unchecked
 * shell and touches no DOM.
 */
export declare const MonoTableCheckboxCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableCheckboxCoreInterface> & T;
