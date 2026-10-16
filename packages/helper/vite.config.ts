import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import dotenv from 'dotenv'
import injectHTML from 'vite-plugin-html-inject';
import { createRequire } from 'node:module'

dotenv.config()

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// The demo dev server only (`pnpm dev`). The library itself is built by tsdown —
// see `tsdown.config.ts`.

// Same alias as the library build: remark's `browser` export of
// `decode-named-character-reference` touches `document` at module scope; its
// `default` export is a plain lookup table.
const NO_DOM_ENTITY_DECODER = createRequire(import.meta.url).resolve(
    'decode-named-character-reference',
)

export default defineConfig({
    root: r('./demo/pages'),
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
    publicDir: r('./demo/public'),
    plugins: [
        injectHTML() as Plugin,
        UnoCSS() as Plugin[],
    ],
})
