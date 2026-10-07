import { nothing, TemplateResult } from 'lit';
import { MenuCssClass, MenuItem } from './menu-types.js';
export interface MenuRenderContext {
    multiple: boolean;
    selectable: boolean;
    disabled: boolean;
    cssClass: MenuCssClass;
    isSelected(id: string): boolean;
    isGroupOpen(id: string): boolean;
    getSlotIconNodes(id: string): Node[] | undefined;
    onItemClick(item: MenuItem, event: Event): void;
    onGroupToggle(group: MenuItem, event: Event): void;
    /**
     * When `true`, group/item bodies are rendered as an empty
     * `<ul class="mono-menu-list" data-mono-slot="body">` placeholder instead of
     * recursing into `item.items`. The host element re-attaches captured DOM
     * children into that slot in `updated()`, allowing arbitrary declarative
     * nesting. Defaults to `false` (the existing items-array behaviour).
     */
    bodySlot?: boolean;
    /**
     * Inline chevron markup for the group expand/collapse affordance. The light
     * build leaves this undefined → the UnoCSS `.mono-icon i-mdi-chevron-right`
     * span is rendered (resolved by global CSS). The shadow build passes an inline
     * SVG here, because that utility class can't resolve inside a shadow root.
     */
    chevronSvg?: TemplateResult;
    /**
     * Mark a group as the ancestor of the currently-selected item, so it gets the
     * `active` accent on its header (`.mono-menu-group.active`). Optional — when
     * absent, groups never get the ancestor-active class (legacy behaviour).
     */
    isGroupActive?(group: MenuItem): boolean;
    /**
     * Render iconify-class icons (`i-mdi-…`) as a native `<slot name="icon-<id>">`
     * instead of a `<span class="i-…">`. The shadow build sets this and supplies
     * matching LIGHT-DOM `<span slot="icon-<id>">` children, so the page's global
     * UnoCSS styles them (utility classes can't resolve inside a shadow root).
     * Default (light build) keeps the inline class span.
     */
    iconSlot?: boolean;
}
export declare function renderMenuIcon(item: MenuItem, ctx: MenuRenderContext): TemplateResult | typeof nothing;
export declare function renderMenuBadge(item: MenuItem, ctx: MenuRenderContext): TemplateResult | typeof nothing;
export declare function renderMenuAppend(item: MenuItem, ctx: MenuRenderContext): TemplateResult | typeof nothing;
export declare function renderMenuItemRow(item: MenuItem, ctx: MenuRenderContext): TemplateResult;
export declare function renderMenuGroup(group: MenuItem, ctx: MenuRenderContext): TemplateResult;
export declare function renderMenuDivider(item: MenuItem, ctx: MenuRenderContext): TemplateResult;
export declare function renderMenuSubheader(item: MenuItem, ctx: MenuRenderContext): TemplateResult;
export declare function renderMenuList(list: MenuItem[], ctx: MenuRenderContext): TemplateResult[];
/**
 * Render only the group rows from `list` — non-group items are skipped.
 * Used by `<mono-menu-list type="group">`.
 */
export declare function renderMenuGroupsOnly(list: MenuItem[], ctx: MenuRenderContext): TemplateResult[];
