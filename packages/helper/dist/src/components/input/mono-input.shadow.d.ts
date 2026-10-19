import { Constructor } from "../../composables/hybird-prop.js";
import { InputIconName, MonoInputCoreInterface } from "./input-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/input/mono-input.shadow.d.ts
declare const MonoInputShadow_base: Constructor<MonoInputCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-input` (SSR build, `@mono-lit/helper/ui/shadow/input`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped. Slotting uses native `<slot>`.
 *
 * Slot-presence note: during SSR the element has no light children, so it can't
 * know which slots are filled. Both server and client therefore DEFAULT every
 * `_has…SlotState` to `false` (so hydration matches), render the slot wrappers
 * with `mono-empty` (hidden by input.css), then correct presence
 * after hydration in `firstUpdated()` (Declarative Shadow DOM assigns slotted
 * content at parse time, so `slotchange` does NOT fire after upgrade — we scan
 * `assignedNodes()` directly; `slotchange` is kept for later dynamic changes).
 * `<slot name="label|helper">` carries the prop text (`label`/`helperText`) as
 * native fallback so it shows with no JS.
 *
 * Shares all logic with the light build via `MonoInputCore`. Both register
 * `mono-input`, so a document loads only one build.
 */
export declare class MonoInputShadow extends MonoInputShadow_base {
  static styles: import("lit").CSSResult[];
  firstUpdated(changed: Map<string, unknown>): void;
  private _slotHasContent;
  private _setSlotState;
  private _onSlotChange;
  protected renderIcon(name: InputIconName): TemplateResult;
  private _renderLabel;
  private _renderHelper;
  private _renderHelperText;
  protected render(): TemplateResult;
  connectedCallback(): void;
}
//#endregion
export {};