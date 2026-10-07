// Shared plumbing for the browser-driven regression tests.
//
// Deliberately NOT vitest: these need a built `dist/` and a real browser, so vitest
// would only add a layer. Run them with `pnpm test:perf` after `pnpm build`.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

export const HERE = path.dirname(fileURLToPath(import.meta.url))
export const PKG = path.resolve(HERE, '../..')
const WORKSPACE = path.resolve(PKG, '../..')

const require_ = createRequire(import.meta.url)

/** Resolve a workspace-root dependency — these live at the monorepo root, not here. */
function fromWorkspace(spec) {
  return require_(path.join(WORKSPACE, 'node_modules', spec))
}

export async function loadPlaywright() {
  const mod = await import(
    new URL(`file:///${path.join(WORKSPACE, 'node_modules/playwright/index.js').replace(/\\/g, '/')}`)
  )
  return mod.default ?? mod
}

/** `@mono-lit/helper/ui/<c>` and `@mono-lit/helper/ui/shadow/<c>` → the built files. */
function uiAliases() {
  const out = {}
  const ui = path.join(PKG, 'dist/ui')
  for (const f of fs.readdirSync(ui)) {
    if (f.endsWith('.js')) out[`@mono-lit/helper/ui/${f.slice(0, -3)}`] = path.join(ui, f)
  }
  const shadow = path.join(ui, 'shadow')
  if (fs.existsSync(shadow)) {
    for (const f of fs.readdirSync(shadow)) {
      if (f.endsWith('.js')) out[`@mono-lit/helper/ui/shadow/${f.slice(0, -3)}`] = path.join(shadow, f)
    }
  }
  return out
}

/**
 * Bundle the fixture into a single classic script.
 *
 * `dist/ui/*.js` carry bare `lit` imports and relative chunk imports, so they cannot
 * be dropped into a `<script type="module">` as-is — esbuild flattens the whole graph
 * (fixture + Vue + the built components) into one IIFE.
 */
export async function bundleFixture(name = 'app') {
  const esbuild = fromWorkspace('esbuild')
  const vueEsm = require_.resolve('vue/dist/vue.esm-bundler.js', {
    paths: [WORKSPACE, PKG],
  })

  const out = path.join(HERE, `.tmp-${name}.js`)
  await esbuild.build({
    entryPoints: [path.join(HERE, `fixtures/${name}.js`)],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    outfile: out,
    absWorkingDir: HERE,
    nodePaths: [path.join(WORKSPACE, 'node_modules'), path.join(PKG, 'node_modules')],
    alias: {
      vue: vueEsm,
      // The fixture imports the PUBLIC entry points, so the test exercises exactly
      // what consumers load: every `dist/ui/<c>.js` and `dist/ui/shadow/<c>.js`
      // maps to its `@mono-lit/helper/ui/…` specifier.
      ...uiAliases(),
    },
    // The rich-text-editor entry carries `import('suneditor/css/editor')` — a CSS
    // import esbuild cannot express in an IIFE. Fixtures set `load-css="false"`
    // and the page inlines the sheet instead (see `sunEditorCss()`).
    external: ['suneditor/css/editor', 'suneditor/css/contents'],
    define: {
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      'process.env.NODE_ENV': '"production"',
    },
  })

  const code = fs.readFileSync(out, 'utf8')
  fs.rmSync(out, { force: true })
  return code
}

/**
 * A built flavor sheet (`dist/ui/theme/<name>.css`), for a fixture page that has
 * to measure a NAMED look. The default sheet carries ONE, whose components
 * deliberately differ from the Basecoat reference, so a spec asserting upstream's
 * own values loads vega on top and the fixture adds `theme-vega` to `<html>`.
 */
export function flavorCss(name) {
  return fs.readFileSync(path.join(PKG, `dist/ui/theme/${name}.css`), 'utf8')
}

/** SunEditor's UI stylesheet from the dev dependency, for the fixtures that inline it. */
export function sunEditorCss() {
  // `suneditor/css/editor` resolves to the source sheet, which `@import`s its
  // design tokens relatively — so read the self-contained minified build by
  // path (the package's `exports` map does not expose it).
  const pkg = path.dirname(require_.resolve('suneditor/package.json', { paths: [PKG, WORKSPACE] }))
  return fs.readFileSync(path.join(pkg, 'dist/suneditor.min.css'), 'utf8')
}

export function assertBuilt() {
  const css = path.join(PKG, 'dist/ui/index.css')
  if (!fs.existsSync(css)) {
    throw new Error(`dist/ui/index.css not found — run \`pnpm build\` in ${PKG} first.`)
  }
  return fs.readFileSync(css, 'utf8')
}

/**
 * Serve the fixture named by `?fixture=` (default `app`); everything else in the
 * query string belongs to the fixture itself (`?rows=`, `?arm=`).
 */
export async function serve(pages) {
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://x').searchParams.get('fixture') ?? 'app'
    const html = pages[name]
    if (!html) {
      res.writeHead(404)
      res.end(`no fixture "${name}"`)
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
  })
  await new Promise((resolve) => server.listen(0, resolve))
  return { server, port: server.address().port }
}

export function pageHtml(css, js) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style>
<style>
  body { margin: 0; font: 14px system-ui; }
  .wrap { display: flex; flex-direction: column; gap: 12px; padding: 12px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .cell { padding: 4px; border: 1px solid #eee; }
  .card { background: #fff; padding: 12px; }
</style></head><body><div id="app"></div><script>${js}</script></body></html>`
}

/** Minimal assertion collector so a failure names itself and sets the exit code. */
export function createReporter(title) {
  const results = []
  return {
    check(name, pass, detail) {
      results.push({ name, pass, detail })
    },
    report() {
      console.log(`\n  ${title}`)
      console.log('  ' + '-'.repeat(title.length))
      for (const r of results) {
        console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `\n        -> ${r.detail}`}`)
      }
      const passed = results.filter((r) => r.pass).length
      console.log(`\n  ${passed}/${results.length} passed\n`)
      return results.every((r) => r.pass)
    },
  }
}
