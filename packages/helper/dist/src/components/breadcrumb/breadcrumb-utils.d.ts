import { BreadcrumbItem, BreadcrumbProps } from './breadcrumb-types.js';
export { isIconifyClass } from '../../composables/icon.js';
/**
 * Coerce any `items` input to a `BreadcrumbItem[]`. Accepts an array (pass-through),
 * a JSON string (`items='[...]'` attribute, or a string assigned to the PROPERTY —
 * which is what nuxt-ssr-lit does when forwarding a Vue `:items="<json>"` binding
 * to the SSR renderer), or anything else (→ `[]`).
 */
export declare function coerceItems(value: unknown): BreadcrumbItem[];
export declare function findItem(items: BreadcrumbItem[], id: string): BreadcrumbItem | null;
export declare function findItemIndex(items: BreadcrumbItem[], id: string): number;
/**
 * Resolve which breadcrumb item is the "current" segment.
 * Priority: explicit `modelValue` → first item with `current: true` → last item.
 */
export declare function resolveCurrentId(items: BreadcrumbItem[], modelValue: BreadcrumbItem | null): string;
export declare function generateBreadcrumbRootClasses(props: {
    variant: string;
    size: string;
    color: string;
    truncate: boolean;
    disabled: boolean;
    cssClassName?: string;
    rootExtra?: string;
}): string;
export declare function validateBreadcrumbProps(props: BreadcrumbProps): string[];
/**
 * The Basecoat styling attributes for the breadcrumb ROOT, mirroring the props
 * one for one. A prop at its DEFAULT emits nothing — `:not([mono-size])` is md,
 * `:not([mono-color])` is primary, `:not([mono-variant])` is default — so the
 * rendered DOM is also the shortest hand-written markup that paints the same
 * (see breadcrumb.css). Shared so `<mono-breadcrumb>` and a standalone
 * `<mono-breadcrumb-list>` cannot drift apart.
 */
export declare function breadcrumbRootAttrs(props: {
    variant: string;
    size: string;
    color: string;
}): {
    size: string | null;
    color: string | null;
    variant: string | null;
};
