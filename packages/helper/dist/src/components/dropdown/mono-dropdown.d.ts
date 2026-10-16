import { Constructor } from "../../composables/hybird-prop.js";
import { MonoDropdownCoreInterface } from "./dropdown-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/dropdown/mono-dropdown.d.ts
declare const MonoDropdown_base: Constructor<MonoDropdownCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-dropdown` (default build, `@mono-lit/helper/ui/dropdown`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="main"`/`"body"`
 * children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets, and the captured nodes are re-appended in
 * `updated()`. All render-mode-agnostic logic lives in `MonoDropdownCore`. The
 * shadow build (`@mono-lit/helper/ui/shadow/dropdown`) shares the mixin but uses native
 * `<slot>`. Both register `mono-dropdown`, so a document loads only one.
 */
export declare class MonoDropdown extends MonoDropdown_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
  private _hasBodySlotState;
  private _slotsCaptured;
  private _slotMain;
  private _slotBody;
  connectedCallback(): void;
  protected updated(changed: Map<string, unknown>): void;
  protected _activeMainNodes(): HTMLElement[];
  private _captureSlots;
  private _placeSlot;
  private _renderBody;
  protected render(): TemplateResult;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-dropdown': MonoDropdown;
  }
}
//#endregion
export {};