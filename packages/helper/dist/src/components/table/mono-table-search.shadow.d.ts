import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableSearchCoreInterface, TableSearchIconName } from "./mono-table-search-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/table/mono-table-search.shadow.d.ts
declare const MonoTableSearchShadow_base: Constructor<MonoTableSearchCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-table-search` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * The icons are inline SVG — the global `.mono-icon`/`i-mdi-*` utility CSS can't
 * reach a shadow root. Shares all other logic via `MonoTableSearchCore`.
 *
 * The element renders `mono-input`'s classes, and a shadow root can't see the
 * page stylesheet, so `input.css` is adopted alongside `table.css` — input first
 * so table rules can still override. `input.css`'s bare `mono-input { }` selector
 * simply never matches in here, which is harmless.
 */
export declare class MonoTableSearchShadow extends MonoTableSearchShadow_base {
  static styles: import("lit").CSSResult[];
  protected renderIcon(name: TableSearchIconName): TemplateResult;
  /** Shadow build projects the slotted filter-builder through a native `<slot>`. */
  protected _renderFilterSlotContent(): TemplateResult;
  connectedCallback(): void;
}
//#endregion
export {};