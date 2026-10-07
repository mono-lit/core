// Root Vitest config. It exists so Vitest does NOT pick up the root `vite.config.ts`,
// which belongs to Vite+ (`vp run` tasks). Test projects are listed in
// `vitest.workspace.ts`.
import { defineConfig } from 'vitest/config'

export default defineConfig({})
