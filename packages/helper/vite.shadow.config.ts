import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import UnoCSS from 'unocss/vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Same reason as in `vite.config.ts`: keep the report chunk free of the
// DOM-at-module-scope entity decoder that remark's `browser` export pulls in.
const NO_DOM_ENTITY_DECODER = createRequire(import.meta.url).resolve(
  'decode-named-character-reference',
)

// Separate build for the shadow-DOM / SSR entries (`@mono-lit/helper/ui/shadow/*`).
//
// Why its own config: unlike the light `ui/*` builds (which BUNDLE lit so they
// are self-contained), the shadow build keeps `lit` EXTERNAL. At runtime the
// consuming app resolves `lit` per export condition — on the server that's lit's
// `node` build (`NODE_MODE = true`), whose lit-html uses an SSR-safe tree-walker
// stub when `document` is undefined and whose reactive-element gets `HTMLElement`
// from `@lit-labs/ssr-dom-shim`. That makes the element importable on the server
// (for `@lit-labs/ssr` / `nuxt-ssr-lit`) WITHOUT a global DOM shim — which would
// otherwise break Vue/Pinia SSR. Consumers of `@mono-lit/helper/ui/shadow/*` must have
// `lit` resolvable (it's a peerDependency).
export default defineConfig({
  resolve: {
    alias: {
      'decode-named-character-reference': NO_DOM_ENTITY_DECODER,
    },
  },
  plugins: [
    // The shadow table pulls in the same controller as the light build, so its
    // `table.export()` reaches the report engine too. Mark `exceljs` external
    // while the specifier is still bare — Vite's resolver would otherwise
    // rewrite it to the `browser` field path and inline 1.3MB into the shadow
    // chunk. Mirrors the plugin in `vite.config.ts`.
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
    // `handlebars` is the report template engine and an optional peer — same
    // reasoning, and it has the same `browser`-field rewrite trap.
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
    // `chart.js` is an optional peer of the chart addon — same reasoning.
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
    // `suneditor` is the optional peer of the rich-text-editor addon — same reasoning.
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
    // `@floating-ui/*` — the optional peers of the tooltip addon, same reasoning.
    // Shadow components import the tooltip module only transitively (none do
    // today), but an import that slips in must never inline the library.
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
    // `@mono-lit/utility` is an optional peer used only by the chart's `odata` path. It
    // is a workspace/symlinked package, so without this Vite resolves it to a real
    // path and inlines the whole fetching stack (devextreme included).
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
    // UnoCSS still runs so `// @unocss-include` template classes resolve; the
    // per-component shadow stylesheet is inlined via `?raw` into `static styles`.
    UnoCSS() as Plugin[],
  ],
  build: {
    // Matches the light build — see the note in vite.config.ts. A library leaves
    // minification to the consuming app; mangled single-letter globals are what
    // collided with Vue's `h` once these bundles moved inside the app's Vite root.
    minify: false,
    emptyOutDir: false, // share dist/ with the main build — don't wipe it
    lib: {
      entry: {
        'ui/shadow/accordion': r('./src/components/accordion/index.shadow.ts'),
        'ui/shadow/breadcrumb': r('./src/components/breadcrumb/index.shadow.ts'),
        'ui/shadow/nav': r('./src/components/nav/index.shadow.ts'),
        'ui/shadow/input': r('./src/components/input/index.shadow.ts'),
        'ui/shadow/drawer': r('./src/components/drawer/index.shadow.ts'),
        'ui/shadow/dropdown': r('./src/components/dropdown/index.shadow.ts'),
        'ui/shadow/sidebar': r('./src/components/sidebar/index.shadow.ts'),
        'ui/shadow/menu': r('./src/components/menu/index.shadow.ts'),
        'ui/shadow/modal': r('./src/components/modal/index.shadow.ts'),
        'ui/shadow/table': r('./src/components/table/index.shadow.ts'),
        'ui/shadow/dropdown-table': r('./src/components/dropdown-table/index.shadow.ts'),
        'ui/shadow/filter': r('./src/components/filter/index.shadow.ts'),
        'ui/shadow/alert': r('./src/components/alert/index.shadow.ts'),
        'ui/shadow/card': r('./src/components/card/index.shadow.ts'),
        'ui/shadow/chart': r('./src/components/chart/index.shadow.ts'),
        'ui/shadow/button': r('./src/components/button/index.shadow.ts'),
        'ui/shadow/button-dropdown': r('./src/components/button/index.button-dropdown.shadow.ts'),
        'ui/shadow/chip': r('./src/components/chip/index.shadow.ts'),
        'ui/shadow/tabs': r('./src/components/tabs/index.shadow.ts'),
        'ui/shadow/checkbox': r('./src/components/checkbox/index.shadow.ts'),
        'ui/shadow/file-upload': r('./src/components/file-upload/index.shadow.ts'),
        'ui/shadow/radio': r('./src/components/radio/index.shadow.ts'),
        'ui/shadow/select': r('./src/components/select/index.shadow.ts'),
        'ui/shadow/switch': r('./src/components/switch/index.shadow.ts'),
        'ui/shadow/tag-input': r('./src/components/tag-input/index.shadow.ts'),
        'ui/shadow/textarea': r('./src/components/textarea/index.shadow.ts'),
        'ui/shadow/rich-text-editor': r('./src/components/rich-text-editor/index.shadow.ts'),
        'ui/shadow/date': r('./src/components/date/index.shadow.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: r('./dist'),
    rollupOptions: {
      // Keep lit external so the runtime picks the env-correct build.
      external: (id) =>
        id === 'chart.js' ||
        id.startsWith('chart.js/') ||
        id === 'suneditor' ||
        id.startsWith('suneditor/') ||
        id.startsWith('@floating-ui/') ||
        id.startsWith('@aejkatappaja/') ||
        id === 'lit' ||
        id.startsWith('lit/') ||
        id === 'lit-html' ||
        id.startsWith('lit-html/') ||
        id === 'lit-element' ||
        id.startsWith('lit-element/') ||
        id.startsWith('@lit/') ||
        id.startsWith('@lit-labs/'),
      output: {
        manualChunks: undefined,
      },
    },
  },
})
