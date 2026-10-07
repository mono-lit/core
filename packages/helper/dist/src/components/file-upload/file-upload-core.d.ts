import { LitElement, TemplateResult } from 'lit';
import { FileUploadCssClass, FileUploadItem, FileUploadValidationState, FileUploadVariant } from './file-upload-types.js';
import { Constructor } from '../../composables/hybird-prop';
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoFileUploadCoreInterface {
    label: string;
    helperText: string;
    /** Dropzone headline. `placeholder` is the old name, kept as an alias. */
    title: string;
    /** Dropzone secondary line. `subtext` is the old name, kept as an alias. */
    subtitle: string;
    /** @deprecated alias of `title` */
    placeholder: string;
    /** @deprecated alias of `subtitle` */
    subtext: string;
    icon: string;
    removeIcon: string;
    accept: string;
    multiple: boolean;
    disabled: boolean;
    required: boolean;
    dragdrop: boolean;
    maxFileSize: number;
    maxFiles: number;
    modelValue: FileUploadItem[];
    cssClass: FileUploadCssClass;
    variant: FileUploadVariant;
    validationState: FileUploadValidationState;
    validationMessage: string;
    clear(): void;
    protected _hasIconSlot: boolean;
    protected _hasTitleSlot: boolean;
    protected _hasSubtitleSlot: boolean;
    protected _inputEl: HTMLInputElement;
    protected _cls(base: string, key: keyof FileUploadCssClass): string;
    protected get _wrapperClasses(): string;
    protected get _subtitleClasses(): string;
    protected _useIconSlots(): boolean;
    protected _renderDropzoneIcon(): TemplateResult;
    protected _renderTitle(): TemplateResult;
    protected _renderSubtitle(): TemplateResult;
    protected _renderDefaultGlyph(): TemplateResult;
    protected _renderRemoveIcon(): TemplateResult;
    protected _renderThumbGlyph(item: FileUploadItem): TemplateResult;
}
/**
 * `MonoFileUploadCore` — all render-mode-agnostic logic for `mono-file-upload`:
 * reactive props (incl. SSR boolean + modelValue-array coercion), hybrid aliases,
 * camelCase attribute fallbacks, the file pipeline (validate / add / drag-drop /
 * remove / clear), the `mno-change`/`mno-remove`/`mno-error` events, and the
 * dropzone/list/message `render()`. Icon rendering goes through overridable hooks
 * (`_renderDropzoneIcon`/`_renderDefaultGlyph`/`_renderRemoveIcon`/
 * `_renderThumbGlyph`) — the light build keeps `data-mono-slot` + `i-mdi-*` iconify
 * classes; the shadow build uses native `<slot>` + inline SVG (iconify can't paint
 * inside a shadow root).
 *
 * SSR-safe: no `document`/`window` access at module/ctor scope; the file pipeline
 * and `_inputEl` (`@query`) only run client-side from user interaction.
 */
export declare const MonoFileUploadCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoFileUploadCoreInterface> & T;
