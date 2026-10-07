import { LitElement, TemplateResult } from 'lit';
import { DrawerPosition, DrawerSize, DrawerColor, DrawerSource, DrawerCssClass } from './drawer-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { MonoAutoFullscreen } from '../../composables/breakpoints';
import { PopupLayer } from '../../composables/popup-stack';
/**
 * Named slots projected by `mono-drawer` (light: captured; shadow: native).
 *
 * `header` replaces the heading COLUMN — title + subtitle — and beats the
 * `title` / `subtitle` slots and props. The close ✕ always stays. `foot` is
 * accepted as an alias of `footer`.
 */
export type DrawerSlotName = 'header' | 'title' | 'subtitle' | 'body' | 'footer';
/**
 * `MonoDrawerCore` — render-mode-agnostic logic for `mono-drawer`: props/hybrid
 * aliases, the open/close model (`show`/`hide`/`toggle` + `mno-*` events), the
 * `PopupLayer` surface (shared z-stack / scroll-lock / topmost-Escape via the
 * SSR-safe `popup-stack`), resizeable-edge logic, and the shared drawer markup
 * (`_renderDrawerBody`). SSR-safe: `popup-stack` no-ops server-side and the
 * `window`/resize access is `isServer`-guarded. Mirrors `modal-core.ts`.
 *
 * Each build supplies the render root + slot/icon strategy:
 *  - light (`mono-drawer.ts`): a `<body>` portal that IS the `.mono-drawer` root,
 *    `data-mono-slot` placeholders, UnoCSS `.i-mdi-close`.
 *  - shadow (`mono-drawer.shadow.ts`): a real shadow root with an inner
 *    `.mono-drawer` root, native `<slot>`s, inline-SVG ✕.
 */
export declare const MonoDrawerCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoDrawerCoreInterface> & T;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoDrawerCoreInterface implements PopupLayer {
    position: DrawerPosition;
    size: DrawerSize;
    color: DrawerColor;
    title: string;
    subtitle: string;
    modelValue: boolean;
    dismissible: boolean;
    persistent: boolean;
    overlay: boolean;
    closeOnEscape: boolean;
    closeOnOverlay: boolean;
    lockScroll: boolean;
    resizeable: boolean;
    autoFullscreen: MonoAutoFullscreen;
    stackable: boolean;
    zIndex?: number;
    width?: string | number;
    height?: string | number;
    cssClass: DrawerCssClass;
    cssClassName: string;
    show(source?: DrawerSource, sourceEvent?: Event): void;
    hide(source?: DrawerSource, sourceEvent?: Event): void;
    toggle(source?: DrawerSource, sourceEvent?: Event): void;
    get lockBodyScroll(): boolean;
    get hasBackdrop(): boolean;
    get pinnedZ(): number | undefined;
    onStackEscape(event: KeyboardEvent): void;
    setStackZ(z: number, isTopBackdrop: boolean): void;
    protected _slotsCaptured: boolean;
    protected _hasHeaderSlotState: boolean;
    protected _hasTitleSlotState: boolean;
    protected _hasSubtitleSlotState: boolean;
    protected get _headingState(): {
        title: boolean;
        subtitle: boolean;
        heading: boolean;
    };
    protected get _headingIdBase(): string;
    protected _headingAria(): {
        labelledby?: string;
        describedby?: string;
    };
    protected _hasBodySlotState: boolean;
    protected _hasFooterSlotState: boolean;
    protected _drawerZ: number;
    protected get _effectiveZ(): number;
    protected _panelEl?: HTMLElement;
    protected get _isMonoDrawer(): boolean;
    protected _computeDrawerClasses(): string[];
    protected _setCssClass(value: unknown): void;
    protected _cls(base: string, key: keyof DrawerCssClass): string;
    protected _computeRootAttrs(): Record<string, string | null>;
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void;
    protected bindRoot: (el: Element | undefined) => void;
    /** The shadow build's inner root, bound by `bindRoot`. */
    protected _rootEl: HTMLElement | null;
    protected _toBoolean(value: unknown): boolean;
    protected _applyOpenSideEffects(): void;
    protected _releaseSideEffects(): void;
    protected _setDrawerSizeVar(name: string, value: string): void;
    protected _removeDrawerSizeVar(name: string): void;
    protected _onResizeStart: (event: PointerEvent) => void;
    protected _renderDrawerBody(): TemplateResult;
    protected get _slotsAlwaysRender(): boolean;
    protected _hasSlot(name: DrawerSlotName): boolean;
    protected _setSlotState(name: DrawerSlotName, has: boolean): void;
    protected _slotOutlet(name: DrawerSlotName, fallback?: unknown): TemplateResult;
    protected renderIcon(name: 'close'): TemplateResult;
}
