import { describe, it } from 'vitest'
import type { MonoAppConfig } from '../src/composables/create-config'

/**
 * `apps[]` entries: `url` (a clone) and `path` (read in place) are BOTH
 * optional at the type level — "at least one" is enforced at runtime by
 * `assertAppSources` / `mono sync`, because a discriminated union fights
 * `defineConfig` inference. What the types must still guarantee is that the
 * lith shape (`path`, no `url`) compiles at all.
 */
describe('MonoAppConfig sources', () => {
  it('accepts path-only, url-only and both', () => {
    const lith: MonoAppConfig = { name: 'esw-project', type: 'vue', path: '../esw-project' }
    const clone: MonoAppConfig = { name: 'esw-project', type: 'vue', url: 'https://github.com/x/y' }
    const both: MonoAppConfig = {
      name: 'esw-project',
      type: 'vue',
      path: '../esw-project',
      url: 'https://github.com/x/y',
    }
    void [lith, clone, both]
  })

  it('still requires name and type', () => {
    // @ts-expect-error — name is required
    const noName: MonoAppConfig = { type: 'vue', path: '../x' }
    // @ts-expect-error — type is required
    const noType: MonoAppConfig = { name: 'x', path: '../x' }
    void [noName, noType]
  })
})
