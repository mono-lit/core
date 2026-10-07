// Shadow-DOM / SSR build entry for file-upload — `@mono-lit/helper/ui/shadow/file-upload`.
//
// Registers the SAME `mono-file-upload` tag as the light build
// (`@mono-lit/helper/ui/file-upload`), so a document must import only one of the two.
// Drop-in replacement: re-exports the identical types/utils as ./index.ts, plus
// the shadow class + core mixin.
export { MonoFileUploadShadow } from './mono-file-upload.shadow.js'

export { MonoFileUploadCore } from './file-upload-core.js'

export type {
  FileUploadItem,
  FileUploadProps,
  FileUploadEvents,
  FileUploadVariant,
  FileUploadValidationState,
} from './file-upload-types.js'

export {
  validateFileUploadProps,
  formatFileSize,
  getFileIcon,
  createUploadItem,
} from './file-upload-utils.js'
