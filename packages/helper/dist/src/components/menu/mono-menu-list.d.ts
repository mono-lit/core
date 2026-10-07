import { LitElement, TemplateResult } from 'lit';
import { MenuItem, MenuBadgeColor, MonoMenuListType } from './menu-types.js';
export declare class MonoMenuList extends LitElement {
    protected createRenderRoot(): HTMLElement;
    /**
     * For normal list mode:
     *   <mono-menu-list :items.prop="items" />
     *
     * For direct single-row mode (one row built from element props):
     *   <mono-menu-list type="group" title="Sales" :items.prop="children" />
     *
     * For declarative composition (any depth, any HTML inside):
     *   <mono-menu-list type="group" title="Group">
     *     <mono-menu-list type="children" title="Item A"></mono-menu-list>
     *     <mono-menu-list type="group" title="Subgroup">…</mono-menu-list>
     *   </mono-menu-list>
     *
     * In single-row mode, this `items` array becomes the built item's `children`.
     */
    items: MenuItem[];
    /** New behavior: render exactly one menu row from a full object. */
    item?: MenuItem;
    /** Render mode / declarative MenuItem.type — see header doc. */
    type: MonoMenuListType;
    /** Direct single-row props. Legacy alias for `type` in declarative mode. */
    itemType?: MenuItem['type'];
    title: string;
    subtitle: string;
    icon: string;
    appendIcon: string;
    badge?: string | number;
    badgeColor?: MenuBadgeColor;
    href: string;
    disabled: boolean;
    defaultOpen: boolean;
    private _parent;
    private _parentList;
    private _rootList;
    private _nestedChildren;
    /** Captured DOM children, re-placed into [data-mono-slot="body"] after render. */
    private _capturedChildren;
    /** Idempotency guard — initial capture must run once per element lifetime,
     *  not again on reconnect (otherwise Lit's marker comments get hijacked). */
    private _childrenCaptured;
    /** Standalone group-open state — only honored on the root-most list. */
    private _standaloneOpen;
    private _childObserver;
    private readonly _autoId;
    connectedCallback(): void;
    disconnectedCallback(): void;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    protected updated(_changed: Map<PropertyKey, unknown>): void;
    getMenuItems(): MenuItem[];
    /** @internal called by a nested `<mono-menu-list>` from its connectedCallback. */
    _registerNestedChild(child: MonoMenuList): void;
    /** @internal */
    _unregisterNestedChild(child: MonoMenuList): void;
    /** Standalone (no `<mono-menu>`) group-open queries — root-most list owns the set. */
    isGroupOpenStandalone(id: string): boolean;
    /** Seed a default-open id into the standalone state set. */
    seedStandaloneOpen(id: string): void;
    toggleGroupStandalone(id: string): void;
    private _findRootList;
    private _captureInitialChildren;
    /**
     * Capture external Element children that landed on the host AFTER Lit's
     * most recent render — typically because a framework (Vue/React) inserted
     * nodes via `v-for`, `v-if`, etc. We deliberately skip non-Element nodes
     * (text / comment) because Lit places its own marker comments around the
     * rendered region and stealing those breaks the part graph.
     */
    private _captureExternalSiblings;
    private _setupChildObserver;
    private _placeBodySlot;
    private _hasCapturedChildren;
    private _hasDirectItemProps;
    /**
     * Declarative mode: `type` describes MenuItem.type and the body is composed
     * from captured DOM children instead of `items`.
     *
     * The order of the checks is the contract. Captured children win outright —
     * they ARE the body. An explicit `items` array comes next, and specifically
     * BEATS direct props: the previous order returned `true` as soon as any direct
     * prop was set, so `<mono-menu-list type="group" title="Sales" :items.prop="kids">`
     * — the single-row form documented in the class header and in `MenuListProps` —
     * landed in declarative mode. `_buildDeclarativeItem()` drops `items` on
     * purpose, so that row rendered an empty `[data-mono-slot="body"]` nothing was
     * ever placed into, and `_buildDirectItem()` (the one branch that does carry
     * `items`) was unreachable.
     *
     * It doubles as a safety net for the element form: a group whose DOM children
     * never made it into `_capturedChildren` now falls back to its `items` array
     * rather than rendering a chevron over an empty body.
     */
    private _isDeclarativeMode;
    private _typeAsMenuItemType;
    private _normalizeItem;
    private _buildDirectItem;
    private _buildDeclarativeItem;
    private _getEffectiveItems;
    private _seedDefaultOpenIntoParent;
    /**
     * A group is "active" while any descendant row is the selected one.
     * `renderMenuGroup` puts `.mono-menu-group.active` on such a header and
     * menu.css already styles it — the class simply never appeared, because
     * nothing supplied this callback.
     */
    private _hasSelectedDescendant;
    private _buildContext;
    private _renderSingleRow;
    private _seedDefaultOpenIntoStandalone;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-menu-list': MonoMenuList;
    }
}
