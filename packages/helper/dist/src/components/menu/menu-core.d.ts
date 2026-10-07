import { LitElement, TemplateResult } from 'lit';
import { MenuItem, MenuDensity, MenuColor, MenuCssClass } from './menu-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { MenuRenderContext } from './menu-render.js';
/**
 * Minimal interface for descendant `<mono-menu-list>` instances. Avoids a
 * circular import — the real class is in `mono-menu-list.ts`.
 */
export interface MonoMenuListLike extends HTMLElement {
    requestUpdate(): void;
    getMenuItems?(): MenuItem[];
}
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoMenuCoreInterface {
    items: MenuItem[];
    modelValue: string | string[];
    multiple: boolean;
    density: MenuDensity;
    color: MenuColor;
    nav: boolean;
    selectable: boolean;
    disabled: boolean;
    controlled: boolean;
    cssClass: MenuCssClass;
    cssClassName: string;
    select(id: string): void;
    deselect(id: string): void;
    toggleGroup(id: string): void;
    expandGroup(id: string): void;
    collapseGroup(id: string): void;
    getActivePath(): MenuItem[];
    requestItemActivation(item: MenuItem, event?: Event): void;
    requestGroupToggle(group: MenuItem, event?: Event): void;
    isItemSelected(id: string): boolean;
    isGroupOpenPublic(id: string): boolean;
    getSlotIconNodes(id: string): Node[] | undefined;
    _registerListChild(child: MonoMenuListLike): void;
    _unregisterListChild(child: MonoMenuListLike): void;
    protected _openGroups: Set<string>;
    protected _slotIcons: Map<string, Node[]>;
    protected _listChildren: Set<MonoMenuListLike>;
    protected _seedDefaultOpenGroups(): void;
    protected _setCssClass(value: unknown): void;
    protected _cls(base: string, key: keyof MenuCssClass): string;
    protected _rootClasses: string;
    protected _isSelected(id: string): boolean;
    protected _isGroupOpen(id: string): boolean;
    protected _renderContext(): MenuRenderContext;
    protected _renderBody(): TemplateResult;
    protected _useIconSlots(): boolean;
    protected _chevronSvg(): TemplateResult | undefined;
    protected _handleItemActivation(item: MenuItem, event?: Event): void;
    protected _handleGroupToggle(group: MenuItem, event?: Event): void;
}
/**
 * `MonoMenuCore` — all render-mode-agnostic logic for `mono-menu`: reactive
 * props, hybrid aliases, css-class interop, selection + open-group state,
 * default-open seeding, the click/toggle/change events, the full public API, and
 * the chrome `render()` (which delegates the body to a `_renderBody()` hook).
 *
 * Leaves to each build: `createRenderRoot()`, the body strategy (light: slot
 * capture / declarative `slot="body"`; shadow: items-driven only), and
 * `_chevronSvg()` (light: undefined → UnoCSS icon span; shadow: inline SVG).
 */
export declare const MonoMenuCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoMenuCoreInterface> & T;
