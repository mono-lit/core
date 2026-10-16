import { Constructor } from "../../composables/hybird-prop.js";
import { FilterIconName, MonoFilterBuilderCoreInterface } from "./filter-builder-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/filter/mono-filter-builder.shadow.d.ts
declare const MonoFilterBuilderShadow_base: Constructor<MonoFilterBuilderCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-filter-builder` (SSR build, `@mono-lit/helper/ui/shadow/filter`).
 * Registers the DISTINCT `mono-shadow-filter-builder` tag; the light element
 * coexists.
 *
 * `filter.css` alone is enough: this component styles its own controls rather than
 * borrowing `input.css`'s inner classes, so there is no second sheet to adopt.
 */
export declare class MonoFilterBuilderShadow extends MonoFilterBuilderShadow_base {
  static styles: import("lit").CSSResult[];
  protected renderIcon(name: FilterIconName): TemplateResult;
  connectedCallback(): void;
}
//#endregion
export {};