import { defineConfig, type UserConfig } from 'tsdown'
import type { Plugin } from 'rolldown'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import dotenv from 'dotenv'
import { createGenerator } from 'unocss'
import unoConfig from './uno.config.ts'
// @ts-expect-error — a plain .mjs build helper, no declarations
import { buildFontSheets } from './scripts/font-sheets.mjs'

dotenv.config()

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// remark pulls in `decode-named-character-reference`, whose `browser` export
// decodes HTML entities with a detached `document.createElement('i')` — AT
// MODULE SCOPE. That makes the whole report chunk unimportable outside a
// browser, so generating a report in a Nitro route or a Node script would throw
// `document is not defined` before any of our code runs. Its `default` export is
// a plain lookup table with no DOM at all, so point at that instead and the
// engine works everywhere. Resolved through `require.resolve` because the
// package's `exports` map has no `./index.js` subpath to alias by name.
const NO_DOM_ENTITY_DECODER = createRequire(import.meta.url).resolve(
    'decode-named-character-reference',
)

/* -------------------------------- externals ------------------------------- */

// Kept OUT of every bundle — the consuming app provides them. tsdown marks these
// external while the specifier is still bare, so a package's `browser` field can
// never rewrite it into an inlinable path first (the trap that used to need an
// `enforce: 'pre'` resolver per package under Vite).
//
//  - `lit` & co.: a SINGLE lit instance at runtime. Mixing a bundled lit (light
//    components) with an external lit (the shadow/SSR build + @lit-labs/ssr) puts
//    two lit-html copies on the page and crashes with
//    `currentDirective._$initialize is not a function`.
//  - `exceljs` (~1MB), `handlebars` (~225KB compiler), `chart.js`, `suneditor`,
//    `@floating-ui/*`, `@aejkatappaja/*`: optional peers of the report engine and
//    the chart / rich-text-editor / tooltip / skeleton addons. Their dynamic
//    `import()`s resolve against the host's copy — and never resolve at all unless
//    the feature is actually used.
//  - `@mono-lit/utility`: an optional peer used only by the chart's `odata` path;
//    inlining it would drag the whole fetching stack (devextreme included) into
//    `dist/ui/chart.js`.
//  - `vite`, `magic-string`, `@vue/*`, `@nuxt/*`, `node:*`: tooling used only by
//    the `vite` / `nuxt` entries.
const NEVER_BUNDLE: (string | RegExp)[] = [
    /^exceljs(\/|$)/,
    /^handlebars(\/|$)/,
    /^chart\.js(\/|$)/,
    /^suneditor(\/|$)/,
    /^@floating-ui\//,
    /^@aejkatappaja\//,
    /^lit(\/|$)/,
    /^lit-html(\/|$)/,
    /^lit-element(\/|$)/,
    /^@lit\//,
    /^@lit-labs\//,
    /^@mono-lit\/utility(\/|$)/,
    /^vite$/,
    /^magic-string$/,
    /^@vue\//,
    /^@nuxt\//,
    /^node:/,
]

// Everything else that is a `dependency` is INLINED, as the Vite library build
// always did (tsdown would otherwise externalize every `dependencies` entry).
// remark in particular must be bundled: the no-DOM entity-decoder alias above only
// takes effect on code that goes through this build.
const isNeverBundled = (id: string) => NEVER_BUNDLE.some((p) => (typeof p === 'string' ? p === id : p.test(id)))
const alwaysBundle = (id: string) => !isNeverBundled(id)

/* --------------------------------- plugins -------------------------------- */

