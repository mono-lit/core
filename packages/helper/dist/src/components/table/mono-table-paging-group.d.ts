import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTablePagingGroupCoreInterface } from "./mono-table-paging-group-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-paging-group.d.ts
declare const MonoTablePagingGroup_base: Constructor<MonoTablePagingGroupCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-paging-group` (default build, `@mono-lit/helper/ui/table`).
 * Paginates the rows inside a single group. All logic lives in
 * `MonoTablePagingGroupCore`; the shadow build shares the mixin.
 *
 * @example
 * <mono-table-paging-group :data-grid.prop="table" :group.prop="node" page-size="5" />
 */
export declare class MonoTablePagingGroup extends MonoTablePagingGroup_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-table-paging-group': MonoTablePagingGroup;
  }
}
//#endregion
export {};