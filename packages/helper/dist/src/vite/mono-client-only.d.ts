import { Plugin } from 'vite';
export interface MonoClientOnlyOptions {
    prefix?: string;
    wrapper?: string;
    /**
     * Tag names (e.g. `'mono-nav'`) to NOT wrap in the client-only wrapper.
     * Use this for components that are server-rendered by another mechanism
     * (e.g. `@lit-labs/ssr` / `nuxt-ssr-lit` shadow-DOM builds) — wrapping them
     * in `<ClientOnly>` would suppress their server markup.
     */
    exclude?: string[];
    /**
     * Wrap LIGHT `<prefix*>` elements in the client-only wrapper. Default `true`.
     * `false` leaves light tags untouched (they server-render as inert custom-element
     * tags and upgrade in the browser) while the shadow `<LitWrapper>` wrap below
     * keeps working — for apps whose pages are client-only as a whole and must not
     * have each `<mono-*>` deferred past the page's `onMounted`.
     */
    lightWrap?: boolean;
    /**
     * Enable the import-driven SSR wrap: a `.vue` file that imports
     * `@mono-lit/helper/ui/shadow/<entry>` gets its matching `<mono-*>` wrapped in
     * `<LitWrapper>` (Declarative Shadow DOM) instead of `<ClientOnly>`. Needs
     * `nuxt-ssr-lit` installed (provides the `<LitWrapper>` component). Default off.
     */
    litWrapper?: boolean;
    /** Component name used for the SSR wrap. Default `'LitWrapper'`. */
    litWrapperComponent?: string;
    /**
     * Tags to ALWAYS treat as shadow (LitWrapper-wrapped) regardless of per-file
     * imports — for components registered once in a shared plugin. Default `[]`.
     */
    shadowOverride?: string[];
}
export declare function monoClientOnlyPlugin(options?: MonoClientOnlyOptions): Plugin;
