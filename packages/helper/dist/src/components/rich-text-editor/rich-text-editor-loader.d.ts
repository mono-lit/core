/** The `suneditor` default export (`{ create, init }`), cached; a failure resets so a later attempt retries. */
export declare function loadSunEditor(): Promise<any>;
/**
 * SunEditor's UI stylesheet (`suneditor/css/editor`), injected ONCE per page by
 * the consumer's bundler as a side-effect import. Failure is not fatal — the
 * editor still works, unstyled — so it is reported once and swallowed.
 */
export declare function loadSunEditorCss(): Promise<void>;
/** Every built-in plugin, keyed by name (`suneditor/plugins`' default export). */
export declare function loadSunEditorPlugins(): Promise<Record<string, any>>;
/** Codes `lang` accepts. */
export declare const SUNEDITOR_LANG_CODES: string[];
/**
 * A language pack by code (`ko`, `pt-BR` → `pt_br`, `zh-CN` → `zh_cn`, …), or
 * `undefined` for English / an unknown code (SunEditor then uses its default).
 */
export declare function loadSunEditorLang(code: string): Promise<any | undefined>;
