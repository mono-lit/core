import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableErrorCoreInterface } from "./mono-table-error-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-error.d.ts
declare const MonoTableError_base: Constructor<MonoTableErrorCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-error` (default build, `@mono-lit/helper/ui/table`).
 *
 * The red bar shown under the header when a request fails:
 *
 * ```html
 * <tbody>
 *   <tr><td colspan="3"><mono-table-error :control-table.prop="table" /></td></tr>
 *   <tr v-for="…">…</tr>
 * </tbody>
 * ```
 *
 * All the logic is in `MonoTableErrorCore`. This build adds nothing but the tag
 * and the stylesheet — the close glyph is the global `i-mdi-close` utility class,
 * which is exactly what a light build can use and a shadow one cannot.
 */
export declare class MonoTableError extends MonoTableError_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-table-error': MonoTableError;
  }
}
//#endregion
export {};