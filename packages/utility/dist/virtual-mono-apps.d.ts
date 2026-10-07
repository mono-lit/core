/**
 * `virtual:mono-apps` — provided by @mono-lit/utility's Vite plugin (`monoLith()` or
 * `monoRepo().vite()` / `mono.plugin`): one lazy import per federated app's
 * `mono.config`, keyed by app name, whether the app is a `.mono/apps` clone or
 * an `apps[].path` sibling.
 *
 * Reference it from the app's `env.d.ts`:
 *   /// <reference types="@mono-lit/utility/virtual-mono-apps" />
 */
declare module 'virtual:mono-apps' {
  const apps: Record<
    string,
    () => Promise<{ default: import('@mono-lit/utility/config').MonoConfig }>
  >
  export default apps
}
