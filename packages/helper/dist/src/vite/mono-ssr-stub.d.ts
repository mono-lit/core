import { Plugin } from 'vite';
export interface MonoSsrStubOptions {
    /**
     * Import prefix whose side-effect (web component registration) modules
     * should be stubbed during the server build. CSS entries are never stubbed.
     */
    packagePrefix?: string;
}
/**
 * `@mono-lit/helper/ui/*` entries register Lit custom elements at module load
 * (`class extends HTMLElement` + `customElements.define(...)`), which throws
 * `HTMLElement is not defined` when evaluated in the Node SSR context.
 *
 * Every `<mono-*>` tag is already wrapped in `<ClientOnly>` and declared via
 * `isCustomElement`, so nothing on the server needs these elements registered.
 * This plugin resolves those side-effect imports to an empty module in the
 * server build only — the client build keeps the real modules, so the elements
 * still register and render after hydration.
 */
export declare function monoSsrStubPlugin(options?: MonoSsrStubOptions): Plugin;
