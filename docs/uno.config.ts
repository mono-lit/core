import { defineConfig, presetIcons, presetWind4 } from 'unocss'
import { fileURLToPath, URL } from 'node:url'

// Absolute path to this folder — the VitePress root (pages live beside this file). Using an
// absolute path here avoids confusion about whether globs are resolved relative
// to the Vite root, the CWD, or this config file.
//
// IMPORTANT: forward-slash normalization is required on Windows. fileURLToPath
// returns backslashes (`C:\path\to\docs\`), but fast-glob (UnoCSS's filesystem
// scanner) treats `\` as the escape character — `C:\…\docs\**/*.vue` matches
// ZERO files on first load. With forward slashes the same glob matches every
// file, so the initial `virtual:uno.css` payload contains all the utility
// classes used in the docs. Without this, styles only appear after a file save
// because Vite's transform pipeline (which uses real file paths, not globs)
// does the scanning instead.
const docsDir = fileURLToPath(new URL('./', import.meta.url)).replace(/\\/g, '/')

export default defineConfig({
  presets: [
    presetWind4({
      preflights: { reset: true },
    }),
    // Enables iconify utility classes (`i-mdi-*`, `i-tabler-*`, `i-lucide-*`,
    // etc.) — used by mono-menu when `item.icon` is an iconify class string.
    // Collections resolve via `@iconify-json/*` packages hoisted by pnpm.
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  content: {
    // pipeline.include accepts FilterPattern (regex). The default already
    // covers .vue/.md/.html — the explicit regex below mirrors the default
    // so VitePress markdown files and Vue SFCs are scanned for utility classes.
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
      ],
    },
    // filesystem watches files outside the Vite import graph so HMR rescans
    // when they change. Absolute glob is robust against CWD/root assumptions.
    // The root also holds node_modules, build output and e2e scripts — keep them out.
    filesystem: [
      `${docsDir}**/*.{vue,ts,tsx,html,md}`,
      `!${docsDir}node_modules/**`,
      `!${docsDir}.vitepress/{dist,cache}/**`,
      `!${docsDir}e2e/**`,
    ],
  },
})
