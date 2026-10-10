// Vite+ workspace config — used ONLY for `vp run` task orchestration + caching.
// (Vitest keeps its own root `vitest.config.ts`, which takes precedence over this file.)
//
//   vp run lib:all      build every library, in dependency order, cached
//   vp run site:build   build the docs site (builds the libraries first)
//   vp cache clean      drop all cached task results
//
// The root package.json scripts (`pnpm build`, `pnpm dev`, …) call these tasks, so
// both entry points behave the same.
import { defineConfig } from 'vite-plus'

/**
 * A cached build of one workspace folder: runs that folder's own `build` script.
 * Excluded from the inputs:
 * - its previous `dist/`: the builders clean and rewrite it, and a task that reads what it
 *   writes can't be cached;
 * - the ROOT package.json: `pnpm run` reads it every time, so editing a root script would
 *   otherwise rebuild everything. (Each package's own package.json stays tracked.)
 */
const IGNORED_INPUTS = ['!package.json', '!**/node_modules/.cache/**', '!**/node_modules/.vite/**']

const buildIn = (dir: string, dependsOn: string[] = [], outDir = `${dir}/dist`) => ({
  command: 'pnpm run build',
  cwd: dir,
  dependsOn,
  cache: {
    input: [{ auto: true }, `!${outDir}/**`, ...IGNORED_INPUTS],
    output: [`${outDir}/**`],
  },
})

export default defineConfig({
  run: {
    tasks: {
      // Build order: utility's .d.ts inlines helper's types, and helper's build reads
      // utility's — so utility is built before AND after helper.
      'lib:devextreme': buildIn('packages/devextreme'),
      'lib:utility-base': buildIn('packages/utility', ['lib:devextreme']),
      'lib:helper': buildIn('packages/helper', ['lib:utility-base']),
      'lib:utility': buildIn('packages/utility', ['lib:helper']),
      'lib:all': {
        command: 'node -e "console.log(\'libraries built\')"',
        dependsOn: ['lib:utility'],
        cache: false,
      },

      // Docs site (VitePress). Output: docs/.vitepress/dist.
      'site:build': {
        ...buildIn('docs', ['lib:all'], 'docs/.vitepress/dist'),
        cache: {
          input: [{ auto: true }, '!docs/.vitepress/dist/**', '!docs/.vitepress/cache/**', ...IGNORED_INPUTS],
          output: ['docs/.vitepress/dist/**'],
        },
      },
    },
  },
})
