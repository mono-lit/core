// rich-text-editor-loader.ts — the OPTIONAL `suneditor` peer, loaded on demand.
//
// Same arrangement as `chart-core.ts`'s `loadChartJs`: the package is
// externalized from mono's build (see the `mono-external-suneditor` plugin in
// both vite configs), so every `import('suneditor…')` below survives into
// `dist/` verbatim and resolves against the CONSUMER's copy at runtime. An app
// that never renders the editor never downloads it; one that has not installed
// it gets an actionable message instead of a stack trace.
//
// Every specifier here is a STATIC string on purpose — a template-literal
// `import(\`suneditor/langs/${code}\`)` cannot be externalized as a bare
// specifier and would reach the browser unresolved.

const INSTALL_HINT =
  '[mono-rich-text-editor] needs the optional peer dependency "suneditor". ' +
  'Install it in your app: pnpm add suneditor@^3.3.3'

function withHint(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err)
  return new Error(`${INSTALL_HINT}${message ? ` (original error: ${message})` : ''}`)
}

let _corePromise: Promise<any> | null = null

/** The `suneditor` default export (`{ create, init }`), cached; a failure resets so a later attempt retries. */
export function loadSunEditor(): Promise<any> {
  _corePromise ??= import('suneditor')
    .then((m: any) => m?.default ?? m)
    .catch((err) => {
      _corePromise = null
      throw withHint(err)
    })
  return _corePromise
}

let _cssPromise: Promise<void> | null = null

/**
 * SunEditor's UI stylesheet (`suneditor/css/editor`), injected ONCE per page by
 * the consumer's bundler as a side-effect import. Failure is not fatal — the
 * editor still works, unstyled — so it is reported once and swallowed.
 */
export function loadSunEditorCss(): Promise<void> {
  _cssPromise ??= import('suneditor/css/editor')
    .then(() => undefined)
    .catch((err) => {
      console.warn(
        '[mono-rich-text-editor] could not load "suneditor/css/editor" — the editor will render ' +
          'unstyled. Import the stylesheet yourself and set load-css="false" if your bundler ' +
          'cannot import CSS from a dynamic import.',
        err,
      )
    })
  return _cssPromise
}

let _pluginsPromise: Promise<Record<string, any>> | null = null

/** Every built-in plugin, keyed by name (`suneditor/plugins`' default export). */
export function loadSunEditorPlugins(): Promise<Record<string, any>> {
  _pluginsPromise ??= import('suneditor/plugins')
    .then((m: any) => m?.default ?? m)
    .catch((err) => {
      _pluginsPromise = null
      throw withHint(err)
    })
  return _pluginsPromise
}

/**
 * The language packs SunEditor ships, each behind its own static import so the
 * consumer's bundler can split them. Unknown codes fall back to English (the
 * editor's own default) with a warning rather than failing the build.
 */
const LANGS: Record<string, () => Promise<any>> = {
  ckb: () => import('suneditor/langs/ckb'),
  cs: () => import('suneditor/langs/cs'),
  da: () => import('suneditor/langs/da'),
  de: () => import('suneditor/langs/de'),
  en: () => import('suneditor/langs/en'),
  es: () => import('suneditor/langs/es'),
  fa: () => import('suneditor/langs/fa'),
  fr: () => import('suneditor/langs/fr'),
  he: () => import('suneditor/langs/he'),
  hu: () => import('suneditor/langs/hu'),
  it: () => import('suneditor/langs/it'),
  ja: () => import('suneditor/langs/ja'),
  km: () => import('suneditor/langs/km'),
  ko: () => import('suneditor/langs/ko'),
  lv: () => import('suneditor/langs/lv'),
  nl: () => import('suneditor/langs/nl'),
  pl: () => import('suneditor/langs/pl'),
  pt_br: () => import('suneditor/langs/pt_br'),
  ro: () => import('suneditor/langs/ro'),
  ru: () => import('suneditor/langs/ru'),
  se: () => import('suneditor/langs/se'),
  tr: () => import('suneditor/langs/tr'),
  uk: () => import('suneditor/langs/uk'),
  ur: () => import('suneditor/langs/ur'),
  zh_cn: () => import('suneditor/langs/zh_cn'),
}

/** Codes `lang` accepts. */
export const SUNEDITOR_LANG_CODES = Object.keys(LANGS)

const _langPromises = new Map<string, Promise<any>>()

/**
 * A language pack by code (`ko`, `pt-BR` → `pt_br`, `zh-CN` → `zh_cn`, …), or
 * `undefined` for English / an unknown code (SunEditor then uses its default).
 */
export function loadSunEditorLang(code: string): Promise<any | undefined> {
  const key = code.trim().toLowerCase().replace(/-/g, '_')
  if (!key || key === 'en') return Promise.resolve(undefined)
  const loader = LANGS[key]
  if (!loader) {
    console.warn(
      `[mono-rich-text-editor] unknown lang "${code}" — SunEditor ships: ${SUNEDITOR_LANG_CODES.join(', ')}. Using English.`,
    )
    return Promise.resolve(undefined)
  }
  let p = _langPromises.get(key)
  if (!p) {
    p = loader()
      .then((m: any) => m?.default ?? m)
      .catch((err) => {
        _langPromises.delete(key)
        throw withHint(err)
      })
    _langPromises.set(key, p)
  }
  return p
}
