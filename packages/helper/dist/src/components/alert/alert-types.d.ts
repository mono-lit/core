/** Scale step. `md` is Basecoat's alert; the rest scale it (see alert.css). */
export type AlertSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
/** The same four looks as mono-button. `outline` is Basecoat's alert. */
export type AlertVariant = 'outline' | 'solid' | 'tonal' | 'text';
export type AlertColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
/** Extra classes per part (`cssClass`), e.g. `{ title: 'font-bold' }`. */
export interface AlertCssClass {
    root?: string;
    icon?: string;
    title?: string;
    subtitle?: string;
    body?: string;
    clear?: string;
}
export interface AlertProps {
    /** The headline. `slot="title"` replaces it. */
    title?: string;
    /** The line under the title. `slot="subtitle"` replaces it. */
    subtitle?: string;
    /**
     * The leading icon: an iconify class (`i-mdi-information-outline`) or plain
     * text (an emoji, a letter). `slot="icon"` replaces it.
     */
    icon?: string;
    /** Colour role. `neutral` (default) is Basecoat's plain alert. */
    color?: AlertColor;
    /** `outline` (default, Basecoat's look), `tonal`, `solid` or `text`. */
    variant?: AlertVariant;
    /** Scale step, `xs` → `xxl`. Default `md`. */
    size?: AlertSize;
    /**
     * Show a ✕ that hides the alert (it sets the element's own `hidden`
     * attribute). The ✕ stays when `slot="body"` replaces the rest.
     */
    clearable?: boolean;
    /** Same as `clearable`. */
    closeable?: boolean;
    /** Accessible name of the ✕. Default `'Close'`. */
    clearLabel?: string;
    'clear-label'?: string;
    /** Extra classes per part. */
    cssClass?: AlertCssClass;
    'css-class'?: AlertCssClass;
}
