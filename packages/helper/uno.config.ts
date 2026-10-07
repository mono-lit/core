import { defineConfig, presetIcons, presetWind4 } from 'unocss'
import presetWebFonts from '@unocss/preset-web-fonts'
import { FONT_SHEETS } from './scripts/font-sheets.mjs'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  // In the production library build, push everything UnoCSS generates (fonts,
  // remaining preflights, and any scanned utility/icon classes) into a single
  // low-priority `@layer mono`. Per the CSS cascade, a consumer's *unlayered*
  // utilities (their own `hidden`, `md:block`, etc.) always win over anything in
  // a layer — so mono's stray `.hidden`/`.flex`/`.w-full` can never override the
  // consumer's utilities, with no `!important` and regardless of import order.
  // Component CSS (imported as plain CSS via entries/index.css) stays UNLAYERED,
  // so components keep their normal precedence. Left off in dev so the demo's
  // cascade is unchanged.
  ...(isProd ? { outputToCssLayers: { cssLayerName: () => 'mono' } } : {}),
  presets: [
    // Reset stays ON for the dev demo (its standalone pages rely on it) but is
    // OFF for the production library build, so dist/ui/index.css does not ship a
    // global reset that would collide with a consumer's own UnoCSS/Tailwind reset.
    presetWind4({ preflights: { reset: !isProd } }),
    // `sans` is the ONE flavor's typeface (`--font-sans: "Poppins", …` in
    // flavors/one.css). In the LIBRARY build the preset only NAMES the fonts
    // (`provider: 'none'`): dist/ui/index.css carries no @font-face. Loading them
    // is opt-in — `import '@mono-lit/helper/ui/font/poppins.css'` — built by
    // scripts/font-sheets.mjs with this same preset + the local processor, so the
    // files are self-hosted. Dev (the demo) loads them from the CDN.
    // ONE font list: FONT_SHEETS is exactly what ships as `@mono-lit/helper/ui/font/<name>.css`,
    // so the demo gets the same faces plus a utility per sheet (`font-inter`, `font-geist`, `font-poppins`,
    // `font-geist-mono`) next to the role names `font-sans` / `font-mono` (which read
    // `--font-sans` / `--font-mono`, i.e. the theme's family behind the sheet override hook).
    presetWebFonts({
      ...(isProd ? { provider: 'none' as const } : {}),
      fonts: {
        sans: FONT_SHEETS.poppins.spec,
        mono: FONT_SHEETS['geist-mono'].spec,
        ...Object.fromEntries(Object.entries(FONT_SHEETS).map(([name, { spec }]) => [name, spec])),
      },
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: {
    'btn-base': 'inline-flex items-center justify-center gap-1 font-sans font-600 cursor-pointer border-none transition-all duration-150 whitespace-nowrap no-underline leading-tight',
    'btn-active': 'active:scale-95',
    'btn-disabled': 'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
    'btn-focus': 'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'btn-hover': 'hover:scale-105 hover:shadow-lg',
  },
  // Built-in default file-type icons returned by `getFileIcon` (file-upload).
  // Safelisted so their preset-icons CSS always ships in dist/ui/index.css,
  // even for consumers without their own UnoCSS scan.
  safelist: [
    // file-upload — file-type + dropzone icons. Every entry here that a
    // component renders ITSELF must also be in scripts/mdi-glyphs.mjs, or the
    // shadow build cannot draw it (its masks don't cross the shadow boundary).
    'i-mdi-cloud-upload-outline',
    'i-mdi-cloud-upload',
    'i-mdi-folder-upload',
    'i-mdi-file-image',
    'i-mdi-file-pdf-box',
    'i-mdi-file-excel',
    'i-mdi-file-word',
    'i-mdi-zip-box',
    'i-mdi-file-video',
    'i-mdi-file-music',
    'i-mdi-file',
    // alert — status icons (kept in step with scripts/mdi-glyphs.mjs NAMES)
    'i-mdi-information-outline',
    'i-mdi-check-circle-outline',
    'i-mdi-alert-outline',
    'i-mdi-alert-circle-outline',
    'i-mdi-bell-outline',
    // shared default icons across components (close/clear, chevrons, etc.)
    'i-mdi-close',
    'i-mdi-refresh',
    'i-mdi-chevron-up',
    'i-mdi-chevron-down',
    'i-mdi-chevron-right',
    'i-mdi-clock-outline',
    'i-mdi-calendar-outline',
    'i-mdi-magnify',
    // mono-table-checkbox — the spinner shown while a `mode="all"` drain runs
    'i-mdi-loading',
    // table sort indicator (mono-table-th / mono-table-sort): neutral + directional
    'i-fluent-arrow-sort-16-filled',
    'i-ri-arrow-up-long-fill',
    'i-ri-arrow-down-long-fill',
    // table header filter (mono-table-th): the funnel is outlined until the column
    // is actually filtered, then filled
    'i-mdi-filter-outline',
    'i-mdi-filter',
  ],
  content: {
    pipeline: {
      include: ['./src/**/*.{js,ts,html}'],
    },
  },
})