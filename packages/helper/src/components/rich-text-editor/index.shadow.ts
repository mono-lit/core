// Shadow-DOM / SSR build entry for the rich text editor —
// `@mono-lit/helper/ui/shadow/rich-text-editor`. Registers `mono-shadow-rich-text-editor`
// (the light build, `@mono-lit/helper/ui/rich-text-editor`, registers
// `mono-rich-text-editor`), so both can coexist in one document.
export { MonoRichTextEditorShadow } from './mono-rich-text-editor.shadow.js'

export { MonoRichTextEditorCore, type RichTextEditorSlotName } from './rich-text-editor-core.js'

export {
  loadSunEditor,
  loadSunEditorCss,
  loadSunEditorLang,
  loadSunEditorPlugins,
  SUNEDITOR_LANG_CODES,
} from './rich-text-editor-loader.js'

export {
  TOOLBAR_BASIC,
  TOOLBAR_STANDARD,
  TOOLBAR_FULL,
  TOOLBAR_DEFAULT,
  TOOLBAR_PRESETS,
  SUNEDITOR_CORE_BUTTONS,
  AUTO_EXCLUDED_PLUGINS,
  resolveToolbar,
  resolvePlugins,
  pruneToolbar,
} from './rich-text-editor-toolbar.js'

export type {
  RichTextEditorSize,
  RichTextEditorColor,
  RichTextEditorVariant,
  RichTextEditorValidationState,
  RichTextEditorMode,
  RichTextEditorToolbar,
  RichTextEditorToolbarPreset,
  RichTextEditorButtonList,
  RichTextEditorPlugins,
  RichTextEditorInstance,
  RichTextEditorOptions,
  RichTextEditorCssClass,
  RichTextEditorModelEventDetail,
  RichTextEditorModelEvent,
  RichTextEditorReadyEventDetail,
  RichTextEditorErrorEventDetail,
  RichTextEditorFocusEventDetail,
  RichTextEditorProps,
  RichTextEditorEvents,
} from './rich-text-editor-types.js'
