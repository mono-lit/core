import type { Plugin } from 'vite'
import { extractComponentTypes } from './extract-component-types'

const VIRTUAL_ID = 'virtual:mono-component-types'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Exposes the component props metadata (from extract-component-types) as the
 * virtual module `virtual:mono-component-types`, consumed by <DemoTypes>. The
 * payload is plain JSON — SSR-safe, no Node APIs reach the client bundle.
 */
export function monoTypesVirtualPlugin(): Plugin {
  return {
    name: 'mono-types-virtual',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(extractComponentTypes())}`
      }
    },
  }
}
