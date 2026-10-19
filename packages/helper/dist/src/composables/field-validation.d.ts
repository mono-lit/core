import { ReactiveController, ReactiveControllerHost, TemplateResult, nothing } from "lit";
//#region src/composables/field-validation.d.ts
export type FieldValidationPosition = 'bottom' | 'icon' | 'float';
/** The normalized state painted on the icon / bubbles. */
export type FieldValidationTone = 'invalid' | 'warning' | 'valid';
export interface FieldValidationRead {
  position: FieldValidationPosition | string | undefined;
  /** The component's own state name (`invalid` / `error` / `warning` / `valid` / `success` / `default`). */
  state: string | undefined;
  /** The validation message; empty → nothing moves. */
  text: string | undefined | null;
  /** While the control's own popup (dropdown, calendar) is open the float bubble stays closed. */
  suppressed?: boolean;
}
export interface FieldValidationNotice {
  position: 'icon' | 'float';
  tone: FieldValidationTone;
  text: string;
}
export declare class FieldValidationController implements ReactiveController {
  private readonly host;
  private readonly read;
  private readonly getBox;
  private readonly _iconBubble;
  private readonly _floatBubble;
  private _hovered;
  private _focused;
  constructor(host: ReactiveControllerHost & HTMLElement, read: () => FieldValidationRead, getBox: () => Element | null | undefined);
  /** The message that moved out of the bottom row, or `null` (bottom mode / no text). */
  get notice(): FieldValidationNotice | null;
  /** True when the bottom row should show the helper and keep the validation text sr-only. */
  get moved(): boolean;
  hostConnected(): void;
  hostDisconnected(): void;
  hostUpdated(): void;
  /** Re-evaluate the float bubble — for popups the host opens without a re-render (date's calendar). */
  refresh(): void;
  /**
   * `icon` mode: the state icon for inside the box (before the clear button /
   * actions). `anchored` wraps it in a zero-height `[mono-validation-anchor]`
   * — for the textarea, whose box can't hold children.
   */
  renderIcon(options?: {
    anchored?: boolean;
  }): TemplateResult | typeof nothing;
  /** `float` mode: the bubble that floats under the box while the field is hovered or focused. */
  renderFloat(): TemplateResult | typeof nothing;
  /** Light build: UnoCSS mask icons; shadow build: inline SVG (page icon CSS can't reach a shadow root). */
  private _glyph;
  /** Touch has no hover: a tap shows the tip — and must not open / focus the control underneath. */
  private _onIconClick;
  private _onEnter;
  private _onLeave;
  private _onFocusIn;
  private _onFocusOut;
  private _syncFloat;
}
//#endregion