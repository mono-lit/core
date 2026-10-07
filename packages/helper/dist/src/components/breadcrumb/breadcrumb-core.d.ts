import { LitElement, TemplateResult } from 'lit';
import { BreadcrumbItem, BreadcrumbVariant, BreadcrumbSize, BreadcrumbColor, BreadcrumbCssClass } from './breadcrumb-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { BreadcrumbRenderContext } from './breadcrumb-render.js';
/**
 * Minimal interface for descendant `<mono-breadcrumb-list>` instances. Avoids a
 * circular import — the real class is in `mono-breadcrumb-list.ts`.
 */
export interface MonoBreadcrumbListLike extends HTMLElement {
    requestUpdate(): void;
    getBreadcrumbItems?(): BreadcrumbItem[];
}
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoBreadcrumbCoreInterface {
    items: BreadcrumbItem[];
    modelValue: BreadcrumbItem | null;
    variant: BreadcrumbVariant;
    size: BreadcrumbSize;
    color: BreadcrumbColor;
    separator: string;
    truncate: boolean;
    disabled: boolean;
    ariaLabel: string | null;
    cssClass: BreadcrumbCssClass;
    cssClassName: string;
    select(id: string): void;
    focus(): void;
    requestItemActivation(item: BreadcrumbItem, index: number, event?: Event): void;
    isItemCurrent(id: string): boolean;
    getSlotIconNodes(id: string): Node[] | undefined;
    hasSeparatorSlot(): boolean;
    getSeparatorString(): string;
    _registerListChild(child: MonoBreadcrumbListLike): void;
    _unregisterListChild(child: MonoBreadcrumbListLike): void;
    protected _slotIcons: Map<string, Node[]>;
    protected _slotSeparator: Node[];
    protected _listChildren: Set<MonoBreadcrumbListLike>;
    protected _cls(base: string, key: keyof BreadcrumbCssClass): string;
    protected get _rootClasses(): string;
    protected _isCurrent(id: string): boolean;
    protected _setCssClass(value: unknown): void;
    protected _setModelValueFromAttribute(value: string | null): void;
    protected _handleItemActivation(item: BreadcrumbItem, index: number, event?: Event): void;
    protected _notifyListChildren(changed: Map<string, unknown>): void;
    protected _renderContext(): BreadcrumbRenderContext;
    protected _itemsForRender(): BreadcrumbItem[];
    protected _renderBody(): TemplateResult;
    protected _useIconSlots(): boolean;
}
/**
 * `MonoBreadcrumbCore` — all render-mode-agnostic logic for `mono-breadcrumb`:
 * reactive props (incl. the SSR `items` string→array coercion), hybrid aliases,
 * camelCase attribute fallbacks, the child-list registry + state propagation,
 * item activation + events, and the `<nav>` chrome `render()`. The light build
 * keeps its `[data-mono-slot]` capture (`slot="body"`/`separator`/`icon-*`) and
 * overrides `_renderBody()`; the shadow build renders the whole list from `items`
 * in one shadow root and overrides `_useIconSlots()` (mirrors `mono-menu`).
 *
 * SSR-safe: no `document`/`window` access except `focus()` (guarded by isServer).
 */
export declare const MonoBreadcrumbCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoBreadcrumbCoreInterface> & T;
