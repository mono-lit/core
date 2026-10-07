import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import dts from 'vite-plugin-dts'
import UnoCSS from 'unocss/vite'
import dotenv from 'dotenv'
import injectHTML from 'vite-plugin-html-inject';
import { readFileSync } from 'node:fs'
// @ts-expect-error — a plain .mjs build helper, no declarations
import { buildFontSheets } from './scripts/font-sheets.mjs'
import { createRequire } from 'node:module'

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

export default defineConfig({
    ...(process.env.NODE_ENV === 'production' ? {} : {
        root: r('./demo/pages'),
    }),
    server: {
        port: Number(process.env.PORT),
    },
    preview: {
        port: Number(process.env.PORT),
    },
    resolve: {
        alias: {
            '@': r('./src'),
            'decode-named-character-reference': NO_DOM_ENTITY_DECODER,
        },
    },
    ...(process.env.NODE_ENV === 'production' ? {
        publicDir: false,
    } : {
        publicDir: r('./demo/public'),
    }),
    plugins: [
        // Keep `exceljs` external. A plain `rollupOptions.external` entry is not
        // enough: Vite's own resolver runs first and rewrites the bare specifier
        // to `…/node_modules/exceljs/dist/exceljs.min.js` (its `browser` field),
        // which the predicate no longer recognises — and 1.3MB of ExcelJS ends
        // up inlined. Resolving it ourselves with `enforce: 'pre'` marks it
        // external while the specifier is still bare, so the emitted chunk keeps
        // `import('exceljs')` and the host's copy is used at runtime.
        {
            name: 'mono-external-exceljs',
            enforce: 'pre',
            resolveId(source) {
                if (source === 'exceljs' || source.startsWith('exceljs/')) {
                    return { id: source, external: true }
                }
                return null
            },
        } as Plugin,
        // Same treatment for `handlebars` — the report template engine, and an
        // optional peer of the export engine. It has a `browser` field
        // (`./dist/cjs/handlebars.js`) and NO `exports` map, so it hits the exact
        // trap described above: without this the ~225KB compiler is inlined into
        // the export chunk no matter what the `external` predicate says.
        {
            name: 'mono-external-handlebars',
            enforce: 'pre',
            resolveId(source) {
                if (source === 'handlebars' || source.startsWith('handlebars/')) {
                    return { id: source, external: true }
                }
                return null
            },
        } as Plugin,
        // Same treatment for `chart.js` — an optional peer of the chart addon.
        // Its package also exposes a `browser`-ish entry, so without a `pre`
        // resolver the bare `chart.js/auto` specifier gets rewritten before the
        // `external` predicate sees it and the whole library is inlined.
        {
            name: 'mono-external-chartjs',
            enforce: 'pre',
            resolveId(source) {
                if (source === 'chart.js' || source.startsWith('chart.js/')) {
                    return { id: source, external: true }
                }
                return null
            },
        } as Plugin,
        // `suneditor` — the optional peer of the rich-text-editor addon. Same two
        // halves: the pre-resolver keeps the bare specifiers (`suneditor`,
        // `suneditor/plugins`, `suneditor/css/editor`, `suneditor/langs/*`)
        // external so the consumer's bundler resolves and splits them.
        {
            name: 'mono-external-suneditor',
            enforce: 'pre',
            resolveId(source) {
                if (source === 'suneditor' || source.startsWith('suneditor/')) {
                    return { id: source, external: true }
                }
                return null
            },
        } as Plugin,
        // `@floating-ui/*` — the optional peers of the tooltip addon (`dom` pulls
        // in `core` and `utils`). External for the same reason as the two above.
        {
            name: 'mono-external-floating-ui',
            enforce: 'pre',
            resolveId(source) {
                if (source.startsWith('@floating-ui/')) {
                    return { id: source, external: true }
                }
                return null
            },
        } as Plugin,
        // Same treatment for `@mono-lit/utility` — an optional peer used only by the
        // chart's `odata` path. It is a workspace/symlinked package, so Vite would
        // otherwise resolve it to a real path and inline the whole fetching stack
        // (devextreme included) into `dist/ui/chart.js`.
        {
            name: '@mono-lit/helper:external-utility',
            enforce: 'pre',
            resolveId(source) {
                if (source === '@mono-lit/utility' || source.startsWith('@mono-lit/utility/')) {
                    return { id: source, external: true }
                }
                return null
            },
        } as Plugin,
        injectHTML() as Plugin,
        UnoCSS() as Plugin[],
        dts({
            tsconfigPath: r('./tsconfig.json'),
            outDirs: r('./dist'),
            entryRoot: r('./src'),
            // Emit declarations for ALL of src, not just entries/. The barrel
            // files (entries/index.ts and each components/*/index.ts) re-export
            // from components/* and data/*, so those must be declared too —
            // otherwise dist/entries/index.d.ts points at non-existent
            // dist/components/* files and every type resolves to nothing.
            include: [
                r('./src'),
            ],
            insertTypesEntry: true
        }) as Plugin,
        // Emit each non-mono flavor as a standalone, opt-in stylesheet at an
        // exact path (dist/ui/theme/<name>.css). They're plain CSS — no UnoCSS
        // utilities/icons to generate — so we just copy the source verbatim,
        // and they stay OUT of the entries/index.css graph so importing the
        // library doesn't drag every flavor in.
        // Consumers: import '@mono-lit/helper/ui/theme/nova.css' + class="theme-nova"
        //            import '@mono-lit/helper/ui/theme/one.css'  + class="theme-one"
        {
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
        } as Plugin,
    ],
    build: {
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
        commonjsOptions: {
            esmExternals: true,
        },
        lib: {
            entry: {
                'index': r('./src/entries/index.ts'),
                // SSR-safe root subset, resolved via the package `node` condition.
                'index.node': r('./src/entries/index.node.ts'),
                // Browser-only OData CSDL search compiler: `@mono-lit/helper/search`.
                'search': r('./src/entries/search.ts'),
                // Tooltip addon (`controlMonoTooltip`) — its @floating-ui peers stay external.
                'tooltip': r('./src/components/tooltip/index.ts'),
                'ui/accordion': r('./src/components/accordion/index.ts'),
                'ui/button': r('./src/components/button/index.ts'),
                'ui/button-dropdown': r('./src/components/button/index.button-dropdown.ts'),
                'ui/chip': r('./src/components/chip/index.ts'),
                'ui/breadcrumb': r('./src/components/breadcrumb/index.ts'),
                'ui/alert': r('./src/components/alert/index.ts'),
                'ui/card': r('./src/components/card/index.ts'),
                'ui/chart': r('./src/components/chart/index.ts'),
                'ui/switch': r('./src/components/switch/index.ts'),
                'ui/checkbox': r('./src/components/checkbox/index.ts'),
                'ui/drawer': r('./src/components/drawer/index.ts'),
                'ui/dropdown': r('./src/components/dropdown/index.ts'),
                'ui/radio': r('./src/components/radio/index.ts'),
                'ui/input': r('./src/components/input/index.ts'),
                'ui/date': r('./src/components/date/index.ts'),
                'ui/menu': r('./src/components/menu/index.ts'),
                'ui/select': r('./src/components/select/index.ts'),
                'ui/sidebar': r('./src/components/sidebar/index.ts'),
                'ui/textarea': r('./src/components/textarea/index.ts'),
                'ui/rich-text-editor': r('./src/components/rich-text-editor/index.ts'),
                'ui/file-upload': r('./src/components/file-upload/index.ts'),
                'ui/tag-input': r('./src/components/tag-input/index.ts'),
                'ui/tabs': r('./src/components/tabs/index.ts'),
                'ui/modal': r('./src/components/modal/index.ts'),
                'ui/nav': r('./src/components/nav/index.ts'),
                'ui/table': r('./src/components/table/index.ts'),
                'ui/dropdown-table': r('./src/components/dropdown-table/index.ts'),
                'ui/filter': r('./src/components/filter/index.ts'),
                // Headless form controller (`monoForm`) — a composable, not an
                // element: no custom element is registered and there is no CSS.
                'ui/form': r('./src/components/form/index.ts'),
                // Spreadsheet export (`@mono-lit/helper/export`, `table.export()`) and
                // import (`@mono-lit/helper/import`, `table.import()`). Both are reached
                // via a DYNAMIC import from the table controller, so rollup emits
                // them as lazily-fetched chunks — importing `monoDataGrid` never
                // pulls handlebars/remark into the main bundle.
                'export': r('./src/export/index.ts'),
                'import': r('./src/import/index.ts'),
                // NOTE: the shadow-DOM / SSR build (`@mono-lit/helper/shadow/*`) is
                // built separately by `vite.shadow.config.ts` so it can keep
                // `lit` EXTERNAL (the server then resolves lit's node build,
                // which is SSR-safe). See plan/2026-06-23-shadow-dom-ssr-mixin-spike.md.
                // Node-targeted Vite plugin entry: `@mono-lit/helper/vite`.
                'vite': r('./src/vite/index.ts'),
                // Nuxt module entry: `@mono-lit/helper/nuxt`.
                'nuxt': r('./src/nuxt/index.ts'),
            },
            formats: ['es'],
            name: '@mono-lit/helper',
            fileName: (format, entryName) => `${entryName}.js`,
            cssFileName: 'ui/index',
        },
        outDir: r('./dist'),
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
            // Externalize `lit` from ALL builds (it's a peerDependency the
            // consuming app provides). This guarantees a SINGLE lit instance at
            // runtime — mixing a bundled lit (light components) with an external
            // lit (the shadow/SSR build + @lit-labs/ssr) puts two lit-html copies
            // on the page and crashes with `currentDirective._$initialize is not a
            // function`. Also externalize the Node/tooling deps used only by the
            // `vite`/`nuxt` entries so they aren't inlined into dist/vite.js.
            // `exceljs` is an OPTIONAL peerDependency of the report engine: it's
            // ~1MB, hosts frequently already ship it (devextreme's exporter uses
            // it), and markdown-only reports never touch it. Keeping it external
            // means the `await import('exceljs')` in the excel renderer resolves
            // against the host's copy — and never resolves at all unless an
            // xlsx report is actually rendered.
            external: (id) =>
                id === 'exceljs' ||
                id.startsWith('exceljs/') ||
                id === 'handlebars' ||
                id.startsWith('handlebars/') ||
                id === 'chart.js' ||
                id.startsWith('chart.js/') ||
                id === 'suneditor' ||
                id.startsWith('suneditor/') ||
                id.startsWith('@floating-ui/') ||
                // the optional peer of the automatic skeleton (never imported by core; defensive)
                id.startsWith('@aejkatappaja/') ||
                id === 'lit' ||
                id.startsWith('lit/') ||
                id === 'lit-html' ||
                id.startsWith('lit-html/') ||
                id === 'lit-element' ||
                id.startsWith('lit-element/') ||
                id.startsWith('@lit/') ||
                id.startsWith('@lit-labs/') ||
                id === 'vite' ||
                id === 'magic-string' ||
                id.startsWith('@vue/') ||
                id.startsWith('@nuxt/') ||
                id.startsWith('node:'),
        },
    }
    // build: {
    //     minify: false,
    //     commonjsOptions: {
    //         esmExternals: true,
    //     },
    //     lib: {
    //         entry: {
    //             'index': r('./src/entries/index.ts'),
    //             'ui/accordion': r('./src/components/accordion/index.ts'),
    //             'ui/button': r('./src/components/button/index.ts'),
    //             'ui/chip': r('./src/components/chip/index.ts'),
    //             'ui/breadcrumb': r('./src/components/breadcrumb/index.ts'),
    //             'ui/card': r('./src/components/card/index.ts'),
    //             'ui/switch': r('./src/components/switch/index.ts'),
    //             'ui/checkbox': r('./src/components/checkbox/index.ts'),
    //             'ui/drawer': r('./src/components/drawer/index.ts'),
    //             'ui/dropdown': r('./src/components/dropdown/index.ts'),
    //             'ui/radio': r('./src/components/radio/index.ts'),
    //             'ui/input': r('./src/components/input/index.ts'),
    //             'ui/menu': r('./src/components/menu/index.ts'),
    //             'ui/select': r('./src/components/select/index.ts'),
    //             'ui/sidebar': r('./src/components/sidebar/index.ts'),
    //             'ui/textarea': r('./src/components/textarea/index.ts'),
    //             'ui/file-upload': r('./src/components/file-upload/index.ts'),
    //             'ui/tag-input': r('./src/components/tag-input/index.ts'),
    //             'ui/tabs': r('./src/components/tabs/index.ts'),
    //             'ui/popover': r('./src/components/popover/index.ts'),
    //             'ui/modal': r('./src/components/modal/index.ts'),
    //             'ui/nav': r('./src/components/nav/index.ts'),
    //             'ui/table': r('./src/components/table/index.ts'),
    //         },
    //         formats: ['es'],
    //         name: '@mono-lit/helper',
    //         fileName: (format, entryName) => `${entryName}.js`,
    //         cssFileName: 'ui/index',
    //     },
    //     outDir: r('./dist'),
    //     rollupOptions: {
    //         output: {
    //             manualChunks: undefined,
    //             globals: {
    //                 lit: 'Lit',
    //                 'lit/decorators.js': 'Lit.decorators',
    //                 'lit/directives/if-defined.js': 'Lit.directives.ifDefined',
    //                 'lit/directives/when.js': 'Lit.directives.when',
    //             },
    //         },
    //         external: (id) => id === 'lit' || id.startsWith('lit/'),
    //     },
    // }
})
