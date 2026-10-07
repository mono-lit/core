import { FileUploadValidationState, FileUploadVariant, FileUploadItem } from './file-upload-types.js';
export declare function validateFileUploadProps(props: {
    variant?: FileUploadVariant;
    validationState?: FileUploadValidationState;
}): boolean;
export { isIconifyClass } from '../../composables/icon.js';
export declare function formatFileSize(size: number): string;
/**
 * Pick a default file-type icon. Returns an MDI iconify utility class
 * (`i-mdi-*`, resolved by UnoCSS preset-icons) — see
 * https://icon-sets.iconify.design/mdi/ . The render layer paints these as a
 * masked SVG via {@link isIconifyClass}. The full set is safelisted in
 * `uno.config.ts` so the CSS ships in `dist/ui/index.css`.
 */
export declare function getFileIcon(type: string, name: string): string;
export declare function createUploadItem(file: File): FileUploadItem;
