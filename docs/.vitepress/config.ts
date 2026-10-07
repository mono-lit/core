import { defineConfig, Plugin } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'
import llmstxtPlugin from 'vitepress-plugin-llmstxt';
import { llmsDemoTransform } from './plugins/patch-llms-demo-source'
import { monoTypesVirtualPlugin } from './plugins/mono-types-virtual'
import { monoShadowDemosPlugin } from './plugins/mono-shadow-demos'
import { llmsDescriptionsPlugin } from './plugins/llms-descriptions'



const docsUnoConfig = fileURLToPath(
  new URL('../uno.config.ts', import.meta.url),
)

const themeBootScript = `
(function () {
  try {
    var html = document.documentElement;

    // Theme color (palette) — apply .theme-color-<name> before paint (no FOUC).
    var savedColor = localStorage.getItem('mono-helper-theme-color');
    var colors = ['one', 'basecoat'];
    var color = colors.indexOf(savedColor) >= 0 ? savedColor : 'one';
    html.classList.add('theme-color-' + color);
    html.setAttribute('data-theme-color', color);

    // Flavor (structure) — ONE is the default (no class); every Basecoat
    // style adds .theme-<name>.
    var savedTheme = localStorage.getItem('mono-helper-theme');
    var themes = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'];
    var theme = themes.indexOf(savedTheme) >= 0 ? savedTheme : 'one';
    if (theme !== 'one') html.classList.add('theme-' + theme);
    html.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`.trim()

const host = '127.0.0.1'

