import { Constructor } from "../../composables/hybird-prop.js";
import { MonoOtpCoreInterface, OtpIconName } from "./otp-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/otp/mono-otp.shadow.d.ts
declare const MonoOtpShadow_base: Constructor<MonoOtpCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-otp` (SSR build, `@mono-lit/helper/ui/shadow/otp`, tag `mono-shadow-otp`).
 *
 * Shares every behaviour with the light build through `MonoOtpCore`; only the slot regions
 * differ: native `<slot name="prefix|suffix|label|helper">` (label / helper carry the prop text as
 * fallback). Slot presence is unknown during SSR, so both sides default to "empty" and
 * `firstUpdated()` scans the assigned nodes (Declarative Shadow DOM assigns slotted content at
 * parse time, so `slotchange` never fires after hydration — same as mono-input).
 */
export declare class MonoOtpShadow extends MonoOtpShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
  firstUpdated(changed: Map<string, unknown>): void;
  private _slotHasContent;
  private _setSlotState;
  private _onSlotChange;
  protected _renderLabelText(): TemplateResult;
  /** Always rendered (the slot must exist to be scanned); hidden with `mono-empty` when empty. */
  protected _renderLabel(): TemplateResult;
  protected _renderHelperText(base: string): TemplateResult;
  protected _renderAffix(name: 'prefix' | 'suffix'): TemplateResult;
  protected renderIcon(_name: OtpIconName): TemplateResult;
}
//#endregion
export {};