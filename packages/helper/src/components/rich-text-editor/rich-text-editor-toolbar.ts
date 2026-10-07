// rich-text-editor-toolbar.ts — toolbar presets and the `toolbar` / `plugins`
// prop resolvers. Pure functions: no DOM, no SunEditor import.

import type {
  RichTextEditorButtonList,
  RichTextEditorPlugins,
  RichTextEditorToolbar,
  RichTextEditorToolbarPreset,
} from './rich-text-editor-types.js'

/**
 * Buttons SunEditor's core provides WITHOUT a plugin (v3 `_defaultButtons`).
 * Anything else in a `buttonList` is the `key` of a plugin that has to be in
 * `plugins`, so a preset is filtered against the plugins actually loaded.
 */
export const SUNEDITOR_CORE_BUTTONS: ReadonlySet<string> = new Set([
  'bold',
  'underline',
  'italic',
  'strike',
  'subscript',
  'superscript',
  'removeFormat',
  'copyFormat',
  'indent',
  'outdent',
  'fullScreen',
  'showBlocks',
  'codeView',
  'markdownView',
  'undo',
  'redo',
  'preview',
  'print',
  'copy',
  'dir',
  'dir_ltr',
  'dir_rtl',
  'finder',
  'save',
  'newDocument',
  'selectAll',
  'pageBreak',
  'pageUp',
  'pageDown',
  'pageNavigator',
])

/**
 * Built-ins `plugins="auto"` leaves OUT: each needs configuration SunEditor
 * warns about when it is missing (a server `url` / `uploadUrl`, a `templates` or
 * `layouts` list, an external KaTeX / MathJax / PDF service). Ask for them by
 * name — `plugins="auto, image­Gallery"` is not a thing, but
 * `:plugins.prop="[...]"` with the class or `plugins="font, link, template"`
 * is — and supply their options through `options`.
 */
export const AUTO_EXCLUDED_PLUGINS: ReadonlySet<string> = new Set([
  'exportPDF',
  'fileUpload',
  'layout',
  'template',
  'math',
  'imageGallery',
  'videoGallery',
  'audioGallery',
  'fileGallery',
  'fileBrowser',
])

/** Markers a `buttonList` may carry besides button names. */
const SPECIAL = /^(\||\/|-left|-right|-center|#fix)$/

/**
 * SunEditor's own default (`DEFAULTS.BUTTON_LIST`) — no plugin buttons at all.
 * Mirrored here rather than imported so the presets stay pure.
 */
export const TOOLBAR_DEFAULT: RichTextEditorButtonList = [
  ['undo', 'redo'],
  '|',
  ['bold', 'underline', 'italic', 'strike', '|', 'subscript', 'superscript'],
  '|',
  ['removeFormat'],
  '|',
  ['outdent', 'indent'],
  '|',
  ['fullScreen', 'showBlocks', 'codeView'],
  '|',
  ['preview', 'print'],
]

/** The essentials: a comment box, a note field. */
export const TOOLBAR_BASIC: RichTextEditorButtonList = [
  ['undo', 'redo'],
  '|',
  ['bold', 'underline', 'italic', 'strike'],
  '|',
  ['list_bulleted', 'list_numbered', 'link'],
  '|',
  ['removeFormat'],
]

/** The default: what a document / description / email body needs. */
export const TOOLBAR_STANDARD: RichTextEditorButtonList = [
  ['undo', 'redo'],
  '|',
  ['blockStyle', 'font', 'fontSize'],
  '|',
  ['bold', 'underline', 'italic', 'strike'],
  ['fontColor', 'backgroundColor'],
  '|',
  ['align', 'list_bulleted', 'list_numbered', 'outdent', 'indent'],
  '|',
  ['table', 'link', 'image', 'video'],
  '|',
  ['blockquote', 'codeBlock', 'hr'],
  '|',
  ['removeFormat'],
  '|',
  ['codeView', 'fullScreen'],
]

/**
 * Every built-in that works with no extra configuration. Left out on purpose:
 * the galleries / file browser (need a server `url`), `template` (needs a
 * `templates` list), `math` and `exportPDF` (need external libraries) — pass
 * those through `toolbar` + `options` when the app provides what they need.
 */
export const TOOLBAR_FULL: RichTextEditorButtonList = [
  ['undo', 'redo'],
  '|',
  ['blockStyle', 'paragraphStyle', 'font', 'fontSize', 'lineHeight'],
  '|',
  ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
  ['fontColor', 'backgroundColor', 'textStyle', 'copyFormat', 'removeFormat'],
  '|',
  ['align', 'list_bulleted', 'list_numbered', 'outdent', 'indent', 'dir_ltr', 'dir_rtl'],
  '|',
  ['table', 'layout', 'link', 'image', 'video', 'audio', 'embed', 'drawing'],
  '|',
  ['blockquote', 'codeBlock', 'hr', 'pageBreak'],
  '|',
  ['showBlocks', 'codeView', 'markdownView', 'fullScreen'],
  '|',
  ['finder', 'selectAll', 'preview', 'print'],
]

export const TOOLBAR_PRESETS: Record<RichTextEditorToolbarPreset, RichTextEditorButtonList> = {
  basic: TOOLBAR_BASIC,
  standard: TOOLBAR_STANDARD,
  full: TOOLBAR_FULL,
  default: TOOLBAR_DEFAULT,
}

export function isToolbarPreset(value: unknown): value is RichTextEditorToolbarPreset {
  return typeof value === 'string' && value in TOOLBAR_PRESETS
}

/**
 * The `buttonList` for a `toolbar` prop value: a preset name, an array, its
 * JSON, or a string of names — `bold, italic | link` (`|` and `/` are honoured
 * as separators, `,`/whitespace split the rest). Unknown → the `standard` preset.
 */
export function resolveToolbar(toolbar: RichTextEditorToolbar | undefined | null): RichTextEditorButtonList {
  if (toolbar == null || toolbar === '') return TOOLBAR_STANDARD
  if (Array.isArray(toolbar)) return toolbar
  if (isToolbarPreset(toolbar)) return TOOLBAR_PRESETS[toolbar]
  if (typeof toolbar !== 'string') return TOOLBAR_STANDARD

  const trimmed = toolbar.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed as RichTextEditorButtonList
    } catch {
      // fall through to the plain-string grammar
    }
  }

  // `bold italic | link image / table` → groups between separators.
  const out: RichTextEditorButtonList = []
  let group: string[] = []
  for (const token of trimmed.split(/[\s,]+/).filter(Boolean)) {
    if (SPECIAL.test(token)) {
      if (group.length) out.push(group)
      group = []
      out.push(token)
    } else {
      group.push(token)
    }
  }
  if (group.length) out.push(group)
  return out.length ? out : TOOLBAR_STANDARD
}

