import { Constructor } from "../../composables/hybird-prop.js";
import { MonoNavCoreInterface, NavSlotName } from "./nav-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/nav/mono-nav.shadow.d.ts
declare const MonoNavShadow_base: Constructor<MonoNavCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-nav` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/nav`).
 *
 * Renders into a real shadow root (no `createRenderRoot` override), so:
 *  - `@lit-labs/ssr` can serialize it to Declarative Shadow DOM on the server,
 *  - styles are scoped via `static styles` (the `:host`-adapted nav sheet),
 *  - slotting uses native `<slot>` instead of the light build's capture hack.
 *
 * Shares ALL behavior with the light build via `MonoNavCore`. Both register the
 * SAME `mono-nav` tag, so a given document must load only one of the two builds
 * (see plan/2026-06-23-shadow-dom-ssr-mixin-spike.md).
 */
export declare class MonoNavShadow extends MonoNavShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
  protected renderSlot(slotName: NavSlotName): TemplateResult;
}
//#endregion
export {};