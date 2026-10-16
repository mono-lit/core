import { Constructor } from "../../composables/hybird-prop.js";
import { FilterIconName, MonoFilterBuilderCoreInterface } from "./filter-builder-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/filter/mono-filter-builder.d.ts
declare const MonoFilterBuilder_base: Constructor<MonoFilterBuilderCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-filter-builder` (default build, `@mono-lit/helper/ui/filter`).
 * Icons use the global UnoCSS `.mono-icon i-mdi-*`.
 *
 * It renders `mono-input`'s classes for its selects/inputs, and those rules ship in
 * the same global `dist/ui/index.css` — so no extra stylesheet is needed here.
 */
export declare class MonoFilterBuilder extends MonoFilterBuilder_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
  protected renderIcon(name: FilterIconName): TemplateResult;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-filter-builder': MonoFilterBuilder;
  }
}
//#endregion
export {};