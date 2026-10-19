import { Constructor } from "../../composables/hybird-prop.js";
import { MonoOtpCoreInterface, OtpIconName } from "./otp-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/otp/mono-otp.d.ts
declare const MonoOtp_base: Constructor<MonoOtpCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-otp` (default build, `@mono-lit/helper/ui/otp`).
 *
 * Renders into the host (styled by the global `dist/ui/index.css`). `slot="prefix|suffix|label|helper"`
 * children are captured on connect and re-placed into `[data-mono-slot]` placeholders after each
 * render — the same strategy as mono-input. Everything else lives in `MonoOtpCore`; the shadow
 * build (`mono-shadow-otp`) shares it with native `<slot>`s.
 */
export declare class MonoOtp extends MonoOtp_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
  private _slots;
  private _slotObserver?;
  /** Capture `slot="…"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
  private _captureSlots;
  connectedCallback(): void;
  disconnectedCallback(): void;
  protected updated(changed: Map<string, unknown>): void;
  protected renderIcon(_name: OtpIconName): TemplateResult;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-otp': MonoOtp;
  }
}
//#endregion
export {};