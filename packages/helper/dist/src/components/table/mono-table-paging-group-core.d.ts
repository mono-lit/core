import { Constructor } from "../../composables/hybird-prop.js";
import { MonoGroupNode } from "./grouping.js";
import { MonoTableControllerCoreInterface } from "./table-controller-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-paging-group-core.d.ts
/** Public surface added by the group-paging core mixin. */
export declare class MonoTablePagingGroupCoreInterface extends MonoTableControllerCoreInterface {
  group?: MonoGroupNode | string;
  pageSize: number;
  siblings: number;
  simple: boolean;
}
/**
 * `MonoTablePagingGroupCore` — render-mode-agnostic logic for
 * `mono-table-paging-group`: paginates the rows inside ONE group. Extends the
 * controller base with group-paging registration on connect / disconnect /
 * group-path change. No slots, no icons — light and shadow share `render()`.
 */
export declare const MonoTablePagingGroupCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTablePagingGroupCoreInterface> & T;
//#endregion