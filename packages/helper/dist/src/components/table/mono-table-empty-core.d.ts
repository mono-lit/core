import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableControllerCoreInterface } from "./table-controller-core.js";
import { MonoFormController } from "../form/form-types.js";
import { MonoFilterSuggestion } from "./filter-suggestion.js";
import { MonoTableController } from "./mono-data-grid.js";
import { LitElement, TemplateResult, nothing } from "lit";
//#region src/components/table/mono-table-empty-core.d.ts
/** `detail` of the `reload` event `<mono-table-empty>` emits when its button is pressed. */
export interface TableEmptyReloadEventDetail {
  grid: MonoTableController;
}
export type TableEmptyReloadEvent = CustomEvent<TableEmptyReloadEventDetail>;
/**
 * `detail` of the `adjust` event — the **Adjust Filter** button was pressed and
 * `values` have ALREADY been written into the form. The event is cancelable:
 * its default action is `grid.refresh()`; call `preventDefault()` to run your own
 * query instead (a page that builds its `$filter` by hand from the form).
 */
export interface TableEmptyAdjustEventDetail extends MonoFilterSuggestion {
  form: MonoFormController;
  grid: MonoTableController;
}
export type TableEmptyAdjustEvent = CustomEvent<TableEmptyAdjustEventDetail>;
/** Events emitted by `<mono-table-empty>` (feeds the generated Vue types). */
export interface TableEmptyEvents {
  reload: TableEmptyReloadEvent;
  adjust: TableEmptyAdjustEvent;
  'mno-reload': TableEmptyReloadEvent;
  mnoReload: TableEmptyReloadEvent;
  'mno-adjust': TableEmptyAdjustEvent;
  mnoAdjust: TableEmptyAdjustEvent;
}
/** `<mono-table-empty :suggestion-filter.prop="…">` — how a filter suggestion is presented. */
export interface MonoEmptySuggestionOptions {
  /**
   * The line that REPLACES the subtitle while a suggestion is shown. A function
   * receives the row count and the whole suggestion; a string substitutes
   * `{count}`, `{value}`, `{label}`, `{key}` and `{field}`.
   */
  message?: string | ((count: number, suggestion: MonoFilterSuggestion) => string);
  /**
   * Each row of the dropdown beside Adjust Filter (shown when there is more than one
   * offer). Same forms as {@link message}. Default `'Adjust {label} to "{value}"'`.
   */
  option?: string | ((count: number, suggestion: MonoFilterSuggestion) => string);
}
/** Public surface added by the empty-state core mixin. */
export declare class MonoTableEmptyCoreInterface extends MonoTableControllerCoreInterface {
  icon: string;
  title: string;
  subtitle: string;
  reload: boolean;
  reloadLabel: string;
  /** The filter form an **Adjust Filter** writes into. */
  dataForm?: MonoFormController;
  /** Alias of {@link dataForm}. */
  controlForm?: MonoFormController;
  /** Presentation of the filter suggestion — `{ message }`. */
  suggestionFilter?: MonoEmptySuggestionOptions | null;
  adjustLabel: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  /** Set by each build once `slot="body"` is known to hold something. */
  protected _hasBodySlot: boolean;
  /** Overridden by the shadow build to emit a real `<slot>`. */
  protected _renderBodySlot(): TemplateResult;
  protected _renderProps(): TemplateResult;
  protected _renderIcon(): TemplateResult | typeof nothing;
}
/**
 * `MonoTableEmptyCore` — render-mode-agnostic logic for `mono-table-empty`, the
 * message shown over a grid that came back with no rows.
 *
 * It is `mono-table-loading`'s pair: same `<caption>` host, same overlay geometry,
 * same controller binding — one covers the grid while a query runs, this one
 * covers it when the query returned nothing. Everything they share lives in
 * `table-overlay.ts`.
 *
 * **When it shows.** With a controller bound: only once that controller has
 * settled at least once (`hasLoaded`) AND has no rows AND is not loading. The
 * `hasLoaded` gate is the load-bearing one — a fresh controller reads
 * `items: [], loading: false`, which is indistinguishable from "loaded and
 * genuinely empty", so without it every table would flash "No data" on mount
 * before its first request had even been made.
 *
 * With NO controller bound it shows unconditionally, because then the consumer is
 * driving it with `v-if` / `v-show` and an element that hid itself would simply
 * never appear.
 *
 * **What it shows.** `icon`, then `title`, then `subtitle`, then a reload button —
 * each omitted when its prop is empty. A `slot="body"` replaces all four, so a
 * consumer can put arbitrary markup (or a mono component) in the same box and
 * keep the placement and centring for free.
 *
 * SSR-safe: all DOM work is guarded behind `isServer`.
 */
export declare const MonoTableEmptyCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableEmptyCoreInterface> & T;
//#endregion