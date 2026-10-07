/**
 * Cached loader for the OPTIONAL `@floating-ui/dom` peer (which itself depends on
 * `@floating-ui/core` — both are the consumer's to install).
 *
 * Loaded on the FIRST show, never at import: registering a tooltip in
 * `<script setup>` costs nothing until somebody actually hovers. Externalized in
 * both vite configs, so the consumer's bundler resolves and splits it.
 */
let _floatingPromise: Promise<typeof import('@floating-ui/dom')> | null = null

export function loadFloatingUi(): Promise<typeof import('@floating-ui/dom')> {
  _floatingPromise ??= import('@floating-ui/dom').catch((err) => {
    _floatingPromise = null // let a later attempt retry
    throw new Error(
      '[mono-tooltip] needs the optional peer dependencies "@floating-ui/dom" and "@floating-ui/core". ' +
        'Install them in your app: pnpm add @floating-ui/dom @floating-ui/core' +
        (err?.message ? ` (original error: ${err.message})` : ''),
    )
  })
  return _floatingPromise
}