export default withMermaid({
  ...defineConfig({
    title: 'Mono',
    description: 'Mono-repo orchestration + Lit web components for the Vue ecosystem.',

    appearance: true,
    cleanUrls: true,
    // The pages share this folder with the site's own files — don't build those as pages.
    srcExclude: ['README.md', 'e2e/**'],
    head: [
      ['script', {}, themeBootScript],
    ],

    vite: {
      server: {
        host,
      },
      optimizeDeps: {
        // mermaid (ESM) is left un-prebundled by Vite, so its CJS sub-deps are
        // served raw and their exports aren't exposed under native ESM →
        // "doesn't provide an export named 'sanitizeUrl'" / "…named 'default'".
        // Vite's documented fix for a CJS dep of an ESM dep is the nested
        // `esm > cjs` include — it force-prebundles that transitive dep (resolved
        // from mermaid's own context, which also avoids the pnpm linking issue).
        //
        // `dayjs` is the same shape as sanitize-url: CJS-only (main is the UMD
        // `dayjs.min.js`, no `module` field / import condition), so served raw it
        // has no `default` export → "doesn't provide an export named 'default'".
        //
        // mermaid's other CJS-only deps (cytoscape-cose-bilkent, cytoscape-fcose)
        // are deliberately NOT listed: Vite can't resolve them here under pnpm, so
        // adding them only emits a "Failed to resolve dependency" warning without
        // pre-bundling anything. Add them only if they actually start failing.
        include: [
          'mermaid > @braintree/sanitize-url',
          'mermaid > dayjs',
        ],
      },

      ssr: {
        // @mono-lit/utility/fetching (its src/core fetch layer) drags in deps that VitePress's Node-ESM
        // SSR pass can't handle: devextreme uses directory imports (e.g.
        // `devextreme/data/data_source`), and exceljs/handlebars/file-saver-es are
        // CommonJS (no named exports under native ESM). Bundling them with Vite —
        // which resolves directory imports and applies CJS↔ESM interop — fixes both.
        noExternal: [
          'devextreme',
          '@mono-lit/utility',
          'exceljs',
          // Now an optional peer of the export engine rather than bundled, so the
          // docs site resolves it from its own dependencies.
          'handlebars',
          'file-saver-es',
          'notivue',
          // SunEditor's source is ESM with EXTENSIONLESS relative imports
          // (`./command/blockquote`), which Node's loader rejects when a demo
          // statically imports `suneditor/plugins`; bundling resolves them.
          'suneditor',
          '@odata2ts/http-client-fetch',
          'uuid',
          'tslib'
        ],
      },

      plugins: [
        monoShadowDemosPlugin() as Plugin,

        monoTypesVirtualPlugin() as Plugin,

        UnoCSS({
          configFile: docsUnoConfig,
        }) as Plugin[],

        llmstxtPlugin({ 
          hostname: 'https://mono-libs.netlify.app',
          // Same exclusions as `srcExclude`: the site's own README/e2e share this folder.
          ignore: ['README.md', 'e2e/**'],
          // Index only the `.md` (LLMs) links — an AI reads the raw markdown, so
          // the parallel `## Web links` list of HTML pages is pure duplication.
          llmsFile: { indexTOC: 'only-llms' },
          // Expand each <DemoSingle name id /> into the real demo source. Runs over
          // every generated page AND the concatenated llms-full.txt, at the right
          // point in the llmstxt pipeline (before files are written).
          //@ts-ignore
          transform: llmsDemoTransform,
        }) as Plugin,

        // Post-processes the generated llms.txt to append each doc's summary
        // (frontmatter description, else first paragraph) to its link line.
        // MUST be last so its closeBundle runs after llmstxt writes the index.
        llmsDescriptionsPlugin() as Plugin,
      ],
    },

    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('mono-'),
        },
      },
    },

    themeConfig: {
      outline: {
        level: [2, 3],
        label: 'On this page',
      },

      sidebar: [
        {
          text: 'Mono-Repo',
          items: [
            { text: 'Getting Started', link: '/repo/getting-started' },
            { text: 'Setup', link: '/repo/setup' },
            { text: 'Config', link: '/repo/config' },
            { text: 'Useful Utils', link: '/repo/useful-utils' },
            { text: 'Sync Host and Remotes', link: '/repo/sync' },
            { text: 'Environment', link: '/repo/env' },
            { text: 'Data Fetching', link: '/repo/data-fetching' },
            { text: 'Mock API', link: '/repo/mock-api' },
            { text: 'Provide and Inject', link: '/repo/provide-inject' },
            { text: 'Resolvers', link: '/repo/resolvers' },
            { text: 'Template Changelog', link: '/repo/template-changelog' },
          ],
        },
        {
          // The same federation with every app a sibling folder of ONE repo,
          // connected by `apps[].path` instead of a GitHub clone.
          text: 'Mono-Lith',
          items: [
            { text: 'Getting Started', link: '/lith/getting-started' },
            { text: 'Config: path and url', link: '/lith/config' },
            { text: 'Dev Server & HMR', link: '/lith/dev-server' },
            { text: 'CLI & TypeScript', link: '/lith/cli-typescript' },
            { text: 'Root runner (Vite+)', link: '/lith/root-runner' },
          ],
        },
        {
          // The OData story end to end: the reactive handle, the generated
          // types, and the URL query language underneath both.
          text: 'Mono-Odata',
          items: [
            { text: 'OData Expression', link: '/odata/expression' },
            { text: 'DataSource', link: '/odata/datasource' },
            { text: 'OData Types', link: '/odata/types' },
          ],
        },
        {
          text: 'Mono-AI',
          items: [
            { text: 'Prompting Guide', link: '/ai/prompting' },
            { text: 'Template Rules', link: '/ai/template' },
            { text: 'Reference LLMs', link: '/ai/ref-llms' },
            { text: 'Skills', link: '/ai/skills' },
          ],
        },
        {
          // Optional extras that pull in heavy externalized deps (exceljs,
          // notivue, yup) — kept out of the core bundle, hence "Addons".
          text: 'Mono-Addons',
          items: [
            { text: 'Chart.js', link: '/addons/chart' },
            { text: 'Rich Text Editor', link: '/addons/rich-text-editor' },
            { text: 'Export Table', link: '/addons/table-export' },
            { text: 'Import Table', link: '/addons/table-import' },
            { text: 'Notivue', link: '/addons/notivue' },
            { text: 'Tooltip', link: '/addons/tooltip' },
            { text: 'Skeleton', link: '/addons/skeleton' },
            { text: 'Yup', link: '/addons/yup' },
          ],
        },
        {
          text: 'Mono-UI',
          items: [
            { text: 'Getting Started', link: '/ui/getting-started' },
            { text: 'Theme', link: '/ui/theme' },
            { text: 'Color', link: '/ui/color' },
            { text: 'DOM Type', link: '/ui/dom-type' },
            { text: 'Global Defaults', link: '/ui/global-defaults' },
            {
              text: 'Form',
              collapsed: false,
              items: [
                { text: 'Form', link: '/ui/form' },
                { text: 'Checkbox', link: '/ui/checkbox' },
                { text: 'Radio', link: '/ui/radio' },
                { text: 'Switch', link: '/ui/switch' },
                { text: 'Input', link: '/ui/input' },
                { text: 'Date', link: '/ui/date' },
                { text: 'Textarea', link: '/ui/textarea' },
                { text: 'Select', link: '/ui/select' },
                { text: 'File upload', link: '/ui/file-upload' },
                { text: 'Tag input', link: '/ui/tag-input' },
              ],
            },
            {
              text: 'Display',
              collapsed: false,
              items: [
                { text: 'Button', link: '/ui/button' },
                { text: 'Button dropdown', link: '/ui/button-dropdown' },
                { text: 'Chip', link: '/ui/chip' },
                { text: 'Card', link: '/ui/card' },
                { text: 'Alert', link: '/ui/alert' },
              ],
            },
            {
              text: 'Data',
              collapsed: false,
              items: [
                { text: 'Table', link: '/ui/table' },
                { text: 'Dropdown table', link: '/ui/dropdown-table' },
                { text: 'Filter builder', link: '/ui/filter' },
              ],
            },
            {
              text: 'Disclosure',
              collapsed: false,
              items: [
                { text: 'Accordion', link: '/ui/accordion' },
              ],
            },
            {
              text: 'Navigation',
              collapsed: false,
              items: [
                { text: 'Tabs', link: '/ui/tabs' },
              ],
            },
            {
              text: 'Overlay',
              collapsed: false,
              items: [
                { text: 'Drawer', link: '/ui/drawer' },
                { text: 'Dropdown', link: '/ui/dropdown' },
                { text: 'Modal', link: '/ui/modal' },
              ],
            },
            {
              text: 'Layout',
              collapsed: false,
              items: [
                { text: 'Nav', link: '/ui/nav' },
                { text: 'Sidebar', link: '/ui/sidebar' },
                { text: 'Menu', link: '/ui/menu' },
                { text: 'Breadcrumb', link: '/ui/breadcrumb' },
              ],
            },
          ],
        },
        {
          text: 'Example',
          items: [
            {
              text: 'Layout',
              link: '/example/layout',
              target: '_blank',
              rel: 'noopener',
            },
            {
              text: 'Layout Rule',
              link: '/example/layout-rule',
              target: '_blank',
              rel: 'noopener',
            },
            {
              text: 'Odoo Sales',
              link: '/example/odoo',
              target: '_blank',
              rel: 'noopener',
            },
            {
              text: 'LinkedIn Feed',
              link: '/example/linkedin',
              target: '_blank',
              rel: 'noopener',
            },
          ],
        },
      ],
    },
  }),

  // Mermaid rendering options (vitepress-plugin-mermaid forwards these to
  // mermaid.initialize). Node size is driven by font size + node padding;
  // bump these to make nodes bigger. nodeSpacing/rankSpacing add room between
  // nodes so the bigger boxes don't crowd.
  mermaid: {
    flowchart: {
      padding: 18,        // inner padding of each node box
      nodeSpacing: 60,    // gap between nodes on the same rank
      rankSpacing: 70,    // gap between ranks
      useMaxWidth: true,  // false = render at natural (larger) size, no shrink-to-fit
    },
    themeVariables: {
      fontSize: '20px',   // biggest single lever for node size
    },
  },
})
