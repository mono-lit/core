import { LitElement, TemplateResult } from 'lit';
import { RichTextEditorColor, RichTextEditorCssClass, RichTextEditorInstance, RichTextEditorMode, RichTextEditorOptions, RichTextEditorPlugins, RichTextEditorSize, RichTextEditorToolbar, RichTextEditorValidationState, RichTextEditorVariant } from './rich-text-editor-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
/** Named slots projected by `mono-rich-text-editor` (light: captured; shadow: native). */
export type RichTextEditorSlotName = 'label' | 'helper';
/**
 * `MonoRichTextEditorCore` — render-mode-agnostic logic for `mono-rich-text-editor`,
 * a form field whose input is a [SunEditor](https://suneditor.com) v3 instance.
 *
 * **The peer is optional.** `suneditor` is externalized from mono's build and
 * loaded the first time an element renders (`rich-text-editor-loader.ts`). An
 * app that has not installed it gets an inline message naming the package and
 * the command, plus an `mno-error` event — never a crash.
 *
 * **The editor's DOM lives in LIGHT DOM, in both builds.** SunEditor is styled by
 * one global stylesheet and parks its modals in a `.sun-editor-carrier-wrapper`
 * on `<body>`, so neither could ever be adopted into a shadow root. The core
 * therefore creates ONE mount node (`.mono-rich-text-editor-mount`) and each
 * build decides where it shows: the light build re-homes it into the rendered
 * field frame, the shadow build keeps it as a light child projected through
 * `<slot name="editor">`. Either way it inherits the `--se-*` theme remap the
 * frame declares, and the page sheet reaches it. SSR renders the chrome only —
 * an editor is client state, exactly like `mono-chart` and `mono-date`.
 *
 * **Lifecycle mirrors `date-core`.** `_ensureEditor()` is idempotent and runs
 * from `firstUpdated`, `connectedCallback` and every `updated()` that finds no
 * instance, so a `v-if` / `<KeepAlive>` round trip rebuilds the editor instead
 * of leaving a dead field. A build token plus an `isConnected` re-check after
 * every `await` keeps a superseded build from constructing an editor on a
 * detached node that nothing would ever destroy. `disconnectedCallback`
 * destroys BEFORE `super` so the DOM is still in the tree.
 *
 * **Value model.** `modelValue` is the HTML. SunEditor → element: `onChange`
 * emits `mno-change`, `onInput` emits `mno-input` (the textarea detail shape),
 * an empty editor is published as `''` so `required` means what it says.
 * Element → editor: an outside `modelValue` write reaches `$.html.set()` only
 * when it differs from the last value the editor itself produced — no caret
 * jumps, no echo. `monoForm` binds through {@link MonoFormControlCore} exactly
 * as `mono-textarea` does.
 */
export declare const MonoRichTextEditorCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoRichTextEditorCoreInterface> & T;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoRichTextEditorCoreInterface {
    size: RichTextEditorSize;
    color: RichTextEditorColor;
    variant: RichTextEditorVariant;
    modelValue: string;
    value: string;
    name: string;
    placeholder: string;
    label: string;
    helperText: string;
    validationState: RichTextEditorValidationState;
    validationMessage: string;
    errorMessage: string;
    successMessage: string;
    ariaLabelText?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    cssClass: RichTextEditorCssClass;
    cssClassName: string;
    mode: RichTextEditorMode;
    toolbar?: RichTextEditorToolbar;
    plugins?: RichTextEditorPlugins;
    language?: string | Record<string, unknown>;
    textDirection?: 'ltr' | 'rtl';
    charCounter: boolean;
    maxLength?: number;
    statusbar: boolean;
    sticky?: number;
    loadCss: boolean;
    options?: RichTextEditorOptions;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    readonly editor: RichTextEditorInstance | null;
    getHtml(): string;
    setHtml(html: string): void;
    insertHtml(html: string): void;
    getText(): string;
    isEmpty(): boolean;
    focus(): void;
    blur(): void;
    codeView(value?: boolean): void;
    fullScreen(value?: boolean): void;
    protected _hasLabelSlotState: boolean;
    protected _hasHelperSlotState: boolean;
    protected _mount?: HTMLDivElement;
    protected get _slotsAlwaysRender(): boolean;
    protected get _useNativeSlots(): boolean;
    protected _setSlotState(name: RichTextEditorSlotName, has: boolean): void;
    protected _slotOutlet(name: RichTextEditorSlotName, fallback?: unknown): TemplateResult;
    protected _renderEditorOutlet(fieldClass: string): TemplateResult;
    protected _placeMount(): void;
}
