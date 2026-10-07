import { LitElement, TemplateResult } from 'lit';
import { ButtonSize, ButtonColor, ButtonVariant, ButtonRounded, ButtonIconPosition, ButtonBadgeColor, ButtonCssClass, ButtonAffixProps, ButtonHandler } from './button-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { buildSizeStyle, CssSizeValue } from '../../composables/css-size';
import { DebounceConfig, RateLimitOption, ThrottleConfig } from '../../composables/rate-limit';
type ButtonLikeElement = HTMLButtonElement | HTMLAnchorElement;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoButtonCoreInterface {
    size: ButtonSize;
    color: ButtonColor;
    variant: ButtonVariant;
    rounded?: ButtonRounded;
    disabled: boolean;
    loading: boolean;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    href?: string;
    target?: string;
    type: 'button' | 'submit' | 'reset';
    iconPosition: ButtonIconPosition;
    prepend: ButtonAffixProps;
    append: ButtonAffixProps;
    badge?: string;
    badgeColor: ButtonBadgeColor;
    iconOnly: boolean;
    glass: boolean;
    tooltip?: string;
    ariaLabelText?: string;
    cssClass: ButtonCssClass;
    throttle?: RateLimitOption<ThrottleConfig>;
    debounce?: RateLimitOption<DebounceConfig>;
    handler?: ButtonHandler;
    noAutoLoading: boolean;
    focus(): void;
    blur(): void;
    click(): void;
    cancelPending(): void;
    protected _hasIcon: boolean;
    protected _hasPrepend: boolean;
    protected _hasAppend: boolean;
    /** The affix config for one side, always an object. */
    protected _affix(name: 'prepend' | 'append'): ButtonAffixProps;
    /** Whether that affix is inert — follows `disabled`, never `loading`. */
    protected _affixDisabled(name: 'prepend' | 'append'): boolean;
    protected _isActive: boolean;
    protected _buttonElement?: ButtonLikeElement;
    protected _cls(base: string, key: keyof ButtonCssClass): string;
    protected _toBoolean(value: unknown): boolean;
    protected _sizeStyle(): ReturnType<typeof buildSizeStyle>;
    protected get _hasSize(): boolean;
    protected _defaultIsEmpty(): boolean;
    protected get _isIconOnlyLike(): boolean;
    protected get _buttonClasses(): string;
    protected _renderWrapper(inner: TemplateResult, style?: unknown): TemplateResult;
    protected get _badgeClass(): string;
    protected get _badgeColor(): string;
    protected get _ariaLabel(): string | undefined;
    /** Spinner visibility: the `loading` prop OR either self-driven phase. */
    protected get _effectiveLoading(): boolean;
    /** Where the spinner is drawn: in the icon position, whatever triggered loading. */
    protected get _showsSpinner(): boolean;
    /** A click does nothing observable (covers the wait as well as the work). */
    protected get _isBlocked(): boolean;
    /** The native `disabled` attribute — `_isBlocked` minus the wait. */
    protected get _isInert(): boolean;
    protected _handleClick(event: MouseEvent): void;
    protected _handleKeyDown(event: KeyboardEvent): void;
    protected _handleFocus(): void;
    protected _handleBlur(): void;
}
/**
 * `MonoButtonCore` — all render-mode-agnostic logic for `mono-button`: reactive
 * props, hybrid aliases, the camelCase attribute fallbacks, the slot-presence
 * `@state` (`_hasIcon`), class/getter computation, sizing, click/keyboard
 * interactivity, and the imperative `focus/blur/click`. No `render()` — the light
 * build keeps its `[data-mono-slot]` capture strategy and the shadow build uses
 * native `<slot>` (each ships its own `render()`, mirroring `mono-card`).
 *
 * The `rounded="full"` auto-"icon-only when empty" refinement depends on light-DOM slot
 * introspection, so it lives behind the `_defaultIsEmpty()` hook (defaults to
 * `false` here; the light build overrides it). SSR-safe: no `document`/`window`
 * access; `_buttonElement` (`@query`) is lazy and `focus/blur/click` only run
 * client-side.
 */
export declare const MonoButtonCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoButtonCoreInterface> & T;
export {};
