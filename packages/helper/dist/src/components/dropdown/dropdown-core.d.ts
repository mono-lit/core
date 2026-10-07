import { LitElement } from 'lit';
import { DropdownPlacement, DropdownTrigger, DropdownSize, DropdownColor, DropdownSource, DropdownCssClass } from './dropdown-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { PopupPortalController } from '../../composables/popup-portal';
/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoDropdownCoreInterface {
    placement: DropdownPlacement;
    trigger: DropdownTrigger;
    size: DropdownSize;
    color: DropdownColor;
    modelValue: boolean;
    disabled: boolean;
    flip: boolean;
    shift: boolean;
    offset: number;
    closeOnOutsideClick: boolean;
    closeOnEscape: boolean;
    cssClass: DropdownCssClass;
    cssClassName: string;
    show(source?: DropdownSource): void;
    hide(source?: DropdownSource): void;
    toggle(source?: DropdownSource): void;
    protected _cls(base: string, key: keyof DropdownCssClass): string;
    protected _computeHostClasses(): string[];
    protected _computeRootAttrs(): Record<string, string | null>;
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void;
    protected _updateHostClasses(): void;
    protected _activeMainNodes(): HTMLElement[];
    protected _syncTriggerListeners(): void;
    protected _positionPanel(): void;
    protected _popup: PopupPortalController;
}
export declare const MonoDropdownCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoDropdownCoreInterface> & T;
