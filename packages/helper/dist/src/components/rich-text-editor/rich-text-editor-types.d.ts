import { VisibilityProps } from '../../composables/visibility';
import { CssSizeValue } from '../../composables/css-size';
export type RichTextEditorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type RichTextEditorColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export type RichTextEditorVariant = 'outlined' | 'filled' | 'underlined';
export type RichTextEditorValidationState = 'default' | 'valid' | 'invalid' | 'warning';
/** SunEditor's toolbar placement modes (`options.mode`). */
export type RichTextEditorMode = 'classic' | 'inline' | 'balloon' | 'balloon-always' | 'classic:bottom' | 'inline:bottom';
/**
 * A toolbar preset — `basic` (formatting essentials), `standard` (the default:
 * fonts, colours, tables, media, code view), `full` (every built-in button) or
 * `default` (SunEditor's own list, no plugin buttons).
 */
export type RichTextEditorToolbarPreset = 'basic' | 'standard' | 'full' | 'default';
/**
 * SunEditor's `buttonList`: groups of button names, `'|'` separators, `'/'` line
 * breaks and `-left` / `-right` / `-center` alignment markers.
 */
export type RichTextEditorButtonList = Array<string | string[]>;
/** What the `toolbar` prop accepts: a preset name, a `buttonList`, or its JSON. */
export type RichTextEditorToolbar = RichTextEditorToolbarPreset | RichTextEditorButtonList | string;
/**
 * What the `plugins` prop accepts: `'auto'` (every built-in, the default), an
 * array of plugin classes (`import { font, image } from 'suneditor/plugins'`),
 * an array of built-in plugin NAMES picked from the full set, or a `name → class`
 * object the way SunEditor itself takes them.
 */
export type RichTextEditorPlugins = 'auto' | 'none' | Array<string | RichTextEditorPluginClass> | Record<string, RichTextEditorPluginClass> | string;
/** A SunEditor plugin class — opaque to mono. */
export type RichTextEditorPluginClass = any;
/**
 * The parts of a SunEditor v3 instance mono relies on, typed structurally so a
 * consumer without the peer installed still gets a usable `editor` type. The
 * real instance carries far more — see SunEditor's own `types/`.
 */