// Vite's `?raw`: the file's source as a default-exported string, untouched. The
// shadow components inline their per-component stylesheet this way (into
// `static styles`), and reports import `.md` templates. Resolved to a
// `\0raw:<file>?raw.js` id so the CSS pipeline (which matches on a trailing
// `.css`) never sees these as stylesheets.
function rawImports(): Plugin {
    const PREFIX = '\0raw:'
    const SUFFIX = '?raw.js'
    return {
        name: 'mono-raw-imports',
        resolveId: {
            order: 'pre',
            handler(source, importer) {
                if (!source.endsWith('?raw')) return null
                const file = source.slice(0, -'?raw'.length)
                const base = importer ? path.dirname(importer.replace(/^\0raw:/, '')) : process.cwd()
                return PREFIX + path.resolve(base, file) + SUFFIX
            },
        },
        load(id) {
            if (!id.startsWith(PREFIX)) return null
            const file = id.slice(PREFIX.length, -SUFFIX.length)
            this.addWatchFile(file)
            return { code: `export default ${JSON.stringify(readFileSync(file, 'utf8'))}`, moduleType: 'js' }
        },
    }
}

// UnoCSS, the way its Vite plugin runs in a library build: every module that goes
// through the build and matches `content.pipeline.include` is scanned, and the
// generated CSS (scanned utilities + icons + the safelist, wrapped in `@layer mono`
// by `outputToCssLayers` in production) replaces `import 'virtual:uno.css'`. It is
// written at the TOP of `ui/index.css`, ahead of the component CSS, matching the
// import order in entries/index.ts.
function unocss(cssFileName: string): Plugin {
    const VIRTUAL = '\0mono-virtual-uno-css'
    // The same filter @unocss/vite applies: `content.pipeline.include` minus
    // stylesheets — except that a module mentioning `@unocss-include` is always
    // scanned. That is how the component sheets' utilities get in: each light
    // component imports its own `<c>.css?raw`, whose code carries the marker.
    const include = new RegExp(`^${r('./src/').replaceAll('\\', '[\\\\/]').replace(/[.]/g, '\\.')}.*\\.(js|ts|html)$`)
    const cssId = /\.(css|postcss|sass|scss|less|stylus|styl)($|\?)/
    const skipped = /(\/\/\s*?@unocss-skip-start\s*?|\/\*\s*?@unocss-skip-start\s*?\*\/|<!--\s*?@unocss-skip-start\s*?-->)[\s\S]*?(\/\/\s*?@unocss-skip-end\s*?|\/\*\s*?@unocss-skip-end\s*?\*\/|<!--\s*?@unocss-skip-end\s*?-->)/g
    const filter = (code: string, id: string) => {
        if (code.includes('@unocss-ignore')) return false
        if (code.includes('@unocss-include') || code.includes('@unocss-placeholder')) return true
        const file = id.replace(/^\0raw:/, '')
        return include.test(file) && !cssId.test(file)
    }
    const tokens = new Set<string>()
    const generator = createGenerator(unoConfig)
    return {
        name: 'mono-unocss',
        buildStart() {
            tokens.clear()
        },
        resolveId(source) {
            return source === 'virtual:uno.css' ? VIRTUAL : null
        },
        load(id) {
            return id === VIRTUAL ? { code: '', moduleType: 'js' } : null
        },
        // `pre`, like the Vite plugin: scan the authored source, before any transform.
        transform: {
            order: 'pre',
            async handler(code, id) {
                if (!filter(code, id)) return null
                await (await generator).applyExtractors(code.replace(skipped, ''), id, tokens)
                return null
            },
        },
        // `post`: @tsdown/css adds the merged stylesheet in its own generateBundle.
        generateBundle: {
            order: 'post',
            async handler(_options, bundle) {
                const { css } = await (await generator).generate(tokens, { minify: true })
                const asset = bundle[cssFileName]
                if (asset?.type === 'asset') {
                    asset.source = css + '\n' + String(asset.source)
                } else {
                    this.emitFile({ type: 'asset', fileName: cssFileName, source: css })
                }
            },
        },
    }
}

