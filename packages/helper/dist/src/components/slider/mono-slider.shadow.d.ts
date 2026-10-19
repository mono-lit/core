import { Constructor } from "../../composables/hybird-prop.js";
import { MonoSliderCoreInterface } from "./slider-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/slider/mono-slider.shadow.d.ts
declare const MonoSliderShadow_base: Constructor<MonoSliderCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-slider` (SSR build, `@mono-lit/helper/ui/shadow/slider`, tag
 * `mono-shadow-slider`).
 *
 * Shares every behaviour with the light build through `MonoSliderCore`; only the label and helper
 * regions differ: native `<slot name="label|helper">` with the prop text as fallback. Slot
 * presence is unknown during SSR, so both sides default to "empty" and `firstUpdated()` scans the
 * assigned nodes (Declarative Shadow DOM assigns slotted content at parse time, so `slotchange`
 * never fires after hydration — same as mono-input / mono-switch).
 */
export declare class MonoSliderShadow extends MonoSliderShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
  firstUpdated(changed: Map<string, unknown>): void;
  private _slotHasContent;
  private _setSlotState;
  private _onSlotChange;
  protected _renderLabelText(): TemplateResult;
  /** Always rendered (the slot must exist to be scanned); hidden with `mono-empty` when empty. */
  protected _renderLabel(): TemplateResult;
  protected _renderMessage(): TemplateResult;
}
//#endregion
export {};