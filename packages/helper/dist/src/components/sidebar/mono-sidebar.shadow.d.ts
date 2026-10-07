import { LitElement, TemplateResult } from 'lit';
import { SidebarSlotName } from './sidebar-core.js';
declare const MonoSidebarShadow_base: import('../../composables/hybird-prop').Constructor<import('./sidebar-core.js').MonoSidebarCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-sidebar` (SSR build, `@mono-lit/helper/ui/shadow/sidebar`).
 *
 * Real shadow root + `static styles` (the `:host`-adapted sheet), so
 * `@lit-labs/ssr` serializes it to Declarative Shadow DOM. Slotting uses native
 * `<slot>`; the chevron icon is inline SVG (the global `.mono-icon`/`i-mdi-*`
 * UnoCSS icon can't reach a shadow root).
 *
 * Caveat: sidebar CSS that targets slotted `<mono-menu>` descendants (the
 * rail-collapse-to-icons rules) cannot reach into slotted light-DOM content from
 * a shadow root — those rules are inert here. The core covers that path instead
 * by publishing `data-rail-collapsed` on the host, which `<mono-menu>` mirrors
 * via MutationObserver (see `menu-core.ts` `_setupRailSync`).
 *
 * Shares all logic with the light build via `MonoSidebarCore`. Both register
 * `mono-sidebar`, so a document loads only one build.
 */
export declare class MonoSidebarShadow extends MonoSidebarShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    protected renderSlot(name: SidebarSlotName): TemplateResult;
    protected renderIcon(_name: 'chevron'): TemplateResult;
}
export {};