/**
 * Drop the plugin buttons a `buttonList` names that are NOT among `available`
 * plugin keys, so `plugins="none"` (or a trimmed list) with the default toolbar
 * degrades to the core buttons instead of SunEditor rejecting the list.
 * Separators left with nothing on either side are dropped too.
 */
export function pruneToolbar(
  list: RichTextEditorButtonList,
  available: ReadonlySet<string>,
): RichTextEditorButtonList {
  const keep = (name: string): boolean =>
    SPECIAL.test(name) || SUNEDITOR_CORE_BUTTONS.has(name) || available.has(name)

  const out: RichTextEditorButtonList = []
  for (const item of list) {
    if (Array.isArray(item)) {
      const group = item.filter(keep)
      // A group that lost every button leaves only its own separators — drop it.
      if (group.some((n) => !SPECIAL.test(n))) out.push(group)
    } else if (keep(item)) {
      out.push(item)
    }
  }

  // Collapse separators that now touch each other or the ends.
  const cleaned: RichTextEditorButtonList = []
  for (const item of out) {
    const isSep = typeof item === 'string' && SPECIAL.test(item)
    const prev = cleaned[cleaned.length - 1]
    if (isSep && (cleaned.length === 0 || (typeof prev === 'string' && SPECIAL.test(prev)))) continue
    cleaned.push(item)
  }
  while (cleaned.length && typeof cleaned[cleaned.length - 1] === 'string') cleaned.pop()
  return cleaned
}

/**
 * The plugin set to hand SunEditor, from the `plugins` prop and (when needed)
 * the full built-in map. Returns `{ plugins, keys }` — `keys` is what
 * `pruneToolbar` filters against.
 *
 * - `'auto'` / unset → every built-in that needs no configuration (`all` must
 *   be supplied; see {@link AUTO_EXCLUDED_PLUGINS}).
 * - `'none'` → nothing.
 * - an array → plugin classes kept as they are, NAMES looked up in `all`.
 * - an object → SunEditor's own `{ name: class }` form.
 * - a string → comma/space-separated names.
 */
export function resolvePlugins(
  plugins: RichTextEditorPlugins | undefined | null,
  all: Record<string, unknown> | null,
): { plugins: unknown[]; keys: Set<string> } {
  const out: unknown[] = []
  const keys = new Set<string>()

  const push = (key: string | undefined, cls: unknown): void => {
    if (!cls || out.includes(cls)) return
    out.push(cls)
    const k = key ?? pluginKey(cls)
    if (k) keys.add(k)
  }

  if (plugins == null || plugins === '' || plugins === 'auto') {
    for (const [key, cls] of Object.entries(all ?? {})) if (!AUTO_EXCLUDED_PLUGINS.has(key)) push(key, cls)
    return { plugins: out, keys }
  }
  if (plugins === 'none') return { plugins: out, keys }

  if (typeof plugins === 'string') {
    for (const name of plugins.split(/[\s,]+/).filter(Boolean)) push(name, all?.[name])
    return { plugins: out, keys }
  }

  if (Array.isArray(plugins)) {
    for (const entry of plugins) {
      if (typeof entry === 'string') push(entry, all?.[entry])
      else push(undefined, entry)
    }
    return { plugins: out, keys }
  }

  for (const [key, cls] of Object.entries(plugins)) push(key, cls)
  return { plugins: out, keys }
}

/** A SunEditor v3 plugin class carries its button name as `static key`. */
function pluginKey(cls: unknown): string | undefined {
  const key = (cls as { key?: unknown } | null)?.key
  return typeof key === 'string' ? key : undefined
}

/** Whether `plugins` needs the full built-in map to be resolved. */
export function pluginsNeedCatalog(plugins: RichTextEditorPlugins | undefined | null): boolean {
  if (plugins == null || plugins === '' || plugins === 'auto') return true
  if (plugins === 'none') return false
  if (typeof plugins === 'string') return true
  if (Array.isArray(plugins)) return plugins.some((p) => typeof p === 'string')
  return false
}
