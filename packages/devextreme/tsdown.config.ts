// tsdown.config.ts
import { defineConfig } from 'tsdown';

// devextreme is a DEPENDENCY, so `pnpm i` of this package installs it for the consumer — the
// apps no longer have to list it themselves — but it is never BUNDLED. This package is a thin
// re-export, so a DataSource made here must be the SAME class every other devextreme user in
// the app (@mono-lit/utility, any devextreme-vue widget) knows. A copy bundled in here is a foreign
// instance: a DxDataGrid handed one of its DataSources died with
// `this._scheduleLoadCallbacks is not a function`. Staying external keeps one instance as long
// as every package pins the same exact version (25.1.6), which pnpm then dedupes to one copy.
export default defineConfig({
  dts: true,
  // Match on the RAW specifier. Left to the default (dependencies by name), rolldown first
  // resolves `devextreme/data/data_source` through that subpath's package.json and emits the
  // resolved file — `devextreme/esm/data/data_source.js` — in BOTH builds and in the .d.ts.
  // The JS still works, but no `.d.ts` sits beside the esm/cjs files, so every consumer saw
  // `DataSource` as `any`. Matching the raw id keeps the public specifier, whose typings
  // devextreme ships (`devextreme/data/data_source.d.ts`).
  deps: {
    neverBundle: [/^devextreme(?:\/|$)/],
  },
  entry: {
    index: './pkg/index.ts',
  },
  // The nuxt templates import this from `mono.config.ts`, which Nitro evaluates on the
  // server as well as in the browser. `browser` only ever mattered while devextreme was
  // bundled in (it picked the browser export conditions of devextreme's own deps); with
  // everything external the output is four bare re-exports and both platforms emit the
  // identical file — `neutral` just says so.
  platform: 'neutral',
  format: ['esm', 'cjs'],        // ← dual ESM + CJS output
  clean: true,
  sourcemap: false,
  treeshake: true,
  // A library should not minify: the consuming app minifies its own bundle, so
  // doing it here buys nothing at runtime and costs real things.
  //
  // It cost us one outright build failure. Minification renamed an internal
  // helper to the single letter `h`; once this package was linked inside the
  // app's Vite root rather than under node_modules, auto-import scanned the
  // file, read that `h` as an undeclared use of Vue's `h()`, and prepended
  // `import { h } from 'vue'`:
  //
  //   [PARSE_ERROR] Identifier `h` has already been declared
  //
  // Single-letter globals are uniquely good at colliding with whatever a tool
  // injects, and
  // shipping readable names also gives consumers legible stack traces and keeps
  // `/*#__PURE__*/` annotations intact for their tree-shaker.
  //
  // matches @mono-lit/utility, which has always shipped unminified.
  minify: false,
});
