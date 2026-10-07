import { LitElement, nothing, TemplateResult } from 'lit';
import { TabsSize, TabsColor, TabsVariant, TabsOrientation, TabsCssClass, TabItem } from './tabs-types.js';
import { Constructor } from '../../composables/hybird-prop';
/**
 * Coerce any `items` input to a `TabItem[]`. Accepts an array (pass-through), a
 * JSON string (`items='[...]'` attribute, OR a string assigned to the PROPERTY —
 * which is what nuxt-ssr-lit does forwarding a Vue `:items="<json>"` binding to
 * the SSR renderer), or anything else (→ `[]`).
 */
export declare function coerceTabItems(value: unknown): TabItem[];
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoTabsCoreInterface {
    items: TabItem[];
    modelValue: string;
    value: string;
    size: TabsSize;
    color: TabsColor;
    variant: TabsVariant;
    orientation: TabsOrientation;
    disabled: boolean;
    cssClass: TabsCssClass;
    cssClassName: string;
    select(id: string): void;
    next(): void;
    previous(): void;
    focus(): void;
    blur(): void;
    protected _setCssClass(value: unknown): void;
    protected _cls(base: string, key: keyof TabsCssClass): string;
    /** Ref for the root each build renders — where the styling attributes go. */
    protected bindRoot: (el: Element | undefined) => void;
    protected _computeRootAttrs(): Record<string, string | null>;
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void;
    protected get _wrapperClasses(): string;
    protected _isActive(item: TabItem): boolean;
    protected _tabClasses(item: TabItem): string;
    protected _selectItem(item: TabItem, sourceEvent?: Event): void;
    protected _handleClick(item: TabItem, event: Event): void;
    protected _itemsForRender(): TabItem[];
    protected _useIconSlots(): boolean;
    protected _iconHasContent(id: string): boolean;
    protected _renderIcon(item: TabItem): TemplateResult | typeof nothing;
    protected _renderBadge(item: TabItem): TemplateResult | typeof nothing;
}
/**
 * `MonoTabsCore` — all render-mode-agnostic logic for `mono-tabs`: reactive props
 * (incl. the SSR `items` string→array coercion and `disabled` string→bool
 * coercion), hybrid aliases, camelCase attribute fallbacks, the `modelValue`↔
 * `value` sync, class computation, tab selection + `mno-click` events, keyboard
 * navigation, and the `role="tablist"` `render()`. Per-tab icons render through a
 * `_renderIcon()` hook: the light build uses `data-mono-slot` placeholders, the
 * shadow build native `<slot name="icon-<id>">` (mirrors `mono-breadcrumb`).
 *
 * SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`
 * (the host in light, the shadow root in shadow) and only matter client-side.
 */
export declare const MonoTabsCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTabsCoreInterface> & T;
