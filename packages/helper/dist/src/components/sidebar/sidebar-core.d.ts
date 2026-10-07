import { LitElement, TemplateResult } from 'lit';
import { SidebarMode, SidebarLocation, SidebarDensity, SidebarColor, SidebarVariant, SidebarSource, SidebarCssClass } from './sidebar-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Slot regions the sidebar lays out. `body` is the default (unnamed) region. */
export type SidebarSlotName = 'header' | 'body' | 'footer';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoSidebarCoreInterface {
    modelValue: boolean;
    mode: SidebarMode;
    location: SidebarLocation;
    density: SidebarDensity;
    color: SidebarColor;
    variant: SidebarVariant;
    width: number;
    railWidth: number;
    expandOnHover: boolean;
    rail: boolean | null;
    contained: boolean;
    persistent: boolean;
    closeOnEscape: boolean;
    closeOnScrim: boolean;
    lockScroll: boolean;
    showScrim: boolean;
    cssClass: SidebarCssClass;
    cssClassName: string;
    open(source?: SidebarSource, sourceEvent?: Event): void;
    hide(source?: SidebarSource, sourceEvent?: Event): void;
    close(source?: SidebarSource, sourceEvent?: Event): void;
    toggle(source?: SidebarSource, sourceEvent?: Event): void;
    expandRail(): void;
    collapseRail(): void;
    protected _setCssClass(value: unknown): void;
    protected _cls(base: string, key: keyof SidebarCssClass): string;
    protected renderSlot(name: SidebarSlotName): TemplateResult;
    protected renderIcon(name: 'chevron'): TemplateResult;
}
/**
 * `MonoSidebarCore` — all render-mode-agnostic logic for `mono-sidebar`:
 * reactive props, hybrid aliases, mode resolution (auto→permanent/temporary via
 * the breakpoint), layout-var side effects, scroll-lock/escape side effects,
 * open/close state + events, and the chrome `render()`.
 *
 * SSR-safe: every `document`/`window` path is guarded by `isServer` (lit) — NOT
 * `typeof document/window`, which is unreliable under @lit-labs/ssr (it defines
 * both on the server).
 *
 * Leaves to each build: `createRenderRoot()`, the slot strategy, `renderSlot()`
 * (light: empty + capture into `[data-mono-slot]`; shadow: native `<slot>`), and
 * `renderIcon()` (light: `.mono-icon` UnoCSS icon; shadow: inline SVG).
 */
export declare const MonoSidebarCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoSidebarCoreInterface> & T;
