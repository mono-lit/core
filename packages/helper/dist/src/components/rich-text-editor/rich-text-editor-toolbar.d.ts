import { RichTextEditorButtonList, RichTextEditorPlugins, RichTextEditorToolbar, RichTextEditorToolbarPreset } from './rich-text-editor-types.js';
/**
 * Buttons SunEditor's core provides WITHOUT a plugin (v3 `_defaultButtons`).
 * Anything else in a `buttonList` is the `key` of a plugin that has to be in
 * `plugins`, so a preset is filtered against the plugins actually loaded.
 */
export declare const SUNEDITOR_CORE_BUTTONS: ReadonlySet<string>;
/**
 * Built-ins `plugins="auto"` leaves OUT: each needs configuration SunEditor
 * warns about when it is missing (a server `url` / `uploadUrl`, a `templates` or
 * `layouts` list, an external KaTeX / MathJax / PDF service). Ask for them by
 * name — `plugins="auto, image­Gallery"` is not a thing, but
 * `:plugins.prop="[...]"` with the class or `plugins="font, link, template"`
 * is — and supply their options through `options`.
 */
export declare const AUTO_EXCLUDED_PLUGINS: ReadonlySet<string>;
/**
 * SunEditor's own default (`DEFAULTS.BUTTON_LIST`) — no plugin buttons at all.
 * Mirrored here rather than imported so the presets stay pure.
 */
export declare const TOOLBAR_DEFAULT: RichTextEditorButtonList;
/** The essentials: a comment box, a note field. */
export declare const TOOLBAR_BASIC: RichTextEditorButtonList;
/** The default: what a document / description / email body needs. */
export declare const TOOLBAR_STANDARD: RichTextEditorButtonList;
/**
 * Every built-in that works with no extra configuration. Left out on purpose:
 * the galleries / file browser (need a server `url`), `template` (needs a
 * `templates` list), `math` and `exportPDF` (need external libraries) — pass
 * those through `toolbar` + `options` when the app provides what they need.
 */
export declare const TOOLBAR_FULL: RichTextEditorButtonList;
export declare const TOOLBAR_PRESETS: Record<RichTextEditorToolbarPreset, RichTextEditorButtonList>;
export declare function isToolbarPreset(value: unknown): value is RichTextEditorToolbarPreset;
/**
 * The `buttonList` for a `toolbar` prop value: a preset name, an array, its
 * JSON, or a string of names — `bold, italic | link` (`|` and `/` are honoured
 * as separators, `,`/whitespace split the rest). Unknown → the `standard` preset.
 */
export declare function resolveToolbar(toolbar: RichTextEditorToolbar | undefined | null): RichTextEditorButtonList;
/**
 * Drop the plugin buttons a `buttonList` names that are NOT among `available`
 * plugin keys, so `plugins="none"` (or a trimmed list) with the default toolbar
 * degrades to the core buttons instead of SunEditor rejecting the list.
 * Separators left with nothing on either side are dropped too.
 */
export declare function pruneToolbar(list: RichTextEditorButtonList, available: ReadonlySet<string>): RichTextEditorButtonList;
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
export declare function resolvePlugins(plugins: RichTextEditorPlugins | undefined | null, all: Record<string, unknown> | null): {
    plugins: unknown[];
    keys: Set<string>;
};
/** Whether `plugins` needs the full built-in map to be resolved. */
export declare function pluginsNeedCatalog(plugins: RichTextEditorPlugins | undefined | null): boolean;
