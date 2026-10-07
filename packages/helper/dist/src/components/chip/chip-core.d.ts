import { LitElement } from 'lit';
import { ChipSize, ChipColor, ChipVariant, ChipRounded, ChipIconPosition, ChipCssClass, ChipModelEventDetail } from './chip-types.js';
import { Constructor } from '../../composables/hybird-prop';
type ChipLikeElement = HTMLSpanElement | HTMLAnchorElement;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoChipCoreInterface {
    size: ChipSize;
    color: ChipColor;
    variant: ChipVariant;
    rounded?: ChipRounded;
    label?: string;
    dot: boolean;
    removable: boolean;
    clickable: boolean;
    disabled: boolean;
    modelValue: boolean;
    selected: boolean;
    href?: string;
    target?: string;
    iconPosition: ChipIconPosition;
    ariaLabelText?: string;
    closeLabel: string;
    cssClass: ChipCssClass;
    focus(): void;
    blur(): void;
    click(): void;
    protected _isActive: boolean;
    protected _hasIcon: boolean;
    protected _chipElement?: ChipLikeElement;
    protected _toBoolean(value: unknown): boolean;
    protected _cls(base: string, key: keyof ChipCssClass): string;
    protected get _chipClasses(): string;
    protected get _isInteractive(): boolean;
    protected _createModelDetail(args: {
        modelValue: boolean;
        oldValue: boolean;
        sourceEvent?: Event;
    }): ChipModelEventDetail;
    protected _handleClick(event: MouseEvent): void;
    protected _handleKeyDown(event: KeyboardEvent): void;
    protected _handleFocus(): void;
    protected _handleBlur(): void;
    protected _handleClose(event: MouseEvent): void;
}
/**
 * `MonoChipCore` — all render-mode-agnostic logic for `mono-chip`: reactive
 * props, hybrid aliases (incl. the `ariaLabel`/`aria-label`/`arialabel` →
 * `ariaLabelText` getters), camelCase attribute fallbacks, the `modelValue`↔
 * `selected` sync + SSR boolean coercion in `willUpdate`, class computation,
 * click/keyboard/close interactivity (`mno-click`/`mno-close`), and the imperative
 * `focus/blur/click`. No `render()` — the light build keeps its `[data-mono-slot]`
 * capture strategy and the shadow build uses native `<slot>` (mirrors `mono-button`).
 *
 * SSR-safe: no `document`/`window` access; `_chipElement` (`@query`) is lazy and
 * `focus/blur/click` only run client-side.
 */
export declare const MonoChipCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoChipCoreInterface> & T;
export {};