export interface RichTextEditorInstance {
    $: {
        html: {
            get(options?: {
                withFrame?: boolean;
                includeFullPage?: boolean;
            }): string;
            set(html: string): void;
            add(html: string): void;
            insert(html: string, options?: Record<string, unknown>): void;
        };
        ui: {
            readOnly(value: boolean): void;
            disable(): void;
            enable(): void;
            setDir(dir: 'ltr' | 'rtl'): void;
        };
        focusManager: {
            focus(): void;
            blur(): void;
        };
        viewer: {
            codeView(value?: boolean): void;
            fullScreen(value?: boolean): void;
        };
        frameContext: {
            get(key: string): unknown;
        };
        [key: string]: unknown;
    };
    isEmpty(): boolean;
    resetOptions(options: Record<string, unknown>): void;
    destroy(): void;
    events: Record<string, unknown> | null;
    [key: string]: unknown;
}
/** SunEditor's `InitOptions` — passed through untouched, so it is left open. */
export type RichTextEditorOptions = Record<string, unknown>;
export interface RichTextEditorCssClass {
    root?: string;
    label?: string;
    required?: string;
    field?: string;
    footer?: string;
    messageWrap?: string;
    message?: string;
    counter?: string;
}
export type RichTextEditorModelEventDetail = {
    /** The editor's HTML, `''` when it holds no content. */
    modelValue: string;
    currentValue: string;
    oldValue: string;
    value: string;
    name?: string;
    /** SunEditor's own event payload (`{ $, frameContext, data, … }`). */
    sourceEvent?: unknown;
};
export type RichTextEditorModelEvent = CustomEvent<RichTextEditorModelEventDetail>;
export type RichTextEditorReadyEventDetail = {
    /** The live SunEditor instance — `el.editor` from here on. */
    editor: RichTextEditorInstance;
};
export type RichTextEditorErrorEventDetail = {
    /** Why the editor could not be built — typically the missing peer. */
    message: string;
    error: unknown;
};
export type RichTextEditorFocusEventDetail = {
    name?: string;
    sourceEvent?: unknown;
};
export interface RichTextEditorProps extends VisibilityProps {
    /** Two-way bound HTML. `''` for an empty editor. */
    modelValue?: string;
    'model-value'?: string;
    modelvalue?: string;
    /** HTML (kept in sync with modelValue). */
    value?: string;
    /** Form field name, carried on the events. */
    name?: string;
    /** Placeholder shown while the editor is empty. */
    placeholder?: string;
    /** Text label shown above the editor. */
    label?: string;
    /** Helper text shown below the editor. */
    helperText?: string;
    'helper-text'?: string;
    helpertext?: string;
    /** Validation state controlling the frame styling. */
    validationState?: RichTextEditorValidationState;
    'validation-state'?: RichTextEditorValidationState;
    validationstate?: RichTextEditorValidationState;
    /** Message shown for the current validation state. */
    validationMessage?: string;
    'validation-message'?: string;
    validationmessage?: string;
    /** Error message that forces the invalid state. */
    errorMessage?: string;
    'error-message'?: string;
    errormessage?: string;
    /** Success message that forces the valid state. */
    successMessage?: string;
    'success-message'?: string;
    successmessage?: string;
    /** Disables editing and the toolbar. */
    disabled?: boolean | string;
    /** Read-only: content shows, cannot be edited. */
    readonly?: boolean | string;
    /** Marks the label and lets `monoForm`'s `required` rule apply. */
    required?: boolean | string;
    /** Field size — scales the toolbar, icons and editing font. */
    size?: RichTextEditorSize;
    /** Accent colour for focus and active toolbar state. */
    color?: RichTextEditorColor;
    /** Frame variant. */
    variant?: RichTextEditorVariant;
    /** Toolbar placement: `classic` (default), `inline`, `balloon`, `balloon-always`, `classic:bottom`, `inline:bottom`. */
    mode?: RichTextEditorMode;
    /** Toolbar preset (`basic` | `standard` | `full` | `default`) or a SunEditor `buttonList` (bind with `.prop`, or JSON). */
    toolbar?: RichTextEditorToolbar;
    /** Plugins: `auto` (all built-ins, default), `none`, an array of plugin classes / names, or a name → class object. */
    plugins?: RichTextEditorPlugins;
    /** Language: a SunEditor language code (`ko`, `de`, `zh-CN`, …) loaded on demand, or a language object (`.prop`). */
    language?: string | Record<string, unknown>;
    /** Text direction of the CONTENT (the host's own `dir` is left to the page). */
    textDirection?: 'ltr' | 'rtl';
    'text-direction'?: 'ltr' | 'rtl';
    textdirection?: 'ltr' | 'rtl';
    /** Show SunEditor's character counter in the status bar. */
    charCounter?: boolean | string;
    'char-counter'?: boolean | string;
    charcounter?: boolean | string;
    /** Maximum number of characters (`charCounter_max`). */
    maxLength?: number | string;
    'max-length'?: number | string;
    maxlength?: number | string;
    /** Show the status bar (resize handle, path). Default `true`. */
    statusbar?: boolean | string;
    /** Sticky toolbar offset in px while the page scrolls (`toolbar_sticky`); unset = not sticky. */
    sticky?: number | string;
    /**
     * Whether the element loads SunEditor's own stylesheet (`suneditor/css/editor`)
     * the first time it renders. Default `true`. Set `false` when the app ships it.
     */
    loadCss?: boolean | string;
    'load-css'?: boolean | string;
    loadcss?: boolean | string;
    /** Raw SunEditor `InitOptions`, merged LAST over everything the props produce. Bind with `.prop`. */
    options?: RichTextEditorOptions;
    /** Class hooks per part. */
    cssClass?: RichTextEditorCssClass | string;
    'css-class'?: RichTextEditorCssClass | string;
    cssclass?: RichTextEditorCssClass | string;
    /** Explicit sizing of the whole field. */
    width?: CssSizeValue;
    /** Editing area height (SunEditor `height`, default `auto`). */
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    'min-width'?: CssSizeValue;
    minwidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    'max-width'?: CssSizeValue;
    maxwidth?: CssSizeValue;
    /** Editing area minimum height (SunEditor `minHeight`, default `10rem`). */
    minHeight?: CssSizeValue;
    'min-height'?: CssSizeValue;
    minheight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    'max-height'?: CssSizeValue;
    maxheight?: CssSizeValue;
    /** `aria-label` for the editing area (defaults to `label` / `placeholder`). */
    ariaLabel?: string;
    'aria-label'?: string;
    arialabel?: string;
}
export interface RichTextEditorEvents {
    input: RichTextEditorModelEvent;
    change: RichTextEditorModelEvent;
    focus: CustomEvent<RichTextEditorFocusEventDetail>;
    blur: CustomEvent<RichTextEditorFocusEventDetail>;
    ready: CustomEvent<RichTextEditorReadyEventDetail>;
    error: CustomEvent<RichTextEditorErrorEventDetail>;
    'mno-input': RichTextEditorModelEvent;
    mnoInput: RichTextEditorModelEvent;
    'mno-change': RichTextEditorModelEvent;
    mnoChange: RichTextEditorModelEvent;
    'mno-focus': CustomEvent<RichTextEditorFocusEventDetail>;
    mnoFocus: CustomEvent<RichTextEditorFocusEventDetail>;
    'mno-blur': CustomEvent<RichTextEditorFocusEventDetail>;
    mnoBlur: CustomEvent<RichTextEditorFocusEventDetail>;
    'mno-ready': CustomEvent<RichTextEditorReadyEventDetail>;
    mnoReady: CustomEvent<RichTextEditorReadyEventDetail>;
    'mno-error': CustomEvent<RichTextEditorErrorEventDetail>;
    mnoError: CustomEvent<RichTextEditorErrorEventDetail>;
}