// Each non-mono flavor as a standalone, opt-in stylesheet at an exact path
// (dist/ui/theme/<name>.css). They're plain CSS — no UnoCSS utilities/icons to
// generate — so the source is copied verbatim, and they stay OUT of the
// entries/index.css graph so importing the library doesn't drag every flavor in.
// Consumers: import '@mono-lit/helper/ui/theme/nova.css' + class="theme-nova"
//            import '@mono-lit/helper/ui/theme/one.css'  + class="theme-one"
function emitFlavorThemes(): Plugin {
    return {
        name: 'mono-emit-flavor-themes',
        async generateBundle() {
            // ONE is the default flavor (index.css applies flavors/one.css at
            // :root); it is still emitted so `theme-one` can re-apply it inside a
            // subtree. Each Basecoat style is the vega base (which resets what ONE
            // sets) followed by the style's own deltas; vega is the base alone.
            const base = readFileSync(r('./src/data/theme/flavors/_vega-base.css'), 'utf8')
            for (const name of ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea', 'one']) {
                const own = name === 'vega' ? '' : readFileSync(r(`./src/data/theme/flavors/${name}.css`), 'utf8')
                const source = name === 'one' ? own : base.replaceAll('__FLAVOR__', name) + '\n' + own
                this.emitFile({ type: 'asset', fileName: `ui/theme/${name}.css`, source })
            }
            const sheets: [source: string, fileName: string][] = [
                // The generated token layer on its own, for consumers styling
                // their own light-DOM markup with the same vocabulary (or an
                // SSR shell that needs the tokens before the components load).
                ['generated/tokens.css', 'ui/theme/tokens.css'],
                // The pre-Basecoat --theme-* names. Bundled into index.css
                // until 2.0, opt-in from 2.0, deleted in 3.0.
                ['generated/legacy.css', 'ui/theme/legacy.css'],
            ]
            for (const [source, fileName] of sheets) {
                this.emitFile({
                    type: 'asset',
                    fileName,
                    source: readFileSync(r(`./src/data/theme/${source}`), 'utf8'),
                })
            }
            // Opt-in self-hosted web fonts: dist/ui/font/<name>.css + font/files/*
            // (`import '@mono-lit/helper/ui/font/poppins.css'`). See scripts/font-sheets.mjs.
            const fonts = await buildFontSheets(r('./node_modules/.cache/mono-helper/fonts'))
            for (const [fileName, source] of Object.entries(fonts.css)) {
                this.emitFile({ type: 'asset', fileName: `ui/${fileName}`, source: source as string })
            }
            for (const [fileName, source] of Object.entries(fonts.files)) {
                this.emitFile({ type: 'asset', fileName: `ui/${fileName}`, source: source as Uint8Array })
            }
        },
    }
}

/* --------------------------------- configs -------------------------------- */

const CSS_FILE = 'ui/index.css'

const shared = {
    format: ['es'],
    platform: 'neutral',
    outDir: r('./dist'),
    // A library should not minify: the consuming app minifies its own bundle,
    // so this changes nothing about what ships to a browser (measured on a
    // template build: the final bundle moved by 45 bytes) while costing real
    // things here.
    //
    // Concretely, mangling produced 27 modules that each bind a top-level `h`
    // — the same name Vue exports for createVNode. If this package is ever
    // linked inside an app's Vite root rather than under node_modules,
    // auto-import scans those files, and shipping identifiers that collide
    // with the auto-import set is a trap to leave lying around.
    // @mono-lit/devextreme hit exactly that and broke every template build.
    //
    // Consumers also get legible stack traces and intact `/*#__PURE__*/`
    // annotations for their own tree-shaker.
    minify: false,
    sourcemap: false,
    treeshake: true,
    alias: {
        '@': r('./src'),
        'decode-named-character-reference': NO_DOM_ENTITY_DECODER,
    },
    // `platform: 'neutral'` resolves only `module`/`browser`; append `main` so the
    // CJS-only deps we inline (e.g. jexl) still resolve instead of going external.
    inputOptions(options) {
        options.resolve = { ...options.resolve, mainFields: ['browser', 'module', 'main'] }
        return options
    },
    deps: {
        neverBundle: NEVER_BUNDLE,
        alwaysBundle,
        // Inlining is the intent here (see `alwaysBundle`) — no per-package hint.
        onlyBundle: false,
    },
} satisfies UserConfig

