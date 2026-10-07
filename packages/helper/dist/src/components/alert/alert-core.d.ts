import { LitElement, nothing, TemplateResult } from 'lit';
import { AlertColor, AlertCssClass, AlertSize, AlertVariant } from './alert-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Regions the alert lays out. `body` also takes the unslotted children. */
export type AlertSlotName = 'icon' | 'title' | 'subtitle' | 'body';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoAlertCoreInterface {
    /** The headline. */
    title: string;
    /** The line under the title. */
    subtitle: string;
    /** Leading icon — an iconify class or plain text. */
    icon: string;
    color: AlertColor;
    variant: AlertVariant;
    size: AlertSize;
    /** Show the ✕ that hides the alert. */
    clearable: boolean;
    /** Same as `clearable`. */
    closeable: boolean;
    clearLabel: string;
    cssClass: AlertCssClass;
    protected _hasIconSlot: boolean;
    protected _hasTitleSlot: boolean;
    protected _hasSubtitleSlot: boolean;
    protected _hasBodySlot: boolean;
    protected _cls(base: string, key: keyof AlertCssClass): string;
    protected get _showsIcon(): boolean;
    protected get _showsTitle(): boolean;
    protected get _showsSubtitle(): boolean;
    protected _renderIconGlyph(): TemplateResult | typeof nothing;
    protected _renderMain(): unknown;
}
/**
 * `MonoAlertCore` — everything both builds share: props (with the `closeable`
 * alias), the ✕ that hides the alert, and the root template. The regions are
 * one overridable hook, `_renderMain()`: the light build fills `[data-mono-slot]`
 * placeholders, the shadow build uses native `<slot>`s.
 *
 * The alert emits NO events of its own. `@click` on it is the browser's click;
 * the ✕ only hides the element (the native `hidden` attribute), and stops its
 * own click so a listener on the alert does not fire for it.
 *
 * SSR-safe: no `document`/`window` access.
 */
export declare const MonoAlertCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoAlertCoreInterface> & T;
