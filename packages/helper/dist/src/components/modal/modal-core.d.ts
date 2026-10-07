import { LitElement, TemplateResult } from 'lit';
import { StyleInfo } from 'lit/directives/style-map.js';
import { ModalSize, ModalColor, ModalSource, ModalCssClass } from './modal-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { PopupLayer } from '../../composables/popup-stack';
import { MonoAutoFullscreen } from '../../composables/breakpoints';
/**
 * Named slots projected by `mono-modal` (light: captured; shadow: native).
 *
 * These are the INTERNAL region names. Consumers may also write `slot="header"`
 * and `slot="footer"` — the drawer's vocabulary — which alias `head` and `foot`.
 * When both spellings are supplied for the same region **the alias wins**; the
 * losing nodes are parked and never rendered.
 *
 * `head` (`header`) replaces the heading COLUMN — title + subtitle — and beats
 * the `title` / `subtitle` slots and props. The close ✕ always stays.
 */
export type ModalSlotName = 'head' | 'title' | 'subtitle' | 'body' | 'foot';
type ModalSizeValue = string | number | undefined;
/**
 * `MonoModalCore` — render-mode-agnostic logic for `mono-modal`: props/hybrid
 * aliases, the open/close model (`show`/`hide`/`toggle` + `mno-*` events), the
 * `PopupLayer` surface (shared z-stack / scroll-lock / topmost-Escape via the
 * SSR-safe `popup-stack`), draggable-header logic, sizing, and the shared modal
 * markup (`_renderModalBody`). SSR-safe: `popup-stack` no-ops server-side and the
 * `window`/drag access is `isServer`-guarded.
 *
 * Each build supplies the render root + slot/icon strategy:
 *  - light (`mono-modal.ts`): renders into a `<body>` portal that IS the
 *    `.mono-modal` root, `data-mono-slot` placeholders, UnoCSS `.i-mdi-close`.
 *  - shadow (`mono-modal.shadow.ts`): a real shadow root with an inner
 *    `.mono-modal` root, native `<slot>`s, inline-SVG ✕ (mirrors dropdown).
 */
export declare const MonoModalCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoModalCoreInterface> & T;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoModalCoreInterface implements PopupLayer {
    size: ModalSize;
    color: ModalColor;
    title: string;
    subtitle: string;
    modelValue: boolean;
    dismissible: boolean;
    persistent: boolean;
    overlay: boolean;
    closeOnEscape: boolean;
    closeOnOverlay: boolean;
    lockScroll: boolean;
    draggable: boolean;
    stackable: boolean;
    autoFullscreen: MonoAutoFullscreen;
    cssClass: ModalCssClass;
    cssClassName: string;
    width?: ModalSizeValue;
    height?: ModalSizeValue;
    minWidth?: ModalSizeValue;
    maxWidth?: ModalSizeValue;
    minHeight?: ModalSizeValue;
    maxHeight?: ModalSizeValue;
    zIndex?: number;
    show(source?: ModalSource, sourceEvent?: Event): void;
    hide(source?: ModalSource, sourceEvent?: Event): void;
    toggle(source?: ModalSource, sourceEvent?: Event): void;
    get lockBodyScroll(): boolean;
    get hasBackdrop(): boolean;
    get pinnedZ(): number | undefined;
    onStackEscape(event: KeyboardEvent): void;
    setStackZ(z: number, isTopBackdrop: boolean): void;
    protected _slotsCaptured: boolean;
    protected _hasHeadSlotState: boolean;
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
    protected _hasFootSlotState: boolean;
    protected _modalZ: number;
    protected get _effectiveZ(): number;
    protected _panelEl?: HTMLElement;
    protected get _isMonoModal(): boolean;
    protected get _isFullscreen(): boolean;
    protected _panelSizeStyle(): StyleInfo;
    protected _computeModalClasses(): string[];
    protected _setCssClass(value: unknown): void;
    protected _cls(base: string, key: keyof ModalCssClass): string;
    protected _computeRootAttrs(): Record<string, string | null>;
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void;
    protected bindRoot: (el: Element | undefined) => void;
    /** The shadow build's inner root, bound by `bindRoot` — it re-applies the
     *  state attributes from its own `updated()`. */
    protected _rootEl: HTMLElement | null;
    protected _toBoolean(value: unknown): boolean;
    protected _applyOpenSideEffects(): void;
    protected _releaseSideEffects(): void;
    protected _onHeaderPointerDown: (event: PointerEvent) => void;
    protected _renderModalBody(): TemplateResult;
    protected get _slotsAlwaysRender(): boolean;
    protected _hasSlot(name: ModalSlotName): boolean;
    protected _setSlotState(name: ModalSlotName, has: boolean): void;
    protected _slotOutlet(name: ModalSlotName, fallback?: unknown): TemplateResult;
    protected renderIcon(name: 'close'): TemplateResult;
}
export {};
