/**
 * Accordion Component Type Definitions
 */
export type AccordionSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AccordionColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export interface AccordionCssClass {
    root?: string;
    head?: string;
    icon?: string;
    title?: string;
    /** The secondary line (`[mono-subtitle]`). The key keeps its original name. */
    description?: string;
    actions?: string;
    arrow?: string;
    body?: string;
}
export type AccordionClickEventDetail = {
    modelValue: boolean;
    currentValue: boolean;
    oldValue: boolean;
    value: boolean;
    sourceEvent?: Event;
};
export type AccordionClickEvent = CustomEvent<AccordionClickEventDetail>;
export interface AccordionProps {
    /**
     * Title text shown in the accordion header. `slot="title"` replaces it, and
     * `slot="header"` replaces the icon, title and subtitle together.
     */
    title?: string;
    /** Secondary text shown under the title. `slot="subtitle"` replaces it. */
    subtitle?: string;
    /** @deprecated Old name of `title`, still accepted. */
    label?: string;
    /** @deprecated Old name of `subtitle`, still accepted. */
    description?: string;
    /** Bound open state; true when the accordion is expanded. */
    modelValue?: boolean;
    'model-value'?: boolean;
    modelvalue?: boolean;
    /** Disables interaction and dims the accordion. */
    disabled?: boolean;
    /** Visual size of the accordion. */
    size?: AccordionSize;
    /** Color theme of the accordion. */
    color?: AccordionColor;
    /** Per-element class overrides. */
    cssClass?: AccordionCssClass;
    cssclass?: AccordionCssClass;
    'css-class'?: AccordionCssClass | string;
}
export interface AccordionEvents {
    toggle: AccordionClickEvent;
    open: AccordionClickEvent;
    close: AccordionClickEvent;
    'mno-click': AccordionClickEvent;
    mnoClick: AccordionClickEvent;
    'mno-open': AccordionClickEvent;
    mnoOpen: AccordionClickEvent;
    'mno-close': AccordionClickEvent;
    mnoClose: AccordionClickEvent;
}
