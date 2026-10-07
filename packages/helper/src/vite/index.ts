// src/vite/index.ts
import type { Plugin } from 'vite'
import { monoClientOnlyPlugin } from './mono-client-only'
import { monoSsrStubPlugin } from './mono-ssr-stub'

export interface MonoSsrOptions {
  /** Custom-element tag prefix wrapped in <ClientOnly>. Default 'mono-'. */
  prefix?: string
  /** Wrapper component used for client-only rendering. Default 'ClientOnly'. */
  wrapper?: string
  /** Import prefix of registration modules stubbed during SSR. Default '@mono-lit/helper/ui/'. */
  ssrStubPrefix?: string
  /**
   * Tag names (e.g. `['mono-nav']`) to NOT wrap in `<ClientOnly>` — for
   * components server-rendered by another mechanism (e.g. `nuxt-ssr-lit`
   * shadow-DOM builds). Default `[]`.
   */
  exclude?: string[]
  /**
   * Wrap LIGHT `<prefix*>` elements in `<ClientOnly>`. Default `true`. `false`
   * keeps the server import-stub and the shadow `<LitWrapper>` wrap but leaves
   * light tags as they are — see `MonoClientOnlyOptions.lightWrap`.
   */
  lightWrap?: boolean
  /**
   * Enable the import-driven SSR wrap: `<mono-*>` whose `@mono-lit/helper/ui/shadow/
   * <entry>` build a `.vue` file imports get wrapped in `<LitWrapper>`
   * (Declarative Shadow DOM) instead of `<ClientOnly>`. Default off.
   */
  litWrapper?: boolean
  /** Component name used for the SSR wrap. Default `'LitWrapper'`. */
  litWrapperComponent?: string
  /** Tags to ALWAYS treat as shadow (for globally-registered components). */
  shadowOverride?: string[]
}

/**
 * One import, one props object — wires both halves of SSR support for the
 * mono web components:
 *   - the SSR import-stub (so `@mono-lit/helper/ui/*` never evaluates on the server)
 *   - the `<ClientOnly>` template wrapper (so `<mono-*>` only renders client-side)
 *
 * Usage:
 *   import { monoSsr } from '@mono-lit/helper/vite'
 *   plugins: [monoSsr()]
 */
export function monoSsr(options: MonoSsrOptions = {}): Plugin[] {
  const {
    prefix = 'mono-',
    wrapper = 'ClientOnly',
    ssrStubPrefix = '@mono-lit/helper/ui/',
    exclude = [],
    lightWrap = true,
    litWrapper = false,
    litWrapperComponent,
    shadowOverride = [],
  } = options

  return [
    monoSsrStubPlugin({ packagePrefix: ssrStubPrefix }),
    monoClientOnlyPlugin({
      prefix,
      wrapper,
      exclude,
      lightWrap,
      litWrapper,
      litWrapperComponent,
      shadowOverride,
    }),
  ]
}

// Keep the individual plugins available for advanced use.
export { monoClientOnlyPlugin, monoSsrStubPlugin }
export type { MonoClientOnlyOptions } from './mono-client-only'
export type { MonoSsrStubOptions } from './mono-ssr-stub'
