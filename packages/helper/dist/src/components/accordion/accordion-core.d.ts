import { LitElement } from 'lit';
import { AccordionSize, AccordionColor, AccordionCssClass } from './accordion-types.js';
import { Constructor } from '../../composables/hybird-prop';
/**
 * Slot regions the accordion lays out. `default` is the unnamed body region.
 * `title` / `subtitle` are canonical; `label` / `description` are their old
 * names, still accepted (the canonical name wins when both are given).
 * `header` replaces the title + subtitle text as a whole.
 */
export type AccordionSlotName = 'title' | 'subtitle' | 'label' | 'description' | 'header' | 'icon' | 'actions' | 'default';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoAccordionCoreInterface {
    size: AccordionSize;
    color: AccordionColor;
    /** Header headline. `label` is the old name, kept as an alias. */
    title: string;
    /** Header secondary line. `description` is the old name, kept as an alias. */
    subtitle: string;
    /** @deprecated alias of `title` */
    label: string;
    /** @deprecated alias of `subtitle` */
    description: string;
    modelValue: boolean;
    disabled: boolean;
    cssClass: AccordionCssClass;
    cssClassName: string;
    toggle(): void;
    expand(): void;
    collapse(): void;
    focus(): void;
    blur(): void;
    protected _hasTitleSlotState: boolean;
    protected _hasSubtitleSlotState: boolean;
    protected _hasHeaderSlotState: boolean;
    protected _hasIconSlotState: boolean;
    protected _hasActionsSlotState: boolean;
    protected _hasBodySlotState: boolean;
    protected _headEl?: HTMLButtonElement;
    protected _cls(base: string, key: keyof AccordionCssClass): string;
    protected get _wrapperClasses(): string;
    /** Ref for the root each build renders — where the styling attributes go. */
    protected bindRoot: (el: Element | undefined) => void;
    protected _computeRootAttrs(): Record<string, string | null>;
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void;
    protected get _hasTitleContent(): boolean;
    protected get _hasSubtitleContent(): boolean;
    protected get _hasIconContent(): boolean;
    protected _setCssClass(value: unknown): void;
    protected _handleClick(event: Event): void;
}
/**
 * `MonoAccordionCore` — all render-mode-agnostic logic for `mono-accordion`:
 * reactive props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
 * `@state`, class/getter computation, click/toggle interactivity, and the
 * imperative `focus/blur`. No `render()` — the light build keeps its
 * `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
 * (each ships its own `render()`, mirroring `mono-card`).
 *
 * SSR-safe: no `document`/`window` access. `_headEl` (`@query`) is lazy and
 * `focus/blur` only run client-side.
 */
export declare const MonoAccordionCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoAccordionCoreInterface> & T;
