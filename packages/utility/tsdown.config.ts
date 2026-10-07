import { defineConfig } from "tsdown"
import dotenv from "dotenv"
import Vue from "unplugin-vue/rolldown"

dotenv.config()

// Packages inlined INTO @mono-lit/utility's dist (bundled, not externalized). @mono-lit/utility
// is consumed as a symlinked git dep, so Vite serves it raw from node_modules and
// never crawls/optimizes it — any bare `import "<cjs-pkg>"` it emits reaches the
// browser unoptimized and throws "doesn't provide an export named ..." for CJS
// packages (yup→tiny-case, @odata2ts/http-client-fetch). Bundling them at build
// makes the dist self-contained ESM (rolldown converts the CJS to ESM), so no
// runtime interop is needed. tsdown's `deps.alwaysBundle` is checked before the
// package.json production-deps externalization, so listed peers get bundled.
// NOTE: passed to `alwaysBundle` as a FUNCTION below — tsdown's default string/
// glob matcher (picomatch) mishandles scoped names like `@odata2ts/...`, so we
// match explicitly (exact, subpath, or RegExp).
const ALWAYS_BUNDLE: (string | RegExp)[] = [
  // yup + its CJS transitive `tiny-case`. The app keeps its OWN yup for authoring
  // schemas (app-source import → Vite optimizes it normally); same version →
  // schemas interop across the two instances.
  'yup',
  // @odata2ts/http-client-fetch (CJS) + its only dep @odata2ts/http-client-base —
  // stateless HTTP-client wrappers used by @mono-lit/utility's fetching helpers. NOT the
  // app's `@odata2ts/odata-service` / `odata-query-objects` (those stay external,
  // provided by the app's generated OData service), so a private instance is fine.
  /^@odata2ts\/http-client-fetch(\/.*)?$/,
  /^@odata2ts\/http-client-base(\/.*)?$/,
]

export default defineConfig({
  dts: { vue: true }, // emit .vue declarations (vue-tsc) — MonoNotivue.vue needs this
  copy: [
    "./bin/mono.mjs",
    "./bin/mono-clone.mjs",
    // Copied flat into dist/ alongside mono-clone.mjs, so its `./mono-git.mjs`
    // import resolves identically from bin/ and from dist/.
    "./bin/mono-git.mjs",
    "./bin/mono-env.mjs",
    // Ambient types for the `virtual:mono-apps` module (`@mono-lit/utility/virtual-mono-apps`).
    "./src/types/virtual-mono-apps.d.ts",
  ],

  entry: {
    index: "./pkg/index.ts",
    // (mono-dev-menu removed — that entry pulled in Menu/Login/Users.vue; the only
    // component we ship is MonoNotivue.vue, built via the `runtime` entry.)
    runtime: "./pkg/runtime.ts",
    config: "./pkg/config/index.ts",
    'config-node': './pkg/config/node.ts',
    fetching: "./pkg/wrapper-fetching.ts",
    nuxt: "./pkg/nuxt.ts",
    'nuxt-layers': "./pkg/nuxt-layers.ts",
    'nuxt-runtime': "./pkg/nuxt-runtime.ts",
    vite: "./pkg/vite.ts",
    'mono-prepare': "./pkg/cli/prepare.ts",
    'mono-skills': "./pkg/cli/skills/index.ts",
    'mono-db': "./pkg/cli/db/index.ts",
    'mock-db': "./pkg/mock-db/index.ts",
  },
  platform: "neutral",
  format: ["es"],
  clean: true,
  sourcemap: false,
  minify: false,
  // `platform: "neutral"` resolves only `module`/`browser` entry fields, so a
  // CJS-only package with just a `main` (e.g. @odata2ts/http-client-fetch) fails to
  // resolve and gets externalized — defeating `deps.alwaysBundle`. Append `main`
  // (last, so ESM `module` still wins for dual packages like yup) so CJS-only deps
  // we alwaysBundle actually inline.
  inputOptions(options) {
    options.resolve = {
      ...options.resolve,
      mainFields: ['module', 'browser', 'main'],
    }
    return options
  },
  deps: {
    // Function form: tsdown's default matcher (picomatch) mishandles scoped names,
    // so match our patterns explicitly. Checked BEFORE package.json prod-deps are
    // externalized, so listed peers (yup, @odata2ts/http-client-*) get inlined.
    alwaysBundle: (id: string) =>
      ALWAYS_BUNDLE.some((p) => (p instanceof RegExp ? p.test(id) : id === p || id.startsWith(p + '/'))),
    neverBundle: [
      "vite",
      'c12',

      "@nuxt/kit",
      "@nuxt/schema",

      "vue",
      "vue-router",
      "jwt-decode",
      "@vue/reactivity",
      "@vue/runtime-core",
      "@vue/runtime-dom",

      "jwt-decode",
      "@mono-lit/utility",

      // app-supplied runtime deps re-exposed via @mono-lit/utility/runtime
      "notivue",
      // (yup is now alwaysBundle'd — see ALWAYS_BUNDLE — so it's NOT external.)

      // The core fetch layer's (src/core) heavy runtime deps — keep them
      // external (apps already install these for OData/grid fetching). Regexes cover
      // devextreme/@odata2ts subpaths. json-server/chokidar/change-case are NOT on
      // any imported path (mock/dev tooling only), so they never enter the bundle.
      /^devextreme(\/.*)?$/,
      /^devextreme-vue(\/.*)?$/,
      // Keep the app-provided OData codegen packages external (the app's generated
      // service owns these instances), but NOT `@odata2ts/http-client-*`, which we
      // alwaysBundle above (CJS interop — see there). So match `odata-*` only.
      /^@odata2ts\/odata-.*/,
      "@mono-lit/devextreme",
      "exceljs",
      "json-server",
      "chokidar",
      "change-case",

      "unstorage",
      "h3",

      // @mono-lit/helper is a TYPE-ONLY dependency: @mono-lit/utility does `import type
      // { MonoHelperModuleOptions } from '@mono-lit/helper/nuxt'` so the `mono.helper`
      // config key gets full autocomplete. The import is erased at runtime, so
      // @mono-lit/helper must NEVER appear in the runtime bundle (keep it external).
      "@mono-lit/helper",

      "pkg-types",
      "citty",
      "dotenv",
    ],

    // DTS-phase override: DO inline @mono-lit/helper's types into the emitted .d.ts
    // (so consumers don't need @mono-lit/helper installed to read @mono-lit/utility's types).
    // This mirrors the runtime/neverBundle split above: runtime external, types
    // bundled. See `DepsConfig.dts` in tsdown.
    dts: {
      alwaysBundle: ['@mono-lit/helper'],
    },
  },

  plugins: [
    Vue({ isProduction: false }),
  ],
})
