import { Constructor } from "./hybird-prop.js";
import { LitElement } from "lit";
//#region src/composables/mono-pending.d.ts
/**
 * Applied to every registered element class by the mono `customElement` decorator.
 * The property itself is registered separately (`registerPendingProperty`) so it lands in
 * Lit's attribute map before `customElements.define`.
 */
export declare function withMonoPending<T extends Constructor<LitElement>>(superClass: T, tag: string): T;
//#endregion