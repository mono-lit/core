import { nothing, TemplateResult } from 'lit';
import { BreadcrumbCssClass, BreadcrumbItem } from './breadcrumb-types.js';
export interface BreadcrumbRenderContext {
    cssClass: BreadcrumbCssClass;
    separator: string;
    hasSeparatorSlot: boolean;
    disabled: boolean;
    /**
     * Shadow build: render per-item icons through a native `<slot name="icon-<id>">`
     * (the element creates matching light-DOM `<span slot>` children styled by the
     * page's global UnoCSS — `i-…` classes can't paint inside a shadow root). The
     * light build leaves this falsy and uses `data-mono-slot` + inline `i-…` spans.
     */
    iconSlot?: boolean;
    isCurrent(id: string): boolean;
    getSlotIconNodes(id: string): Node[] | undefined;
    onItemClick(item: BreadcrumbItem, index: number, event: Event): void;
}
export declare function renderBreadcrumbIcon(item: BreadcrumbItem, ctx: BreadcrumbRenderContext): TemplateResult | typeof nothing;
export declare function renderBreadcrumbBadge(item: BreadcrumbItem, ctx: BreadcrumbRenderContext): TemplateResult | typeof nothing;
export declare function renderBreadcrumbItemRow(item: BreadcrumbItem, index: number, ctx: BreadcrumbRenderContext): TemplateResult;
export declare function renderBreadcrumbSeparator(ctx: BreadcrumbRenderContext, index: number): TemplateResult;
export declare function renderBreadcrumbList(items: BreadcrumbItem[], ctx: BreadcrumbRenderContext): TemplateResult[];
/**
 * Render items with a leading separator BEFORE each item — used when the child
 * `<mono-breadcrumb-list>` is composed inside a parent `<mono-breadcrumb>` and
 * we don't know whether this child is the first sibling. The very first
 * separator is hidden via CSS:
 *   `.mono-breadcrumb-list > mono-breadcrumb-list:first-child > .mono-breadcrumb-sep:first-child { display: none; }`
 */
export declare function renderBreadcrumbItemsLeadingSep(items: BreadcrumbItem[], ctx: BreadcrumbRenderContext, startIndex?: number): TemplateResult[];
