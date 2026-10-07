/**
 * Breadcrumb Component Type Definitions
 */
export type BreadcrumbVariant = 'default' | 'contained' | 'underlined';
export type BreadcrumbSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type BreadcrumbColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark' | 'surface';
export type BreadcrumbBadgeColor = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';
export interface BreadcrumbItem {
    id: string;
    title?: string;
    href?: string;
    icon?: string;
    badge?: string | number;
    badgeColor?: BreadcrumbBadgeColor;
    /** Marks this item as the current/last segment. If unset, the final array entry is treated as current. */
    current?: boolean;
    disabled?: boolean;
}
export interface BreadcrumbCssClass {
    root?: string;
    list?: string;
    item?: string;
    itemCurrent?: string;
    itemDisabled?: string;
    action?: string;
    icon?: string;
    content?: string;
    title?: string;
    badge?: string;
    separator?: string;
}
export type BreadcrumbClickEventDetail = {
    value: string;
    item: BreadcrumbItem;
    index: number;
    sourceEvent?: Event;
};
export type BreadcrumbClickEvent = CustomEvent<BreadcrumbClickEventDetail>;
export type BreadcrumbChangeEventDetail = {
    modelValue: BreadcrumbItem | null;
    currentValue: BreadcrumbItem | null;
    oldValue: BreadcrumbItem | null;
    sourceEvent?: Event;
};
export type BreadcrumbChangeEvent = CustomEvent<BreadcrumbChangeEventDetail>;
export interface BreadcrumbProps {
    /** List of breadcrumb segments to render. */
    items?: BreadcrumbItem[];
    /** Two-way bound currently selected breadcrumb item. */
    modelValue?: BreadcrumbItem | null;
    'model-value'?: BreadcrumbItem | null;
    modelvalue?: BreadcrumbItem | null;
    /** Visual style of the breadcrumb. */
    variant?: BreadcrumbVariant;
    /** Size of the breadcrumb. */
    size?: BreadcrumbSize;
    /** Color theme of the breadcrumb. */
    color?: BreadcrumbColor;
    /** Separator character shown between segments. */
    separator?: string;
    /** Truncates long segment titles with an ellipsis. */
    truncate?: boolean;
    /** Disables interaction with all segments. */
    disabled?: boolean;
    /** Per-part class overrides for styling internal elements. */
    cssClass?: BreadcrumbCssClass;
    cssclass?: BreadcrumbCssClass;
    'css-class'?: BreadcrumbCssClass | string;
    /** Extra class applied to the root element. */
    cssClassName?: string;
}
export interface BreadcrumbEvents {
    change: BreadcrumbChangeEvent;
    click: BreadcrumbClickEvent;
    'mno-change': BreadcrumbChangeEvent;
    mnoChange: BreadcrumbChangeEvent;
    'mno-click': BreadcrumbClickEvent;
    mnoClick: BreadcrumbClickEvent;
}
/**
 * `<mono-breadcrumb-list>` mirrors `<mono-menu-list>`'s dual mode:
 *   - List mode: `<mono-breadcrumb-list :items.prop="items" />`.
 *   - Single-row mode (for `v-for`): pass row-level props directly
 *     (`title`, `href`, `icon`, `current`, …) and the component normalises them
 *     into a one-entry list.
 */
export interface BreadcrumbListProps {
    /** List of breadcrumb segments to render. */
    items?: BreadcrumbItem[];
    /** A single breadcrumb item to render. */
    item?: BreadcrumbItem;
    /** Direct single-row props. */
    title?: string;
    /** Link target for this segment. */
    href?: string;
    /** Icon name shown before the segment title. */
    icon?: string;
    /** Badge text or count shown on the segment. */
    badge?: string | number;
    /** Color theme of the segment badge. */
    badgeColor?: BreadcrumbBadgeColor;
    'badge-color'?: BreadcrumbBadgeColor;
    /** Marks this segment as the current one. */
    current?: boolean;
    /** Disables interaction with this segment. */
    disabled?: boolean;
    /** Standalone styling — only used when there is no parent `<mono-breadcrumb>`. */
    variant?: BreadcrumbVariant;
    /** Size of the breadcrumb when standalone. */
    size?: BreadcrumbSize;
    /** Color theme of the breadcrumb when standalone. */
    color?: BreadcrumbColor;
    /** Separator character shown between segments when standalone. */
    separator?: string;
    /** Truncates long segment titles when standalone. */
    truncate?: boolean;
}
