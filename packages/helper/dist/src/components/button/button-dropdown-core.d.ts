import { LitElement, nothing, TemplateResult } from 'lit';
import { ButtonDropdownCssClass, ButtonDropdownItem } from './button-dropdown-types.js';
import { ButtonProps } from './button-types.js';
import { DropdownPlacement, DropdownSource } from '../dropdown/dropdown-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoButtonDropdownCoreInterface {
    buttons: ButtonDropdownItem[];
    min: number;
    placement: DropdownPlacement;
    offset: number;
    color?: ButtonProps['color'];
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    trigger?: ButtonProps & {
        label?: string;
        icon?: string;
    };
    modelValue: boolean;
    disabled: boolean;
    closeOnSelect: boolean;
    closeOnOutsideClick: boolean;
    closeOnEscape: boolean;
    cssClass: ButtonDropdownCssClass;
    show(source?: DropdownSource): void;
    hide(source?: DropdownSource): void;
    toggle(source?: DropdownSource): void;
    /** Whether the entries are currently behind the trigger rather than inline. */
    readonly collapsed: boolean;
    /** Tag of the button element to render — differs per build. */
    protected _buttonTag(): string;
    /** Whether entry content may be a Lit template (shadow only — see the impl). */
    protected _declarativeItems(): boolean;
    protected _cls(base: string, key: keyof ButtonDropdownCssClass): string;
    protected renderRow(): TemplateResult;
    /** The `⋮` trigger, or `nothing` while the entries are inline. */
    protected renderTrigger(): TemplateResult | typeof nothing;
    /** The menu rows — rendered INSIDE the panel each build writes itself. */
    protected renderMenuList(): TemplateResult;
    /**
     * The panel is deliberately NOT built here. `PopupPortalController` physically
     * moves it into a `<body>` portal, and a node inside a `${}` expression carries
     * a `ChildPart` range that breaks when its nodes are ejected ("this `ChildPart`
     * has no `parentNode`"). Each build writes the panel as a STATIC element in its
     * own template — the same arrangement `mono-dropdown` uses — and reads these.
     */
    protected readonly panelClass: string;
    protected readonly panelHidden: boolean;
    protected bindPanel: (el: Element | undefined) => void;
    /** Ref for the inner root each build renders — where the styling attributes go. */
    protected bindRoot: (el: Element | undefined) => void;
    protected _computeRootAttrs(): Record<string, string | null>;
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void;
    /** The `mono-item-color` an entry gets inside the menu (null = the panel's ink). */
    protected _itemColorAttr(item: ButtonDropdownItem): string | null;
}
export declare const MonoButtonDropdownCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoButtonDropdownCoreInterface> & T;
