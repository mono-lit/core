/**
 * Card Component Type Definitions
 */
/**
 * Content scale of the card — padding, title and subtitle type, the header /
 * actions / subtitle gaps and the header icon box. The same 6-step scale
 * accordion, modal, drawer and the form controls use.
 *
 * It does **not** set the card's width or height. That is what the `width` /
 * `height` / `min-*` / `max-*` props (and `--mono-card-*`) are for, so a compact
 * `size="xs"` card can still be wide. Corner radius is the `shape` prop's job,
 * not this one.
 *
 * Before 2026-08-18 this was a 3-step density scale
 * (`'compact' | 'md' | 'comfortable'`) that only changed the padding; `compact`
 * is roughly `sm` and `comfortable` roughly `lg`.
 */
export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
/**
 * Visual style of the card.
 *
 * `'gradient'` was removed with the Basecoat port (2026-09): the design system
 * has no colour gradients. Use `'tonal'` for a tinted surface.
 */
export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'tonal' | 'glass';
export type CardColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'dark' | 'neutral' | 'light';
export type CardRounded = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
export type CardMediaPosition = 'top' | 'bottom';
/**
 * Per-element class overrides.
 *
 * Example:
 * cssClass={{
 *   root: 'my-card',
 *   header: 'my-card-header',
 *   body: 'my-card-body',
 *   actions: 'my-card-actions'
 * }}
 */
export interface CardCssClass {
    root?: string;
    media?: string;
    header?: string;
    icon?: string;
    headerContent?: string;
    title?: string;
    subtitle?: string;
    body?: string;
    actions?: string;
    footer?: string;
    loading?: string;
}
export interface CardProps {
    /**
     * Content scale — padding, type, gaps and the header icon. Not a dimension:
     * use `width` / `height` for that. See {@link CardSize}.
     */
    size?: CardSize;
    /** Visual style variant of the card. */
    variant?: CardVariant;
    /** Color theme of the card. */
    color?: CardColor;
    /** Corner radius of the card. */
    rounded?: CardRounded;
    /** Position of the media slot (top or bottom). */
    mediaPosition?: CardMediaPosition;
    'media-position'?: CardMediaPosition;
    mediaposition?: CardMediaPosition;
    /**
     * Title text shown in the card header. `slot="title"` replaces it, and
     * `slot="header"` replaces the icon, title and subtitle together.
     */
    title?: string;
    /** Subtitle text shown under the title. `slot="subtitle"` replaces it. */
    subtitle?: string;
    /** @deprecated Old name of `title`, still accepted. */
    heading?: string;
    /** @deprecated Old name of `subtitle`, still accepted. */
    subheading?: string;
    /** Adds a border around the card. */
    bordered?: boolean;
    /** Adds a hover elevation effect. */
    hoverable?: boolean;
    /** Makes the card interactive and clickable. */
    clickable?: boolean;
    /** Applies the selected highlight state. */
    selected?: boolean;
    /** Disables interaction and dims the card. */
    disabled?: boolean;
    /** Shows a loading overlay on the card. */
    loading?: boolean;
    /**
     * Explicit sizing. Each accepts a CSS length string (`"320px"`, `"80%"`) or a
     * number (interpreted as px). Use `width="100%"` for a full-width card.
     */
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    'min-width'?: string | number;
    maxWidth?: string | number;
    'max-width'?: string | number;
    minHeight?: string | number;
    'min-height'?: string | number;
    maxHeight?: string | number;
    'max-height'?: string | number;
    /** Shows a divider below the header. */
    headerDivider?: boolean;
    'header-divider'?: boolean;
    headerdivider?: boolean;
    /** Shows a divider above the footer. */
    footerDivider?: boolean;
    'footer-divider'?: boolean;
    footerdivider?: boolean;
    /** Renders the card as an anchor with this URL. */
    href?: string;
    /** Anchor target window when href is set. */
    target?: string;
    /** Accessible label text for screen readers. */
    ariaLabelText?: string;
    ariaLabel?: string;
    'aria-label'?: string;
    'aria-label-text'?: string;
    arialabel?: string;
    arialabeltext?: string;
    /** Per-element class overrides. */
    cssClass?: CardCssClass;
    'css-class'?: CardCssClass;
}
export interface CardClickEventDetail {
    originalEvent: MouseEvent | KeyboardEvent;
}
export type CardClickEvent = CustomEvent<CardClickEventDetail>;
export interface CardEvents {
    click: CardClickEvent;
    'mno-click': CardClickEvent;
    mnoClick: CardClickEvent;
}
