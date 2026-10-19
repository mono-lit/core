import { Constructor } from "../../composables/hybird-prop.js";
import { MonoSliderCoreInterface } from "./slider-core.js";
import { LitElement } from "lit";
//#region src/components/slider/mono-slider.d.ts
declare const MonoSlider_base: Constructor<MonoSliderCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-slider` (default build, `@mono-lit/helper/ui/slider`).
 *
 * Renders into the host (styled by the global `dist/ui/index.css`). `slot="label"` /
 * `slot="helper"` children are captured on connect and re-placed into `[data-mono-slot]`
 * placeholders after each render — the same strategy as mono-input. Everything else lives in
 * `MonoSliderCore`; the shadow build (`mono-shadow-slider`) shares it with native `<slot>`s.
 */
export declare class MonoSlider extends MonoSlider_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
  private _slotLabel;
  private _slotHelper;
  private _slotObserver?;
  /** Capture `slot="label|helper"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
  private _captureSlots;
  connectedCallback(): void;
  disconnectedCallback(): void;
  protected updated(changed: Map<string, unknown>): void;
  private _placeSlot;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-slider': MonoSlider;
  }
}
//#endregion
export {};