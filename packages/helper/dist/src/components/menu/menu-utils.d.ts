import { MenuItem, MenuProps } from './menu-types.js';
export { isIconifyClass } from '../../composables/icon.js';
export declare function isItem(node: MenuItem): boolean;
export declare function isGroup(node: MenuItem): boolean;
export declare function isDivider(node: MenuItem): boolean;
export declare function isSubheader(node: MenuItem): boolean;
/**
 * Walk the tree and collect the chain (root → leaf) leading to the item with
 * the given id. Returns an empty array if not found.
 */
export declare function findActivePath(items: MenuItem[], id: string): MenuItem[];
export declare function findItem(items: MenuItem[], id: string): MenuItem | null;
/**
 * Generate a 1–2 character alias from a menu item's title for the icon
 * fallback (used by `renderMenuIcon` when no `item.icon` and no slot icon are
 * provided). Each space-delimited word contributes its first character; output
 * is uppercased and capped at `max` characters.
 *
 * Examples:
 *   getMenuAlias('Dashboard')           → 'D'
 *   getMenuAlias('Post Budget')         → 'PB'
 *   getMenuAlias('Sales Order Report')  → 'SO'
 *   getMenuAlias('logbook')             → 'L'
 *   getMenuAlias('')                    → ''
 */
export declare function getMenuAlias(input: string | undefined | null, max?: number): string;
export declare function collectDefaultOpenGroups(items: MenuItem[]): string[];
export declare function generateMenuRootClasses(props: {
    density: string;
    color: string;
    nav: boolean;
    selectable: boolean;
    disabled: boolean;
    cssClassName?: string;
    rootExtra?: string;
}): string;
export declare function validateMenuProps(props: MenuProps): string[];
/**
 * The Basecoat styling attributes for the menu ROOT, mirroring the props one
 * for one. A prop at its DEFAULT emits nothing — `:not([mono-density])` is
 * comfortable and `:not([mono-color])` is primary — so the rendered DOM is
 * also the shortest hand-written markup that paints the same (see menu.css).
 * `nav` defaults to TRUE, so `mono-plain` is the attribute that says
 * something. Shared so `<mono-menu>` and a standalone `<mono-menu-list>`
 * cannot drift apart.
 */
export declare function menuRootAttrs(props: {
    density: string;
    color: string;
}): {
    density: string | null;
    color: string | null;
};
