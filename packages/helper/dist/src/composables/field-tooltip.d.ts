import { MonoTooltipOptions } from "../components/tooltip/tooltip-types.js";
import { ReactiveController, ReactiveControllerHost, TemplateResult, nothing } from "lit";
//#region src/composables/field-tooltip.d.ts
/** What the `tooltip` prop accepts: plain text, or full tooltip options. */
export type FieldTooltipValue = string | MonoTooltipOptions | null | undefined | false;
/** @internal — tests: forget the cached probe so a re-mocked peer is probed again. */
export declare function resetFieldTooltipProbe(): void;
/** `string` → `{ content }`; anything without content → `null` (renders nothing). */
export declare function normalizeFieldTooltip(value: FieldTooltipValue): MonoTooltipOptions | null;
/** A click on the bubble is still inside the `<label>` and the icon: neither should react. */
export declare const stopBubbleClick: (e: Event) => void;
export declare class FieldTooltipController implements ReactiveController {
  private readonly host;
  private readonly read;
  private _fn;
  private _ctrl;
  private _el;
  /** The options last handed to the controller — keys dropped since get blanked. */
  private _applied;
  /** The raw prop value behind `_applied` — a string re-normalizes to a new object every time. */
  private _raw;
  private _connected;
  /** The built-in bubble behind a plain-text tooltip. */
  private readonly _bubble;
  constructor(host: ReactiveControllerHost & {
    readonly renderRoot?: Node;
  }, read: () => FieldTooltipValue);
  hostConnected(): void;
  hostDisconnected(): void;
  hostUpdated(): void;
  /** The ⓘ for the end of the label row, or `nothing`. */
  render(): TemplateResult | typeof nothing;
  /**
   * Plain text: the icon carries its own bubble. `aria-describedby` reads the
   * text to screen readers on focus; hover, focus or a tap shows it, Escape
   * dismisses it, and the pointer may move onto it without it closing.
   */
  private _renderSimple;
  /**
   * Light build: the UnoCSS `i-mdi-information-outline` mask (shipped in
   * `ui/index.css`). Shadow build: the same path inline — the page's icon CSS
   * cannot reach a shadow root.
   */
  private _icon;
  private _ensureProbe;
  private _setEl;
  private _sync;
  private _unbind;
  /** Touch has no hover: a tap shows it, and it closes when focus leaves. */
  private _onIconClick;
}
//#endregion