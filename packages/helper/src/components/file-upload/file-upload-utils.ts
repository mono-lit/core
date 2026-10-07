import type {
  FileUploadValidationState,
  FileUploadVariant,
  FileUploadItem,
} from './file-upload-types.js'

export function validateFileUploadProps(props: {
  variant?: FileUploadVariant
  validationState?: FileUploadValidationState
}): boolean {
  const validVariants: FileUploadVariant[] = ['default', 'compact']
  const validStates: FileUploadValidationState[] = ['default', 'valid', 'invalid', 'warning']

  if (props.variant && !validVariants.includes(props.variant)) return false
  if (props.validationState && !validStates.includes(props.validationState)) return false

  return true
}

// Re-exported from the shared composable (single source of truth).
export { isIconifyClass } from '../../composables/icon.js'

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Pick a default file-type icon. Returns an MDI iconify utility class
 * (`i-mdi-*`, resolved by UnoCSS preset-icons) — see
 * https://icon-sets.iconify.design/mdi/ . The render layer paints these as a
 * masked SVG via {@link isIconifyClass}. The full set is safelisted in
 * `uno.config.ts` so the CSS ships in `dist/ui/index.css`.
 */
export function getFileIcon(type: string, name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (type.startsWith('image/')) return 'i-mdi-file-image'
  if (type.includes('pdf') || ext === 'pdf') return 'i-mdi-file-pdf-box'
  if (type.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'i-mdi-file-excel'
  if (type.includes('word') || ['doc', 'docx'].includes(ext)) return 'i-mdi-file-word'
  if (type.includes('zip') || ['zip', 'rar', '7z'].includes(ext)) return 'i-mdi-zip-box'
  if (type.includes('video/')) return 'i-mdi-file-video'
  if (type.includes('audio/')) return 'i-mdi-file-music'

  return 'i-mdi-file'
}

export function createUploadItem(file: File): FileUploadItem {
  const isImage = file.type.startsWith('image/')
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  }
}