import { LitElement } from 'lit';
import { BreadcrumbItem, BreadcrumbBadgeColor, BreadcrumbVariant, BreadcrumbSize, BreadcrumbColor } from './breadcrumb-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { BreadcrumbRenderContext } from './breadcrumb-render.js';
/** Public + shared-protected surface added by the list core mixin. */
export declare class MonoBreadcrumbListCoreInterface {
    items: BreadcrumbItem[];
    item?: BreadcrumbItem;
    title: string;
    href: string;
    icon: string;
    badge?: string | number;
    badgeColor?: BreadcrumbBadgeColor;
    current: boolean;
    disabled: boolean;
    variant: BreadcrumbVariant;
    size: BreadcrumbSize;
    color: BreadcrumbColor;
    separator: string;
    truncate: boolean;
    getBreadcrumbItems(): BreadcrumbItem[];
    protected readonly _autoId: string;
    protected _hasDirectItemProps(): boolean;
    protected _normalizeItem(item: Partial<BreadcrumbItem>): BreadcrumbItem;
    protected _buildDirectItem(): BreadcrumbItem;
    protected _getEffectiveItems(): BreadcrumbItem[];
    protected _itemsForRender(): BreadcrumbItem[];
    protected _useIconSlots(): boolean;
    protected _standaloneContext(): BreadcrumbRenderContext;
    protected _buildContext(): BreadcrumbRenderContext;
    protected _standaloneRootClasses(): string;
}
/**
 * `MonoBreadcrumbListCore` — render-mode-agnostic logic for the STANDALONE
 * `mono-breadcrumb-list`: reactive props (incl. the SSR `items` string→array
 * coercion), item resolution (`items` array / single `item` / direct single-row
 * props), the self-contained `<nav><ol>` render, and the `_useIconSlots()` /
 * `_itemsForRender()` hooks.
 *
 * The light build (`mono-breadcrumb-list.ts`) extends this and layers the
 * light-only CHILD composition (registering with a parent `<mono-breadcrumb>`
 * via `closest()` and rendering bare items). The shadow build
 * (`mono-breadcrumb-list.shadow.ts`) extends this for `@lit-labs/ssr`, rendering
 * standalone in one shadow root and overriding `_useIconSlots()`. Child mode is
 * a light-only feature (cross-element `closest()` can't work under SSR).
 *
 * SSR-safe: no `document`/`window` access.
 */
export declare const MonoBreadcrumbListCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoBreadcrumbListCoreInterface> & T;
