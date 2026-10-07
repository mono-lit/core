import { VisibilityProps } from '../../composables/visibility';
export type SwitchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type SwitchColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export interface SwitchCssClass {
    root?: string;
    input?: string;
    track?: string;
    thumb?: string;
    label?: string;
    labelText?: string;
    description?: string;
}
export type SwitchModelEventDetail = {
    modelValue: boolean;
    currentValue: boolean;
    oldValue: boolean;
    checked: boolean;
    value?: string;
    name?: string;
    sourceEvent?: Event;
};
export type SwitchModelEvent = CustomEvent<SwitchModelEventDetail>;
export interface SwitchProps extends VisibilityProps {
    /** Two-way bound on/off state of the switch. */
    modelValue?: boolean;
    'model-value'?: boolean;
    modelvalue?: boolean;
    /** Whether the switch is checked (kept in sync with modelValue). */
    checked?: boolean;
    /** Color theme of the switch. */
    color?: SwitchColor;
    /** Size of the switch. */
    size?: SwitchSize;
    /** Disables interaction with the switch. */
    disabled?: boolean;
    /** Shows a loading state and blocks interaction. */
    loading?: boolean;
    /** Text label shown next to the switch. */
    label?: string;
    /** Secondary line under the label. `slot="sublabel"` replaces it. */
    sublabel?: string;
    /** The same as `sublabel` — still accepted, both names share one value. */
    description?: string;
    /** Value submitted with the form when checked. */
    value?: string;
    /** Form field name for the underlying input. */
    name?: string;
    /** Accessible label for screen readers. */
    ariaLabelText?: string;
    ariaLabel?: string;
    'aria-label'?: string;
    'aria-label-text'?: string;
    arialabel?: string;
    arialabeltext?: string;
    /** Per-part class overrides for styling internal elements. */
    cssClass?: SwitchCssClass;
    cssclass?: SwitchCssClass;
    'css-class'?: SwitchCssClass | string;
}
export interface SwitchEvents {
    change: SwitchModelEvent;
    'mno-change': SwitchModelEvent;
    mnoChange: SwitchModelEvent;
}
