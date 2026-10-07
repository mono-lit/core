import { VisibilityProps } from '../../composables/visibility';
export type FileUploadVariant = 'default' | 'compact';
export type FileUploadValidationState = 'default' | 'valid' | 'invalid' | 'warning';
export type FileUploadAction = 'add' | 'remove' | 'replace' | 'clear';
/**
 * Per-element class overrides. Each key maps to one of the rendered internal
 * elements; the supplied class string is appended to the element's base class.
 */
export interface FileUploadCssClass {
    root?: string;
    label?: string;
    required?: string;
    dropzone?: string;
    icon?: string;
    title?: string;
    /** The secondary dropzone line. */
    subtitle?: string;
    /** @deprecated Old key of `subtitle`, still applied to the same element. */
    subtext?: string;
    input?: string;
    list?: string;
    item?: string;
    thumb?: string;
    file?: string;
    name?: string;
    meta?: string;
    remove?: string;
    message?: string;
}
export interface FileUploadItem {
    id: string;
    file?: File;
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
}
export type FileUploadModelEventDetail = {
    modelValue: FileUploadItem[];
    currentValue: FileUploadItem[];
    oldValue: FileUploadItem[];
    files: FileUploadItem[];
    addedFiles: FileUploadItem[];
    removedFile?: FileUploadItem;
    action: FileUploadAction;
    sourceEvent?: Event;
};
export type FileUploadRemoveEventDetail = {
    modelValue: FileUploadItem[];
    currentValue: FileUploadItem[];
    oldValue: FileUploadItem[];
    files: FileUploadItem[];
    removedFile: FileUploadItem;
    action: 'remove';
    sourceEvent?: Event;
};
export type FileUploadErrorEventDetail = {
    message: string;
    reason: 'max-file-size' | 'max-files';
    file?: File;
    maxFileSize?: number;
    maxFiles?: number;
    sourceEvent?: Event;
};
export type FileUploadModelEvent = CustomEvent<FileUploadModelEventDetail>;
export type FileUploadRemoveEvent = CustomEvent<FileUploadRemoveEventDetail>;
export type FileUploadErrorEvent = CustomEvent<FileUploadErrorEventDetail>;
export interface FileUploadProps extends VisibilityProps {
    /** Field label shown above the dropzone. */
    label?: string;
    /** Helper text shown below the dropzone. */
    helperText?: string;
    'helper-text'?: string;
    helpertext?: string;
    /**
     * Primary prompt text inside the dropzone. `slot="title"` replaces it.
     * Default `'Klik atau seret file ke sini'`.
     */
    title?: string;
    /**
     * Secondary hint text inside the dropzone. `slot="subtitle"` replaces it.
     * Default `'Pilih file untuk diunggah'`.
     */
    subtitle?: string;
    /** @deprecated Old name of `title`, still accepted. */
    placeholder?: string;
    /** @deprecated Old name of `subtitle`, still accepted. */
    subtext?: string;
    /** Accepted file types for the file input. */
    accept?: string;
    /**
     * Dropzone icon. An iconify utility class (e.g. `i-mdi-cloud-upload`) renders
     * the icon; any other string renders as text/emoji. A `slot="icon"` child
     * takes priority over this prop.
     */
    icon?: string;
    /** Remove (✕) button icon — iconify class or text. */
    removeIcon?: string;
    'remove-icon'?: string;
    removeicon?: string;
    /** Allows selecting multiple files at once. */
    multiple?: boolean;
    /** Disables interaction and dims the component. */
    disabled?: boolean;
    /** Marks the field as required with an indicator. */
    required?: boolean;
    /** Enables drag-and-drop file selection. */
    dragdrop?: boolean;
    /** Maximum allowed size per file, in bytes. */
    maxFileSize?: number;
    'max-file-size'?: number;
    maxfilesize?: number;
    /** Maximum number of files allowed. */
    maxFiles?: number;
    'max-files'?: number;
    maxfiles?: number;
    /** Two-way bound list of selected files. */
    modelValue?: FileUploadItem[];
    'model-value'?: FileUploadItem[];
    modelvalue?: FileUploadItem[];
    /** Layout style: default or compact. */
    variant?: FileUploadVariant;
    /** Validation state styling the component. */
    validationState?: FileUploadValidationState;
    'validation-state'?: FileUploadValidationState;
    validationstate?: FileUploadValidationState;
    /** Validation message shown below the dropzone. */
    validationMessage?: string;
    'validation-message'?: string;
    validationmessage?: string;
    /** Per-element class overrides for internal parts. */
    cssClass?: FileUploadCssClass;
    'css-class'?: FileUploadCssClass;
}
export interface FileUploadEvents {
    change: FileUploadModelEvent;
    remove: FileUploadRemoveEvent;
    error: FileUploadErrorEvent;
    'mno-change': FileUploadModelEvent;
    mnoChange: FileUploadModelEvent;
    'mno-remove': FileUploadRemoveEvent;
    mnoRemove: FileUploadRemoveEvent;
    'mno-error': FileUploadErrorEvent;
    mnoError: FileUploadErrorEvent;
}
