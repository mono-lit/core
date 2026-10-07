import { LitElement } from 'lit';
import { CardSize, CardVariant, CardColor, CardRounded, CardMediaPosition, CardCssClass } from './card-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { buildSizeStyle, CssSizeValue } from '../../composables/css-size';
type CardRootElement = HTMLDivElement | HTMLAnchorElement;
/** Slot regions the card lays out. `default` is the unnamed body region. */
export type CardSlotName = 'media' | 'icon' | 'title' | 'subtitle' | 'header' | 'actions' | 'footer' | 'default';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoCardCoreInterface {
    size: CardSize;
    variant: CardVariant;
    color: CardColor;
    rounded?: CardRounded;
    mediaPosition: CardMediaPosition;
    /** Header headline. `heading` is the old name, kept as an alias. */
    title: string;
    /** Header secondary line. `subheading` is the old name, kept as an alias. */
    subtitle: string;
    /** @deprecated alias of `title` */
    heading?: string;
    /** @deprecated alias of `subtitle` */
    subheading?: string;
    bordered: boolean;
    hoverable: boolean;
    clickable: boolean;
    selected: boolean;
    disabled: boolean;
    loading: boolean;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    headerDivider: boolean;
    footerDivider: boolean;
    href?: string;
    target?: string;
    ariaLabelText?: string;
    cssClass: CardCssClass;
    focus(): void;
    blur(): void;
    click(): void;
    protected _hasMedia: boolean;
    protected _hasIcon: boolean;
    protected _hasTitle: boolean;
    protected _hasSubtitle: boolean;
    protected _hasHeaderSlot: boolean;
    protected _hasActions: boolean;
    protected _hasFooter: boolean;
    protected _hasDefault: boolean;
    protected _cardElement?: CardRootElement;
    protected _cls(base: string, key: keyof CardCssClass): string;
    protected _sizeStyle(): ReturnType<typeof buildSizeStyle>;
    protected get _isInteractive(): boolean;
    protected get _isDisabled(): boolean;
    protected get _hasHeader(): boolean;
    protected get _cardClasses(): string;
    protected _handleClick(event: MouseEvent): void;
    protected _handleKeyDown(event: KeyboardEvent): void;
}
/**
 * `MonoCardCore` — all render-mode-agnostic logic for `mono-card`: reactive
 * props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
 * `@state`, class/getter computation, click/keyboard interactivity, and the
 * imperative `focus/blur/click`. No `render()` — the light build keeps its
 * `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
 * (each ships its own `render()`, mirroring `mono-input`).
 *
 * SSR-safe: no `document`/`window` access. `_cardElement` (`@query`) is lazy and
 * `focus/blur/click` + the `HTMLAnchorElement` check only run client-side.
 */
export declare const MonoCardCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoCardCoreInterface> & T;
export {};