export default defineConfig([
    // Light DOM build — every `@mono-lit/helper` entry except `ui/shadow/*`, plus
    // the global stylesheet (dist/ui/index.css) and the opt-in theme/font sheets.
    {
        ...shared,
        clean: true,
        dts: false,
        // PostCSS (postcss-import only), as Vite did: `@import`s are inlined and the
        // authored CSS ships as written. The default lightningcss transformer
        // re-prints it — strips comments, rewrites values, merges rules.
        css: { fileName: CSS_FILE, transformer: 'postcss' },
        entry: {
            'index': './src/entries/index.ts',
            // SSR-safe root subset, resolved via the package `node` condition.
            'index.node': './src/entries/index.node.ts',
            // Browser-only OData CSDL search compiler: `@mono-lit/helper/search`.
            'search': './src/entries/search.ts',
            // Tooltip addon (`controlMonoTooltip`) — its @floating-ui peers stay external.
            'tooltip': './src/components/tooltip/index.ts',
            'ui/accordion': './src/components/accordion/index.ts',
            'ui/button': './src/components/button/index.ts',
            'ui/button-dropdown': './src/components/button/index.button-dropdown.ts',
            'ui/chip': './src/components/chip/index.ts',
            'ui/breadcrumb': './src/components/breadcrumb/index.ts',
            'ui/alert': './src/components/alert/index.ts',
            'ui/card': './src/components/card/index.ts',
            'ui/chart': './src/components/chart/index.ts',
            'ui/switch': './src/components/switch/index.ts',
            'ui/checkbox': './src/components/checkbox/index.ts',
            'ui/drawer': './src/components/drawer/index.ts',
            'ui/dropdown': './src/components/dropdown/index.ts',
            'ui/radio': './src/components/radio/index.ts',
            'ui/input': './src/components/input/index.ts',
            'ui/date': './src/components/date/index.ts',
            'ui/menu': './src/components/menu/index.ts',
            'ui/select': './src/components/select/index.ts',
            'ui/sidebar': './src/components/sidebar/index.ts',
            'ui/textarea': './src/components/textarea/index.ts',
            'ui/rich-text-editor': './src/components/rich-text-editor/index.ts',
            'ui/file-upload': './src/components/file-upload/index.ts',
            'ui/tag-input': './src/components/tag-input/index.ts',
            'ui/tabs': './src/components/tabs/index.ts',
            'ui/modal': './src/components/modal/index.ts',
            'ui/nav': './src/components/nav/index.ts',
            'ui/table': './src/components/table/index.ts',
            'ui/dropdown-table': './src/components/dropdown-table/index.ts',
            'ui/filter': './src/components/filter/index.ts',
            // Headless form controller (`monoForm`) — a composable, not an
            // element: no custom element is registered and there is no CSS.
            'ui/form': './src/components/form/index.ts',
            // Spreadsheet export (`@mono-lit/helper/export`, `table.export()`) and
            // import (`@mono-lit/helper/import`, `table.import()`). Both are reached
            // via a DYNAMIC import from the table controller, so they are emitted
            // as lazily-fetched chunks — importing `monoDataGrid` never pulls
            // handlebars/remark into the main bundle.
            'export': './src/export/index.ts',
            'import': './src/import/index.ts',
            // Node-targeted Vite plugin entry: `@mono-lit/helper/vite`.
            'vite': './src/vite/index.ts',
            // Nuxt module entry: `@mono-lit/helper/nuxt`.
            'nuxt': './src/nuxt/index.ts',
        },
        plugins: [rawImports(), unocss(CSS_FILE), emitFlavorThemes()],
    },
    // Shadow-DOM / SSR build (`@mono-lit/helper/ui/shadow/*`). Its own chunk graph,
    // as it always had: the consuming app resolves the external `lit` per export
    // condition — on the server that's lit's `node` build, whose lit-html uses an
    // SSR-safe tree-walker stub and whose reactive-element gets `HTMLElement` from
    // `@lit-labs/ssr-dom-shim` — so the element is importable on the server (for
    // `@lit-labs/ssr` / `nuxt-ssr-lit`) WITHOUT a global DOM shim. The per-component
    // shadow stylesheet is inlined via `?raw` into `static styles`.
    {
        ...shared,
        clean: false, // shares dist/ with the light build
        dts: false,
        entry: {
            'ui/shadow/accordion': './src/components/accordion/index.shadow.ts',
            'ui/shadow/breadcrumb': './src/components/breadcrumb/index.shadow.ts',
            'ui/shadow/nav': './src/components/nav/index.shadow.ts',
            'ui/shadow/input': './src/components/input/index.shadow.ts',
            'ui/shadow/drawer': './src/components/drawer/index.shadow.ts',
            'ui/shadow/dropdown': './src/components/dropdown/index.shadow.ts',
            'ui/shadow/sidebar': './src/components/sidebar/index.shadow.ts',
            'ui/shadow/menu': './src/components/menu/index.shadow.ts',
            'ui/shadow/modal': './src/components/modal/index.shadow.ts',
            'ui/shadow/table': './src/components/table/index.shadow.ts',
            'ui/shadow/dropdown-table': './src/components/dropdown-table/index.shadow.ts',
            'ui/shadow/filter': './src/components/filter/index.shadow.ts',
            'ui/shadow/alert': './src/components/alert/index.shadow.ts',
            'ui/shadow/card': './src/components/card/index.shadow.ts',
            'ui/shadow/chart': './src/components/chart/index.shadow.ts',
            'ui/shadow/button': './src/components/button/index.shadow.ts',
            'ui/shadow/button-dropdown': './src/components/button/index.button-dropdown.shadow.ts',
            'ui/shadow/chip': './src/components/chip/index.shadow.ts',
            'ui/shadow/tabs': './src/components/tabs/index.shadow.ts',
            'ui/shadow/checkbox': './src/components/checkbox/index.shadow.ts',
            'ui/shadow/file-upload': './src/components/file-upload/index.shadow.ts',
            'ui/shadow/radio': './src/components/radio/index.shadow.ts',
            'ui/shadow/select': './src/components/select/index.shadow.ts',
            'ui/shadow/switch': './src/components/switch/index.shadow.ts',
            'ui/shadow/tag-input': './src/components/tag-input/index.shadow.ts',
            'ui/shadow/textarea': './src/components/textarea/index.shadow.ts',
            'ui/shadow/rich-text-editor': './src/components/rich-text-editor/index.shadow.ts',
            'ui/shadow/date': './src/components/date/index.shadow.ts',
        },
        plugins: [rawImports()],
    },
    // Declarations — one `.d.ts` per source module under dist/src/**, mirroring
    // src/. Not bundled per entry on purpose: dist/vue.d.ts (scripts/gen-vue-types.mjs)
    // imports each `*Props` interface from its own module and augments
    // `MonoUIComponents` in the module that declares it, which only works while
    // every interface keeps a single, stable home.
    {
        ...shared,
        clean: false,
        unbundle: true,
        root: './src',
        outDir: r('./dist/src'),
        entry: ['./src/**/*.ts', '!./src/**/*.d.ts'],
        dts: { emitDtsOnly: true, tsconfig: r('./tsconfig.json') },
        deps: { neverBundle: true },
        plugins: [rawImports(), { name: 'mono-virtual-uno-css-stub', resolveId: (s) => (s === 'virtual:uno.css' ? { id: s, external: true } : null) }],
    },
])
