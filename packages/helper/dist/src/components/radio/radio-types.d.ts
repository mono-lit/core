import { VisibilityProps } from '../../composables/visibility';
export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type RadioColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export type RadioValue = string | number | boolean | null;
export interface RadioCssClass {
    root?: string;
    input?: string;
    circle?: string;
    dot?: string;
    label?: string;
    labelText?: string;
    description?: string;
}
export type RadioModelEventDetail<TValue = RadioValue> = {
    modelValue: TValue;
    currentValue: TValue;
    oldValue: TValue;
    value: TValue;
    checked: boolean;
    sourceEvent?: Event;
};
export type RadioModelEvent<TValue = RadioValue> = CustomEvent<RadioModelEventDetail<TValue>>;
export interface RadioProps extends VisibilityProps {
    /** The value this radio represents within its group. */
    value?: RadioValue;
    /** The currently selected value of the radio group. */
    modelValue?: RadioValue;
    'model-value'?: RadioValue;
    modelvalue?: RadioValue;
    /** Color theme applied to the radio. */
    color?: RadioColor;
    /** Visual size of the radio. */
    size?: RadioSize;
    /** Disables the radio, preventing selection. */
    disabled?: boolean;
    /** Text label shown beside the radio. */
    label?: string;
    /** Secondary line under the label. `slot="sublabel"` replaces it. */
    sublabel?: string;
    /** The same as `sublabel` — still accepted, both names share one value. */
    description?: string;
    /** Custom CSS classes applied to internal radio parts. */
    cssClass?: RadioCssClass;
    cssclass?: RadioCssClass;
    'css-class'?: RadioCssClass | string;
    /** Accessible label used when no visible label is present. */
    ariaLabelText?: string;
    ariaLabel?: string;
    'aria-label'?: string;
    'aria-label-text'?: string;
    arialabel?: string;
    arialabeltext?: string;
}
export interface RadioEvents {
    change: RadioModelEvent;
    'mno-change': RadioModelEvent;
    mnoChange: RadioModelEvent;
}
