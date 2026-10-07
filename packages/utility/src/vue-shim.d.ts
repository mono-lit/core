declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * The compile-time global that carries the sanitized `mono.config.ts` subset into
 * the client bundle. Defined by `monoRepo` (Vite) / `@mono-lit/utility/nuxt` via Vite
 * `define`; deep-sanitized so it's always plain JSON (no functions/classes).
 */
declare const __MONO_CONFIG_EXPOSE__: Record<string, any>
