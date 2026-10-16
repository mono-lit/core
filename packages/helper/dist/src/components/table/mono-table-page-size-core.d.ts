import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableControllerCoreInterface } from "./table-controller-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-page-size-core.d.ts
/** Public surface added by the page-size core mixin. */
export declare class MonoTablePageSizeCoreInterface extends MonoTableControllerCoreInterface {
  sizes: Array<number | 'all'> | string;
  label: string;
}
/**
 * `MonoTablePageSizeCore` — render-mode-agnostic logic for `mono-table-page-size`:
 * a native `<select>` of page-size options wired to the controller. No slots, no
 * icons — light and shadow share the full `render()`.
 */
export declare const MonoTablePageSizeCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTablePageSizeCoreInterface> & T;
//#endregion